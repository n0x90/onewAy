import asyncio
import json
from enum import StrEnum
from typing import Any

from pymetasploit3.msfrpc import MsfRpcClient

from app.exceptions import (
    FailedToSetOptionsError,
    MetasploitModulesNotLoadedError,
    NotValidMetasploitModuleTypeError,
)
from app.settings import settings


class MetasploitModuleType(StrEnum):
    EXPLOIT = "exploit"
    AUXILIARY = "auxiliary"
    PAYLOAD = "payload"
    POST = "post"
    ENCODER = "encoder"
    NOP = "nop"
    EVASION = "evasion"


class MetasploitManager:
    def __init__(self):
        self._modules: dict[str, dict[str, Any]] | None = None
        self.session = MsfRpcClient(
            settings.metasploit.msfrpc_password, ssl=settings.metasploit.ssl
        )

    @property
    def modules(self) -> dict[str, dict[str, Any]]:
        if not self._modules:
            raise MetasploitModulesNotLoadedError()

        return self._modules

    def _match_module_options_defaults(
        self, mod_name: str, all_opts: list[str] | dict[str, Any]
    ) -> dict[str, str] | None:
        default_opts = self.get_module_options(mod_name)
        if not default_opts:
            return None

        option_names = (
            list(all_opts.keys()) if isinstance(all_opts, dict) else list(all_opts)
        )
        return {name: str(default_opts.get(name, "")) for name in option_names}

    def load_modules(self) -> None:
        with open(settings.metasploit.options_dump) as f:
            raw_data = json.load(f)

        self._modules = {
            module_name: module_options
            for module_name, module_options in raw_data.items()
            if isinstance(module_options, dict)
        }

    def get_module_options(self, module_name: str) -> dict[str, Any] | None:
        return self.modules.get(module_name)

    def get_module_options_advanced(
        self, module_name: str
    ) -> dict[str, dict[str, Any]] | None:
        mod_type, mod_name = module_name.split("/", 1)

        if mod_type not in MetasploitModuleType._value2member_map_:
            raise NotValidMetasploitModuleTypeError(mod_type)

        mod = self.session.modules.use(mod_type, mod_name)
        matched = self._match_module_options_defaults(module_name, mod.options)
        if not matched:
            return None

        return {module_name: matched}

    async def run_module(
        self, module_name: str, opts: dict[str, str], payload_number: int | None = None
    ) -> dict[str, Any]:
        mod_type, mod_name = module_name.split("/", 1)

        if mod_type not in MetasploitModuleType._value2member_map_:
            raise NotValidMetasploitModuleTypeError(mod_type)

        mod = self.session.modules.use(mod_type, mod_name)

        try:
            for key, value in opts.items():
                mod[key] = value
        except (KeyError, IndexError) as e:
            raise FailedToSetOptionsError() from e

        loop = asyncio.get_running_loop()

        if mod_type == MetasploitModuleType.EXPLOIT.value:
            payloads = mod.payloads
            if not payloads:
                raise FailedToSetOptionsError()

            if payload_number is None:
                resolved_payload = payloads[0]
            else:
                resolved_payload = payloads[payload_number]

            return await loop.run_in_executor(
                None, lambda: mod.execute(payload=resolved_payload)
            )
        else:
            return await loop.run_in_executor(None, mod.execute)

    def stop_job(self, job_id: str) -> None:
        self.session.jobs.stop(job_id)


metasploit_manager = MetasploitManager()
