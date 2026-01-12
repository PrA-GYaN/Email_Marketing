import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@viozonx.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@viozonx.com',
      password: adminPassword,
      role: 'ADMIN',
      isEmailVerified: true,
      companyName: 'ViozonX Admin',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create demo user
  const demoPassword = await bcrypt.hash('Demo@123456', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: demoPassword,
      role: 'USER',
      isEmailVerified: true,
      companyName: 'Demo Company',
      senderName: 'Demo Team',
      senderEmail: 'demo@example.com',
      companyAddress: '123 Demo Street, Demo City, DC 12345',
    },
  });
  console.log('✅ Demo user created:', demoUser.email);

  // Create tags for demo user
  const leadTag = await prisma.tag.create({
    data: {
      name: 'Lead',
      userId: demoUser.id,
    },
  });

  const customerTag = await prisma.tag.create({
    data: {
      name: 'Customer',
      userId: demoUser.id,
    },
  });

  const vipTag = await prisma.tag.create({
    data: {
      name: 'VIP',
      userId: demoUser.id,
    },
  });

  console.log('✅ Tags created');

  // Create sample contacts
  const contacts = [];
  const contactEmails = [
    { email: 'john@example.com', firstName: 'John', lastName: 'Doe', tags: [leadTag.id] },
    { email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith', tags: [customerTag.id] },
    { email: 'bob@example.com', firstName: 'Bob', lastName: 'Johnson', tags: [leadTag.id, customerTag.id] },
    { email: 'alice@example.com', firstName: 'Alice', lastName: 'Williams', tags: [vipTag.id, customerTag.id] },
    { email: 'charlie@example.com', firstName: 'Charlie', lastName: 'Brown', tags: [leadTag.id] },
  ];

  for (const contactData of contactEmails) {
    const contact = await prisma.contact.create({
      data: {
        email: contactData.email,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        status: 'SUBSCRIBED',
        userId: demoUser.id,
      },
    });

    // Assign tags
    for (const tagId of contactData.tags) {
      await prisma.contactTag.create({
        data: {
          contactId: contact.id,
          tagId: tagId,
        },
      });
    }

    contacts.push(contact);
  }

  console.log(`✅ ${contacts.length} contacts created`);

  // Create sample campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Welcome Campaign',
      subject: 'Welcome to Our Newsletter!',
      senderName: 'Demo Team',
      senderEmail: 'demo@example.com',
      emailContent: {
        blocks: [
          {
            type: 'heading',
            data: { text: 'Welcome to ViozonX!' },
          },
          {
            type: 'text',
            data: { text: 'Thank you for subscribing to our newsletter. We are excited to have you with us!' },
          },
          {
            type: 'button',
            data: { text: 'Visit Our Website', url: 'https://viozonx.com' },
          },
        ],
      },
      status: 'DRAFT',
      userId: demoUser.id,
    },
  });

  // Link campaign to tags
  await prisma.campaignTag.create({
    data: {
      campaignId: campaign.id,
      tagId: leadTag.id,
    },
  });

  console.log('✅ Sample campaign created');

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
