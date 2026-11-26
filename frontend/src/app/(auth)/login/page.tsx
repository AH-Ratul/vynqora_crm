'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (hasHydrated && accessToken) {
      router.replace('/');
    }
  }, [hasHydrated, accessToken, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-7">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-stone-900 text-sm font-semibold text-stone-50">
            V
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Sign in to Vynqora CRM
          </h1>
          <p className="text-xs text-muted-foreground">
            Enter your credentials to access your workspace.
          </p>
        </div>

        <form
          onSubmit={handleSubmit((data) => login.mutate(data))}
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-xs"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-9" disabled={login.isPending}>
            {login.isPending && <Loader2 className="size-4 animate-spin" />}
            Sign in
          </Button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-9"
            disabled={login.isPending}
            onClick={() => login.mutate({ email: 'admin@email.com', password: 'admin123' })}
          >
            {login.isPending && <Loader2 className="size-4 animate-spin" />}
            Demo Admin Login
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            admin@email.com · admin123
          </p>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          New to Vynqora CRM?{' '}
          <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
