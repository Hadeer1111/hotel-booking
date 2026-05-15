import Link from 'next/link';
import { ArrowRight, CalendarHeart, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function HomePage(): React.ReactElement {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <section className="relative overflow-hidden rounded-3xl shadow-soft">
        <div
          aria-hidden="true"
          className={cn(
            'absolute inset-0 bg-gradient-to-br from-cyan-400 via-cyan-300 to-amber-200',
            'bg-[length:200%_200%] animate-gradient-shift',
          )}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.6),transparent_55%)]"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-white/25 blur-3xl animate-float"
        />
        <div
          aria-hidden="true"
          className="absolute -top-16 -left-10 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl animate-float"
          style={{ animationDelay: '3s' }}
        />

        <div className="relative flex flex-col items-center gap-6 px-6 py-20 text-center md:py-28">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1',
              'text-xs font-medium text-brand-turquoiseDeep shadow-soft animate-fade-up',
            )}
          >
            <Sparkles className="h-3.5 w-3.5" /> Tropical Joy is here
          </span>
          <h1
            className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 animate-fade-up sm:text-4xl md:text-6xl"
            style={{ animationDelay: '60ms' }}
          >
            Book hotels with confidence.
            <span className="block bg-gradient-to-r from-brand-turquoiseDeep to-amber-500 bg-clip-text text-transparent">
              Manage yours with ease.
            </span>
          </h1>
          <p
            className="max-w-2xl text-lg text-slate-800/80 animate-fade-up"
            style={{ animationDelay: '120ms' }}
          >
            A single workspace for guests, managers, and admins. Search rooms, book
            instantly, and watch your business in real time.
          </p>
          <div
            className="flex flex-wrap justify-center gap-3 animate-fade-up"
            style={{ animationDelay: '180ms' }}
          >
            <Link href="/hotels">
              <Button
                size="lg"
                className={cn(
                  'group gap-2 rounded-full shadow-soft',
                  'hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300',
                )}
              >
                Browse hotels
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full bg-white/70 backdrop-blur hover:bg-white"
              >
                Create an account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 md:grid-cols-3 sm:gap-5">
        <FeatureCard
          delay={0}
          icon={CalendarHeart}
          title="Instant booking"
          description="Pick your dates, pay securely, and get an instant confirmation. No waiting, no surprises."
        />
        <FeatureCard
          delay={80}
          icon={ShieldCheck}
          title="Verified hotels"
          description="Every listing is managed by a real partner. Star ratings, rooms, and prices are kept up to date."
        />
        <FeatureCard
          delay={160}
          icon={Sparkles}
          title="Real-time insights"
          description="Managers and admins see revenue, occupancy, and bookings update live on a dedicated dashboard."
        />
      </section>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <div
      className={cn(
        'group rounded-2xl border-0 bg-card p-6 shadow-soft animate-fade-up',
        'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          'mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl',
          'bg-gradient-to-br from-cyan-100 to-amber-100 text-brand-turquoiseDeep',
          'transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6',
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
