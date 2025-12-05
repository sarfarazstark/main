import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

// You must provide an adapter in Prisma 7
const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL!,
});

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		adapter,
		log: ['warn', 'error'], // optional
	});

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}
