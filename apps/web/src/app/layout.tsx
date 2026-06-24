import type { Metadata } from 'next';
import { Fira_Code } from 'next/font/google';
import './globals.css';

const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira-code' });
import { ConnectionProvider } from '@/lib/ConnectionContext';
import { ThemeProvider } from 'qos-ui-shared';

export const metadata: Metadata = {
  title: 'Q-OS Command Interface',
  description: 'Quantum Operating System — Edge Node Dashboard & Control Plane',
  keywords: ['Q-OS', 'edge computing', 'WASM', 'mesh network', 'node dashboard'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className={`bg-qos-bg text-qos-text antialiased selection:bg-qos-primary/20 selection:text-qos-primary ${firaCode.variable}`} suppressHydrationWarning>
        <ThemeProvider>
          <ConnectionProvider>
            {children}
          </ConnectionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
