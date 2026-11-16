"""Conversation tables 8 and 9: chat_sessions and chat_messages."""

from __future__ import annotations

from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base
from models.enums import ChatStatus, Sender
from models.types import enum_column
from models.user import User


class ChatSession(Base):
    """Table 8 - `chat_sessions`: one conversation with the assistant."""

    __tablename__ = "chat_sessions"

    chat_session_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False, index=True)
    session_title: Mapped[str | None] = mapped_column(String(150))
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    ended_at: Mapped[datetime | None] = mapped_column(DateTime)
    status: Mapped[ChatStatus] = mapped_column(enum_column(ChatStatus, "chat_status_enum"), default=ChatStatus.active)

    user: Mapped["User"] = relationship(back_populates="chat_sessions")
    messages: Mapped[list[ChatMessage]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",  # deleting a session deletes its messages
        order_by="ChatMessage.message_id",
    )


class ChatMessage(Base):
    """Table 9 - `chat_messages`: one bubble in a session."""

    __tablename__ = "chat_messages"

    message_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    chat_session_id: Mapped[int] = mapped_column(
        ForeignKey("chat_sessions.chat_session_id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender: Mapped[Sender] = mapped_column(enum_column(Sender, "sender_enum"), nullable=False)
    message_text: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    session: Mapped[ChatSession] = relationship(back_populates="messages")
