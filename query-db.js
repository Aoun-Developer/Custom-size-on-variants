import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const shop = 'testing-apps-web.myshopify.com';
        const sets = await prisma.customSizeSet.findMany({
            where: { shop },
            select: { id: true, name: true, triggerVariant: true }
        });
        console.log('Sets for shop:', shop);
        console.log(JSON.stringify(sets, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
