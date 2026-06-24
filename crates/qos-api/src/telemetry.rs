use std::io;
use tokio::sync::broadcast;
use tracing_subscriber::fmt::MakeWriter;

/// A custom writer that intercepts log bytes and forwards them as Strings
/// into a Tokio broadcast channel for real-time WebSocket streaming.
#[derive(Clone)]
pub struct BroadcastWriter {
    tx: broadcast::Sender<String>,
}

impl BroadcastWriter {
    pub fn new(tx: broadcast::Sender<String>) -> Self {
        Self { tx }
    }
}

impl io::Write for BroadcastWriter {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        if let Ok(s) = std::str::from_utf8(buf) {
            // Ignore errors if there are no active receivers (WebSocket clients)
            let _ = self.tx.send(s.to_string());
        }
        Ok(buf.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

impl<'a> MakeWriter<'a> for BroadcastWriter {
    type Writer = Self;

    fn make_writer(&self) -> Self::Writer {
        self.clone()
    }
}
