import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'qos_abi::write_output — Q-OS Docs' };

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
        <Link href="/docs/sdk-reference" className="hover:text-[#00d4ff] transition-colors">qos-sdk</Link>
        <span>›</span>
        <span className="text-gray-400">write_output</span>
      </div>

      <div className="mb-8 pb-8 border-b border-[#00d4ff]/10">
        <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#facc15] bg-[#facc15]/10 border border-[#facc15]/20 px-2.5 py-1 rounded-full mb-4 inline-block">
          qos-sdk Reference
        </span>
        <H1>qos_sdk::output::write</H1>
        <P>
          Sends the final receipt payload from the WASM module back to the host, which is then routed to the guest's Micro-UI and the Admin HUD via an <InlineCode>EXECUTION_RECEIPT</InlineCode> WebSocket event.
        </P>
      </div>

      <H2 id="signature">Signature</H2>
      <div className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg mb-8 overflow-x-auto">
        <pre className="text-sm font-mono text-gray-300">
<span className="text-[#ff7a2f]">pub fn</span> <span className="text-[#00d4ff]">write</span>(data: &amp;[<span className="text-[#00d4ff]">u8</span>])
        </pre>
      </div>

      <H2 id="usage">Usage</H2>
      <P>
        The data passed to <InlineCode>output::write</InlineCode> should typically be a JSON-encoded string. Once written, the module should normally return immediately.
      </P>

      <div className="my-6 rounded-xl border border-gray-800 bg-[#111] overflow-hidden">
        <div className="flex items-center px-4 py-2 bg-black border-b border-gray-800">
          <span className="text-xs font-mono-code text-gray-500">src/lib.rs</span>
        </div>
        <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{`use qos_sdk::output;

#[no_mangle]
pub extern "C" fn run() -> i32 {
    // Construct receipt
    let receipt = br#"{"status":"success","message":"Checked in"}"#;
    
    // Write back to host
    output::write(receipt);
    
    // Return 0 for success
    0
}`}
        </pre>
      </div>

      <div className="flex items-center justify-between pt-8 border-t border-[#00d4ff]/10 mt-12">
        <Link href="/docs/sdk-reference/read-input" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>read_input</span>
        </Link>
        <Link href="/docs/sdk-reference/state-get" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span>state_get</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </article>
  );
}
