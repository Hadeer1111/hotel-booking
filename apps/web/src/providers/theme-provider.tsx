'use client';

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

/**
 * Thin wrapper around `next-themes`. We swap the html class (`darkMode:
 * 'class'` in tailwind.config.ts), persist the user's choice in
 * localStorage, respect the system preference until they pick one, and
 * disable transitions while the class swap happens so the page doesn't
 * fade through an in-between state.
 */
export function ThemeProvider({ children, ...rest }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...rest}
    >
      {children}
    </NextThemesProvider>
  );
}
