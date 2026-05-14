-- Defence in depth for booking correctness.
-- See README "Why SERIALIZABLE and FOR UPDATE SKIP LOCKED and the exclusion constraint?"
--
-- This constraint makes it physically impossible for two PENDING/CONFIRMED
-- bookings to overlap on the same physical Room, even if every line of
-- application code regresses. CANCELLED rows are excluded so cancelled
-- bookings don't block fresh reservations.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
ADD CONSTRAINT booking_no_overlap
EXCLUDE USING gist (
  "roomId"                                 WITH =,
  tstzrange("checkIn", "checkOut", '[)')   WITH &&
)
WHERE (status IN ('PENDING', 'CONFIRMED'));

-- Speeds up the availability lookup the booking service performs inside
-- the SERIALIZABLE transaction.
CREATE INDEX booking_room_dates_idx
  ON "Booking"
  USING gist ("roomId", tstzrange("checkIn", "checkOut", '[)'));
