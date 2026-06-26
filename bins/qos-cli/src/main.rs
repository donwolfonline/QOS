pub mod cmd_node;
pub mod cmd_module;
pub mod cmd_logs;
pub mod cmd_test;
pub mod cmd_network;
pub mod cmd_developer;
pub mod cmd_simulate;

use anyhow::Result;
use clap::{Parser, Subcommand};

/// Q-OS orchestration engine CLI.
#[derive(Parser, Debug)]
#[command(name = "qos", version, about = "Q-OS primary orchestration engine")]
struct Cli {
    #[command(subcommand)]
    cmd: Command,
}

#[derive(Subcommand, Debug)]
enum Command {
    /// Node management (init, start)
    Node {
        #[command(subcommand)]
        action: cmd_node::NodeCommand,
    },
    /// Module management (pack, deploy)
    Module {
        #[command(subcommand)]
        action: cmd_module::ModuleCommand,
    },
    /// Developer tools (login, sign)
    Developer {
        #[command(subcommand)]
        action: cmd_developer::DeveloperCommand,
    },
    /// Stream runtime telemetry logs
    Logs {
        /// Stream logs in real-time
        #[arg(long)]
        tail: bool,
        /// API Authentication token
        #[arg(long, env = "QOS_TOKEN")]
        token: Option<String>,
    },
    /// Automated testing harness
    Test {
        #[command(subcommand)]
        action: cmd_test::TestCommand,
    },
    /// Inspect local network state
    Network {
        #[command(subcommand)]
        action: cmd_network::NetworkCommand,
    },
    /// Spawn a local multi-node mesh for integration testing
    Simulate {
        #[command(subcommand)]
        action: cmd_simulate::SimulateCommand,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    // Configure tracing to output gracefully to stderr so raw data can be piped via stdout.
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .with_writer(std::io::stderr)
        .init();

    let cli = Cli::parse();

    match cli.cmd {
        Command::Node { action } => {
            cmd_node::run(action).await?;
        }
        Command::Module { action } => {
            cmd_module::run(action).await?;
        }
        Command::Developer { action } => {
            cmd_developer::run(action).await?;
        }
        Command::Logs { tail, token } => {
            cmd_logs::run(tail, token).await?;
        }
        Command::Test { action } => {
            cmd_test::run(action).await?;
        }
        Command::Network { action } => {
            cmd_network::run(action).await?;
        }
        Command::Simulate { action } => {
            cmd_simulate::run(action).await?;
        }
    }

    Ok(())
}
