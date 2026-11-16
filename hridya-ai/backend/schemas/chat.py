"""Pydantic schemas for chat sessions and messages."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ChatSessionCreate(BaseModel):
    session_title: str | None = Field(default=None, max_length=150)
    language: str = Field(default="English", max_length=50)


class ChatSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    chat_session_id: int
    session_title: str | None
    status: str
    started_at: datetime | None = None
    ended_at: datetime | None = None
    message_count: int = 0


class ChatMessageCreate(BaseModel):
    message_text: str = Field(min_length=1, max_length=8000)
    language: str = Field(default="English", max_length=50)


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    message_id: int
    chat_session_id: int
    sender: str
    message_text: str
    sent_at: datetime | None = None


class ChatReply(BaseModel):
    chat_session_id: int
    reply: str
    source: str = Field(description="'gemini' when the live API answered, 'fallback' otherwise")
    crisis_detected: bool = False
    user_message: ChatMessageOut
    assistant_message: ChatMessageOut
