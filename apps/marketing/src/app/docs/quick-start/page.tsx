import type { Metadata } from 'next';
import Link from 'next/link';
import { CodeBlock } from '@/components/docs/CodeBlock';

export const metadata: Metadata = {
  title: 'Quick Start — Q-OS Docs',
  description: 'Install the Q-OS CLI, scaffold a Rust edge agent, write a full SDK module reading Sled state and broadcasting over Gossipsub, then deploy and monitor with live logs.',
};

// ─── Prose helpers ────────────────────────────────────────────────────────────
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
    <div id={`step-${num}`} className="scroll-mt-24">
      <div className="flex items-center gap-4 mt-14 mb-6">
        <div className="w-11 h-11 rounded-xl bg-[#00ff41]/10 border border-[#00ff41]/30 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(0,255,65,0.12)]">
          <span className="font-mono-code text-[#00ff41] font-black">{num}</span>
        </div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Code Samples ──────────────────────────────────────────────────────────────

const INSTALL_CMD = `$ curl -sL https://q-os.io/install | bash
> [OK] Detected platform: darwin-arm64
> [OK] Downloading qos-cli v0.1.0...
> [OK] Binary installed to /usr/local/bin/qos
> [OK] Sled state directory initialized at ~/.qos/state/
> [OK] Ed25519 keypair generated at ~/.qos/master.key
> Run 'qos --version' to verify the install.`;

const INIT_CMD = `$ qos init my-edge-agent --template rust
> [OK] Scaffolding Rust edge agent in ./my-edge-agent/
> [OK] Creating Cargo.toml with wasm32 target config
> [OK] Creating src/lib.rs with qos-sdk boilerplate
> [OK] Creating qos.toml (module manifest)
> 
> Your edge agent is ready. Next steps:
>   cd my-edge-agent
>   qos build --release`;

const CARGO_TOML = `[package]
name    = "my-edge-agent"
version = "0.1.0"
edition = "2021"

# cdylib emits a .wasm binary the Q-OS runtime can load
[lib]
crate-type = ["cdylib"]

[dependencies]
# qos-sdk provides safe wrappers around the host ABI.
# It is a zero-dependency crate — no std required.
qos-sdk = "0.1"

# serde_json is compiled to WASM for payload serialization
serde_json = { version = "1", default-features = false, features = ["alloc"] }`;

const LIB_RS = `//! my-edge-agent — a Q-OS WASM module
//!
//! This agent demonstrates the four core SDK operations:
//!   1. Reading persistent state from the node's local Sled DB
//!   2. Incrementing and writing state back
//!   3. Broadcasting a Gossipsub message to all peers on the mesh
//!   4. Returning a structured JSON payload to the caller

use qos_sdk::{
    state,    // Typed Sled DB wrappers (get / set / delete)
    gossip,   // libp2p Gossipsub broadcast API
    input,    // Read the raw input bytes from the caller
    output,   // Write the response payload back to the host
};

/// Module entry point.
///
/// The Q-OS runtime calls \`run()\` on every invocation.
/// It reads \`input\`, calls your logic, and sends back whatever
/// you pass to \`output::write()\`.
#[no_mangle]
pub extern "C" fn run() {
    // ── Step 1: Read the caller's JSON payload ─────────────────────────────
    // input::read() returns the raw bytes the host passed to this invocation.
    // Here we expect: { "agent_id": "node-42", "event": "heartbeat" }
    let raw = input::read();
    let payload: serde_json::Value =
        serde_json::from_slice(&raw).unwrap_or(serde_json::Value::Null);

    let agent_id = payload["agent_id"]
        .as_str()
        .unwrap_or("unknown")
        .to_string();

    // ── Step 2: Read & increment a heartbeat counter from Sled DB ──────────
    // state::get returns Option<Vec<u8>>; state::set persists raw bytes.
    // The Sled store is durably written to disk — data survives restarts.
    let counter_key = format!("heartbeat::{agent_id}");

    let count: u64 = state::get(&counter_key)
        .and_then(|bytes| String::from_utf8(bytes).ok())
        .and_then(|s| s.parse().ok())
        .unwrap_or(0)
        + 1;

    state::set(&counter_key, count.to_string().as_bytes());

    // ── Step 3: Broadcast a Gossipsub message to all mesh peers ────────────
    // gossip::publish sends a message on a named topic.
    // All Q-OS nodes subscribed to this topic receive it in real time.
    let gossip_msg = serde_json::json!({
        "topic":    "qos.agents.heartbeat",
        "agent_id": agent_id,
        "count":    count,
        "ts":       qos_sdk::clock::unix_ms(), // monotonic host clock
    });
    gossip::publish("qos.agents.heartbeat", gossip_msg.to_string().as_bytes());

    // ── Step 4: Return a JSON response payload ─────────────────────────────
    // output::write() hands the bytes back to the Q-OS host.
    // The runtime forwards this to the originating caller (HTTP / WebSocket).
    let response = serde_json::json!({
        "ok":       true,
        "agent_id": agent_id,
        "count":    count,
        "message":  format!("Heartbeat #{count} recorded and broadcast to mesh."),
    });

    output::write(response.to_string().as_bytes());
}`;

const DEPLOY_CMD = `# Build the module to WASM (one-time target setup)
$ rustup target add wasm32-unknown-unknown

# Compile in release mode — optimized, stripped
$ qos build --release
> [OK] Compiling my-edge-agent (wasm32)
> [OK] Module size: 38 KB (stripped)
> [OK] Ed25519 signature applied — hash: a3f9c12...

# Deploy the signed module to your live edge node
$ qos module deploy ./dist/my-edge-agent.qos --name heartbeat-agent
> [MESH] Uploading payload to local node...
> [OK] Module 'heartbeat-agent' registered on node edge-001
> [OK] Invoke via: POST http://localhost:3000/api/v1/invoke/heartbeat-agent`;

const LOGS_CMD = `# Stream live execution logs from the edge node
$ qos logs --tail
> 2026-06-26T13:01:04Z  INFO  qos_runtime   Module 'heartbeat-agent' loaded (38 KB)
> 2026-06-26T13:01:05Z  INFO  qos_wasm      run() invoked — agent_id="node-42"
> 2026-06-26T13:01:05Z  DEBUG qos_state     state::get "heartbeat::node-42" → None (first run)
> 2026-06-26T13:01:05Z  DEBUG qos_state     state::set "heartbeat::node-42" = "1"
> 2026-06-26T13:01:05Z  INFO  qos_gossip    Published 84 bytes → topic "qos.agents.heartbeat"
> 2026-06-26T13:01:05Z  INFO  qos_runtime   run() → 200 OK (0.6ms)
> 2026-06-26T13:01:06Z  INFO  qos_mesh      Peer edge-002 received gossip — heartbeat::node-42 count=1

# Query current persisted state directly
$ qos state get heartbeat::node-42
> 1`;

// ─── Page ─────────────────────────────────────────────────────────────────────
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
            ~10 min
          </span>
          <span className="font-mono-code text-[10px] uppercase tracking-widest text-[#00d4ff] bg-[#00d4ff]/10 border border-[#00d4ff]/20 px-2.5 py-1 rounded-full">
            Rust · WASM · libp2p · Sled
          </span>
        </div>
        <H1>Quick Start</H1>
        <P>
          In this guide you will install the <InlineCode>qos</InlineCode> CLI, scaffold a new Rust edge agent,
          write a fully functional module that reads and writes from the local Sled DB, broadcasts a Gossipsub
          message across the P2P mesh, and returns a JSON response — then deploy and monitor it with live tail logs.
        </P>
      </div>

      {/* Prerequisites */}
      <H2 id="prerequisites">Prerequisites</H2>
      <P>Make sure you have the following installed before continuing:</P>
      <ul className="my-4 flex flex-col gap-3">
        {[
          { tool: 'Rust + Cargo', href: 'https://rustup.rs', desc: '≥ 1.78 (stable)' },
          { tool: 'wasm32 target', href: '#step-2', desc: 'rustup target add wasm32-unknown-unknown' },
          { tool: 'qos CLI', href: '#step-1', desc: 'Installed in Step 1' },
        ].map(p => (
          <li key={p.tool} className="flex items-center gap-4 text-sm p-3 rounded-lg bg-[#111] border border-[#00d4ff]/10">
            <span className="text-[#00ff41]">✓</span>
            <a href={p.href} className="font-mono-code text-[#00d4ff] font-medium hover:underline">{p.tool}</a>
            <span className="text-gray-600 ml-auto font-mono-code text-xs">{p.desc}</span>
          </li>
        ))}
      </ul>

      {/* ── Step 1: Install CLI ─────────────────────────────────────────────── */}
      <Step num="01" title="Install the CLI">
        <P>
          The Q-OS CLI is a single Rust binary that manages your local edge node, handles module signing,
          and gives you a live window into the running mesh. Install it with a single curl command:
        </P>
        <CodeBlock lang="bash" filename="terminal" code={INSTALL_CMD} />
        <Callout type="info">
          The installer generates an <InlineCode>Ed25519</InlineCode> keypair at{' '}
          <InlineCode>~/.qos/master.key</InlineCode> on first run. This is your module signing identity —
          keep the private key secure. The public key is embedded in every module you publish.
        </Callout>
        <Callout type="warn">
          On macOS you may need to clear the Gatekeeper flag:{' '}
          <InlineCode>xattr -d com.apple.quarantine /usr/local/bin/qos</InlineCode>
        </Callout>
      </Step>

      {/* ── Step 2: Initialize Project ─────────────────────────────────────── */}
      <Step num="02" title="Initialize Project">
        <P>
          Use <InlineCode>qos init</InlineCode> to scaffold a new edge agent from the official Rust template.
          This creates a ready-to-build Cargo project pre-configured with the <InlineCode>qos-sdk</InlineCode>{' '}
          dependency and a signed module manifest.
        </P>
        <CodeBlock lang="bash" filename="terminal" code={INIT_CMD} />

        <H3>Project Structure</H3>
        <CodeBlock lang="bash" filename="my-edge-agent/" showLineNumbers={false} code={`my-edge-agent/
├── Cargo.toml       # wasm32 lib target + qos-sdk dependency
├── qos.toml         # Module manifest (name, version, public_key)
└── src/
    └── lib.rs       # Your module logic — the run() entry point`} />

        <H3>Cargo.toml</H3>
        <P>
          The scaffolded <InlineCode>Cargo.toml</InlineCode> sets the crate type to{' '}
          <InlineCode>cdylib</InlineCode> so Cargo emits a <InlineCode>.wasm</InlineCode> binary,
          and includes <InlineCode>qos-sdk</InlineCode> for safe host ABI access:
        </P>
        <CodeBlock lang="toml" filename="Cargo.toml" code={CARGO_TOML} />
      </Step>

      {/* ── Step 3: The Code ───────────────────────────────────────────────── */}
      <Step num="03" title="The Code">
        <P>
          Open <InlineCode>src/lib.rs</InlineCode>. The snippet below is a complete, production-annotated
          module demonstrating all four core SDK operations:{' '}
          reading from the <strong className="text-white">Sled DB</strong>,{' '}
          incrementing and persisting a counter,{' '}
          broadcasting a <strong className="text-white">Gossipsub</strong> message to mesh peers,{' '}
          and returning a structured <strong className="text-white">JSON payload</strong> to the caller.
        </P>
        <CodeBlock lang="rust" filename="src/lib.rs" code={LIB_RS} />

        <Callout type="tip">
          <strong className="text-white">qos-sdk</strong> is a thin zero-dependency wrapper around the
          host ABI. All functions (<InlineCode>state::get</InlineCode>, <InlineCode>gossip::publish</InlineCode>,{' '}
          <InlineCode>output::write</InlineCode>) compile to a handful of <InlineCode>extern "C"</InlineCode>{' '}
          calls that the runtime resolves at link time. No networking, no async runtime — just raw speed.
        </Callout>
        <Callout type="info">
          <InlineCode>qos_sdk::clock::unix_ms()</InlineCode> reads the host's monotonic clock via the ABI.
          This ensures timestamps are tamper-proof even when the WASM sandbox has no direct access to
          system time.
        </Callout>
      </Step>

      {/* ── Step 4: Deploy & Monitor ───────────────────────────────────────── */}
      <Step num="04" title="Deploy & Monitor">
        <P>
          Build the module to a signed <InlineCode>.qos</InlineCode> bundle, deploy it to your running node,
          then tail the live execution logs to watch each invocation, state mutation, and Gossipsub broadcast
          in real time:
        </P>

        <H3>Build & Deploy</H3>
        <CodeBlock lang="bash" filename="terminal — deploy" code={DEPLOY_CMD} />

        <H3>Monitor with Live Logs</H3>
        <P>
          <InlineCode>qos logs --tail</InlineCode> streams structured log lines directly from the runtime
          engine — WASM execution traces, state reads/writes, gossip broadcasts, and peer receipts:
        </P>
        <CodeBlock lang="bash" filename="terminal — qos logs --tail" code={LOGS_CMD} />

        <Callout type="tip">
          Add <InlineCode>--filter heartbeat-agent</InlineCode> to scope logs to a single module.
          Use <InlineCode>--level debug</InlineCode> for full WASM frame traces including fuel consumption.
        </Callout>
      </Step>

      {/* ── Next Steps ─────────────────────────────────────────────────────── */}
      <div id="next-steps" className="mt-16 pt-10 border-t border-[#00d4ff]/10 scroll-mt-24">
        <h2 className="text-xl font-bold text-white mb-6">Next Steps</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { href: '/docs/sdk-reference', title: 'qos-sdk Reference', desc: 'Full API surface: state, gossip, input, output, clock, and error types.' },
            { href: '/docs/architecture/edge-node', title: 'Edge Node Architecture', desc: 'How the Rust daemon, Sled store, WASM sandbox, and libp2p mesh interconnect.' },
            { href: '/docs/architecture/crdt', title: 'CRDT State Sync', desc: 'How Q-OS keeps state consistent across all peers with zero coordination.' },
            { href: '/ecosystem', title: 'Monetize Your Module', desc: 'Sign, publish, and earn recurring revenue from your edge agent on the registry.' },
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
