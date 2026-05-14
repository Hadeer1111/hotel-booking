import request from 'supertest';
import { bootstrapE2E, resetDb, hasDb, type E2EHandle } from './e2e-utils';

const RUN = hasDb() ? describe : describe.skip;

RUN('auth flow (e2e)', () => {
  let handle: E2EHandle;
  beforeAll(async () => {
    handle = await bootstrapE2E();
  });
  afterAll(async () => {
    await handle.app.close();
  });
  beforeEach(async () => {
    await resetDb(handle.prisma);
  });

  it('register -> login -> refresh -> reuse-detection', async () => {
    const credentials = { email: 'e2e@x.io', password: 'Password123!', name: 'E2E' };

    const reg = await request(handle.app.getHttpServer())
      .post('/v1/auth/register')
      .send(credentials)
      .expect(201);
    expect(reg.body.accessToken).toBeTruthy();
    expect(reg.body.refreshToken).toBeTruthy();

    const login = await request(handle.app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    const firstRefresh = login.body.refreshToken as string;

    const rotated = await request(handle.app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: firstRefresh })
      .expect(200);
    expect(rotated.body.refreshToken).not.toBe(firstRefresh);

    // Reusing the previous refresh token must invalidate the entire family.
    await request(handle.app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: firstRefresh })
      .expect(401);

    // The rotated token is now also revoked because the family was burned.
    await request(handle.app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: rotated.body.refreshToken })
      .expect(401);
  });
});
