# Install Steps for onewAy
Prerequisites:
- PostgreSQL (tested on PostgreSQL 18)
- Python (tested on Python 3.14)
- Rust
- NodeJS

Optional:
- Metasploit

### 1. Clone the repo
```bash
git clone https://github.com/n0x90/onewAy.git
```

### 2. Install the backend dependencies
```bash
cd onewAy/server/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Setup PostgreSQL database
Replace [your_db_user], [your_db_user_password], and [your_db_name] with values of your choice.
```bash
postgres=# CREATE USER [your_db_user] WITH PASSWORD '[your_db_user_password]';
postgres=# CREATE DATABASE [your_db_name] OWNER [your_db_user];
postgres=# GRANT ALL PRIVILEGES ON DATABASE [your_db_name] TO [your_db_user];
```
_Note: You can also setup a testing database in this step if you want to run live development tests. If you just want to use this software don't worry about it._

### 4. Create your backend config
In `server/backend` you should create a new file called `config.toml` which will hold all of the configuration options for your backend. You can see a minimal example here.
```toml
# config.toml minimal example
[security]
secret_key = "your_secret_key"

[database]
database_url = "postgresql+asyncpg://oneway:your_db_password@localhost:5432/oneway_db"
```
If you decided not to install Metasploit you will have to disable it via the config as it's enabled by default. Just add these lines to the config:
```toml
[metasploit]
active = false
```
You can find all the config settings and their defaults in [server/backend/SETTINGS.md](server/backend/SETTINGS.md).

### 4.5 Setup SSL certs (highly recommended)
You should setup SSL certs for the project. You _can_ use it without if for some reason you don't want to but you will have to change the backend config.toml settings to `ssl = false` and `frontend_url = "http://localhost:5173"`. You can find how to create self signed certificates online. The default path for the cert file is `[your_home_directory]/.onewAy/onewAy.crt` and the key file is `[your_home_directory]/.onewAy/onewAy.key`. If you have different names for the files or want to put them somewhere else you can change where the server looks for the paths in `config.toml`.

_Note: You will have to ensure the SANs information on the cert points to localhost or 127.0.0.1 if you want to access the frontend on browsers like Chrome if you don't want a security warning. In addition to get rid of the warning you will have to add the cert to your browsers certificate store._

_TODO: Add an example for self signed certificates._

### 5. Create your user account
**Note: make sure PostgreSQL service has started before starting this step.**
To create your use account you will login with in the frontend go to `server/backend` and run:
```bash
python run.py
```
It will then prompt you for your details and add it to the database.

### 6. Install frontend dependencies
To install the frontend dependencies go to the directory `server/frontend' and run:
```bash
npm install
```

# Start the Framework
To start the framework first startup the backend. Go to `server/backend ` and run:
```bash
python run.py
```

Then start the frontend. Go to `server/frontend` and run:
```bash
npm run dev
```
Then click the URL you get from Vite and login to the framework interface.
