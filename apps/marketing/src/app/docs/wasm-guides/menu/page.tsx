import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Menu & Ordering Module — Q-OS Docs' };

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
        <span className="text-gray-400">Menu & Ordering</span>
      </div>

      <div className="mb-8 pb-8 border-b border-[#00d4ff]/10">
        <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#ff7a2f] bg-[#ff7a2f]/10 border border-[#ff7a2f]/20 px-2.5 py-1 rounded-full mb-4 inline-block">
          WASM Module Guide
        </span>
        <H1>Menu & Ordering Module</H1>
        <P>
          This guide demonstrates how to process incoming JSON payloads (orders) and append them to a Kitchen Display System (KDS) queue.
        </P>
      </div>

      <H2 id="flow">Architecture Flow</H2>
      <P>
        Instead of a single counter, a KDS requires a list of pending orders. Since <InlineCode>state::set</InlineCode> overwrites keys entirely, the module must append the new order to an existing list, or use a unique ID for the key (e.g., <InlineCode>order:1234</InlineCode>).
      </P>

      <div className="my-6 rounded-xl border border-gray-800 bg-[#111] overflow-hidden">
        <div className="flex items-center px-4 py-2 bg-black border-b border-gray-800">
          <span className="text-xs font-mono-code text-gray-500">src/lib.rs</span>
        </div>
        <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{`#![no_std]

use qos_sdk::{state, input, output};

#[no_mangle]
pub extern "C" fn run() -> i32 {
    let payload = input::read().unwrap_or_default();
    
    // Fetch current order index
    let mut index: u32 = 0;
    if let Some(val) = state::get("menu:order_index") {
        if val.len() == 4 {
            let mut buf = [0u8; 4];
            buf.copy_from_slice(&val);
            index = u32::from_le_bytes(buf) + 1;
        }
    }
    
    // Update index
    state::set("menu:order_index", &index.to_le_bytes()).unwrap();
    
    // Save order payload to a unique key
    // We format the string manually since no_std prevents String::format
    // For simplicity in this example, we assume order ID matches the index.
    // In reality, use a tiny string formatting crate.
    let key = "menu:order_pending";
    state::set(key, &payload).unwrap();
    
    output::write(b"{\\"status\\":\\"sent_to_kitchen\\"}");
    0
}`}
        </pre>
      </div>

      <Callout type="tip">
        When an order is saved, the <InlineCode>STATE_MUTATION</InlineCode> event is sent to the Admin HUD immediately, allowing the kitchen screen to populate in real-time without polling.
      </Callout>

      <div className="flex items-center justify-between pt-8 border-t border-[#00d4ff]/10 mt-12">
        <Link href="/docs/wasm-guides/guestbook" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Guest Check-In</span>
        </Link>
        <Link href="/docs/wasm-guides/vip" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span>VIP Validation</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </article>
  );
}
