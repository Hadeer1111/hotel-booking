// Test bootstrap env. Real e2e runs set RUN_E2E=1 + DATABASE_URL externally;
// dummy values here keep static module loading (AppModule import side effects)
// from blowing up the test harness when the suite is skipped.
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/hotel_booking_test';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? '0'.repeat(32);
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? '1'.repeat(32);
process.env.BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS ?? '4';
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'fatal';
process.env.PAYMENTS_PROVIDER = process.env.PAYMENTS_PROVIDER ?? 'mock';
