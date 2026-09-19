/**
 * prisma/seed.ts
 *
 * Initial database seed.
 * Creates a Super Admin user, a sample package, product, and content blocks.
 */

import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // 1. Super Admin User
  const adminEmail = "admin@direct.app";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("SuperSecret123!", 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: "Super",
        lastName: "Admin",
        role: Role.SUPER_ADMIN,
      },
    });
    console.log(`Created Super Admin user: ${adminEmail}`);
  } else {
    console.log(`Super Admin ${adminEmail} already exists.`);
  }

  // 2. Content Blocks (Homepage Baseline)
  const blocks = [
    {
      slug: "homepage-hero",
      type: "json",
      content: JSON.stringify({
        headline: "Direct Fan Experiences",
        subheadline: "Connect directly with your favorite celebrity.",
        ctaText: "Explore Packages",
      }),
    },
    {
      slug: "faq-1",
      type: "html",
      content: "<p>Experiences are typically delivered within 7-10 business days.</p>",
    },
  ];

  for (const block of blocks) {
    await prisma.contentBlock.upsert({
      where: { slug: block.slug },
      update: {},
      create: block,
    });
  }
  console.log("Created baseline content blocks.");

  // 3. Sample Experience Package
  const packageSlug = "personalized-video";
  const existingPackage = await prisma.experiencePackage.findUnique({ where: { slug: packageSlug } });
  if (!existingPackage) {
    await prisma.experiencePackage.create({
      data: {
        name: "Personalized Video Message",
        slug: packageSlug,
        description: "A 30-second personalized video message for any occasion.",
        price: 5000, // $50.00
        currency: "USD",
        deliveryInfo: "Delivered within 7 days",
        requiredFields: [
          {
            name: "recipientName",
            label: "Who is this for?",
            type: "text",
            required: true,
          },
          {
            name: "occasion",
            label: "Occasion",
            type: "select",
            options: ["Birthday", "Pep Talk", "Roast", "Other"],
            required: true,
          },
          {
            name: "instructions",
            label: "Instructions for the video",
            type: "textarea",
            required: true,
            validation: {
              maxLength: 500,
            },
          },
        ],
      },
    });
    console.log(`Created sample experience package: ${packageSlug}`);
  }

  // 4. Sample Category and Product
  const categorySlug = "apparel";
  let category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: "Apparel",
        slug: categorySlug,
        description: "Official merchandise",
      },
    });
  }

  const productSlug = "signature-hoodie";
  const existingProduct = await prisma.product.findUnique({ where: { slug: productSlug } });
  if (!existingProduct) {
    const product = await prisma.product.create({
      data: {
        name: "Signature Hoodie",
        slug: productSlug,
        description: "Premium heavy-weight cotton hoodie.",
        categoryId: category.id,
        basePrice: 6500, // $65.00
        currency: "USD",
      },
    });

    // Variant
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: "HOODIE-BLK-L",
        name: "Black / Large",
        inventory: {
          create: {
            quantityOnHand: 100,
          },
        },
      },
    });
    console.log(`Created sample product: ${productSlug}`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
