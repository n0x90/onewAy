# Backend Settings Reference

This file documents all supported backend settings loaded by `server/backend/app/settings.py`.

## Where Settings Are Loaded From

The backend reads settings from `server/backend/config.toml` by default (`CONFIG_FILE = "config.toml"`), plus standard Pydantic settings sources (init args, env, dotenv, file secrets).

Note: `config.toml` must be valid TOML and UTF-8 without BOM.

## Minimum Required Config

```toml
[security]
secret_key = "replace_with_random_secret"

[database]
database_url = "postgresql+asyncpg://user:password@localhost:5432/oneway_db"

[metasploit]
active = false
```

## Full Settings

### `[app]`

- `debug` (bool, default: `false`)
- `host` (string, default: `"0.0.0.0"`)
- `port` (int, default: `8000`)
- `frontend_url` (string, default: `"https://localhost:5173"`)
  - Trailing `/` is removed automatically.

### `[security]`

- `ssl` (bool, default: `true`)
- `ssl_certfile` (file path, default: `~/.onewAy/onewAy.crt`)
- `ssl_keyfile` (file path, default: `~/.onewAy/onewAy.key`)
- `secret_key` (string, required)
- `algorithm` (string, default: `"HS256"`)
- `access_token_expire_minutes` (int, default: `30`)
- `refresh_token_expire_days` (int, default: `7`)

When `ssl = true`, cert/key paths must point to existing files.

### `[database]`

- `database_url` (string, required)
  - Expected async SQLAlchemy URL format, e.g. `postgresql+asyncpg://...`.

### `[paths]`

- `modules_path` (directory path, default: `[repo_root]/modules`)
- `client_path` (directory path, default: `[repo_root]/client`)

Both values must resolve to existing directories.

### `[metasploit]`

- `active` (bool, default: `true`)
- `mod_info_path` (file path, default: `[repo_root]/server/backend/metasploit_mod_options.json`)
- `options_dump` (file path, default: `[repo_root]/server/backend/metasploit_mod_options.json`)
- `msfrpc_password` (string, default: `null`)
- `ssl` (bool, default: `true`)

Validation rule: if `active = true`, `msfrpc_password` must be set and non-empty.

### `[testing]`

- `testing` (bool, default: `false`)
- `database_url` (string, default: `null`)
- `secret_key` (string, default: `null`)

If `testing = true`, both `testing.database_url` and `testing.secret_key` are required.  
When set, they override `[database].database_url` and `[security].secret_key`.

## Example Local Development Config

```toml
[app]
debug = true
host = "0.0.0.0"
port = 8000
frontend_url = "https://localhost:5173"

[security]
ssl = true
ssl_certfile = "C:/Users/<you>/.onewAy/onewAy.crt"
ssl_keyfile = "C:/Users/<you>/.onewAy/onewAy.key"
secret_key = "replace_with_random_secret"

[database]
database_url = "postgresql+asyncpg://oneway:<password>@localhost:5432/oneway_db"

[metasploit]
active = false
```
