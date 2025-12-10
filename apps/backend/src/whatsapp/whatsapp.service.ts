import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  proto,
  downloadMediaMessage,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  Browsers,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { join } from 'path';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWhatsAppInstanceDto } from './dto/create-whatsapp-instance.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { WhatsAppStatus, MessageDirection, MessageType, MessageStatus } from '@prisma/client';

interface WAConnection {
  socket: WASocket;
  qr?: string;
  status: WhatsAppStatus;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private connections: Map<string, WAConnection> = new Map();
  private readonly authDir = join(process.cwd(), 'wa-auth');

  constructor(private prisma: PrismaService) {
    // Crear directorio de auth si no existe
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  async createInstance(
    organizationId: string,
    createDto: CreateWhatsAppInstanceDto,
  ) {
    const instance = await this.prisma.whatsAppInstance.create({
      data: {
        ...createDto,
        organizationId,
        status: WhatsAppStatus.DISCONNECTED,
      },
    });

    // Iniciar conexión
    await this.initializeConnection(instance.id, organizationId);

    return instance;
  }

  async getInstances(organizationId: string) {
    return this.prisma.whatsAppInstance.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            conversations: true,
            messages: true,
          },
        },
      },
    });
  }

  async getInstance(organizationId: string, id: string) {
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { id, organizationId },
      include: {
        conversations: {
          take: 10,
          orderBy: { lastMessageAt: 'desc' },
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                phone: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!instance) {
      throw new NotFoundException(`WhatsApp instance ${id} not found`);
    }

    // Agregar QR actual si está disponible
    const connection = this.connections.get(id);
    if (connection && connection.qr) {
      return {
        ...instance,
        qrCode: connection.qr,
      };
    }

    return instance;
  }

  async deleteInstance(organizationId: string, id: string) {
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { id, organizationId },
    });

    if (!instance) {
      throw new NotFoundException(`WhatsApp instance ${id} not found`);
    }

    // Desconectar socket si está activo
    const connection = this.connections.get(id);
    if (connection) {
      connection.socket.end(undefined);
      this.connections.delete(id);
    }

    // Eliminar archivos de autenticación
    const authPath = join(this.authDir, id);
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
    }

    return this.prisma.whatsAppInstance.delete({
      where: { id },
    });
  }

  async sendMessage(organizationId: string, sendDto: SendMessageDto) {
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { id: sendDto.instanceId, organizationId },
    });

    if (!instance) {
      throw new NotFoundException(`WhatsApp instance not found`);
    }

    const connection = this.connections.get(sendDto.instanceId);
    if (!connection || connection.status !== WhatsAppStatus.CONNECTED) {
      throw new Error('WhatsApp instance is not connected');
    }

    // Formatear número de teléfono
    const phoneNumber = sendDto.to.replace(/\D/g, '');
    const jid = `${phoneNumber}@s.whatsapp.net`;

    try {
      // Enviar mensaje
      const sent = await connection.socket.sendMessage(jid, {
        text: sendDto.message,
      });

      // Buscar o crear contacto
      let contact = await this.prisma.contact.findFirst({
        where: {
          organizationId,
          phone: phoneNumber,
        },
      });

      if (!contact) {
        contact = await this.prisma.contact.create({
          data: {
            name: phoneNumber,
            phone: phoneNumber,
            organizationId,
          },
        });
      }

      // Buscar o crear conversación
      let conversation = await this.prisma.conversation.findFirst({
        where: {
          contactId: contact.id,
          whatsappInstanceId: sendDto.instanceId,
          organizationId,
        },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            contactId: contact.id,
            whatsappInstanceId: sendDto.instanceId,
            organizationId,
            channel: 'WHATSAPP',
            status: 'OPEN',
          },
        });
      }

      // Guardar mensaje en BD
      const message = await this.prisma.message.create({
        data: {
          content: sendDto.message,
          type: MessageType.TEXT,
          direction: MessageDirection.OUTBOUND,
          status: MessageStatus.SENT,
          conversationId: conversation.id,
          contactId: contact.id,
          whatsappInstanceId: sendDto.instanceId,
          whatsappMessageId: sent.key.id,
          organizationId,
        },
      });

      return message;
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      throw error;
    }
  }

  async getQRCode(organizationId: string, instanceId: string) {
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { id: instanceId, organizationId },
    });

    if (!instance) {
      throw new NotFoundException(`WhatsApp instance not found`);
    }

    const connection = this.connections.get(instanceId);
    if (!connection || !connection.qr) {
      return { qrCode: null, message: 'No QR code available' };
    }

    return { qrCode: connection.qr };
  }

  private async initializeConnection(instanceId: string, organizationId: string) {
    const authPath = join(this.authDir, instanceId);
    if (!fs.existsSync(authPath)) {
      fs.mkdirSync(authPath, { recursive: true });
    }

    try {
      const { state, saveCreds } = await useMultiFileAuthState(authPath);
      const { version } = await fetchLatestBaileysVersion();

      const socket = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, Logger),
        },
        printQRInTerminal: true,
        browser: Browsers.ubuntu('OpenTalkWisp'),
        getMessage: async (key) => {
          return { conversation: '' };
        },
      });

      // Guardar conexión inicial
      this.connections.set(instanceId, {
        socket,
        status: WhatsAppStatus.DISCONNECTED,
      });

      // Event: Actualización de conexión
      socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Actualizar QR code
        if (qr) {
          this.connections.set(instanceId, {
            socket,
            qr,
            status: WhatsAppStatus.QR_CODE,
          });

          await this.prisma.whatsAppInstance.update({
            where: { id: instanceId },
            data: {
              status: WhatsAppStatus.QR_CODE,
              qrCode: qr,
            },
          });

          this.logger.log(`QR Code generated for instance ${instanceId}`);
        }

        // Conexión exitosa
        if (connection === 'open') {
          this.connections.set(instanceId, {
            socket,
            status: WhatsAppStatus.CONNECTED,
          });

          const phone = socket.user?.id?.split(':')[0];

          await this.prisma.whatsAppInstance.update({
            where: { id: instanceId },
            data: {
              status: WhatsAppStatus.CONNECTED,
              phone,
              connectedAt: new Date(),
              qrCode: null,
            },
          });

          this.logger.log(`WhatsApp instance ${instanceId} connected`);
        }

        // Desconexión
        if (connection === 'close') {
          const shouldReconnect =
            (lastDisconnect?.error as Boom)?.output?.statusCode !==
            DisconnectReason.loggedOut;

          if (shouldReconnect) {
            this.logger.log(`Reconnecting instance ${instanceId}...`);
            setTimeout(() => this.initializeConnection(instanceId, organizationId), 3000);
          } else {
            this.connections.delete(instanceId);
            await this.prisma.whatsAppInstance.update({
              where: { id: instanceId },
              data: {
                status: WhatsAppStatus.DISCONNECTED,
                qrCode: null,
              },
            });
            this.logger.log(`WhatsApp instance ${instanceId} logged out`);
          }
        }
      });

      // Event: Guardar credenciales
      socket.ev.on('creds.update', saveCreds);

      // Event: Mensajes entrantes
      socket.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
          await this.handleIncomingMessage(instanceId, organizationId, msg);
        }
      });

    } catch (error) {
      this.logger.error(`Error initializing WhatsApp: ${error.message}`);
      await this.prisma.whatsAppInstance.update({
        where: { id: instanceId },
        data: { status: WhatsAppStatus.ERROR },
      });
    }
  }

  private async handleIncomingMessage(
    instanceId: string,
    organizationId: string,
    msg: proto.IWebMessageInfo,
  ) {
    try {
      if (!msg.message || msg.key.fromMe) return;

      const phoneNumber = msg.key.remoteJid?.split('@')[0];
      if (!phoneNumber) return;

      // Buscar o crear contacto
      let contact = await this.prisma.contact.findFirst({
        where: {
          organizationId,
          phone: phoneNumber,
        },
      });

      if (!contact) {
        const pushName = msg.pushName || phoneNumber;
        contact = await this.prisma.contact.create({
          data: {
            name: pushName,
            phone: phoneNumber,
            organizationId,
          },
        });
      }

      // Buscar o crear conversación
      let conversation = await this.prisma.conversation.findFirst({
        where: {
          contactId: contact.id,
          whatsappInstanceId: instanceId,
          organizationId,
        },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            contactId: contact.id,
            whatsappInstanceId: instanceId,
            organizationId,
            channel: 'WHATSAPP',
            status: 'OPEN',
          },
        });
      }

      // Extraer contenido del mensaje
      const content =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        'Media message';

      // Guardar mensaje
      await this.prisma.message.create({
        data: {
          content,
          type: MessageType.TEXT,
          direction: MessageDirection.INBOUND,
          status: MessageStatus.DELIVERED,
          conversationId: conversation.id,
          contactId: contact.id,
          whatsappInstanceId: instanceId,
          whatsappMessageId: msg.key.id,
          organizationId,
        },
      });

      // Actualizar última actividad de la conversación
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      this.logger.log(`Message received from ${phoneNumber}`);
    } catch (error) {
      this.logger.error(`Error handling incoming message: ${error.message}`);
    }
  }

  // Método para reconectar instancias al iniciar el servidor
  async onModuleInit() {
    this.logger.log('Reconnecting WhatsApp instances...');
    
    const instances = await this.prisma.whatsAppInstance.findMany({
      where: {
        status: {
          in: [WhatsAppStatus.CONNECTED, WhatsAppStatus.QR_CODE],
        },
      },
    });

    for (const instance of instances) {
      this.logger.log(`Reconnecting instance ${instance.id}...`);
      await this.initializeConnection(instance.id, instance.organizationId);
    }
  }
}
