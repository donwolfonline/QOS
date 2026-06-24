//! `qos` — developer CLI for Q-OS.
//!
//! # Subcommands
//! - `qos run <image.png>`   — Decode QR from image and execute the module.
//! - `qos inject <wasm> <descriptor.json>` — Directly inject a WASM + descriptor (bypasses QR).
//! - `qos state get <key>`   — Read a value from the state store.
//! - `qos state list`        — List all state keys.

use anyhow::Context;
use clap::{Parser, Subcommand};
use std::path::PathBuf;

/// Q-OS developer CLI.
#[derive(Parser, Debug)]
#[command(name = "qos", version, about = "Q-OS developer tools")]
struct Cli {
    /// Path to the sled state database directory.
    #[arg(long, default_value = ".qos-state")]
    state_dir: PathBuf,

    #[command(subcommand)]
    cmd: Command,
}

#[derive(Subcommand, Debug)]
enum Command {
    /// Decode QR from an image and execute the WASM module.
    Run {
        /// Path to the QR code image (PNG / JPEG).
        image: PathBuf,
        /// Do not require an Ed25519 signature (development only).
        #[arg(long)]
        no_strict: bool,
    },
    /// Inject a WASM module directly using a JSON descriptor.
    Inject {
        /// Path to the WASM binary.
        wasm: PathBuf,
        /// Path to the JSON ModuleDescriptor file.
        descriptor: PathBuf,
    },
    /// Inspect the Q-OS state store.
    State {
        #[command(subcommand)]
        action: StateAction,
    },
}

#[derive(Subcommand, Debug)]
enum StateAction {
    /// Read a state key.
    Get { key: String },
    /// List all state keys.
    List,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let cli = Cli::parse();

    // State store shared across subcommands.
    let state = qos_state::SledStateStore::open(&cli.state_dir)
        .context("opening state store")?;

    match cli.cmd {
        Command::Run { image, no_strict } => {
            let image_bytes = std::fs::read(&image)
                .with_context(|| format!("reading image {:?}", image))?;
            println!("TODO: run QR pipeline on {:?} (strict={})", image, !no_strict);
            let _ = (image_bytes, state);
        }
        Command::Inject { wasm, descriptor } => {
            println!("TODO: inject {:?} with descriptor {:?}", wasm, descriptor);
        }
        Command::State { action: StateAction::Get { key } } => {
            println!("TODO: get state key '{key}'");
        }
        Command::State { action: StateAction::List } => {
            println!("TODO: list all state keys");
        }
    }

    Ok(())
}
