import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'qos_abi::read_input — Q-OS Docs' };

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
        <span className="text-gray-400">read_input</span>
      </div>

      <div className="mb-8 pb-8 border-b border-[#00d4ff]/10">
        <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#facc15] bg-[#facc15]/10 border border-[#facc15]/20 px-2.5 py-1 rounded-full mb-4 inline-block">
          qos-sdk Reference
        </span>
        <H1>qos_sdk::input::read</H1>
        <P>
          Reads the JSON payload provided by the host environment (typically passed from the guest's Micro-UI upon scanning the QR code).
        </P>
      </div>

      <H2 id="signature">Signature</H2>
      <div className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg mb-8 overflow-x-auto">
        <pre className="text-sm font-mono text-gray-300">
<span className="text-[#ff7a2f]">pub fn</span> <span className="text-[#00d4ff]">read</span>() -&gt; <span className="text-[#00ff41]">Option</span>&lt;<span className="text-[#facc15]">Vec</span>&lt;<span className="text-[#00d4ff]">u8</span>&gt;&gt;
        </pre>
      </div>

      <H2 id="usage">Usage</H2>
      <P>
        Because Q-OS WASM modules execute in a <InlineCode>#[no_std]</InlineCode> environment, this function returns a raw byte vector. You will typically use a lightweight JSON parser like <InlineCode>serde-json-core</InlineCode> or <InlineCode>microserde</InlineCode> to deserialize the bytes into a Rust struct.
      </P>

      <div className="my-6 rounded-xl border border-gray-800 bg-[#111] overflow-hidden">
        <div className="flex items-center px-4 py-2 bg-black border-b border-gray-800">
          <span className="text-xs font-mono-code text-gray-500">src/lib.rs</span>
        </div>
        <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{`use qos_sdk::input;

#[no_mangle]
pub extern "C" fn run() -> i32 {
    // 1. Read input bytes from host
    if let Some(bytes) = input::read() {
        // 2. Convert to string (if expecting UTF-8)
        if let Ok(json_str) = core::str::from_utf8(&bytes) {
            qos_sdk::log_msg(qos_sdk::LogLevel::Info, "Received payload");
            // 3. Parse JSON...
        }
    }
    0
}`}
        </pre>
      </div>

      <H2 id="internals">Under the Hood</H2>
      <P>
        This wrapper calls the raw ABI function <InlineCode>__qos_input_len()</InlineCode> to determine the buffer size, allocates a <InlineCode>Vec&lt;u8&gt;</InlineCode>, and then calls <InlineCode>__qos_input_read(*mut u8)</InlineCode> to instruct the host to write the payload directly into the WASM sandbox's linear memory.
      </P>

      <div className="flex items-center justify-between pt-8 border-t border-[#00d4ff]/10 mt-12">
        <Link href="/docs/sdk-reference" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>SDK Overview</span>
        </Link>
        <Link href="/docs/sdk-reference/write-output" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span>write_output</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </article>
  );
}
