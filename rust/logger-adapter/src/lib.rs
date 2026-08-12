use serde::Serialize;
use serde_json::{json, Map, Value};
use std::env;
use std::error::Error as StdError;
use std::fmt;
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};

#[derive(Debug)]
pub enum LoggerAdapterError {
    BridgeExited,
    BridgeError { code: String, message: String },
    Io(std::io::Error),
    MissingPipe(&'static str),
    Protocol(String),
    Serialize(serde_json::Error),
}

impl fmt::Display for LoggerAdapterError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::BridgeExited => write!(formatter, "logger bridge exited"),
            Self::BridgeError { code, message } => write!(formatter, "logger bridge error {code}: {message}"),
            Self::Io(error) => write!(formatter, "{error}"),
            Self::MissingPipe(name) => write!(formatter, "logger bridge missing {name} pipe"),
            Self::Protocol(message) => write!(formatter, "logger bridge protocol error: {message}"),
            Self::Serialize(error) => write!(formatter, "{error}"),
        }
    }
}

impl StdError for LoggerAdapterError {
    fn source(&self) -> Option<&(dyn StdError + 'static)> {
        match self {
            Self::Io(error) => Some(error),
            Self::Serialize(error) => Some(error),
            _ => None,
        }
    }
}

impl From<std::io::Error> for LoggerAdapterError {
    fn from(error: std::io::Error) -> Self {
        Self::Io(error)
    }
}

impl From<serde_json::Error> for LoggerAdapterError {
    fn from(error: serde_json::Error) -> Self {
        Self::Serialize(error)
    }
}

pub type Result<T> = std::result::Result<T, LoggerAdapterError>;

#[derive(Clone, Debug, Default, Serialize)]
pub struct LoggerConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub console: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dir: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub quiet: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub save: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

impl LoggerConfig {
    pub fn new(source: impl Into<String>) -> Self {
        Self {
            source: Some(source.into()),
            ..Self::default()
        }
    }

    pub fn console(mut self, enabled: bool) -> Self {
        self.console = Some(enabled);
        self
    }

    pub fn dir(mut self, dir: impl Into<String>) -> Self {
        self.dir = Some(dir.into());
        self
    }

    pub fn quiet(mut self, enabled: bool) -> Self {
        self.quiet = Some(enabled);
        self
    }

    pub fn save(mut self, enabled: bool) -> Self {
        self.save = Some(enabled);
        self
    }

    pub fn extra(mut self, key: impl Into<String>, value: impl Serialize) -> Result<Self> {
        self.extra.insert(key.into(), serde_json::to_value(value)?);
        Ok(self)
    }
}

#[derive(Debug)]
pub struct LoggerAdapterBuilder {
    bridge_script: PathBuf,
    bun_executable: String,
    logger: LoggerConfig,
}

impl LoggerAdapterBuilder {
    pub fn new(logger: LoggerConfig) -> Self {
        Self {
            bridge_script: default_bridge_script_path(),
            bun_executable: env::var("BUN").unwrap_or_else(|_| "bun".to_string()),
            logger,
        }
    }

    pub fn bridge_script(mut self, path: impl Into<PathBuf>) -> Self {
        self.bridge_script = path.into();
        self
    }

    pub fn bun_executable(mut self, command: impl Into<String>) -> Self {
        self.bun_executable = command.into();
        self
    }

    pub fn start(self) -> Result<LoggerAdapter> {
        LoggerAdapter::start(self)
    }
}

#[derive(Debug)]
pub struct LoggerAdapter {
    child: Child,
    closed: bool,
    next_id: u64,
    stdin: ChildStdin,
    stdout: BufReader<ChildStdout>,
}

impl LoggerAdapter {
    pub fn builder(logger: LoggerConfig) -> LoggerAdapterBuilder {
        LoggerAdapterBuilder::new(logger)
    }

    pub fn start(builder: LoggerAdapterBuilder) -> Result<Self> {
        let mut child = Command::new(&builder.bun_executable)
        .arg(&builder.bridge_script)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit())
        .spawn()?;

        let stdin = child.stdin.take().ok_or(LoggerAdapterError::MissingPipe("stdin"))?;
        let stdout = child.stdout.take().ok_or(LoggerAdapterError::MissingPipe("stdout"))?;
        let mut adapter = Self {
            child,
            closed: false,
            next_id: 1,
            stdin,
            stdout: BufReader::new(stdout),
        };
        adapter.configure(builder.logger)?;
        Ok(adapter)
    }

    pub fn info<T: Serialize>(&mut self, group: &str, message: &str, metadata: T) -> Result<()> {
        self.log("info", group, message, metadata)
    }

    pub fn warn<T: Serialize>(&mut self, group: &str, message: &str, metadata: T) -> Result<()> {
        self.log("warn", group, message, metadata)
    }

    pub fn error<T: Serialize>(&mut self, group: &str, message: &str, metadata: T) -> Result<()> {
        self.log("error", group, message, metadata)
    }

    pub fn fail<T: Serialize>(&mut self, group: &str, message: &str, metadata: T) -> Result<()> {
        self.log("fail", group, message, metadata)
    }

    pub fn log<T: Serialize>(&mut self, level: &str, group: &str, message: &str, metadata: T) -> Result<()> {
        let metadata = serde_json::to_value(metadata)?;
        let command = if metadata.is_null() {
            json!({
                    "type": "log",
                    "level": level,
                    "group": group,
                    "message": message
            })
        } else {
            json!({
                    "type": "log",
                    "level": level,
                    "group": group,
                    "message": message,
                    "metadata": metadata
            })
        };
        self.send(command)
    }

    pub fn flush(&mut self) -> Result<()> {
        let id = self.next_id();
        self.send(json!({ "type": "flush", "id": id }))?;
        self.wait_for_ack(&id)
    }

    pub fn close(&mut self) -> Result<()> {
        if self.closed {
            return Ok(());
        }
        let id = self.next_id();
        self.send(json!({ "type": "close", "id": id }))?;
        let result = self.wait_for_ack(&id);
        self.closed = true;
        let _ = self.child.wait();
        result
    }

    fn configure(&mut self, logger: LoggerConfig) -> Result<()> {
        let id = self.next_id();
        self.send(json!({ "type": "configure", "id": id, "logger": logger }))?;
        self.wait_for_ack(&id)
    }

    fn next_id(&mut self) -> String {
        let id = self.next_id.to_string();
        self.next_id += 1;
        id
    }

    fn send(&mut self, value: Value) -> Result<()> {
        serde_json::to_writer(&mut self.stdin, &value)?;
        self.stdin.write_all(b"\n")?;
        self.stdin.flush()?;
        Ok(())
    }

    fn wait_for_ack(&mut self, id: &str) -> Result<()> {
        loop {
            let mut line = String::new();
            let read = self.stdout.read_line(&mut line)?;
            if read == 0 {
                return Err(LoggerAdapterError::BridgeExited);
            }
            let response: Value = serde_json::from_str(line.trim())?;
            if response.get("id").and_then(Value::as_str) != Some(id) {
                continue;
            }
            if response.get("ok").and_then(Value::as_bool) == Some(true) {
                return Ok(());
            }
            let error = response.get("error").and_then(Value::as_object);
            let code = error
            .and_then(|item| item.get("code"))
            .and_then(Value::as_str)
            .unwrap_or("bridge-error")
            .to_string();
            let message = error
            .and_then(|item| item.get("message"))
            .and_then(Value::as_str)
            .unwrap_or("command failed")
            .to_string();
            return Err(LoggerAdapterError::BridgeError { code, message });
        }
    }
}

impl Drop for LoggerAdapter {
    fn drop(&mut self) {
        if self.closed {
            return;
        }
        let _ = self.send(json!({ "type": "close" }));
        let _ = self.child.kill();
        let _ = self.child.wait();
        self.closed = true;
    }
}

fn default_bridge_script_path() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
    .join("..")
    .join("..")
    .join("dist")
    .join("bridge")
    .join("server.js")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn config_serializes() {
        let config = LoggerConfig::new("native-app")
        .console(false)
        .save(false)
        .quiet(true);
        let value = serde_json::to_value(config).unwrap();
        assert_eq!(value["source"], "native-app");
        assert_eq!(value["console"], false);
    }

    #[test]
    fn bridge_round_trip() {
        let bridge_script = default_bridge_script_path();
        assert!(bridge_script.exists(), "bridge script must be built before running bridge tests");
        let logger = LoggerConfig::new("native-app")
        .console(false)
        .save(false)
        .quiet(true);
        let mut log = LoggerAdapter::builder(logger).start().unwrap();
        log.info("app.start", "started", json!({ "pid": std::process::id() })).unwrap();
        log.warn("app.warn", "warning", json!({ "code": "sample" })).unwrap();
        log.error("app.error", "failed", json!({ "recoverable": true })).unwrap();
        log.fail("app.fail", "stopped", json!({ "expected": false })).unwrap();
        log.log("info", "app.event", "recorded", json!({ "count": 1 })).unwrap();
        log.flush().unwrap();
        log.close().unwrap();
    }
}
