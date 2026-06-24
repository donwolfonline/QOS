import { ComingSoon } from '@/components/docs/ComingSoon';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Installation — Q-OS Docs' };

export default function Page() {
  return (
    <article>
      <div className="flex items-center gap-2 text-xs font-mono-code text-gray-700 mb-8">
        <Link href="/docs" className="hover:text-[#00d4ff] transition-colors">Docs</Link>
        <span>›</span>
        <span className="text-gray-400">Installation</span>
      </div>
      <ComingSoon
        title="Installation"
        category="Getting Started"
        categoryColor="#00ff41"
        prev={{ label: 'Introduction', href: '/docs' }}
        next={{ label: 'Your First Module', href: '/docs/first-module' }}
        topics={['System requirements (macOS, Linux)', 'Downloading the qos binary', 'PATH configuration', 'Verifying the install with qos --version', 'Firewall and port setup']}
      />
    </article>
  );
}
