import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { WishlistProvider } from '@/providers/wishlist-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hotel Booking',
  description: 'Manage hotels, rooms, bookings, and payments.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <WishlistProvider>
                <SiteHeader />
                <main className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]">{children}</main>
                <Toaster />
              </WishlistProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
