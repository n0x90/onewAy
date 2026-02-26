from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from app.models import client, client_module, module, refresh_token, user  # noqa: E402,F401
