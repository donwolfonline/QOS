#![no_std]

use qos_sdk::{log_msg, LogLevel};

#[cfg(not(test))]
#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    log_msg(LogLevel::Error, "WASM module panicked!");
    #[cfg(target_arch = "wasm32")]
    core::arch::wasm32::unreachable();
    #[cfg(not(target_arch = "wasm32"))]
    loop {}
}

#[no_mangle]
pub extern "C" fn run() -> i32 {
    log_msg(LogLevel::Info, "Hello from dummy_module WASM!");
    
    // Check time
    let _now = qos_sdk::time::now_ms();
    
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
