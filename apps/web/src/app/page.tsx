export default function HomePage(): React.ReactElement {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Hotel Booking</h1>
      <p className="text-muted-foreground">
        The web client is up. Hotels, bookings, and dashboard pages follow.
      </p>
    </main>
  );
}
