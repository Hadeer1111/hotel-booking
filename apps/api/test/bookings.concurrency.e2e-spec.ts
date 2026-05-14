import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { bootstrapE2E, resetDb, hasDb, type E2EHandle } from './e2e-utils';

const RUN = hasDb() ? describe : describe.skip;

/**
 * The headline test for the booking correctness story: spin up N parallel
 * booking requests for the same room-type with only 1 physical room
 * available, and assert that *exactly one* succeeds.
 *
 * This exercises the full layered defence:
 *   - SERIALIZABLE transaction
 *   - FOR UPDATE SKIP LOCKED room selection
 *   - booking_no_overlap exclusion constraint as the last line of defence
 *
 * Loss-free correctness here is the single most important quality of the
 * service, so this test runs against a real Postgres (not a mock).
 */
RUN('bookings concurrency (e2e)', () => {
  let handle: E2EHandle;
  let customerToken: string;
  let hotelId: string;
  let roomTypeId: string;

  beforeAll(async () => {
    handle = await bootstrapE2E();
  });
  afterAll(async () => {
    await handle.app.close();
  });

  beforeEach(async () => {
    await resetDb(handle.prisma);

    const passwordHash = await bcrypt.hash('Password123!', 4);
    const customer = await handle.prisma.user.create({
      data: { email: 'c@x.io', name: 'C', passwordHash, role: Role.CUSTOMER },
    });
    const hotel = await handle.prisma.hotel.create({
      data: { name: 'H1', city: 'NYC', address: '1 Main', stars: 4 },
    });
    const rt = await handle.prisma.roomType.create({
      data: {
        hotelId: hotel.id,
        name: 'Standard',
        capacity: 2,
        basePricePerNight: 100,
      },
    });
    await handle.prisma.room.create({ data: { roomTypeId: rt.id, roomNumber: '101' } });
    hotelId = hotel.id;
    roomTypeId = rt.id;

    const login = await request(handle.app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: customer.email, password: 'Password123!' })
      .expect(200);
    customerToken = login.body.accessToken as string;
  });

  it('serialises parallel bookings: exactly one succeeds', async () => {
    const checkIn = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const checkOut = new Date(checkIn.getTime() + 24 * 60 * 60 * 1000);
    const N = 8;

    const responses = await Promise.all(
      Array.from({ length: N }, () =>
        request(handle.app.getHttpServer())
          .post('/v1/bookings')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            hotelId,
            roomTypeId,
            checkIn: checkIn.toISOString(),
            checkOut: checkOut.toISOString(),
            guestCount: 1,
          }),
      ),
    );

    const ok = responses.filter((r: { status: number }) => r.status === 201);
    const conflicts = responses.filter((r: { status: number }) => r.status === 409);

    expect(ok.length).toBe(1);
    expect(conflicts.length).toBe(N - 1);
    // verify only one booking row exists
    const count = await handle.prisma.booking.count();
    expect(count).toBe(1);
  });
});
