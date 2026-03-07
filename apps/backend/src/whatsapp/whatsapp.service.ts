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
import * as QRCode from 'qrcode';
import pino from 'pino';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateWhatsAppInstanceDto } from './dto/create-whatsapp-instance.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SendMediaDto, MediaType } from './dto/send-media.dto';
import { WhatsAppStatus, MessageDirection, MessageType, MessageStatus } from '@prisma/client';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

interface WAConnection {
  socket: WASocket;
  qr?: string;
  status: WhatsAppStatus;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private connections: Map<string, WAConnection> = new Map();
  // Use persistent volume in Railway, /tmp in legacy systems, local in dev
  private readonly authDir = process.env.RAILWAY_ENVIRONMENT 
    ? join('/app', 'wa-sessions')  // Railway persistent volume
    : process.env.NODE_ENV === 'production'
    ? join('/tmp', 'wa-auth')      // Other platforms (ephemeral - not recommended)
    : join(process.cwd(), 'wa-auth'); // Development

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    @InjectQueue('flow-execution') private flowQueue: Queue,
    @InjectQueue('ai-processing') private aiQueue: Queue,
  ) {
    // Crear directorio de auth si no existe
    try {
      if (!fs.existsSync(this.authDir)) {
        fs.mkdirSync(this.authDir, { recursive: true });
        this.logger.log(`✅ Created auth directory at: ${this.authDir}`);
      } else {
        this.logger.log(`✅ Using existing auth directory: ${this.authDir}`);
      }
      
      // Log environment info
      this.logger.log(`📁 Storage: ${process.env.RAILWAY_ENVIRONMENT ? 'Railway Persistent Volume' : process.env.NODE_ENV === 'production' ? 'Ephemeral /tmp' : 'Local filesystem'}`);
    } catch (error) {
      this.logger.error(`❌ Failed to create auth directory: ${error.message}`);
      this.logger.warn('⚠️  WhatsApp connections may not persist across restarts');
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

    // Verify WebSocket is actually open
    const ws = (connection.socket as any).ws;
    if (ws && ws.readyState !== 1) {
      this.logger.warn(`WebSocket not open (readyState: ${ws?.readyState}), reconnecting...`);
      connection.status = WhatsAppStatus.DISCONNECTED;
      throw new Error('WhatsApp connection lost. Please reconnect the instance.');
    }

    // Formatear número de teléfono
    const phoneNumber = sendDto.to.replace(/\D/g, '');
    const jid = `${phoneNumber}@s.whatsapp.net`;

    this.logger.log(`Sending message to JID: ${jid} (original: ${sendDto.to})`);

    try {
      // Enviar mensaje
      const sent = await connection.socket.sendMessage(jid, {
        text: sendDto.message,
      });

      this.logger.log(`Message sent result: ${JSON.stringify(sent?.key || 'no key')}`);

      if (!sent?.key?.id) {
        this.logger.error(`Message send returned no key ID - connection may be stale`);
        // Mark connection as potentially broken
        connection.status = WhatsAppStatus.DISCONNECTED;
        throw new Error('Message send failed - no confirmation from WhatsApp. Try reconnecting the instance.');
      }

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
          whatsappMessageId: sent?.key?.id || '',
          organizationId,
        },
      });

      return message;
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      throw error;
    }
  }

  async sendMedia(organizationId: string, sendDto: SendMediaDto) {
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
      let messageContent: any = {};
      let messageType: any = 'TEXT';

      // Descargar archivo si es URL, o usar base64 directamente
      let mediaBuffer: Buffer;
      
      if (sendDto.mediaUrl.startsWith('http://') || sendDto.mediaUrl.startsWith('https://')) {
        // Descargar desde URL usando fetch
        const response = await fetch(sendDto.mediaUrl);
        const arrayBuffer = await response.arrayBuffer();
        mediaBuffer = Buffer.from(arrayBuffer);
      } else if (sendDto.mediaUrl.startsWith('data:')) {
        // Convertir Data URL a buffer
        const base64Data = sendDto.mediaUrl.split(',')[1];
        mediaBuffer = Buffer.from(base64Data, 'base64');
      } else {
        // Asumir que es base64 puro
        mediaBuffer = Buffer.from(sendDto.mediaUrl, 'base64');
      }

      // Construir mensaje según tipo de media
      switch (sendDto.type) {
        case MediaType.IMAGE:
          messageContent = {
            image: mediaBuffer,
            caption: sendDto.caption || '',
          };
          messageType = 'IMAGE';
          break;

        case MediaType.VIDEO:
          messageContent = {
            video: mediaBuffer,
            caption: sendDto.caption || '',
            mimetype: sendDto.mimeType || 'video/mp4',
          };
          messageType = 'VIDEO';
          break;

        case MediaType.AUDIO:
          messageContent = {
            audio: mediaBuffer,
            mimetype: sendDto.mimeType || 'audio/mp4',
            ptt: false, // Push-to-talk (mensaje de voz) = false
          };
          messageType = 'AUDIO';
          break;

        case MediaType.DOCUMENT:
          messageContent = {
            document: mediaBuffer,
            mimetype: sendDto.mimeType || 'application/pdf',
            fileName: sendDto.fileName || 'document.pdf',
            caption: sendDto.caption || '',
          };
          messageType = 'DOCUMENT';
          break;

        default:
          throw new Error(`Unsupported media type: ${sendDto.type}`);
      }

      // Enviar mensaje con media
      const sent = await connection.socket.sendMessage(jid, messageContent);

      // Buscar o crear contacto
      let contact = await this.prisma.contact.findFirst({
        where: { organizationId, phone: phoneNumber },
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
          content: sendDto.caption || `[${sendDto.type}]`,
          type: messageType,
          direction: MessageDirection.OUTBOUND,
          status: MessageStatus.SENT,
          mediaUrl: sendDto.mediaUrl,
          conversationId: conversation.id,
          contactId: contact.id,
          whatsappInstanceId: sendDto.instanceId,
          whatsappMessageId: sent?.key?.id || '',
          organizationId,
        },
      });

      this.logger.log(`Media sent to ${phoneNumber}: ${sendDto.type}`);
      return message;
    } catch (error) {
      this.logger.error(`Error sending media: ${error.message}`);
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
    const qrCode = connection?.qr || instance.qrCode || null;

    // Devolver información completa de la instancia con QR actualizado
    return {
      ...instance,
      qrCode,
    };
  }

  getServiceHealth() {
    const connections = Array.from(this.connections.entries()).map(([id, conn]) => ({
      instanceId: id,
      status: conn.status,
      hasQR: !!conn.qr,
    }));

    // Check if auth directory is writable
    let canWrite = false;
    try {
      const testFile = join(this.authDir, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      canWrite = true;
    } catch (error) {
      this.logger.warn(`Auth directory is not writable: ${error.message}`);
    }

    return {
      service: 'whatsapp',
      status: 'running',
      authDirectory: this.authDir,
      authDirectoryExists: fs.existsSync(this.authDir),
      authDirectoryWritable: canWrite,
      activeConnections: this.connections.size,
      connections,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    };
  }

  private async initializeConnection(instanceId: string, organizationId: string) {
    const authPath = join(this.authDir, instanceId);
    
    this.logger.log(`🔄 Initializing WhatsApp connection for instance ${instanceId}`);
    this.logger.log(`📁 Auth path: ${authPath}`);
    
    try {
      // Create instance auth directory
      if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true });
        this.logger.log(`✅ Created auth path: ${authPath}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to create auth directory: ${error.message}`);
      throw new Error(`Cannot initialize WhatsApp: ${error.message}`);
    }

    try {
      const { state, saveCreds } = await useMultiFileAuthState(authPath);
      const { version, isLatest } = await fetchLatestBaileysVersion();
      
      this.logger.log(`📱 Using WA v${version.join('.')}, isLatest: ${isLatest}`);

      const socket = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
        },
        logger: pino({ level: 'silent' }), // Reduce noise in Railway logs
        printQRInTerminal: false,
        // CLAVE: Usar browser string oficial de Baileys (más confiable)
        browser: Browsers.baileys('Chrome'),
        // Timeouts aumentados para evitar desconexiones
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        defaultQueryTimeoutMs: 60000,
        qrTimeout: 60000,
        emitOwnEvents: true,
        retryRequestDelayMs: 250,
        msgRetryCounterCache: undefined,
        getMessage: async (key) => {
          return { conversation: '' };
        },
        // Optimizaciones de memoria para Railway
        syncFullHistory: false,
        markOnlineOnConnect: true,
        fireInitQueries: false,
        generateHighQualityLinkPreview: false,
      });

      // Guardar conexión inicial
      this.connections.set(instanceId, {
        socket,
        status: WhatsAppStatus.DISCONNECTED,
      });

      // Event: Actualización de conexión
     socket.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect, qr } = update;

  // Extraemos info del error (si existe)
  const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
  const errorMessage = (lastDisconnect?.error as Error)?.message ?? '';

  this.logger.log(`🔔 Connection update for instance ${instanceId}:`, {
    connection,
    hasQR: !!qr,
    statusCode,
    errorMessage,
  });

  // 1) Manejo de QR
  if (qr) {
    try {
      const qrDataURL = await QRCode.toDataURL(qr, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'M',
      });

      this.connections.set(instanceId, {
        socket,
        qr: qrDataURL,
        status: WhatsAppStatus.QR_CODE,
      });

      await this.prisma.whatsAppInstance.update({
        where: { id: instanceId },
        data: {
          status: WhatsAppStatus.QR_CODE,
          qrCode: qrDataURL,
        },
      });

      this.logger.log(
        `📱 QR Code generated for instance ${instanceId} (valid for ~40 seconds)`,
      );
    } catch (error) {
      this.logger.error(`❌ Error generating QR code: ${error.message}`);
    }
  }

  // 2) Conexión abierta OK
  if (connection === 'open') {
    this.connections.set(instanceId, {
      socket,
      status: WhatsAppStatus.CONNECTED,
      qr: undefined,
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

    this.logger.log(
      `✅ WhatsApp instance ${instanceId} connected successfully! Phone: ${phone}`,
    );
    return;
  }

  // 3) Desconexión
  if (connection === 'close') {
    // Detectar tipos de error
    const isConflict = errorMessage.toLowerCase().includes('conflict');
    const isLoggedOut =
      statusCode === DisconnectReason.loggedOut || statusCode === 401;

    this.logger.log(
      `⚠️  Connection closed for instance ${instanceId}. Status code: ${statusCode}, isConflict: ${isConflict}, isLoggedOut: ${isLoggedOut}`,
    );

    // 3.1) Caso CONFLICT: NO borrar sesión, intentar reconectar
    if (isConflict) {
      this.logger.warn(
        `🔁 Conflict detected for ${instanceId} (Stream Errored conflict). ` +
          'Probablemente el número está abierto en otra sesión de WhatsApp Web o en otro cliente Baileys. ' +
          'No se borrará la sesión; se intentará reconectar automáticamente.',
      );

      // Opcional: marcar estado "reconectando"
      this.connections.set(instanceId, {
        socket,
        status: WhatsAppStatus.DISCONNECTED,
        qr: undefined,
      });

      await this.prisma.whatsAppInstance.update({
        where: { id: instanceId },
        data: {
          status: WhatsAppStatus.DISCONNECTED,
          qrCode: null,
        },
      });

      setTimeout(() => {
        this.logger.log(`🔌 Attempting reconnection for instance ${instanceId} after conflict`);
        this.initializeConnection(instanceId, organizationId).catch((err) => {
          this.logger.error(
            `❌ Reconnection after conflict failed for ${instanceId}: ${err.message}`,
          );
        });
      }, 5000);

      return;
    }

    // 3.2) Logout REAL: limpiar sesión y pedir nuevo QR
    if (isLoggedOut) {
      this.logger.error(
        `❌ ERROR CRÍTICO: Sesión cerrada para ${instanceId} (status ${statusCode}). ` +
          'Se limpiará la sesión y será necesario escanear un nuevo QR.',
      );

      try {
        if (fs.existsSync(authPath)) {
          fs.rmSync(authPath, { recursive: true, force: true });
          this.logger.log(`✅ Sesión limpiada exitosamente: ${authPath}`);
        }
      } catch (cleanError) {
        this.logger.error(
          `❌ Error limpiando sesión de ${instanceId}: ${cleanError.message}`,
        );
      }

      this.connections.delete(instanceId);

      await this.prisma.whatsAppInstance.update({
        where: { id: instanceId },
        data: {
          status: WhatsAppStatus.DISCONNECTED,
          qrCode: null,
        },
      });

      this.logger.warn(
        `💡 Genera un nuevo QR desde el frontend para reconectar la instancia ${instanceId}`,
      );
      return;
    }

    // 3.3) Otros errores: aplicar lógica de reconexión estándar
    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

    if (shouldReconnect) {
      this.logger.log(
        `🔄 Reconnecting instance ${instanceId} in 5 seconds (statusCode: ${statusCode})...`,
      );
      setTimeout(() => {
        this.logger.log(`🔌 Attempting reconnection for instance ${instanceId}`);
        this.initializeConnection(instanceId, organizationId).catch((err) => {
          this.logger.error(
            `❌ Reconnection failed for ${instanceId}: ${err.message}`,
          );
        });
      }, 5000);
    } else {
      this.connections.delete(instanceId);
      await this.prisma.whatsAppInstance.update({
        where: { id: instanceId },
        data: {
          status: WhatsAppStatus.DISCONNECTED,
          qrCode: null,
        },
      });
      this.logger.log(`📴 WhatsApp instance ${instanceId} logged out (no reconnect)`);
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
      this.logger.error(`❌ Error initializing WhatsApp: ${error.message}`);
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
      if (!msg.message || !msg.key || msg.key.fromMe) return;

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

      // Extraer contenido del mensaje y tipo
      let content = '';
      let messageType: any = MessageType.TEXT; // Usar any temporalmente para evitar error de tipos
      let mediaUrl: string | null = null;

      // Determinar tipo de mensaje y extraer contenido
      if (msg.message.conversation || msg.message.extendedTextMessage) {
        content = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        messageType = 'TEXT';
      } else if (msg.message.imageMessage) {
        content = msg.message.imageMessage.caption || '[Imagen]';
        messageType = 'IMAGE';
        // Descargar y guardar imagen
        try {
          const buffer = await downloadMediaMessage(msg as any, 'buffer', {});
          const base64 = buffer.toString('base64');
          mediaUrl = `data:image/jpeg;base64,${base64}`;
        } catch (err) {
          this.logger.error(`Error downloading image: ${err.message}`);
        }
      } else if (msg.message.videoMessage) {
        content = msg.message.videoMessage.caption || '[Video]';
        messageType = 'VIDEO';
        try {
          const buffer = await downloadMediaMessage(msg as any, 'buffer', {});
          const base64 = buffer.toString('base64');
          mediaUrl = `data:video/mp4;base64,${base64}`;
        } catch (err) {
          this.logger.error(`Error downloading video: ${err.message}`);
        }
      } else if (msg.message.audioMessage) {
        content = '[Audio]';
        messageType = 'AUDIO';
        try {
          const buffer = await downloadMediaMessage(msg as any, 'buffer', {});
          const base64 = buffer.toString('base64');
          mediaUrl = `data:audio/mp4;base64,${base64}`;
        } catch (err) {
          this.logger.error(`Error downloading audio: ${err.message}`);
        }
      } else if (msg.message.documentMessage) {
        content = msg.message.documentMessage.caption || `[Documento: ${msg.message.documentMessage.fileName || 'archivo'}]`;
        messageType = 'DOCUMENT';
        try {
          const buffer = await downloadMediaMessage(msg as any, 'buffer', {});
          const base64 = buffer.toString('base64');
          const mimeType = msg.message.documentMessage.mimetype || 'application/octet-stream';
          mediaUrl = `data:${mimeType};base64,${base64}`;
        } catch (err) {
          this.logger.error(`Error downloading document: ${err.message}`);
        }
      } else if (msg.message.locationMessage) {
        const loc = msg.message.locationMessage;
        content = `[Ubicación: ${loc.degreesLatitude}, ${loc.degreesLongitude}]`;
        messageType = 'LOCATION';
      } else if (msg.message.contactMessage) {
        content = `[Contacto: ${msg.message.contactMessage.displayName || 'Sin nombre'}]`;
        messageType = 'CONTACT';
      } else {
        content = '[Mensaje no soportado]';
        messageType = 'TEXT';
      }

      // Guardar mensaje
      const savedMessage = await this.prisma.message.create({
        data: {
          content,
          type: messageType,
          direction: MessageDirection.INBOUND,
          status: MessageStatus.DELIVERED,
          mediaUrl,
          conversationId: conversation.id,
          contactId: contact.id,
          whatsappInstanceId: instanceId,
          whatsappMessageId: msg.key.id || '',
          organizationId,
        },
      });

      // Actualizar última actividad de la conversación
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      this.logger.log(`Message received from ${phoneNumber}`);

      // Emit real-time events via WebSocket
      this.eventsGateway.emitToOrganization(organizationId, 'message:new', {
        ...savedMessage,
        contact,
        conversation,
      });
      this.eventsGateway.emitToConversation(conversation.id, 'message:new', savedMessage);

      // Dispatch flow trigger check via Bull queue
      await this.flowQueue.add('check-triggers', {
        organizationId,
        conversationId: conversation.id,
        messageContent: content,
        contactId: contact.id,
      }, { priority: 2 });

      // Dispatch AI processing (sentiment analysis)
      await this.aiQueue.add('sentiment-analysis', {
        messageId: savedMessage.id,
        content,
        contactId: contact.id,
        organizationId,
      }, { priority: 3 });
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
