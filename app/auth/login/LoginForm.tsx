'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  const registered = searchParams?.get('registered');

  const { login, loading: isLoading, user } = useAuth();

  useEffect(() => {
    if (error) setError('');
  }, [email, password]);

  useEffect(() => {
    if (user) router.replace(callbackUrl);
  }, [user, callbackUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) return setError('Email dan password harus diisi');
    if (!/\S+@\S+\.\S+/.test(email)) return setError('Format email tidak valid');

    setIsSubmitting(true);
    setError('');

    try {
      const result = await login(email, password);

      if (result?.success) {
        toast({ title: 'Login berhasil', description: 'Mengalihkan ke dashboard...' });
        router.replace(callbackUrl);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setError(errorMessage);
      toast({ title: 'Login gagal', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md p-6 space-y-4">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Masuk</CardTitle>
          <CardDescription>
            {registered ? (
              <span className="text-green-600">Registrasi berhasil! Silakan masuk.</span>
            ) : (
              'Masukkan email dan password Anda untuk mengakses akun.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className={error?.includes('email') ? 'border-red-500' : ''}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                  Lupa password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className={error ? 'border-red-500' : ''}
              />
            </div>

            {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}

            <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Belum punya akun?{' '}
            <Link href="/auth/register" className="text-primary hover:underline">
              Daftar Sekarang
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
