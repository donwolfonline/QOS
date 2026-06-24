# Q-OS Security Model

## Threat Model

| Threat | Mitigation |
|---|---|
| **QR injection** (malicious QR printed by attacker) | URI allow-list; SHA-256 hash; Ed25519 signature in strict mode |
| **Module tampering** (MITM of WASM download) | SHA-256 verified *before* any WASM parse step |
| **Supply-chain attack** (malicious dependency) | `cargo-deny` advisory + license audit in CI |
| **WASM escape** (module attempts to break out of sandbox) | Wasmtime isolation; fresh `Store` per invocation; no shared mutable state |
| **Capability escalation** (module calls host function it wasn't granted) | Every host import is capability-gated via `require_cap!` before dispatch |
| **Resource exhaustion / DoS** (infinite loop, OOM) | Fuel metering (CPU), `ResourceLimiter` (memory), wall-clock timeout (time) |
| **State namespace collision** | Keys namespaced by `(module_sha256, invocation_id)` — cross-module access denied |
| **Trust root compromise** | Ed25519 keys distributed out-of-band; rotation procedure in SECURITY.md |

## Strict Mode

Run `qos-runtime --strict` to require Ed25519 signatures on all modules.
In this mode, modules without a valid `signature` + `signer_pubkey` field in
their QR payload are rejected before any network fetch occurs.

## Security Contacts

Report vulnerabilities to: security@your-org.example
