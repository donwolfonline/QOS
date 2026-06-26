use anyhow::{Context, Result};
use crossterm::{
    event::{self, Event, KeyCode, KeyModifiers},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use futures_util::StreamExt;
use ratatui::{
    backend::CrosstermBackend,
    layout::{Constraint, Layout},
    style::{Color, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph},
    Terminal,
};
use std::{
    io,
    sync::{Arc, Mutex},
    time::Duration,
};
use tokio_tungstenite::connect_async;

#[derive(Clone)]
struct LogLine {
    tag: String,
    tag_color: Color,
    content: String,
}

pub async fn run(tail: bool, token: Option<String>) -> Result<()> {
    if !tail {
        println!("Please use --tail to stream real-time logs.");
        return Ok(());
    }

    let auth_token = token.unwrap_or_else(|| {
        std::env::var("QOS_TOKEN").unwrap_or_else(|_| "".to_string())
    });

    if auth_token.is_empty() {
        anyhow::bail!("API authentication token is required. Use --token <TOKEN> or set QOS_TOKEN env var.");
    }

    let url = format!("ws://127.0.0.1:3000/api/v1/stream?token={}", auth_token);

    // TUI setup
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let logs: Arc<Mutex<Vec<LogLine>>> = Arc::new(Mutex::new(Vec::new()));
    let logs_clone = logs.clone();

    // Start WebSocket connection
    tokio::spawn(async move {
        match connect_async(&url).await {
            Ok((ws_stream, _)) => {
                let (_, mut read) = ws_stream.split();
                while let Some(msg) = read.next().await {
                    if let Ok(tokio_tungstenite::tungstenite::Message::Text(text)) = msg {
                        let parsed = parse_event(&text);
                        if let Some(line) = parsed {
                            let mut l = logs_clone.lock().unwrap();
                            l.push(line);
                            if l.len() > 100 {
                                l.remove(0); // Keep last 100 lines
                            }
                        }
                    }
                }
            }
            Err(e) => {
                let mut l = logs_clone.lock().unwrap();
                l.push(LogLine {
                    tag: "[ERROR]".to_string(),
                    tag_color: Color::Red,
                    content: format!("WebSocket connection failed: {}", e),
                });
            }
        }
    });

    loop {
        terminal.draw(|f| {
            let size = f.size();
            let chunks = Layout::default()
                .constraints([Constraint::Percentage(100)].as_ref())
                .split(size);

            let l = logs.lock().unwrap();
            let mut text = Vec::new();
            for log in l.iter() {
                text.push(Line::from(vec![
                    Span::styled(
                        format!("{} ", log.tag),
                        Style::default().fg(log.tag_color),
                    ),
                    Span::raw(&log.content),
                ]));
            }

            let paragraph = Paragraph::new(text).block(
                Block::default()
                    .title(" Q-OS Telemetry Stream (Press 'q' or Ctrl+C to quit) ")
                    .borders(Borders::ALL)
                    .border_style(Style::default().fg(Color::Rgb(0, 212, 255))), // Cyan border
            );
            f.render_widget(paragraph, chunks[0]);
        })?;

        if event::poll(Duration::from_millis(100))? {
            if let Event::Key(key) = event::read()? {
                if key.code == KeyCode::Char('q')
                    || (key.code == KeyCode::Char('c') && key.modifiers.contains(KeyModifiers::CONTROL))
                {
                    break;
                }
            }
        }
    }

    // Teardown
    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen)?;
    terminal.show_cursor()?;

    Ok(())
}

fn parse_event(raw: &str) -> Option<LogLine> {
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(raw) {
        // Handle raw state mutation JSON
        if let Some(msg_type) = json.get("type").and_then(|v| v.as_str()) {
            if msg_type == "STATE_MUTATION" || msg_type == "STATE_REMOVE" {
                let key = json.get("key").and_then(|v| v.as_str()).unwrap_or("?");
                return Some(LogLine {
                    tag: "[MESH]".to_string(),
                    tag_color: Color::Rgb(0, 212, 255), // Cyan
                    content: format!("State synchronized: {}", key),
                });
            }
        }

        // Handle NDJSON tracing output
        if let Some(fields) = json.get("fields") {
            if let Some(message) = fields.get("message").and_then(|v| v.as_str()) {
                if message == "ExecutionEngine: invocation complete" {
                    let hash = fields
                        .get("module")
                        .and_then(|v| v.as_str())
                        .unwrap_or("unknown");
                    let latency = fields.get("latency_us").and_then(|v| v.as_u64()).unwrap_or(0);
                    let fuel = fields
                        .get("fuel_consumed")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);
                    let mem = fields
                        .get("peak_memory_bytes")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);
                    let exit_code = fields.get("exit_code").and_then(|v| v.as_i64()).unwrap_or(-1);

                    if exit_code == 0 {
                        return Some(LogLine {
                            tag: "[OK]".to_string(),
                            tag_color: Color::Rgb(0, 255, 65), // Neon green
                            content: format!(
                                "{} | {}us | {} fuel | {} bytes",
                                hash, latency, fuel, mem
                            ),
                        });
                    } else {
                        return Some(LogLine {
                            tag: "[TRAP]".to_string(),
                            tag_color: Color::Rgb(255, 0, 60), // Pulsing dark red
                            content: format!("{} | exit_code: {}", hash, exit_code),
                        });
                    }
                } else if message.contains("trap") || message.contains("exhausted") {
                    let reason = fields
                        .get("reason")
                        .and_then(|v| v.as_str())
                        .unwrap_or("Unknown trap");
                    return Some(LogLine {
                        tag: "[TRAP]".to_string(),
                        tag_color: Color::Rgb(255, 0, 60), // Pulsing dark red
                        content: reason.to_string(),
                    });
                } else {
                    return Some(LogLine {
                        tag: "[INFO]".to_string(),
                        tag_color: Color::White,
                        content: message.to_string(),
                    });
                }
            }
        }
    }

    // Fallback for unparseable or regular text
    Some(LogLine {
        tag: "[RAW]".to_string(),
        tag_color: Color::Gray,
        content: raw.to_string(),
    })
}
