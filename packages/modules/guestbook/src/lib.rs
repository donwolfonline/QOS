#![no_std]

extern crate alloc;

use alloc::string::{String, ToString};
use alloc::format;

use qos_sdk::LogLevel;

#[cfg(not(test))]
#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    qos_sdk::log::telemetry(LogLevel::Error, "Guestbook module panicked!");
    #[cfg(target_arch = "wasm32")]
    core::arch::wasm32::unreachable();
    #[cfg(not(target_arch = "wasm32"))]
    loop {}
}

#[no_mangle]
pub extern "C" fn _start() -> i32 {
    qos_sdk::log::telemetry(LogLevel::Info, "Guestbook module starting...");

    // 1. Read input payload (e.g. user_name and device_id) via Host ABI state
    let user_name = qos_sdk::state::get("user_name")
        .and_then(|bytes| String::from_utf8(bytes).ok())
        .unwrap_or_else(|| "Anonymous".to_string());

    let device_id = qos_sdk::state::get("device_id")
        .and_then(|bytes| String::from_utf8(bytes).ok())
        .unwrap_or_else(|| "UnknownDevice".to_string());

    let timestamp = qos_sdk::time::now_ms();

    // 2. Fetch current guestbook log
    let mut log_str = qos_sdk::state::get("guestbook_log")
        .and_then(|bytes| String::from_utf8(bytes).ok())
        .unwrap_or_else(|| "[]".to_string());

    // Basic heuristic for check-in number (count existing entries)
    let check_in_number = log_str.matches('{').count() + 1;

    // 3. Append new user to the list
    let new_entry = format!(
        r#"{{"user_name":"{}","device_id":"{}","timestamp":{}}}"#,
        user_name, device_id, timestamp
    );

    if log_str.trim() == "[]" || log_str.is_empty() {
        log_str = format!("[{}]", new_entry);
    } else if log_str.ends_with(']') {
        log_str.pop(); // Remove ']'
        log_str = format!("{},{}]", log_str, new_entry);
    } else {
        log_str = format!("[{}]", new_entry);
    }

    // 4. Save updated list back to edge node
    if qos_sdk::state::set("guestbook_log", log_str.as_bytes()).is_err() {
        qos_sdk::log::telemetry(LogLevel::Error, "Failed to save guestbook_log");
        return -1;
    }

    // 5. Return structured JSON response to the host
    let response = format!(
        r#"{{"status":"success","check_in_number":{},"timestamp":{}}}"#,
        check_in_number, timestamp
    );

    if qos_sdk::state::set("response", response.as_bytes()).is_err() {
        qos_sdk::log::telemetry(LogLevel::Error, "Failed to write response payload");
        return -1;
    }

    qos_sdk::log::telemetry(LogLevel::Info, "Guestbook module executed successfully");
    0
}
