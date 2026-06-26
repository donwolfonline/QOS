use anyhow::{Context, Result};
use clap::Subcommand;
use ed25519_dalek::SigningKey;
use keyring::Entry;
use owo_colors::OwoColorize;
use rand::rngs::OsRng;

#[derive(Subcommand, Debug)]
pub enum DeveloperCommand {
    /// Login and generate/import developer credentials
    Login,
}

pub async fn run(cmd: DeveloperCommand) -> Result<()> {
    match cmd {
        DeveloperCommand::Login => {
            println!("{}", "Q-OS Developer Login".fg_rgb::<0, 212, 255>());
            
            let entry = Entry::new("qos-cli", "developer")?;
            
            match entry.get_password() {
                Ok(priv_hex) => {
                    println!("{} Developer keypair found in OS Keychain.", "✔".fg_rgb::<0, 255, 65>());
                    let priv_bytes = hex::decode(priv_hex).context("Failed to decode stored private key")?;
                    let mut key_bytes = [0u8; 32];
                    key_bytes.copy_from_slice(&priv_bytes[0..32]);
                    let signing_key = SigningKey::from_bytes(&key_bytes);
                    let verifying_key = signing_key.verifying_key();
                    println!("{} Public Key: {}", "►".fg_rgb::<0, 212, 255>(), hex::encode(verifying_key.to_bytes()));
                }
                Err(_) => {
                    println!("{} No developer keypair found. Generating new Ed25519 keypair...", "►".fg_rgb::<0, 212, 255>());
                    let mut csprng = OsRng;
                    let signing_key = SigningKey::generate(&mut csprng);
                    let verifying_key = signing_key.verifying_key();
                    
                    let priv_hex = hex::encode(signing_key.to_bytes());
                    entry.set_password(&priv_hex).context("Failed to store private key in OS Keychain")?;
                    
                    println!("{} New keypair generated and securely stored in OS Keychain.", "✔".fg_rgb::<0, 255, 65>());
                    println!("{} Public Key: {}", "►".fg_rgb::<0, 212, 255>(), hex::encode(verifying_key.to_bytes()));
                    println!("{} Keep your machine secure! This key will be used to sign all your published Q-OS modules.", "⚠".fg_rgb::<255, 204, 0>());
                }
            }
            
            Ok(())
        }
    }
}
