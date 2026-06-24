import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Guest Check-In Module — Q-OS Docs' };

function H1({ children }: { children: React.ReactNode }) { return <h1 className="text-4xl font-black text-white tracking-tight mb-4 font-mono-code">{children}</h1>; }
function H2({ id, children }: { id: string; children: React.ReactNode }) { return <h2 id={id} className="text-2xl font-bold text-white mt-14 mb-4 scroll-mt-24 flex items-center gap-3"><span className="text-[#00d4ff] font-mono-code text-lg">#</span>{children}</h2>; }
function P({ children }: { children: React.ReactNode }) { return <p className="text-gray-400 leading-7 mb-4">{children}</p>; }
function InlineCode({ children }: { children: React.ReactNode }) { return <code className="font-mono-code text-[#00d4ff] bg-[#00d4ff]/8 border border-[#00d4ff]/15 px-1.5 py-0.5 rounded text-sm">{children}</code>; }
function Callout({ type, children }: { type: 'tip' | 'warn' | 'info'; children: React.ReactNode }) {
  const styles = {
    tip:  { border: '#00ff41', bg: '#00ff41', icon: '💡', label: 'TIP' },
    warn: { border: '#ff7a2f', bg: '#ff7a2f', icon: '⚠️', label: 'WARNING' },
    info: { border: '#00d4ff', bg: '#00d4ff', icon: 'ℹ️', label: 'NOTE' },
  }[type];
  return (
    <div className="my-6 rounded-xl border p-4 pl-5 relative overflow-hidden" style={{ borderColor: styles.border + '35', background: styles.bg + '08' }}>
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: styles.border }} />
      <p className="font-mono-code text-[10px] uppercase tracking-widest mb-2" style={{ color: styles.border }}>{styles.icon} {styles.label}</p>
      <div className="text-gray-400 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function Page() {
  return (
    <article>
      <div className="flex items-center gap-2 text-xs font-mono-code text-gray-700 mb-8">
        <Link href="/docs" className="hover:text-[#00d4ff] transition-colors">Docs</Link>
        <span>›</span>
        <Link href="/docs/wasm-guides" className="hover:text-[#00d4ff] transition-colors">WASM Guides</Link>
        <span>›</span>
        <span className="text-gray-400">Guestbook</span>
      </div>

      <div className="mb-8 pb-8 border-b border-[#00d4ff]/10">
        <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#ff7a2f] bg-[#ff7a2f]/10 border border-[#ff7a2f]/20 px-2.5 py-1 rounded-full mb-4 inline-block">
          WASM Module Guide
        </span>
        <H1>Guest Check-In Module</H1>
        <P>
          This guide demonstrates how to build a simple but robust Guestbook module. It records the total number of physical visits to a location.
        </P>
      </div>

      <H2 id="source">Full Source Code</H2>
      <P>
        This module reads the alias (name) from the guest's Micro-UI, increments a global counter, and writes the guest's name to a specific Sled key.
      </P>

      <div className="my-6 rounded-xl border border-gray-800 bg-[#111] overflow-hidden">
        <div className="flex items-center px-4 py-2 bg-black border-b border-gray-800">
          <span className="text-xs font-mono-code text-gray-500">src/lib.rs</span>
        </div>
        <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{`#![no_std]

use qos_sdk::{state, input, output, log_msg, LogLevel};

#[no_mangle]
pub extern "C" fn run() -> i32 {
    // 1. Read alias from input
    let bytes = input::read().unwrap_or_default();
    let alias = core::str::from_utf8(&bytes).unwrap_or("Anonymous");
    
    // 2. Increment global counter atomically
    let mut current_count: u32 = 1;
    if let Some(val) = state::get("guestbook:total_visits") {
        if val.len() == 4 {
            let mut buf = [0u8; 4];
            buf.copy_from_slice(&val);
            current_count = u32::from_le_bytes(buf) + 1;
        }
    }
    state::set("guestbook:total_visits", &current_count.to_le_bytes()).unwrap();
    
    // 3. Save latest guest
    state::set("guestbook:latest_guest", alias.as_bytes()).unwrap();
    
    log_msg(LogLevel::Info, "New guest checked in!");
    
    // 4. Return receipt
    // In a real app, use a JSON serializer like microserde.
    let receipt = "{\\"status\\":\\"success\\"}";
    output::write(receipt.as_bytes());
    
    0
}`}
        </pre>
      </div>

      <H2 id="concurrency">Handling Concurrency</H2>
      <P>
        Because <InlineCode>state::get</InlineCode> and <InlineCode>state::set</InlineCode> run within the execution pipeline synchronously on the Edge Node, there is no risk of a race condition between reading the counter and writing the updated counter.
      </P>

      <div className="flex items-center justify-between pt-8 border-t border-[#00d4ff]/10 mt-12">
        <Link href="/docs/wasm-guides" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>WASM Guides Overview</span>
        </Link>
        <Link href="/docs/wasm-guides/menu" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span>Menu & Ordering</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </article>
  );
}
