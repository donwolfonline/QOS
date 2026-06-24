# Q-OS Host ABI Reference

## Import Namespace: `host`

All host imports are in the `host` module. WASM modules declare them as:

```wat
(import "host" "log" (func $log (param i32 i32 i32)))
(import "host" "now_ms" (func $now_ms (result i64)))
(import "host" "state_get" (func $state_get (param i32 i32 i32 i32) (result i32)))
(import "host" "state_set" (func $state_set (param i32 i32 i32 i32) (result i32)))
```

## Functions

### `host::log(level: i32, ptr: i32, len: i32)`
Log a UTF-8 message. `level`: 0=error, 1=warn, 2=info, 3+=debug.
Requires no capability.

### `host::now_ms() -> i64`
Returns current Unix time in milliseconds. No capability required.

### `host::state_get(key_ptr: i32, key_len: i32, out_ptr: i32, out_max: i32) -> i32`
Read a value from the state store.
- Returns number of bytes written to `out_ptr`, or `0` (not found), or `-1` (error).
- **Requires**: `state_read` capability.

### `host::state_set(key_ptr: i32, key_len: i32, val_ptr: i32, val_len: i32) -> i32`
Write a value to the state store.
- Returns `0` on success, `-1` on error.
- **Requires**: `state_write` capability.

## Memory Convention

- All pointers refer to the WASM linear memory named `memory`.
- Strings are UTF-8 encoded without a null terminator.
- State values are raw bytes; modules handle their own encoding.

## Adding New Host Functions

1. Add the function signature to `qos-host-abi/src/imports.rs`.
2. Add a capability field to `CapabilitySet` in `qos-types/src/descriptor.rs`.
3. Add `require_cap!` guard as the first statement in the implementation.
4. Add the capability to the QR payload JSON schema docs.
5. Request security sign-off before merging.
