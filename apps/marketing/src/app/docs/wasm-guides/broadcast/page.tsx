import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Custom Broadcast Logic — Q-OS Docs' };

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
        <span className="text-gray-400">Custom Broadcast Logic</span>
      </div>

      <div className="mb-8 pb-8 border-b border-[#00d4ff]/10">
        <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#ff7a2f] bg-[#ff7a2f]/10 border border-[#ff7a2f]/20 px-2.5 py-1 rounded-full mb-4 inline-block">
          WASM Module Guide
        </span>
        <H1>Custom Broadcast Logic</H1>
        <P>
          Sometimes you want a WASM module to actively push notifications directly to the Admin HUD without storing permanent state. You can do this using the <InlineCode>qos_sdk::broadcast</InlineCode> module.
        </P>
      </div>

      <H2 id="source">Low Stock Alerts</H2>
      <P>
        Building upon the Inventory module, we can dispatch a critical alert to the manager's dashboard if a SKU drops below 5 items.
      </P>

      <div className="my-6 rounded-xl border border-gray-800 bg-[#111] overflow-hidden">
        <div className="flex items-center px-4 py-2 bg-black border-b border-gray-800">
          <span className="text-xs font-mono-code text-gray-500">src/lib.rs</span>
        </div>
        <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{`#![no_std]

// Assuming the qos_sdk has a broadcast module:
use qos_sdk::{state, output, broadcast, LogLevel};

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
                
                // --- NEW LOGIC HERE ---
                if stock == 5 {
                    broadcast::send(LogLevel::Warn, b"Beer stock is critically low! Only 5 left.");
                }
                
                output::write(b"{\\"status\\":\\"success\\"}");
                return 0;
            }
        }
    }
    
    1
}`}
        </pre>
      </div>

      <div className="flex items-center justify-between pt-8 border-t border-[#00d4ff]/10 mt-12">
        <Link href="/docs/wasm-guides/inventory" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Inventory Sync</span>
        </Link>
        <div />
      </div>
    </article>
  );
}
