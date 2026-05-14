'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import { LoginSchema, type LoginInput } from '@hotel-booking/types';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/forms/form-error';
import { AuthShell } from '@/components/auth/auth-shell';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
      const next = params.get('next') ?? '/dashboard';
      router.push(next);
    } catch (err) {
      setError('root', { message: (err as Error).message });
    }
  });

  return (
    <AuthShell
      tagline="Welcome back."
      blurb="Sign in to manage your hotels, track bookings, and watch your revenue grow."
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to continue.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            className="h-11 rounded-xl"
            {...register('email')}
          />
          {errors.email ? (
            <p className="text-xs text-destructive animate-fade-up">{errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            aria-invalid={Boolean(errors.password)}
            className="h-11 rounded-xl"
            {...register('password')}
          />
          {errors.password ? (
            <p className="text-xs text-destructive animate-fade-up">{errors.password.message}</p>
          ) : null}
        </div>
        <FormError error={errors.root?.message ? new Error(errors.root.message) : undefined} />

        <Button
          type="submit"
          className="h-11 w-full gap-2 rounded-xl shadow-soft hover:-translate-y-0.5 transition-transform"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              Signing in…
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Sign in
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          No account?{' '}
          <Link href="/register" className="font-medium text-brand-turquoiseDeep hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
