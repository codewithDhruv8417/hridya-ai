"""Database engine + session factory.

Three objects are exported:

* `engine`        - owns the connection pool. Created once per process.
* `SessionLocal`  - the class that produces sessions. A session is a unit of
                    work: you read objects from it, change them, commit.
* `get_db`        - a FastAPI dependency that hands each request its own
                    session and always closes it afterwards, even on error.

Why a dependency instead of a global session? A session is *not* thread safe.
Giving every request its own session is what keeps concurrent users from
trampling each other's data.
"""

from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from config import settings

# SQLite needs two special arguments; MySQL does not accept them.
engine_kwargs: dict = {"pool_pre_ping": True, "future": True}
if settings.is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs.update(pool_recycle=3600, pool_size=10, max_overflow=20)

engine = create_engine(settings.sqlalchemy_url, echo=False, **engine_kwargs)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: `db: Session = Depends(get_db)`."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> bool:
    """Used by /health. Returns False instead of raising when MySQL is down."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:  # noqa: BLE001 - we only care that it failed
        return False
