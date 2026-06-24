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
use sha2::{Sha256, Digest};
use qos_state::StateStore;

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
    /// Install a resource from the registry.
    Install {
        #[command(subcommand)]
        action: InstallAction,
    },
}

#[derive(Subcommand, Debug)]
enum InstallAction {
    /// Install a WASM module from the centralized registry.
    Module {
        /// Module name in the format `author/module_name`
        name: String,
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
        Command::Install { action: InstallAction::Module { name } } => {
            install_module(&name, &state).await?;
        }
    }

    Ok(())
}

async fn install_module(name: &str, state: &qos_state::SledStateStore) -> anyhow::Result<()> {
    println!("Fetching module '{}' from registry...", name);
    let client = reqwest::Client::builder().use_rustls_tls().build()?;
    
    let url = format!("https://q-os.io/api/registry/download?module={}", name);
    let resp = client.get(&url).send().await?;
    
    if !resp.status().is_success() {
        anyhow::bail!("Failed to download module: HTTP {}", resp.status());
    }
    
    let expected_hash = match resp.headers().get("x-qos-sha256") {
        Some(h) => h.to_str()?.to_string(),
        None => anyhow::bail!("Registry did not provide an X-QOS-SHA256 header for validation"),
    };
    
    let bytes = resp.bytes().await?;
    
    // Validate SHA-256
    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let computed_hash = hex::encode(hasher.finalize());
    
    if computed_hash != expected_hash {
        anyhow::bail!(
            "Cryptographic validation failed! Expected {}, got {}",
            expected_hash,
            computed_hash
        );
    }
    
    println!("Validation successful (SHA-256: {})", computed_hash);
    
    // Save to library/
    let lib_dir = PathBuf::from("library");
    std::fs::create_dir_all(&lib_dir)?;
    
    let safe_name = name.replace("/", "_");
    let file_path = lib_dir.join(format!("{}.qos", safe_name));
    
    std::fs::write(&file_path, &bytes)?;
    println!("Saved to {:?}", file_path);
    
    // Register execution path in Sled state store
    let key = qos_types::StateKey::new("system", "registry", name);
    let entry = qos_types::StateEntry {
        bytes: file_path.to_string_lossy().as_bytes().to_vec(),
        vector_clock: std::collections::HashMap::new(),
        last_modified: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH)?.as_millis() as u64,
    };
    
    state.set(&key, entry)?;
    println!("Module registered in state store.");
    
    Ok(())
}
