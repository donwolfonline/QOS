use anyhow::{Context, Result};
use clap::Subcommand;
use flate2::write::GzEncoder;
use flate2::Compression;
use indicatif::{ProgressBar, ProgressStyle};
use owo_colors::OwoColorize;
use qos_state::{SledStateStore, StateStore};
use qos_types::manifest::QosManifest;
use std::fs::File;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Subcommand, Debug)]
pub enum ModuleCommand {
    /// Validates a local module's manifest and compiles/packages it into an optimized .qos bundle.
    Pack {
        /// Path to the Rust project to bundle
        path: PathBuf,
    },
    /// Hot-swaps the active WASM module into the local runtime without resetting the daemon state.
    Deploy {
        /// Path to the .qos bundle
        file: PathBuf,
    },
}

pub async fn run(cmd: ModuleCommand) -> Result<()> {
    match cmd {
        ModuleCommand::Pack { path } => {
            println!("{}", "Packing Q-OS Module...".fg_rgb::<0, 212, 255>());

            let pb = ProgressBar::new_spinner();
            pb.set_style(
                ProgressStyle::default_spinner()
                    .tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ ")
                    .template("{spinner:.cyan} {msg}")?,
            );
            pb.set_message("Validating manifest & building...");

            let project_path = path.canonicalize().context("Failed to resolve project path")?;
            let project_path = path.canonicalize().context("Failed to resolve project path")?;

            // Build directly in the project path to resolve local path dependencies
            let build_status = Command::new("cargo")
                .arg("build")
                .arg("--target")
                .arg("wasm32-unknown-unknown")
                .arg("--release")
                .arg("--target-dir")
                .arg(project_path.join("target"))
                .current_dir(&project_path)
                .status()
                .context("Failed to compile WASM")?;

            if !build_status.success() {
                anyhow::bail!("Cargo build failed");
            }

            let manifest_path = project_path.join("manifest.json");
            let mut manifest: QosManifest = if manifest_path.exists() {
                let content = std::fs::read_to_string(&manifest_path)?;
                serde_json::from_str(&content).context("Invalid manifest.json format")?
            } else {
                anyhow::bail!("manifest.json not found in project directory");
            };

            let wasm_file_name = format!("{}.wasm", manifest.name.replace('-', "_"));
            let wasm_path = project_path
                .join("target")
                .join("wasm32-unknown-unknown")
                .join("release")
                .join(&wasm_file_name);

            if !wasm_path.exists() {
                anyhow::bail!("Compiled WASM not found at {}", wasm_path.display());
            }

            // Cryptographic Signing
            pb.set_message("Cryptographically signing module...");
            let wasm_bytes = std::fs::read(&wasm_path)?;
            use sha2::{Digest, Sha256};
            let mut hasher = Sha256::new();
            hasher.update(&wasm_bytes);
            let hash = hasher.finalize();

            let entry = keyring::Entry::new("qos-cli", "developer")?;
            let priv_hex = entry.get_password().context("No developer key found. Please run `qos developer login` first.")?;
            let priv_bytes = hex::decode(&priv_hex).context("Failed to decode private key")?;
            let mut key_bytes = [0u8; 32];
            key_bytes.copy_from_slice(&priv_bytes[0..32]);
            
            use ed25519_dalek::{Signer, SigningKey};
            let signing_key = SigningKey::from_bytes(&key_bytes);
            let signature = signing_key.sign(&hash);
            let verifying_key = signing_key.verifying_key();

            manifest.public_key = Some(hex::encode(verifying_key.to_bytes()));
            manifest.signature = Some(hex::encode(signature.to_bytes()));

            let out_dir = std::env::current_dir()?;
            let qos_filename = format!("{}-{}.qos", manifest.name, manifest.version);
            let out_file_path = out_dir.join(&qos_filename);

            pb.set_message("Archiving bundle...");

            let tar_gz = File::create(&out_file_path)?;
            let enc = GzEncoder::new(tar_gz, Compression::default());
            let mut tar = tar::Builder::new(enc);

            let manifest_bytes = serde_json::to_vec_pretty(&manifest)?;
            let mut header = tar::Header::new_gnu();
            header.set_size(manifest_bytes.len() as u64);
            header.set_cksum();
            tar.append_data(&mut header, "manifest.json", manifest_bytes.as_slice())?;

            let mut wasm_file = File::open(&wasm_path)?;
            tar.append_file("module.wasm", &mut wasm_file)?;
            tar.finish()?;

            pb.finish_and_clear();
            println!(
                "{} Bundle packed successfully: {}",
                "✔".fg_rgb::<0, 255, 65>(),
                out_file_path.display()
            );

            Ok(())
        }
        ModuleCommand::Deploy { file } => {
            println!("{}", "Deploying Q-OS Module...".fg_rgb::<0, 212, 255>());
            println!(
                "{} Limits locked: 16MB RAM | 15k Fuel | 50ms Timeout",
                "[SANDBOX]".bold().cyan()
            );

            let pb = ProgressBar::new_spinner();
            pb.set_style(
                ProgressStyle::default_spinner()
                    .tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ ")
                    .template("{spinner:.cyan} {msg}")?,
            );
            pb.set_message("Uploading bundle to local daemon...");

            let file_path = file.canonicalize().context("Bundle file not found")?;
            let bundle_bytes = std::fs::read(&file_path)?;

            let client = reqwest::Client::new();
            let res = client
                .post("http://127.0.0.1:3030/api/v1/execute")
                .body(bundle_bytes)
                .send()
                .await
                .context("Failed to connect to local Q-OS daemon (http://127.0.0.1:3030). Is it running?")?;

            let status = res.status();
            let json: serde_json::Value = res.json().await?;

            if !status.is_success() {
                pb.finish_and_clear();
                let status_str = json["status"].as_str().unwrap_or("");
                if status_str == "EXECUTION_HALTED: RESOURCE_EXHAUSTED" {
                    println!(
                        "\n{}\n{}\n{}",
                        "██████████████████████████████████████████████████████████████████████████".fg_rgb::<255, 0, 60>(),
                        "[TRAP] MODULE TERMINATED: Exceeded compute limits. Optimize your Rust code to use fewer CPU cycles.".fg_rgb::<255, 0, 60>().bold(),
                        "██████████████████████████████████████████████████████████████████████████".fg_rgb::<255, 0, 60>()
                    );
                    if let Some(fuel) = json["fuel_consumed"].as_u64() {
                        println!("{} Fuel consumed before crash: {}", "►".fg_rgb::<255, 0, 60>(), fuel.to_string().fg_rgb::<255, 0, 60>());
                    }
                    anyhow::bail!("Deployment failed due to resource exhaustion.");
                } else {
                    let err = json["error"].as_str().unwrap_or(&status_str);
                    anyhow::bail!("Daemon error: {} | {}", status, err);
                }
            }

            pb.finish_and_clear();
            println!(
                "{} Module deployed and executed successfully!",
                "✔".fg_rgb::<0, 255, 65>()
            );

            Ok(())
        }
    }
}
