// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash passwords
    const hashedPasswordNaufal = await bcrypt.hash('najib1357', 10);
    const hashedPasswordAsep = await bcrypt.hash('asep123', 10);

    // Create users
    const naufal = await prisma.user.upsert({
      where: { id: 'naufal' },
      update: {},
      create: {
        id: 'naufal',
        name: 'Naufal',
        email: 'naufalnajib52@gmail.com',
        password: hashedPasswordNaufal,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    const asep = await prisma.user.upsert({
      where: { id: 'asep' },
      update: {},
      create: {
        id: 'asep',
        name: 'Asep',
        email: 'asep@gmail.com',
        password: hashedPasswordAsep,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    // Create conversation
    const conversation = await prisma.conversation.upsert({
      where: { id: 'conv1' },
      update: {},
      create: {
        id: 'conv1',
        createdAt: new Date(),
        updatedAt: new Date(),
        users: {
          connect: [{ id: 'naufal' }, { id: 'asep' }]
        }
      }
    });

    // Create sample messages
    const message1 = await prisma.message.create({
      data: {
        content: 'Hello Asep, how are you?',
        authorId: 'naufal',
        conversationId: 'conv1',
        createdAt: new Date(),
      }
    });

    const message2 = await prisma.message.create({
      data: {
        content: 'Hi Naufal, I am doing great! How about you?',
        authorId: 'asep',
        conversationId: 'conv1',
        createdAt: new Date(),
      }
    });

    const message3 = await prisma.message.create({
      data: {
        content: 'I am doing well too. Just working on the UMKM project.',
        authorId: 'naufal',
        conversationId: 'conv1',
        createdAt: new Date(),
      }
    });

    console.log('Seed data created successfully');
    console.log({ naufal, asep, conversation, message1, message2, message3 });
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });