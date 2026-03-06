use std::env;

fn main() {
    println!("cargo:rerun-if-env-changed=API_URL");
    println!("cargo:rerun-if-env-changed=USERNAME");
    println!("cargo:rerun-if-env-changed=PASSWORD");
    println!("cargo:rerun-if-env-changed=LOG");
    println!("cargo:rerun-if-env-changed=DEBUG");
    println!("cargo:rustc-check-cfg=cfg(oneway_log)");
    println!("cargo:rustc-check-cfg=cfg(oneway_debug)");

    env::var("API_URL").expect("API_URL is not set");
    env::var("USERNAME").expect("USERNAME is not set");
    env::var("PASSWORD").expect("PASSWORD is not set");

    let log = env::var("LOG")
        .unwrap_or_else(|_| "false".to_string())
        .parse::<bool>()
        .unwrap_or(false);
    let debug = env::var("DEBUG")
        .unwrap_or_else(|_| "false".to_string())
        .parse::<bool>()
        .unwrap_or(false);

    if log {
        println!("cargo:rustc-cfg=oneway_log");
    }

    if debug {
        println!("cargo:rustc-cfg=oneway_debug");
    }

    if debug && !log {
        panic!("DEBUG is set to true but LOG is set to false");
    }
}
