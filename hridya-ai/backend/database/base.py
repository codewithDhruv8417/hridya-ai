"""The SQLAlchemy declarative base shared by every ORM model.

`Base.metadata` is the registry that knows all 12 tables. `create_all()` walks
it and emits the CREATE TABLE statements in the right dependency order.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
