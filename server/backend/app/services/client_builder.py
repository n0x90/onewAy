import os
import shutil
import subprocess
import uuid
import zipfile
from pathlib import Path

from app.exceptions import FailedToCompileClientError
from app.logger import get_logger
from app.schemas.user import UserBuildClientRequest
from app.settings import settings
from app.utils import resolve_root

log = get_logger()


def get_current_client_version() -> str:
    with open(settings.paths.client_path / ".version") as f:
        return f.read().strip()


def check_rust_install() -> bool:
    try:
        subprocess.run(
            ["cargo", "--version"],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
        subprocess.run(
            ["rustc", "--version"],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
        return True
    except Exception as e:
        log.error(e)
        return False


async def compile_client(client_info: UserBuildClientRequest) -> str:
    if not check_rust_install():
        raise FailedToCompileClientError("Rust toolchain is not available on the server")

    env = os.environ.copy()
    env["USERNAME"] = client_info.username
    env["PASSWORD"] = client_info.password
    env["API_URL"] = client_info.api_url
    env["LOG"] = str(client_info.log)
    env["DEBUG"] = str(client_info.debug)

    try:
        subprocess.run(
            ["cargo", "build", "--release"],
            cwd=settings.paths.client_path,
            env=env,
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as e:
        stderr = (e.stderr or "").strip()
        stdout = (e.stdout or "").strip()
        log.error("Client compilation failed. stdout=%s stderr=%s", stdout, stderr)
        raise FailedToCompileClientError(stderr or "Client compilation failed") from e
    except Exception as e:
        log.error(e)
        raise FailedToCompileClientError(str(e)) from e

    target_directory = settings.paths.client_path / "target" / "release"
    target_binary = target_directory / "client"
    if not target_binary.exists():
        target_binary = target_directory / "client.exe"

    if not target_binary.exists() or not target_binary.is_file():
        raise FailedToCompileClientError("Compiled client binary was not found")

    if not client_info.static:
        raise FailedToCompileClientError(
            "Dynamic client builds are not implemented yet"
        )

    build_root = Path(resolve_root("[ROOT]")) / "server" / "backend" / "builds"
    staging_directory = build_root / str(uuid.uuid4())
    staging_directory.mkdir(parents=True, exist_ok=False)

    staged_binary = staging_directory / target_binary.name
    shutil.copy2(target_binary, staged_binary)

    zip_path = staging_directory / "client.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.write(staged_binary, arcname=staged_binary.name)

    return str(zip_path)
