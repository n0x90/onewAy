import json
from typing import Any

from app.exceptions import MetasploitModulesNotLoadedError
from app.settings import settings


class MetasploitManager:
    def __init__(self):
        self._modules: dict[str, dict[str, Any]] | None = None

    @property
    def modules(self) -> dict[str, dict[str, Any]]:
        if not self._modules:
            raise MetasploitModulesNotLoadedError()

        return self._modules

    def load_modules(self) -> None:
        with open(settings.paths.metasploit_options_dump) as f:
            raw_data = json.load(f)

        self._modules = {
            module_name: module_options
            for module_name, module_options in raw_data.items()
            if isinstance(module_options, dict)
        }

    def get_module(self, module_name: str) -> dict[str, dict[str, Any]] | None:
        return self.modules.get(module_name)


metasploit_manager = MetasploitManager()
