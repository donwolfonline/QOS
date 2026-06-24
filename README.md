# Q-OS — QR-triggered WebAssembly Edge Runtime

Q-OS is a lightweight, secure runtime that executes **WebAssembly modules
triggered by QR code scans**. It is designed for constrained edge hardware
(Raspberry Pi, industrial gateways, kiosk terminals) where network access may
be intermittent and security posture must be verifiable offline.

## Quick Start

```bash
# Install Rust (stable)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Build all crates
cargo build --workspace

# Run tests
cargo test --workspace

# Run the dev CLI on a QR image
cargo run --bin qos -- run path/to/qr.png --no-strict

# Start the runtime daemon
cargo run --bin qos-runtime -- --config qos.toml
```

## Architecture

```
QR Input → [Bootloader] → [Sandbox Manager] → [State Sync Engine] → Edge Store
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design.

## Security

- All modules are SHA-256 content-addressed before execution.
- Ed25519 signature verification in `--strict` mode.
- WASM sandbox with per-invocation memory isolation (Wasmtime).
- Capability-gated host ABI — deny by default.
- `cargo-deny` audits for CVEs and license compliance.

See [docs/SECURITY.md](docs/SECURITY.md) for the threat model.

## Project Layout

```
q-os/
├── crates/
│   ├── qos-types          # Shared types (zero internal deps)
│   ├── qos-crypto         # SHA-256 + Ed25519
│   ├── qos-policy         # URI allow-list + capability policy
│   ├── qos-qr             # QR decoding
│   ├── qos-fetch          # Async module fetcher
│   ├── qos-cache          # LRU WASM cache
│   ├── qos-bootloader     # Layer 1 orchestrator
│   ├── qos-host-abi       # WASM ↔ host import surface
│   ├── qos-sandbox        # Layer 2 Wasmtime runtime
│   ├── qos-state          # Layer 3 sled KV store
│   └── qos-sync-adapters  # Pluggable sync backends
└── bins/
    ├── qos-runtime        # Edge daemon
    └── qos-cli            # Developer tools
```

## License

MIT OR Apache-2.0
# QOS
