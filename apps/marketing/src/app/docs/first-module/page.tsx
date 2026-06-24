import { ComingSoon } from '@/components/docs/ComingSoon';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Your First Module — Q-OS Docs' };

export default function Page() {
  return (
    <article>
      <div className="flex items-center gap-2 text-xs font-mono-code text-gray-700 mb-8">
        <Link href="/docs" className="hover:text-[#00d4ff] transition-colors">Docs</Link>
        <span>›</span>
        <span className="text-gray-400">Your First Module</span>
      </div>
      <ComingSoon
        title="Your First Module"
        category="Getting Started"
        categoryColor="#00ff41"
        prev={{ label: 'Installation', href: '/docs/installation' }}
        next={{ label: 'System Overview', href: '/docs/architecture' }}
        topics={['Scaffolding a new Rust WASM crate', 'The execute() entry point', 'Reading guest input', 'Writing state', 'Returning a receipt']}
      />
    </article>
  );
}
