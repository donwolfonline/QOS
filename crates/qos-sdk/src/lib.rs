#![no_std]

extern crate alloc;
use alloc::vec::Vec;

#[global_allocator]
static ALLOCATOR: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[link(wasm_import_module = "host")]
extern "C" {
    fn log(level: i32, ptr: *const u8, len: usize);
    fn now_ms() -> i64;
    fn state_get(key_ptr: *const u8, key_len: usize, out_ptr: *mut u8, out_max: usize) -> i32;
    fn state_set(key_ptr: *const u8, key_len: usize, val_ptr: *const u8, val_len: usize) -> i32;
}

#[repr(i32)]
pub enum LogLevel {
    Error = 0,
    Warn = 1,
    Info = 2,
    Debug = 3,
}

pub fn log_msg(level: LogLevel, msg: &str) {
    unsafe {
        log(level as i32, msg.as_ptr(), msg.len());
    }
}

pub mod time {
    pub fn now_ms() -> u64 {
        let ms = unsafe { super::now_ms() };
        if ms < 0 { 0 } else { ms as u64 }
    }
}

pub mod state {
    use super::*;

    /// Get state from the Q-OS host.
    pub fn get(key: &str) -> Option<Vec<u8>> {
        let mut buf = [0u8; 4096]; // Max state size for now
        let written = unsafe {
            super::state_get(key.as_ptr(), key.len(), buf.as_mut_ptr(), buf.len())
        };
        if written < 0 {
            None
        } else if written == 0 {
            None
        } else {
            Some(buf[..written as usize].to_vec())
        }
    }

    /// Set state on the Q-OS host.
    pub fn set(key: &str, value: &[u8]) -> Result<(), ()> {
        let res = unsafe {
            super::state_set(key.as_ptr(), key.len(), value.as_ptr(), value.len())
        };
        if res < 0 {
            Err(())
        } else {
            Ok(())
        }
    }
}
