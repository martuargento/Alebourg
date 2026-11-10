const { PrismaClient: LocalPrismaClient } = require('@prisma/client');

function crearClienteProduccion() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL es obligatorio en producción.');
  }

  const { PrismaClient } = require('../generated/prisma-production');
  const url = new URL(databaseUrl);
  url.searchParams.set('pgbouncer', 'true');
  return new PrismaClient({
    datasources: { db: { url: url.toString() } },
  });
}

const prisma = process.env.NODE_ENV === 'production'
  ? crearClienteProduccion()
  : new LocalPrismaClient();

module.exports = { prisma };
