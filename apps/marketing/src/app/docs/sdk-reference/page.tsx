import type { Metadata } from 'next';
import Link from 'next/link';
import { CodeBlock } from '@/components/docs/CodeBlock';

export const metadata: Metadata = {
  title: 'qos-sdk Reference — Q-OS Docs',
  description: 'Complete ABI reference for writing Q-OS WASM modules: state_get, state_set, write_output, and error handling patterns.',
};

const ABI_FNS = [
  {
    name: '__qos_state_get',
    sig: 'fn __qos_state_get(key_ptr: *const u8, key_len: u32, out_ptr: *mut u8) -> u32',
    color: '#00ff41',
    desc: 'Reads a value from the Sled K/V store by key. Returns the byte length written into out_ptr. Returns 0 if the key does not exist.',
    example: `fn state_get(key: &str) -> Option<String> {
    let key_bytes = key.as_bytes();
    let mut buf = vec![0u8; 4096];
    let len = unsafe {
        __qos_state_get(key_bytes.as_ptr(), key_bytes.len() as u32, buf.as_mut_ptr())
    };
    if len == 0 { return None; }
    String::from_utf8(buf[..len as usize].to_vec()).ok()
}`,
  },
  {
    name: '__qos_state_set',
    sig: 'fn __qos_state_set(key_ptr: *const u8, key_len: u32, val_ptr: *const u8, val_len: u32)',
    color: '#00d4ff',
    desc: 'Writes a key-value pair to the Sled store. Writes are atomic and immediately durable. The change is broadcast to all WebSocket subscribers as a STATE_MUTATION event.',
    example: `fn state_set(key: &str, value: &str) {
    let k = key.as_bytes();
    let v = value.as_bytes();
    unsafe {
        __qos_state_set(k.as_ptr(), k.len() as u32, v.as_ptr(), v.len() as u32)
    };
}`,
  },
];

export default function SdkReferencePage() {
  return (
    <article>
      <div className="flex items-center gap-2 text-xs font-mono-code text-gray-700 mb-8">
        <Link href="/docs" className="hover:text-[#00d4ff] transition-colors">Docs</Link>
        <span>›</span>
        <span className="text-gray-400">qos-sdk Reference</span>
      </div>

      <div className="mb-10 pb-10 border-b border-[#00d4ff]/10">
        <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#facc15] bg-[#facc15]/10 border border-[#facc15]/20 px-2.5 py-1 rounded-full mb-4 inline-block">
          SDK Reference
        </span>
        <h1 className="text-4xl font-black text-white tracking-tight mb-4 font-mono-code">qos-sdk Reference</h1>
        <p className="text-gray-400 leading-7">
          The Q-OS host ABI exposes a minimal set of <code className="text-[#00d4ff] text-sm font-mono-code">extern "C"</code> functions
          that your WASM module can import. There is no separate library to link — the host
          runtime injects these symbols at instantiation time.
        </p>
      </div>

      {ABI_FNS.map(fn_ => (
        <div key={fn_.name} className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: fn_.color }} />
            <code className="font-mono-code font-bold" style={{ color: fn_.color }}>{fn_.name}</code>
          </div>
          <div className="bg-[#0d0d0d] border border-[#00d4ff]/10 rounded-xl px-5 py-3 mb-4">
            <code className="font-mono-code text-[13px] text-gray-400">{fn_.sig}</code>
          </div>
          <p className="text-gray-400 text-sm leading-7 mb-2">{fn_.desc}</p>
          <h4 className="text-xs font-mono-code uppercase tracking-widest text-gray-600 mb-1 mt-4">Example Usage</h4>
          <CodeBlock lang="rust" code={fn_.example} showLineNumbers={false} />
        </div>
      ))}

      <div className="mt-8 p-6 rounded-xl border border-dashed border-[#00d4ff]/20 text-center">
        <p className="text-gray-600 font-mono-code text-xs mb-2">More ABI functions — coming soon</p>
        <p className="text-gray-500 text-sm">
          <code className="text-[#00d4ff] text-xs font-mono-code">__qos_broadcast</code>,{' '}
          <code className="text-[#00d4ff] text-xs font-mono-code">__qos_log</code>,{' '}
          <code className="text-[#00d4ff] text-xs font-mono-code">__qos_timestamp</code> are on the roadmap.
        </p>
      </div>
    </article>
  );
}
