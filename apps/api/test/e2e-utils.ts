import { Test, type TestingModule } from '@nestjs/testing';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpProblemFilter } from '../src/common/errors/http-problem.filter';

export interface E2EHandle {
  app: INestApplication;
  prisma: PrismaService;
  module: TestingModule;
}

export async function bootstrapE2E(): Promise<E2EHandle> {
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = module.createNestApplication({ rawBody: true });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new HttpProblemFilter());
  await app.init();
  return { app, prisma: app.get(PrismaService), module };
}

export async function resetDb(prisma: PrismaService): Promise<void> {
  // order matters because of FK constraints
  await prisma.paymentEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.room.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.user.deleteMany();
}

/** Set when DATABASE_URL is reachable; e2e tests skip when missing. */
export function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.RUN_E2E === '1');
}
