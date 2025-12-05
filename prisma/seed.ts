// prisma/seed.ts
import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

type DeviceImages = {
	mobile: string;
	tablet: string;
	desktop: string;
};

type Product = {
	id: number;
	slug: string;
	name: string;
	image: DeviceImages;
	category: string;
	categoryImage: DeviceImages;
	new: boolean;
	price: number;
	description: string;
	features: string;
	includes: { quantity: number; item: string }[];
	gallery: {
		first: DeviceImages;
		second: DeviceImages;
		third: DeviceImages;
	};
	others: {
		slug: string;
		name: string;
		image: DeviceImages;
	}[];
};

function loadProducts(): Product[] {
	const filePath = path.join('./data.json');
	const content = fs.readFileSync(filePath, 'utf-8');
	const data = JSON.parse(content) as Product[];
	return data;
}

function normalizeAssetPath(p: string): string {
	return p.replace(/^\.\//, '/');
}

function capitalize(str: string): string {
	if (!str) return str;
	return str.charAt(0).toUpperCase() + str.slice(1);
}

async function main() {
	console.log('Seeding start…');

	const Products = loadProducts();

	const categorySlugs = Array.from(new Set(Products.map((p) => p.category)));

	for (const slug of categorySlugs) {
		await prisma.category.upsert({
			where: { slug },
			update: {},
			create: {
				slug,
				name: capitalize(slug),
			},
		});
	}

	// 2) Seed products
	for (const p of Products) {
		const category = await prisma.category.findUnique({
			where: { slug: p.category },
		});

		if (!category) {
			throw new Error(`Category ${p.category} not found for product ${p.slug}`);
		}

		await prisma.product.upsert({
			where: { slug: p.slug },
			update: {
				name: p.name,
				description: p.description,
				features: p.features,
				price: p.price,
				imageUrl: normalizeAssetPath(p.image.desktop),
				categoryId: category.id,
			},
			create: {
				slug: p.slug,
				name: p.name,
				description: p.description,
				price: p.price,
				imageUrl: normalizeAssetPath(p.image.desktop),
				features: p.features,
				categoryId: category.id,
			},
		});
	}

	console.log('Seeding complete.');
}

main()
	.catch((e) => {
		console.error('Seeding error:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
