import type { Metadata } from 'next';
import Link from 'next/link';
import { CodeBlock } from '@/components/docs/CodeBlock';

export const metadata: Metadata = {
  title: 'Quick Start — Q-OS Docs',
  description: 'Write your first Q-OS WASM module in Rust, bundle it with the CLI, and deploy it to a live local edge node in under 5 minutes.',
};

// ─── Inline MDX-style helpers ───────────────────────────────────────────────
function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="text-4xl font-black text-white tracking-tight mb-4 font-mono-code">{children}</h1>;
}
function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold text-white mt-14 mb-4 scroll-mt-24 flex items-center gap-3">
      <span className="text-[#00d4ff] font-mono-code text-lg">#</span>
      {children}
    </h2>
  );
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-bold text-gray-200 mt-8 mb-3">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-400 leading-7 mb-4">{children}</p>;
}
function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono-code text-[#00d4ff] bg-[#00d4ff]/8 border border-[#00d4ff]/15 px-1.5 py-0.5 rounded text-sm">
      {children}
    </code>
  );
}
function Callout({ type, children }: { type: 'tip' | 'warn' | 'info'; children: React.ReactNode }) {
  const styles = {
    tip:  { border: '#00ff41', bg: '#00ff41', icon: '💡', label: 'TIP' },
    warn: { border: '#ff7a2f', bg: '#ff7a2f', icon: '⚠️', label: 'WARNING' },
    info: { border: '#00d4ff', bg: '#00d4ff', icon: 'ℹ️', label: 'NOTE' },
  }[type];
  return (
    <div className="my-6 rounded-xl border p-4 pl-5 relative overflow-hidden"
      style={{ borderColor: styles.border + '35', background: styles.bg + '08' }}>
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: styles.border }} />
      <p className="font-mono-code text-[10px] uppercase tracking-widest mb-2" style={{ color: styles.border }}>
        {styles.icon} {styles.label}
      </p>
      <div className="text-gray-400 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
function Step({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div id={`step-${num.toLowerCase()}`} className="scroll-mt-24">
      <div className="flex items-center gap-4 mt-12 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#00ff41]/10 border border-[#00ff41]/30 flex items-center justify-center shrink-0">
          <span className="font-mono-code text-[#00ff41] font-black text-sm">{num}</span>
        </div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Code Samples ────────────────────────────────────────────────────────────
const CARGO_TOML = `[package]
name = "my_qos_module"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
# No external dependencies needed — qos_abi is provided by the host runtime`;

const LIB_RS = `use std::slice;

// The host runtime imports these functions — they are provided at link time.
extern "C" {
    fn __qos_state_get(key_ptr: *const u8, key_len: u32, out_ptr: *mut u8) -> u32;
    fn __qos_state_set(key_ptr: *const u8, key_len: u32, val_ptr: *const u8, val_len: u32);
}

/// Safe wrapper to read a state key from the Sled store.
fn state_get(key: &str) -> Option<String> {
    let key_bytes = key.as_bytes();
    let mut buf = vec![0u8; 4096];
    let len = unsafe {
        __qos_state_get(key_bytes.as_ptr(), key_bytes.len() as u32, buf.as_mut_ptr())
    };
    if len == 0 { return None; }
    String::from_utf8(buf[..len as usize].to_vec()).ok()
}

/// Safe wrapper to write a value to the Sled store.
fn state_set(key: &str, value: &str) {
    let k = key.as_bytes();
    let v = value.as_bytes();
    unsafe { __qos_state_set(k.as_ptr(), k.len() as u32, v.as_ptr(), v.len() as u32) };
}

/// Q-OS entry point — called by the WASM runtime on each guest interaction.
#[no_mangle]
pub extern "C" fn execute(input_ptr: *const u8, input_len: u32) -> *mut u8 {
    // 1. Read guest input (JSON string)
    let input_bytes = unsafe { slice::from_raw_parts(input_ptr, input_len as usize) };
    let input = String::from_utf8_lossy(input_bytes);

    // 2. Parse the guest's alias from the input
    let alias = if input.contains("alias") {
        input.split('"').nth(3).unwrap_or("Guest").to_string()
    } else {
        "Anonymous".to_string()
    };

    // 3. Read & increment a check-in counter from persistent state
    let count: u32 = state_get("checkin_count")
        .and_then(|v| v.parse().ok())
        .unwrap_or(0) + 1;
    state_set("checkin_count", &count.to_string());

    // 4. Log the guest entry
    let log_entry = format!(r#"{{"alias":"{}","checkin":{},"ts":"{}"}}"#, alias, count, "now");
    state_set(&format!("guest_{}", count), &log_entry);

    // 5. Return a receipt to the Micro-UI
    let receipt = format!(
        r#"{{"status":"ok","alias":"{}","checkin_number":{},"message":"Welcome, {}! You are guest #{}"}}"#,
        alias, count, alias, count
    );
    let mut output = receipt.into_bytes();
    output.push(0); // null terminator
    let ptr = output.as_mut_ptr();
    std::mem::forget(output); // transfer ownership to host
    ptr
}`;

const BUILD_CMD = `# Install the WASM target (one-time)
$ rustup target add wasm32-unknown-unknown

# Build the module
$ cargo build --target wasm32-unknown-unknown --release

# The .wasm binary is now at:
# ./target/wasm32-unknown-unknown/release/my_qos_module.wasm`;

const DEPLOY_CMD = `# 1. Start the local Q-OS edge node
$ qos start
> [MESH] mDNS Discovery Active. Found 1 Peer.
> [WASM] Runtime ready. Awaiting payload.

# 2. Deploy your module to table 4
$ qos module deploy \\
    ./target/wasm32-unknown-unknown/release/my_qos_module.wasm \\
    --table 4 \\
    --name guestbook

> [OK] Module 'guestbook' registered.
> [OK] QR code for table 4 now routes to 'guestbook'.
> [STATE] checkin_count = 0`;

const VERIFY_CMD = `# Check the current state after a guest scans
$ qos state get checkin_count
> 3

$ qos state get guest_1
> {"alias":"Khalid","checkin":1,"ts":"..."}

# Watch the live stream
$ qos stream watch
> {"type":"STATE_MUTATION","key":"checkin_count","value":"4"}
> {"type":"EXECUTION_RECEIPT","fuel_consumed":1.2,"status":"ok"}`;

// ─── Page ────────────────────────────────────────────────────────────────────
export default function QuickStartPage() {
  return (
    <article>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono-code text-gray-700 mb-8">
        <Link href="/docs" className="hover:text-[#00d4ff] transition-colors">Docs</Link>
        <span>›</span>
        <Link href="/docs" className="hover:text-[#00d4ff] transition-colors">Getting Started</Link>
        <span>›</span>
        <span className="text-gray-400">Quick Start</span>
      </div>

      {/* Title block */}
      <div className="mb-8 pb-8 border-b border-[#00d4ff]/10">
        <div className="flex items-center gap-3 mb-3">
          <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#00ff41] bg-[#00ff41]/10 border border-[#00ff41]/20 px-2.5 py-1 rounded-full">
            5 min read
          </span>
          <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#00d4ff] bg-[#00d4ff]/10 border border-[#00d4ff]/20 px-2.5 py-1 rounded-full">
            Rust · WASM · CLI
          </span>
        </div>
        <H1>Quick Start</H1>
        <P>
          In this guide you will write your first Q-OS WASM module in Rust, compile it to
          <InlineCode>wasm32-unknown-unknown</InlineCode>, deploy it to a running local edge node,
          and watch a guest check in from a mobile browser — all in under 5 minutes.
        </P>
      </div>

      {/* Prerequisites */}
      <H2 id="prerequisites">Prerequisites</H2>
      <P>Make sure you have the following installed before continuing:</P>
      <ul className="my-4 flex flex-col gap-3">
        {[
          { tool: 'Rust + Cargo', href: 'https://rustup.rs', desc: '≥ 1.76 (stable)' },
          { tool: 'qos CLI', href: '#step-1', desc: 'Installed in Step 1' },
          { tool: 'wasm32 target', href: '#step-2', desc: 'rustup target add wasm32-unknown-unknown' },
        ].map(p => (
          <li key={p.tool} className="flex items-center gap-4 text-sm p-3 rounded-lg bg-[#111] border border-[#00d4ff]/10">
            <span className="text-[#00ff41]">✓</span>
            <a href={p.href} className="font-mono-code text-[#00d4ff] font-medium hover:underline">{p.tool}</a>
            <span className="text-gray-600 ml-auto font-mono-code text-xs">{p.desc}</span>
          </li>
        ))}
      </ul>

      {/* Step 1 */}
      <Step num="01" title="Install the Q-OS Edge Node">
        <P>
          The Q-OS daemon is a single Rust binary that manages the local Sled state store,
          exposes the REST API, and streams real-time telemetry over WebSocket. Install it
          with one command:
        </P>
        <CodeBlock lang="bash" filename="terminal" code={`$ curl -sL https://q-os.io/install | bash
> [OK] Downloading qos-api v0.1.0 (darwin-arm64)...
> [OK] Binary installed to /usr/local/bin/qos
> [OK] Sled state directory initialized at ~/.qos/state/
> Run 'qos start' to boot your edge node.`} />
        <Callout type="info">
          On macOS you may need to run <InlineCode>xattr -d com.apple.quarantine /usr/local/bin/qos</InlineCode> to clear the Gatekeeper flag on first run.
        </Callout>
      </Step>

      {/* Step 2 */}
      <Step num="02" title="Write Your First Rust Module">
        <P>
          Create a new Rust library crate. Q-OS modules expose a single{' '}
          <InlineCode>extern "C" fn execute</InlineCode> symbol — the host runtime calls it
          for every guest interaction.
        </P>

        <H3>Cargo.toml</H3>
        <P>Set the crate type to <InlineCode>cdylib</InlineCode> so Cargo emits a shared library suitable for WASM:</P>
        <CodeBlock lang="toml" filename="Cargo.toml" code={CARGO_TOML} />

        <H3>src/lib.rs</H3>
        <P>
          The full module below reads a guest alias from the input JSON, persists a check-in
          counter in the Sled state store, and returns a receipt JSON for the Micro-UI to
          display:
        </P>
        <CodeBlock lang="rust" filename="src/lib.rs" code={LIB_RS} />

        <Callout type="tip">
          The <InlineCode>__qos_state_get</InlineCode> and <InlineCode>__qos_state_set</InlineCode>{' '}
          extern functions are injected automatically by the Q-OS host runtime. You never link against
          a separate SDK library — the ABI is baked into the runtime itself.
        </Callout>
      </Step>

      {/* Step 3 */}
      <Step num="03" title="Build & Deploy">
        <P>Compile the module to WASM, then deploy it to any table with the CLI:</P>
        <CodeBlock lang="bash" filename="terminal — build" code={BUILD_CMD} />
        <CodeBlock lang="bash" filename="terminal — deploy" code={DEPLOY_CMD} />

        <Callout type="tip">
          Run <InlineCode>qos module list</InlineCode> to see all registered modules.
          Use <InlineCode>qos module swap --table 4 --name happy_hour</InlineCode> to hot-swap
          logic mid-service without changing the physical QR code.
        </Callout>
      </Step>

      {/* Step 4 */}
      <Step num="04" title="Verify It's Working">
        <P>
          Point a mobile browser at the QR code on table 4. After the guest submits their
          name, use the CLI or Admin Dashboard to confirm the state was written:
        </P>
        <CodeBlock lang="bash" filename="terminal — verify" code={VERIFY_CMD} />
      </Step>

      {/* Next steps */}
      <div id="next-steps" className="mt-16 pt-10 border-t border-[#00d4ff]/10 scroll-mt-24">
        <h2 className="text-xl font-bold text-white mb-6">Next Steps</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { href: '/docs/architecture', title: 'System Architecture', desc: 'Understand how the Rust daemon, Sled store, and WASM runtime interconnect.' },
            { href: '/docs/sdk-reference', title: 'qos-sdk Reference', desc: 'Full API surface: state_get, state_set, broadcast, and error handling.' },
            { href: '/docs/wasm-guides/guestbook', title: 'Guestbook Module Guide', desc: 'Production-ready check-in flow with validation, deduplication, and receipts.' },
            { href: '/docs/wasm-guides/menu', title: 'Menu & Ordering Guide', desc: 'Render dynamic menus, accept orders, and persist them to local state.' },
          ].map(l => (
            <Link key={l.href} href={l.href}
              className="group p-5 rounded-xl bg-[#111] border border-[#00d4ff]/12 hover:border-[#00d4ff]/30 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-bold text-white group-hover:text-[#00d4ff] transition-colors">{l.title}</span>
                <span className="text-gray-700 group-hover:text-[#00d4ff] transition-colors">→</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{l.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}
