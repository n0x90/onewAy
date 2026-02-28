#[derive(Debug)]
pub struct Config {
    pub log: bool,
    pub debug: bool,
}

impl Config {
    const fn new() -> Self {
        Self {
            log: true,
            debug: true,
        }
    }
}

pub const CONFIG: Config = Config::new();
