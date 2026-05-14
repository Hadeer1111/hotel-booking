import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage(): React.ReactElement {
  return (
    <section className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <h1 className="text-5xl font-semibold tracking-tight max-w-3xl">
        Book hotels with confidence. Manage yours with ease.
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl">
        A single workspace for guests, managers, and admins. Search rooms, book
        instantly, and watch your business in real time.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/hotels">
          <Button size="lg">Browse hotels</Button>
        </Link>
        <Link href="/register">
          <Button size="lg" variant="outline">
            Create an account
          </Button>
        </Link>
      </div>
    </section>
  );
}
