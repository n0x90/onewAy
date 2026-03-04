use crate::{debug, error};
use std::path::{Path, PathBuf};
use std::process::{ChildStdin, ChildStdout, Stdio};

#[derive(Debug, serde::Deserialize, Clone)]
pub struct ModuleConfig {
    pub name: String,
    pub description: String,
    pub version: String,
}

#[derive(Debug)]
pub struct Job {
    pub uuid: String,
    pub stdout: ChildStdout,
    pub stdin: ChildStdin,
}

#[derive(Debug)]
pub struct Module  {
    pub data: ModuleConfig,
    pub binary_path: PathBuf,
    pub jobs: Vec<Job>,
}

#[derive(Debug)]
pub struct ModuleManager {
    pub modules: Vec<Module>,
}

impl ModuleManager {
    pub fn new() -> Self {
        Self {
            modules: vec![],
        }
    }

    pub fn init(&mut self, modules_path: &Path) -> std::io::Result<()> {
        for entry in std::fs::read_dir(modules_path)? {
            let entry = entry?;
            let file_type = entry.file_type()?;

            if file_type.is_dir() {
                let path = entry.path();
                let module_config = path.join("config.yaml");

                if module_config.exists() {
                    let config = Self::load_config(&module_config);
                    match config {
                        Ok(config) => {
                            self.modules.push(Module {
                                data: config.clone(),
                                binary_path: path,
                                jobs: vec![],
                            });

                            debug!("Loaded module: {}", config.name);
                        },
                        Err(e) => error!("Failed to load module config: {}", e),
                    }
                }
            }
        }
        Ok(())
    }

    pub fn run_module(&mut self, module: &mut Module) {
        let child = std::process::Command::new(module.binary_path.clone())
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn();

        if let Err(e) = child {
            error!("Failed to spawn module: {}", e);
            return;
        }

        let mut child = child.unwrap();
        let stdin = child.stdin.take().unwrap();
        let stdout = child.stdout.take().unwrap();

        module.jobs.push(Job {
            uuid: uuid::Uuid::new_v4().to_string(),
            stdin,
            stdout,
        })
    }

    fn load_config(config_path: &Path) -> Result<ModuleConfig, std::io::Error> {
        let data = std::fs::read_to_string(config_path)?;
        let config = serde_yaml::from_str::<ModuleConfig>(&data).map_err(|e| {
            std::io::Error::new(std::io::ErrorKind::InvalidData, e)
        })?;
        
        Ok(config)
    }
}
