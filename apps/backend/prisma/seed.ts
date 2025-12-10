import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crear organización de prueba
  const org = await prisma.organization.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo',
      plan: 'PRO',
      status: 'ACTIVE',
      maxUsers: 10,
      maxContacts: 1000,
      maxWhatsApps: 3,
    },
  });

  console.log('✅ Organization created:', org.name);

  // Crear usuario owner
  const hashedPassword = await bcrypt.hash('demo1234', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@opentalkwisp.com' },
    update: {},
    create: {
      email: 'demo@opentalkwisp.com',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: 'OWNER',
      status: 'ACTIVE',
      organizationId: org.id,
    },
  });

  console.log('✅ User created:', user.email);

  // Crear algunos contactos de prueba
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '+5491123456789',
        company: 'Acme Corp',
        score: 75,
        organizationId: org.id,
      },
    }),
    prisma.contact.create({
      data: {
        name: 'María García',
        email: 'maria@example.com',
        phone: '+5491198765432',
        company: 'Tech Inc',
        score: 90,
        organizationId: org.id,
      },
    }),
    prisma.contact.create({
      data: {
        name: 'Carlos López',
        phone: '+5491155555555',
        score: 60,
        organizationId: org.id,
      },
    }),
  ]);

  console.log(`✅ Created ${contacts.length} contacts`);

  // Crear pipeline de ventas
  const pipeline = await prisma.pipeline.create({
    data: {
      name: 'Sales Pipeline',
      order: 1,
      organizationId: org.id,
      stages: {
        create: [
          { name: 'Lead', order: 1, color: '#3b82f6' },
          { name: 'Qualified', order: 2, color: '#8b5cf6' },
          { name: 'Proposal', order: 3, color: '#f59e0b' },
          { name: 'Negotiation', order: 4, color: '#10b981' },
          { name: 'Closed Won', order: 5, color: '#22c55e' },
        ],
      },
    },
    include: { stages: true },
  });

  console.log('✅ Pipeline created with stages');

  // Crear algunos deals
  const deals = await Promise.all([
    prisma.deal.create({
      data: {
        title: 'CRM Implementation',
        value: 15000,
        currency: 'USD',
        probability: 70,
        contactId: contacts[0].id,
        stageId: pipeline.stages[2].id,
        pipelineId: pipeline.id,
        assignedToId: user.id,
        organizationId: org.id,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Consulting Services',
        value: 8000,
        currency: 'USD',
        probability: 50,
        contactId: contacts[1].id,
        stageId: pipeline.stages[1].id,
        pipelineId: pipeline.id,
        assignedToId: user.id,
        organizationId: org.id,
      },
    }),
  ]);

  console.log(`✅ Created ${deals.length} deals`);

  console.log('🎉 Seeding completed!');
  console.log(`
📧 Email: demo@opentalkwisp.com
🔑 Password: demo1234
🏢 Organization: Demo Organization
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
