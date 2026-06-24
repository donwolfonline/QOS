#![no_std]

use qos_sdk::{log_msg, LogLevel};

#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    log_msg(LogLevel::Error, "WASM module panicked!");
    core::arch::wasm32::unreachable()
}

#[no_mangle]
pub extern "C" fn run() -> i32 {
    log_msg(LogLevel::Info, "Hello from dummy_module WASM!");
    
    // Check time
    let now = qos_sdk::time::now_ms();
    
    // Check state
    if let Some(val) = qos_sdk::state::get("counter") {
        if val.len() == 1 {
            let count = val[0] + 1;
            qos_sdk::state::set("counter", &[count]).unwrap();
            return count as i32;
        }
    } else {
        qos_sdk::state::set("counter", &[1]).unwrap();
        return 1;
    }
    
    0
}
