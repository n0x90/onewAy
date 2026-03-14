from uuid import UUID, uuid4

from app.exceptions import (
    ClientUuidCouldNotBeResolved,
    JobNotFoundError,
    NoWebsocketManagerSetError,
)
from app.services.websocket_manager import WebsocketManager, client_websocket_manager
from app.services.websocket_message import StartModule, StopJob


class ModuleManager:
    _ws_manager: WebsocketManager | None = client_websocket_manager

    def __init__(self):
        self.state: dict[UUID, dict[UUID, str]] = {}

    @property
    def ws_manager(self) -> WebsocketManager:
        ws_manager = self._ws_manager
        if ws_manager is None:
            raise NoWebsocketManagerSetError()
        return ws_manager

    def set_ws_manager(self, ws_manager: WebsocketManager) -> None:
        self._ws_manager = ws_manager

    async def run_module(self, module_name: str, client_uuid: UUID) -> UUID:
        msg = StartModule(module_name=module_name)
        await self.ws_manager.send(client_uuid, msg.to_json())

        job_id = uuid4()
        self.state[job_id] = {client_uuid: module_name}
        return job_id

    async def stop_job(self, job_id: UUID) -> None:
        job = self.state.get(job_id)
        if not job:
            raise JobNotFoundError(job_id)

        msg = StopJob(job_id=job_id)
        try:
            client_uuid = next(iter(job.keys()))
        except StopIteration as e:
            raise ClientUuidCouldNotBeResolved(job_id) from e

        await self.ws_manager.send(client_uuid, msg.to_json())
        self.state.pop(job_id, None)

    def get_jobs_by_client(self, client_uuid: UUID) -> list[UUID]:
        return [
            job_id for job_id, job_meta in self.state.items() if client_uuid in job_meta
        ]

    def get_job_summaries_by_client(self, client_uuid: UUID) -> list[tuple[UUID, str]]:
        summaries: list[tuple[UUID, str]] = []
        for job_id, job_meta in self.state.items():
            module_name = job_meta.get(client_uuid)
            if module_name is not None:
                summaries.append((job_id, module_name))

        return summaries


module_manager = ModuleManager()
