pub const API_URL: &str = env!("API_URL");
pub const USERNAME: &str = env!("USERNAME");
pub const PASSWORD: &str = env!("PASSWORD");

pub const LOG: bool = cfg!(oneway_log);
pub const DEBUG: bool = cfg!(oneway_debug);
