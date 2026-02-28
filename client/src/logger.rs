use crate::config::CONFIG;
use chrono::Local;
use std::fmt::Arguments;

#[derive(Debug, Clone, Copy)]
pub enum LogLevel {
    Debug,
    Info,
    Warn,
    Error,
}

impl LogLevel {
    fn as_str(self) -> &'static str {
        match self {
            Self::Debug => "DEBUG",
            Self::Info => "INFO",
            Self::Warn => "WARN",
            Self::Error => "ERROR",
        }
    }
}

pub(crate) fn log(level: LogLevel, args: Arguments<'_>) {
    if !CONFIG.log {
        return;
    }
    let timestamp = Local::now().format("%m/%d/%Y %I:%M:%S %p");
    let message = format!("[{}] [{timestamp}] - {args}", level.as_str());

    match level {
        LogLevel::Warn | LogLevel::Error => eprintln!("{message}"),
        LogLevel::Debug => {
            if CONFIG.debug {
                println!("{message}")
            }
        }
        LogLevel::Info => println!("{message}"),
    }
}

#[macro_export]
macro_rules! debug {
    ($($arg:tt)*) => {
        $crate::logger::log(
            $crate::logger::LogLevel::Debug,
            format_args!($($arg)*),
        )
    };
}

#[macro_export]
macro_rules! info {
    ($($arg:tt)*) => {
        $crate::logger::log(
            $crate::logger::LogLevel::Info,
            format_args!($($arg)*),
        )
    };
}

#[macro_export]
macro_rules! warn {
    ($($arg:tt)*) => {
        $crate::logger::log(
            $crate::logger::LogLevel::Warn,
            format_args!($($arg)*),
        )
    };
}

#[macro_export]
macro_rules! error {
    ($($arg:tt)*) => {
        $crate::logger::log(
            $crate::logger::LogLevel::Error,
            format_args!($($arg)*),
        )
    };
}
