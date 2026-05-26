import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ─── Usuarios ────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const gerentePassword = await bcrypt.hash('gerente123', 10);
  const cajeroPassword = await bcrypt.hash('cajero123', 10);

  const admin = await prisma.usuario.upsert({
    where: { correo: 'admin@pos.com' },
    update: {},
    create: { nombre: 'Administrador', correo: 'admin@pos.com', password: adminPassword, rol: 'ADMIN' },
  });

  const gerente = await prisma.usuario.upsert({
    where: { correo: 'gerente@pos.com' },
    update: {},
    create: { nombre: 'Gerente', correo: 'gerente@pos.com', password: gerentePassword, rol: 'GERENTE' },
  });

  const cajero = await prisma.usuario.upsert({
    where: { correo: 'cajero@pos.com' },
    update: {},
    create: { nombre: 'Cajero', correo: 'cajero@pos.com', password: cajeroPassword, rol: 'CAJERO' },
  });

  console.log('✓ Usuarios:', admin.correo, gerente.correo, cajero.correo);

  // ─── Categorías ───────────────────────────────────────────────────────────────
  const [bebidas, snacks, lacteos, limpieza, dulces] = await Promise.all([
    prisma.categoria.upsert({ where: { nombre: 'Bebidas' }, update: {}, create: { nombre: 'Bebidas' } }),
    prisma.categoria.upsert({ where: { nombre: 'Snacks' }, update: {}, create: { nombre: 'Snacks' } }),
    prisma.categoria.upsert({ where: { nombre: 'Lácteos' }, update: {}, create: { nombre: 'Lácteos' } }),
    prisma.categoria.upsert({ where: { nombre: 'Limpieza' }, update: {}, create: { nombre: 'Limpieza' } }),
    prisma.categoria.upsert({ where: { nombre: 'Dulces' }, update: {}, create: { nombre: 'Dulces' } }),
  ]);

  console.log('✓ Categorías: Bebidas, Snacks, Lácteos, Limpieza, Dulces');

  // ─── Productos ────────────────────────────────────────────────────────────────
  const productos = [
    { nombre: 'Coca-Cola 600ml',   sku: 'COC-600',  precio: 18.00, costo: 10.50, stock: 100, categoriaId: bebidas.id },
    { nombre: 'Pepsi 600ml',       sku: 'PEP-600',  precio: 17.00, costo: 9.50,  stock: 80,  categoriaId: bebidas.id },
    { nombre: 'Agua 1L',           sku: 'AGU-001',  precio: 12.00, costo: 5.00,  stock: 150, categoriaId: bebidas.id },
    { nombre: 'Jugo Naranja 1L',   sku: 'JUG-NAR',  precio: 22.00, costo: 13.00, stock: 60,  categoriaId: bebidas.id },
    { nombre: 'Sabritas Original', sku: 'SAB-ORI',  precio: 19.00, costo: 11.00, stock: 90,  categoriaId: snacks.id },
    { nombre: 'Doritos Nacho',     sku: 'DOR-NAC',  precio: 19.00, costo: 11.00, stock: 70,  categoriaId: snacks.id },
    { nombre: 'Gansito',           sku: 'GAN-001',  precio: 16.00, costo: 9.00,  stock: 50,  categoriaId: snacks.id },
    { nombre: 'Leche Entera 1L',   sku: 'LEC-ENT',  precio: 24.00, costo: 16.00, stock: 40,  categoriaId: lacteos.id },
    { nombre: 'Yogurt Natural',    sku: 'YOG-NAT',  precio: 18.00, costo: 11.00, stock: 30,  categoriaId: lacteos.id },
    { nombre: 'Queso Manchego',    sku: 'QUE-MAN',  precio: 45.00, costo: 30.00, stock: 25,  categoriaId: lacteos.id },
    { nombre: 'Escoba',            sku: 'ESC-001',  precio: 55.00, costo: 30.00, stock: 15,  categoriaId: limpieza.id },
    { nombre: 'Jabón de Barra',    sku: 'JAB-BAR',  precio: 14.00, costo: 7.00,  stock: 60,  categoriaId: limpieza.id },
    { nombre: 'Chicle Doublemint', sku: 'CHI-DOU',  precio: 5.00,  costo: 2.50,  stock: 200, categoriaId: dulces.id },
    { nombre: 'Paleta Payaso',     sku: 'PAL-PAY',  precio: 8.00,  costo: 4.00,  stock: 120, categoriaId: dulces.id },
  ];

  for (const p of productos) {
    await prisma.producto.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  console.log(`✓ Productos: ${productos.length} registros`);

  // ─── Caja ─────────────────────────────────────────────────────────────────────
  const caja = await prisma.caja.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000001', nombre: 'Caja Principal' },
  });

  console.log('✓ Caja:', caja.nombre);
  console.log('\n─── Credenciales ────────────────────────────────');
  console.log('  ADMIN:   admin@pos.com   / admin123');
  console.log('  GERENTE: gerente@pos.com / gerente123');
  console.log('  CAJERO:  cajero@pos.com  / cajero123');
  console.log('─────────────────────────────────────────────────');
  console.log(`\n  Caja ID: ${caja.id}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
