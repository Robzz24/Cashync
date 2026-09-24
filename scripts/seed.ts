import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const MONTH_NUMBERS: Record<string, number> = {
  'January': 0, 'February': 1, 'March': 2, 'April': 3,
  'May': 4, 'June': 5, 'July': 6, 'August': 7,
  'September': 8, 'October': 9, 'November': 10, 'December': 11,
};

async function main() {
  console.log('Seeding FinTrack database...');

  // Upsert the single user
  const user = await prisma.user.upsert({
    where: { id: 'fintrack-user' },
    update: {},
    create: {
      id: 'fintrack-user',
      name: 'Usuario',
    },
  });
  console.log(`User created/found: ${user.id}`);

  // Check if transactions already exist
  const existingCount = await prisma.transaction.count({
    where: { userId: user.id },
  });

  if (existingCount > 0) {
    console.log(`Already have ${existingCount} transactions, skipping import.`);
    return;
  }

  // Read historical data
  const filePath = path.join(process.cwd(), 'data', 'historico.json');
  if (!fs.existsSync(filePath)) {
    console.log('No historical data file found, skipping import.');
    return;
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  const records: any[] = JSON.parse(rawData);

  console.log(`Importing ${records.length} historical records...`);

  const created = await prisma.transaction.createMany({
    data: records.map((r: any) => {
      const monthNum = MONTH_NUMBERS[r.mes] ?? 0;
      const fecha = new Date(2026, monthNum, 15);
      return {
        tipo: r.tipo === 'Ingreso' ? 'Ingreso' : 'Gasto',
        descripcion: r.descripcion ?? 'Sin descripción',
        monto: r.monto ?? 0,
        fecha,
        mes: r.mes ?? 'January',
        metodoPago: r.metodo_pago ?? 'Efectivo',
        cuenta: r.cuenta ?? 'Efectivo',
        categoria: r.categoria ?? 'Otros',
        fuente: r.fuente ?? 'Importado',
        userId: user.id,
      };
    }),
    skipDuplicates: true,
  });

  console.log(`Imported ${created.count} transactions successfully.`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
