import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'VIP Validation Module — Q-OS Docs' };

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
        <span className="text-gray-400">VIP Validation</span>
      </div>

      <div className="mb-8 pb-8 border-b border-[#00d4ff]/10">
        <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#ff7a2f] bg-[#ff7a2f]/10 border border-[#ff7a2f]/20 px-2.5 py-1 rounded-full mb-4 inline-block">
          WASM Module Guide
        </span>
        <H1>VIP Validation Module</H1>
        <P>
          This module handles single-use ticket validation. It reads a token from the guest, checks if it exists in the valid tokens list, and then burns it so it cannot be re-used.
        </P>
      </div>

      <H2 id="validation">Validation Logic</H2>
      <P>
        Because this runs entirely on the Edge Node without internet, the list of valid tokens must be pre-loaded into the Sled database before the event.
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
    let payload = input::read().unwrap_or_default();
    let token = core::str::from_utf8(&payload).unwrap_or("");
    
    // Check if token exists in valid list
    // Pre-loaded as "vip:valid:TOKEN_STRING" -> "1"
    // Wait, let's do something simpler: check if it has been used.
    
    // We expect the Admin HUD to pre-load state like:
    // state::set("vip:token:A1B2", b"valid");
    
    // 1. Construct the key (in a real app, use a string formatter crate)
    // Here we assume the token is exactly 4 chars for the example
    if token.len() != 4 {
        output::write(b"{\\"status\\":\\"error\\", \\"msg\\":\\"Invalid token length\\"}");
        return 1;
    }
    
    let mut key = [0u8; 14];
    key[..10].copy_from_slice(b"vip:token:");
    key[10..].copy_from_slice(token.as_bytes());
    
    let key_str = core::str::from_utf8(&key).unwrap();
    
    if let Some(val) = state::get(key_str) {
        if val == b"valid" {
            // Valid token! Burn it.
            state::set(key_str, b"used").unwrap();
            log_msg(LogLevel::Info, "VIP entry granted");
            output::write(b"{\\"status\\":\\"granted\\"}");
            return 0;
        } else if val == b"used" {
            log_msg(LogLevel::Warn, "Replay attack attempted");
            output::write(b"{\\"status\\":\\"denied\\", \\"msg\\":\\"Ticket already used\\"}");
            return 1;
        }
    }
    
    output::write(b"{\\"status\\":\\"denied\\", \\"msg\\":\\"Invalid ticket\\"}");
    1
}`}
        </pre>
      </div>

      <div className="flex items-center justify-between pt-8 border-t border-[#00d4ff]/10 mt-12">
        <Link href="/docs/wasm-guides/menu" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Menu & Ordering</span>
        </Link>
        <Link href="/docs/wasm-guides/inventory" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span>Inventory Sync</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </article>
  );
}
