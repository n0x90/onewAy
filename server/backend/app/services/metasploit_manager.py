import json
from typing import Any

from pymetasploit3.msfrpc import MsfRpcClient

from app.exceptions import MetasploitModulesNotLoadedError
from app.settings import settings


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
        mod = self.session.modules.use(mod_type, mod_name)
        matched = self._match_module_options_defaults(module_name, mod.options)
        if not matched:
            return None

        return {module_name: matched}


metasploit_manager = MetasploitManager()
