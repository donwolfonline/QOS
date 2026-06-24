import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'qos_abi::state_get — Q-OS Docs' };

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
        <Link href="/docs/sdk-reference" className="hover:text-[#00d4ff] transition-colors">qos-sdk</Link>
        <span>›</span>
        <span className="text-gray-400">state_get</span>
      </div>

      <div className="mb-8 pb-8 border-b border-[#00d4ff]/10">
        <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#facc15] bg-[#facc15]/10 border border-[#facc15]/20 px-2.5 py-1 rounded-full mb-4 inline-block">
          qos-sdk Reference
        </span>
        <H1>qos_sdk::state::get</H1>
        <P>
          Retrieves the value for a given key from the Edge Node's Sled database.
        </P>
      </div>

      <H2 id="signature">Signature</H2>
      <div className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg mb-8 overflow-x-auto">
        <pre className="text-sm font-mono text-gray-300">
<span className="text-[#ff7a2f]">pub fn</span> <span className="text-[#00d4ff]">get</span>(key: &amp;<span className="text-[#00d4ff]">str</span>) -&gt; <span className="text-[#00ff41]">Option</span>&lt;<span className="text-[#facc15]">Vec</span>&lt;<span className="text-[#00d4ff]">u8</span>&gt;&gt;
        </pre>
      </div>

      <H2 id="usage">Usage</H2>
      <P>
        If the key exists, the host returns the bytes exactly as they were stored. If the key does not exist, <InlineCode>None</InlineCode> is returned.
      </P>

      <div className="my-6 rounded-xl border border-gray-800 bg-[#111] overflow-hidden">
        <div className="flex items-center px-4 py-2 bg-black border-b border-gray-800">
          <span className="text-xs font-mono-code text-gray-500">src/lib.rs</span>
        </div>
        <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{`use qos_sdk::state;

#[no_mangle]
pub extern "C" fn run() -> i32 {
    if let Some(val) = state::get("counter") {
        if val.len() == 1 {
            let count = val[0];
            // ... use count ...
        }
    }
    0
}`}
        </pre>
      </div>

      <Callout type="tip">
        Because WASM memory allocation is cheap, <InlineCode>get()</InlineCode> allocates a fresh <InlineCode>Vec&lt;u8&gt;</InlineCode> per call. You don't need to manually size buffers or handle pointers unless using the raw ABI.
      </Callout>

      <div className="flex items-center justify-between pt-8 border-t border-[#00d4ff]/10 mt-12">
        <Link href="/docs/sdk-reference/write-output" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>write_output</span>
        </Link>
        <Link href="/docs/sdk-reference/state-set" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span>state_set</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </article>
  );
}
