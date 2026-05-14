'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { RegisterSchema, type RegisterInput } from '@hotel-booking/types';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormError } from '@/components/forms/form-error';
import { AuthShell } from '@/components/auth/auth-shell';

export default function RegisterPage() {
  const router = useRouter();
  const { register: signUp } = useAuth();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { email: '', password: '', name: '', role: 'CUSTOMER' },
  });

  const role = watch('role');

  const onSubmit = handleSubmit(async (values) => {
    try {
      const user = await signUp(values);
      router.push(user.role === 'MANAGER' ? '/dashboard' : '/hotels');
    } catch (err) {
      setError('root', { message: (err as Error).message });
    }
  });

  return (
    <AuthShell
      tagline="Start your journey."
      blurb="Create an account to book hand-picked hotels — or list your own and reach travellers worldwide."
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          It takes less than a minute.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Your full name"
            className="h-11 rounded-xl"
            {...register('name')}
          />
          {errors.name ? (
            <p className="text-xs text-destructive animate-fade-up">{errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="h-11 rounded-xl"
            {...register('password')}
          />
          {errors.password ? (
            <p className="text-xs text-destructive animate-fade-up">{errors.password.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">I am a…</Label>
          <Select
            value={role}
            onValueChange={(v) => setValue('role', v as RegisterInput['role'])}
          >
            <SelectTrigger id="role" className="h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CUSTOMER">Guest (book rooms)</SelectItem>
              <SelectItem value="MANAGER">Hotel manager</SelectItem>
            </SelectContent>
          </Select>
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
              Creating…
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Create account
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-turquoiseDeep hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
