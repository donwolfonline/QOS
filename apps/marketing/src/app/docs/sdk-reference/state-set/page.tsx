import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'qos_abi::state_set — Q-OS Docs' };

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
        <span className="text-gray-400">state_set</span>
      </div>

      <div className="mb-8 pb-8 border-b border-[#00d4ff]/10">
        <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#facc15] bg-[#facc15]/10 border border-[#facc15]/20 px-2.5 py-1 rounded-full mb-4 inline-block">
          qos-sdk Reference
        </span>
        <H1>qos_sdk::state::set</H1>
        <P>
          Writes a byte array to a specific key in the Sled state store. This is the primary way a WASM module causes a persistent side-effect.
        </P>
      </div>

      <H2 id="signature">Signature</H2>
      <div className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg mb-8 overflow-x-auto">
        <pre className="text-sm font-mono text-gray-300">
<span className="text-[#ff7a2f]">pub fn</span> <span className="text-[#00d4ff]">set</span>(key: &amp;<span className="text-[#00d4ff]">str</span>, value: &amp;[<span className="text-[#00d4ff]">u8</span>]) -&gt; <span className="text-[#00ff41]">Result</span>&lt;(), ()&gt;
        </pre>
      </div>

      <H2 id="usage">Usage</H2>
      <P>
        <InlineCode>set()</InlineCode> is atomic. If multiple invocations of a module call <InlineCode>set()</InlineCode> simultaneously, the host guarantees sequential ordering without data corruption.
      </P>

      <div className="my-6 rounded-xl border border-gray-800 bg-[#111] overflow-hidden">
        <div className="flex items-center px-4 py-2 bg-black border-b border-gray-800">
          <span className="text-xs font-mono-code text-gray-500">src/lib.rs</span>
        </div>
        <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{`use qos_sdk::state;

#[no_mangle]
pub extern "C" fn run() -> i32 {
    let mut count: u8 = 1;
    
    if let Some(val) = state::get("counter") {
        if val.len() == 1 {
            count = val[0] + 1;
        }
    }
    
    // Atomically save the new count
    state::set("counter", &[count]).unwrap();
    
    count as i32
}`}
        </pre>
      </div>

      <Callout type="warn">
        Every call to <InlineCode>set()</InlineCode> automatically triggers a <InlineCode>STATE_MUTATION</InlineCode> WebSocket event to the Admin dashboard. You should bundle updates where possible to avoid spamming the WebSocket channel.
      </Callout>

      <div className="flex items-center justify-between pt-8 border-t border-[#00d4ff]/10 mt-12">
        <Link href="/docs/sdk-reference/state-get" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>state_get</span>
        </Link>
        <Link href="/docs/sdk-reference/errors" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#00d4ff] font-mono-code transition-colors group">
          <span>Error Handling</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </article>
  );
}
