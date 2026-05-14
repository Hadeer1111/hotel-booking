/* eslint-disable no-console */
import { PrismaClient, Role, HotelStatus, BookingStatus } from '@prisma/client';
import type { Hotel, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PASSWORD = 'Password123!';
const BCRYPT_ROUNDS = 12;

/**
 * Populates the database with a realistic dataset:
 *   - 1 admin, 2 managers, 3 customers
 *   - 4 named hotels (kept stable so e2e references like "Aurora Grand" still work)
 *   - 76 generated hotels spread deterministically across cities, managers, and 1-5 stars
 *     (enough rows to exercise infinite scroll + multi-select filters)
 *   - 3 room types per hotel with 2-4 physical rooms each
 *   - 1 confirmed booking with a paid Payment (only on first seed)
 *
 * Idempotent: looks up hotels by name (no unique constraint, but names are unique by design here)
 * and skips the booking seed if it already exists. Re-runs refresh data instead of duplicating it.
 */
async function main(): Promise<void> {
  console.log('seeding database...');

  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hotelbooking.dev' },
    update: { passwordHash, role: Role.ADMIN, name: 'Ada Admin' },
    create: {
      email: 'admin@hotelbooking.dev',
      name: 'Ada Admin',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const [manager1, manager2] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'manager1@hotelbooking.dev' },
      update: { passwordHash, role: Role.MANAGER, name: 'Maya Manager' },
      create: {
        email: 'manager1@hotelbooking.dev',
        name: 'Maya Manager',
        passwordHash,
        role: Role.MANAGER,
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager2@hotelbooking.dev' },
      update: { passwordHash, role: Role.MANAGER, name: 'Mark Manager' },
      create: {
        email: 'manager2@hotelbooking.dev',
        name: 'Mark Manager',
        passwordHash,
        role: Role.MANAGER,
      },
    }),
  ]);

  const customers = await Promise.all(
    ['carol', 'chad', 'casey'].map((slug, i) =>
      prisma.user.upsert({
        where: { email: `${slug}@example.com` },
        update: { passwordHash, name: `${slug[0]?.toUpperCase()}${slug.slice(1)} Customer` },
        create: {
          email: `${slug}@example.com`,
          name: `${slug[0]?.toUpperCase()}${slug.slice(1)} Customer`,
          passwordHash,
          role: Role.CUSTOMER,
        },
      }).then((u) => ({ user: u, index: i })),
    ),
  );

  // Original named hotels — kept stable for e2e tests and human readability.
  const namedHotels: HotelSeed[] = [
    { manager: manager1, name: 'Aurora Grand', city: 'Reykjavík', stars: 5 },
    { manager: manager1, name: 'Northern Lights Inn', city: 'Tromsø', stars: 4 },
    { manager: manager2, name: 'Coral Bay Resort', city: 'Hurghada', stars: 4 },
    { manager: manager2, name: 'Sahara Palace', city: 'Marrakech', stars: 5 },
  ];

  // Generated bulk dataset — deterministic so re-running seeds the same names/stars.
  const cities = [
    'Reykjavik', 'Tromso', 'Hurghada', 'Marrakech', 'Paris', 'Rome',
    'Tokyo', 'Cairo', 'Dubai', 'Cape Town', 'Lisbon', 'Madrid',
    'Berlin', 'Vienna', 'Prague', 'Athens',
  ];
  const adjectives = [
    'Grand', 'Royal', 'Coastal', 'Palace', 'Boutique', 'Heritage', 'Skyline', 'Garden',
  ];

  const generated: HotelSeed[] = Array.from({ length: 76 }, (_, i) => {
    const city = cities[i % cities.length]!;
    const adj = adjectives[i % adjectives.length]!;
    const suffix = Math.floor(i / cities.length) + 1;
    return {
      manager: i % 2 === 0 ? manager1 : manager2,
      name: `${adj} ${city} ${suffix}`,
      city,
      // Deterministic spread across 1..5; coprime with 5 so all bands fill up.
      stars: ((i * 7) % 5) + 1,
    };
  });

  const hotelData: HotelSeed[] = [...namedHotels, ...generated];

  for (const h of hotelData) {
    const hotel = await upsertHotelByName(h);
    await ensureRoomTypesAndRooms(hotel);
  }

  await ensureSampleBooking(customers[0]?.user);

  console.log(`seed complete (${hotelData.length} hotels):`);
  console.log(`  admin     -> ${admin.email}            (password: ${PASSWORD})`);
  console.log(`  manager   -> ${manager1.email}, ${manager2.email}`);
  console.log(`  customers -> carol@example.com, chad@example.com, casey@example.com`);
}

interface HotelSeed {
  manager: User;
  name: string;
  city: string;
  stars: number;
}

/**
 * Idempotent hotel upsert by name. Hotel has no unique constraint on name,
 * but our seed names are unique by construction, so find-then-update-or-create
 * keeps the dataset stable across re-runs.
 */
async function upsertHotelByName(h: HotelSeed): Promise<Hotel> {
  const existing = await prisma.hotel.findFirst({ where: { name: h.name } });
  const data = {
    name: h.name,
    city: h.city,
    address: `1 ${h.name} Avenue`,
    stars: h.stars,
    status: HotelStatus.ACTIVE,
    managerId: h.manager.id,
  };
  if (existing) {
    return prisma.hotel.update({ where: { id: existing.id }, data });
  }
  return prisma.hotel.create({ data });
}

async function ensureRoomTypesAndRooms(hotel: Hotel): Promise<void> {
  const types = [
    { name: 'Standard', capacity: 2, price: 90, units: 3 },
    { name: 'Deluxe', capacity: 3, price: 160, units: 2 },
    { name: 'Suite', capacity: 4, price: 280, units: 2 },
  ];

  for (const t of types) {
    const roomType = await prisma.roomType.upsert({
      where: { hotelId_name: { hotelId: hotel.id, name: t.name } },
      update: {
        capacity: t.capacity,
        basePricePerNight: t.price,
        description: `${t.name} room at ${hotel.name}`,
      },
      create: {
        hotelId: hotel.id,
        name: t.name,
        capacity: t.capacity,
        basePricePerNight: t.price,
        description: `${t.name} room at ${hotel.name}`,
      },
    });

    for (let unit = 1; unit <= t.units; unit++) {
      const roomNumber = `${t.name[0]}${unit.toString().padStart(2, '0')}`;
      await prisma.room.upsert({
        where: { roomTypeId_roomNumber: { roomTypeId: roomType.id, roomNumber } },
        update: {},
        create: { roomTypeId: roomType.id, roomNumber },
      });
    }
  }
}

/**
 * Seeds a single confirmed booking on Aurora Grand's first Standard room for the first
 * customer. Skipped if that customer already has any booking (idempotent re-runs).
 */
async function ensureSampleBooking(customer: User | undefined): Promise<void> {
  if (!customer) return;
  const already = await prisma.booking.findFirst({ where: { userId: customer.id } });
  if (already) return;

  const firstHotel = await prisma.hotel.findFirst({
    where: { name: 'Aurora Grand' },
    include: { roomTypes: { include: { rooms: true } } },
  });
  const standardType = firstHotel?.roomTypes.find((t) => t.name === 'Standard');
  const room = standardType?.rooms[0];
  if (!standardType || !room) return;

  const checkIn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const checkOut = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
  const nights = 2;
  const total = Number(standardType.basePricePerNight) * nights;

  const booking = await prisma.booking.create({
    data: {
      userId: customer.id,
      roomId: room.id,
      checkIn,
      checkOut,
      guestCount: 2,
      totalPrice: total,
      status: BookingStatus.CONFIRMED,
    },
  });
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      provider: 'mock',
      amount: total,
      currency: 'usd',
      status: 'SUCCEEDED',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e: unknown) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
