import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Module Registry — Q-OS',
  description:
    'The App Store for the Physical World. Browse, install, and publish WASM modules for your Q-OS edge node. IoT telemetry, sensor rate limiters, sync coordinators, and more.',
  openGraph: {
    title: 'Q-OS Module Registry — Deploy WASM Logic to Physical Space',
    description: 'Browse 12+ ready-to-deploy WASM modules for edge computing, IoT, industrial automation, and more. Install in one command.',
    url: 'https://q-os.io/registry',
  },
};

export default function RegistryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
