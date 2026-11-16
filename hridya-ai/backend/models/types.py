"""Shared column helpers for the ORM models."""

from sqlalchemy import Enum as SAEnum


def enum_column(enum_cls, name: str):
    """Store a Python enum as VARCHAR + CHECK.

    ``native_enum=False`` keeps the schema identical on MySQL (where the
    hand-written schema uses ENUM) and on SQLite (used for quick local tests),
    without creating separate named types that MySQL cannot share.
    """
    return SAEnum(
        enum_cls,
        native_enum=False,
        values_callable=lambda enum: [member.value for member in enum],
        name=name,
        validate_strings=True,
    )
