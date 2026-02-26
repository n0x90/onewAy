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

pub fn log(level: LogLevel, args: Arguments<'_>, _file: &str, _line: u32, _module: &str) {
    let timestamp = Local::now().format("%m/%d/%Y %I:%M:%S %p");
    let message = format!("[{}] [{timestamp}] - {args}", level.as_str());

    match level {
        LogLevel::Warn | LogLevel::Error => eprintln!("{message}"),
        LogLevel::Debug | LogLevel::Info => println!("{message}"),
    }
}

#[macro_export]
macro_rules! log_debug {
    ($($arg:tt)*) => {
        $crate::logger::log(
            $crate::logger::LogLevel::Debug,
            format_args!($($arg)*),
            file!(),
            line!(),
            module_path!(),
        )
    };
}

#[macro_export]
macro_rules! log_info {
    ($($arg:tt)*) => {
        $crate::logger::log(
            $crate::logger::LogLevel::Info,
            format_args!($($arg)*),
            file!(),
            line!(),
            module_path!(),
        )
    };
}

#[macro_export]
macro_rules! log_warn {
    ($($arg:tt)*) => {
        $crate::logger::log(
            $crate::logger::LogLevel::Warn,
            format_args!($($arg)*),
            file!(),
            line!(),
            module_path!(),
        )
    };
}

#[macro_export]
macro_rules! log_error {
    ($($arg:tt)*) => {
        $crate::logger::log(
            $crate::logger::LogLevel::Error,
            format_args!($($arg)*),
            file!(),
            line!(),
            module_path!(),
        )
    };
}
