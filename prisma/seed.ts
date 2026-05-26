import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  const admin = await prisma.usuario.upsert({
    where: { correo: 'admin@pos.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      correo: 'admin@pos.com',
      password,
      rol: 'ADMIN',
    },
  });

  console.log('Usuario creado:', admin.correo);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
