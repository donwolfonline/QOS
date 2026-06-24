import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Inventory Sync Module — Q-OS Docs' };

function H1({ children }: { children: React.ReactNode }) { return <h1 className="text-4xl font-black text-white tracking-tight mb-4 font-mono-code">{children}</h1>; }
function H2({ id, children }: { id: string; children: React.ReactNode }) { return <h2 id={id} className="text-2xl font-bold text-white mt-14 mb-4 scroll-mt-24 flex items-center gap-3"><span className="text-[#00d4ff] font-mono-code text-lg">#</span>{children}</h2>; }
function P({ children }: { children: React.ReactNode }) { return <p className="text-gray-400 leading-7 mb-4">{children}</p>; }
function InlineCode({ children }: { children: React.ReactNode }) { return <code className="font-mono-code text-[#00d4ff] bg-[#00d4ff]/8 border border-[#00d4ff]/15 px-1.5 py-0.5 rounded text-sm">{children}</code>; }

export default function Page() {
  return (
    <article>
      <div className="flex items-center gap-2 text-xs font-mono-code text-gray-700 mb-8">
        <Link href="/docs" className="hover:text-[#00d4ff] transition-colors">Docs</Link>
        <span>›</span>
        <Link href="/docs/wasm-guides" className="hover:text-[#00d4ff] transition-colors">WASM Guides</Link>
        <span>›</span>
        <span className="text-gray-400">Inventory Sync</span>
      </div>

      <div className="mb-8 pb-8 border-b border-[#00d4ff]/10">
        <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#ff7a2f] bg-[#ff7a2f]/10 border border-[#ff7a2f]/20 px-2.5 py-1 rounded-full mb-4 inline-block">
          WASM Module Guide
        </span>
        <H1>Inventory Sync Module</H1>
        <P>
          This guide shows how to decrement inventory counts atomically. In a CRDT mesh network, local subtractions sync across all peer edge nodes automatically.
        </P>
      </div>

      <H2 id="source">Atomic Subtraction</H2>
      <div className="my-6 rounded-xl border border-gray-800 bg-[#111] overflow-hidden">
        <div className="flex items-center px-4 py-2 bg-black border-b border-gray-800">
          <span className="text-xs font-mono-code text-gray-500">src/lib.rs</span>
        </div>
        <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{`#![no_std]

use qos_sdk::{state, output};

#[no_mangle]
pub extern "C" fn run() -> i32 {
    let sku_key = "inventory:sku_beer";
    
    if let Some(val) = state::get(sku_key) {
        if val.len() == 4 {
            let mut buf = [0u8; 4];
            buf.copy_from_slice(&val);
            let mut stock = u32::from_le_bytes(buf);
            
            if stock > 0 {
                stock -= 1;
                state::set(sku_key, &stock.to_le_bytes()).unwrap();
                output::write(b"{\\"status\\":\\"success\\",\\"msg\\":\\"Dispensing...\\"}");
                return 0;
            } else {
                output::write(b"{\\"status\\":\\"error\\",\\"msg\\":\\"Out of stock!\\"}");
                return 1;
            }
        }
    }
    
    output::write(b"{\\"status\\":\\"error\\",\\"msg\\":\\"SKU not found\\"}");
    1
}`}
        </pre>
      </div>

      <div className="flex items-center justify-between pt-8 border-t border-[#00d4ff]/10 mt-12">
        <Link href="/docs/wasm-guides/vip" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>VIP Validation</span>
        </Link>
        <Link href="/docs/wasm-guides/broadcast" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span>Custom Broadcast Logic</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </article>
  );
}
