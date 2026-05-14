/* eslint-disable no-console */
import { PrismaClient, Role, HotelStatus, BookingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PASSWORD = 'Password123!';
const BCRYPT_ROUNDS = 12;

/**
 * Populates the database with a realistic dataset:
 * - 1 admin, 2 managers, 3 customers
 * - 4 hotels (2 per manager)
 * - 3 room types per hotel, 3-5 physical rooms per type
 * - 1 confirmed booking per customer with a paid Payment
 *
 * Idempotent: uses upsert by email/unique keys so re-running just refreshes data.
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

  const hotelData = [
    { manager: manager1, name: 'Aurora Grand', city: 'Reykjavík', stars: 5 },
    { manager: manager1, name: 'Northern Lights Inn', city: 'Tromsø', stars: 4 },
    { manager: manager2, name: 'Coral Bay Resort', city: 'Hurghada', stars: 4 },
    { manager: manager2, name: 'Sahara Palace', city: 'Marrakech', stars: 5 },
  ];

  for (const h of hotelData) {
    const hotel = await prisma.hotel.upsert({
      where: { id: `${h.name}-stub` }, // never matches, forces create on first run
      update: {},
      create: {
        name: h.name,
        city: h.city,
        address: `1 ${h.name} Avenue`,
        stars: h.stars,
        status: HotelStatus.ACTIVE,
        managerId: h.manager.id,
      },
    });

    const types = [
      { name: 'Standard', capacity: 2, price: 90, units: 4 },
      { name: 'Deluxe', capacity: 3, price: 160, units: 3 },
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

  const firstHotel = await prisma.hotel.findFirstOrThrow({
    where: { name: 'Aurora Grand' },
    include: { roomTypes: { include: { rooms: true } } },
  });
  const standardType = firstHotel.roomTypes.find((t) => t.name === 'Standard');
  if (standardType && standardType.rooms[0] && customers[0]) {
    const room = standardType.rooms[0];
    const checkIn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const checkOut = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
    const nights = 2;
    const total = Number(standardType.basePricePerNight) * nights;

    const booking = await prisma.booking.create({
      data: {
        userId: customers[0].user.id,
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

  console.log('seed complete:');
  console.log(`  admin     -> ${admin.email}            (password: ${PASSWORD})`);
  console.log(`  manager   -> ${manager1.email}, ${manager2.email}`);
  console.log(`  customers -> carol@example.com, chad@example.com, casey@example.com`);
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
