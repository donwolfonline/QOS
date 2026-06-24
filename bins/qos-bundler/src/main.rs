use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use flate2::write::GzEncoder;
use flate2::Compression;
use qos_types::manifest::QosManifest;
use std::fs::File;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Parser)]
#[command(name = "qos-bundler")]
#[command(about = "Packages a Rust project into a Q-OS compatible `.qos` bundle.", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Build and package a Q-OS module
    Build {
        /// Path to the Rust project to bundle
        #[arg(default_value = ".")]
        project_path: PathBuf,

        /// Output directory for the `.qos` file
        #[arg(short, long, default_value = ".")]
        out_dir: PathBuf,

        /// Override the manifest.json path
        #[arg(short, long)]
        manifest: Option<PathBuf>,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Build { project_path, out_dir, manifest } => {
            build_project(&project_path, &out_dir, manifest.as_deref())?;
        }
    }

    Ok(())
}

fn build_project(project_path: &Path, out_dir: &Path, manifest_path: Option<&Path>) -> Result<()> {
    let project_path = project_path.canonicalize().context("Failed to resolve project path")?;
    let out_dir = out_dir.canonicalize().context("Failed to resolve output dir")?;

    println!("🚀 Starting Q-OS Bundler");
    println!("📦 Project: {}", project_path.display());

    // 1. Create a staging directory
    let staging_dir = tempfile::tempdir().context("Failed to create staging dir")?;
    let staging_path = staging_dir.path();

    // 2. Copy the project to staging dir
    println!("📂 Staging project to temporary directory...");
    let status = Command::new("cp")
        .arg("-R")
        .arg(&project_path)
        .arg(staging_path)
        .status()
        .context("Failed to execute cp")?;
    
    if !status.success() {
        anyhow::bail!("Failed to copy project to staging directory");
    }

    // Determine the actual project root within the staging dir (cp -R usually nests it)
    let project_name = project_path.file_name().unwrap();
    let staged_project = staging_path.join(project_name);
    
    // 3. Inject Q-OS SDK dependency
    println!("💉 Injecting Q-OS SDK dependency...");
    // Assuming qos-sdk is located at /Users/frederickdineen/qos/crates/qos-sdk
    let sdk_path = "/Users/frederickdineen/qos/crates/qos-sdk";
    let add_status = Command::new("cargo")
        .arg("add")
        .arg("qos-sdk")
        .arg("--path")
        .arg(sdk_path)
        .current_dir(&staged_project)
        .status()
        .context("Failed to inject qos-sdk")?;
    
    if !add_status.success() {
        anyhow::bail!("cargo add qos-sdk failed");
    }

    // 4. Compile the project to wasm32-unknown-unknown
    println!("🔨 Compiling to wasm32-unknown-unknown...");
    let build_status = Command::new("cargo")
        .arg("build")
        .arg("--target")
        .arg("wasm32-unknown-unknown")
        .arg("--release")
        .current_dir(&staged_project)
        .status()
        .context("Failed to compile WASM")?;

    if !build_status.success() {
        anyhow::bail!("Cargo build failed");
    }

    // 5. Parse manifest
    let manifest_path_resolved = match manifest_path {
        Some(p) => p.to_path_buf(),
        None => project_path.join("manifest.json"),
    };

    let manifest: QosManifest = if manifest_path_resolved.exists() {
        println!("📄 Parsing manifest from {}", manifest_path_resolved.display());
        let content = std::fs::read_to_string(&manifest_path_resolved)?;
        serde_json::from_str(&content).context("Invalid manifest.json format")?
    } else {
        println!("⚠️ No manifest.json found, generating a default one.");
        // Try to guess the name from Cargo.toml
        let cargo_toml_path = staged_project.join("Cargo.toml");
        let cargo_toml = std::fs::read_to_string(&cargo_toml_path)?;
        let name = cargo_toml.lines()
            .find(|l| l.starts_with("name ="))
            .and_then(|l| l.split('=').nth(1))
            .map(|s| s.trim().trim_matches('"'))
            .unwrap_or("unknown_module")
            .to_string();

        QosManifest {
            name,
            version: "0.1.0".to_string(),
            author: None,
            capabilities: Default::default(),
            entrypoint: "run".to_string(),
            dependencies: Default::default(),
            initial_state: Default::default(),
        }
    };

    // The wasm file is usually named with underscores instead of hyphens
    let wasm_file_name = format!("{}.wasm", manifest.name.replace('-', "_"));
    let wasm_path = staged_project
        .join("target")
        .join("wasm32-unknown-unknown")
        .join("release")
        .join(&wasm_file_name);

    if !wasm_path.exists() {
        anyhow::bail!("Compiled WASM not found at {}", wasm_path.display());
    }

    // 6. Package into .qos archive
    let qos_filename = format!("{}-{}.qos", manifest.name, manifest.version);
    let out_file_path = out_dir.join(&qos_filename);
    println!("🗜️ Packaging bundle into {}", out_file_path.display());

    let tar_gz = File::create(&out_file_path)?;
    let enc = GzEncoder::new(tar_gz, Compression::default());
    let mut tar = tar::Builder::new(enc);

    // Add manifest.json
    let manifest_bytes = serde_json::to_vec_pretty(&manifest)?;
    let mut header = tar::Header::new_gnu();
    header.set_size(manifest_bytes.len() as u64);
    header.set_cksum();
    tar.append_data(&mut header, "manifest.json", manifest_bytes.as_slice())?;

    // Add WASM binary
    let mut wasm_file = File::open(&wasm_path)?;
    tar.append_file("module.wasm", &mut wasm_file)?;

    tar.finish()?;

    println!("✅ Bundle created successfully: {}", out_file_path.display());

    Ok(())
}
