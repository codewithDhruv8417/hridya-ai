"""AI chat: sessions, history and Gemini-backed replies.

Ownership is checked on every route: a session id guessed by another user must
never return someone else's conversation.
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from models.chat import ChatMessage, ChatSession
from models.enums import ChatStatus, Sender
from schemas.chat import (
    ChatMessageCreate,
    ChatMessageOut,
    ChatReply,
    ChatSessionCreate,
    ChatSessionOut,
)
from services.deps import CurrentUser, DbSession
from services.gemini import generate_reply

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["AI Chat"])


def _own_session(db: DbSession, session_id: int, user_id: int) -> ChatSession:
    session = db.get(ChatSession, session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
    if session.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This chat belongs to another user")
    return session


def _to_session_out(session: ChatSession, message_count: int = 0) -> ChatSessionOut:
    return ChatSessionOut(
        chat_session_id=session.chat_session_id,
        session_title=session.session_title,
        status=session.status.value if hasattr(session.status, "value") else str(session.status),
        started_at=session.started_at,
        ended_at=session.ended_at,
        message_count=message_count,
    )


@router.post("/sessions", response_model=ChatSessionOut, status_code=status.HTTP_201_CREATED)
def create_session(payload: ChatSessionCreate, db: DbSession, user: CurrentUser) -> ChatSessionOut:
    session = ChatSession(
        user_id=user.user_id,
        session_title=payload.session_title or f"{payload.language} wellness check-in",
        status=ChatStatus.active,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return _to_session_out(session)


@router.get("/sessions", response_model=list[ChatSessionOut])
def list_sessions(db: DbSession, user: CurrentUser) -> list[ChatSessionOut]:
    sessions = db.scalars(
        select(ChatSession)
        .where(ChatSession.user_id == user.user_id)
        .options(selectinload(ChatSession.messages))
        .order_by(ChatSession.chat_session_id.desc())
    ).all()
    return [_to_session_out(session, len(session.messages)) for session in sessions]


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageOut])
def get_messages(session_id: int, db: DbSession, user: CurrentUser) -> list[ChatMessage]:
    _own_session(db, session_id, user.user_id)
    return list(
        db.scalars(
            select(ChatMessage)
            .where(ChatMessage.chat_session_id == session_id)
            .order_by(ChatMessage.message_id)
        ).all()
    )


@router.post("/sessions/{session_id}/messages", response_model=ChatReply)
async def send_message(
    session_id: int, payload: ChatMessageCreate, db: DbSession, user: CurrentUser
) -> ChatReply:
    session = _own_session(db, session_id, user.user_id)
    if session.status == ChatStatus.closed:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This chat session is closed")

    history = [
        {"sender": message.sender.value, "message_text": message.message_text}
        for message in db.scalars(
            select(ChatMessage)
            .where(ChatMessage.chat_session_id == session_id)
            .order_by(ChatMessage.message_id.desc())
            .limit(10)
        ).all()
    ][::-1]  # oldest first, because the model expects chronological turns

    reply_text, source, crisis = await generate_reply(payload.message_text, history, payload.language)

    user_message = ChatMessage(
        chat_session_id=session_id, sender=Sender.user, message_text=payload.message_text
    )
    db.add(user_message)
    db.flush()

    assistant_message = ChatMessage(
        chat_session_id=session_id, sender=Sender.assistant, message_text=reply_text
    )
    db.add(assistant_message)

    # First user message becomes the session title, which makes the history list readable.
    if not session.session_title:
        session.session_title = payload.message_text[:140]

    db.commit()
    db.refresh(user_message)
    db.refresh(assistant_message)

    return ChatReply(
        chat_session_id=session_id,
        reply=reply_text,
        source=source,
        crisis_detected=crisis,
        user_message=ChatMessageOut.model_validate(user_message),
        assistant_message=ChatMessageOut.model_validate(assistant_message),
    )


@router.post("/sessions/{session_id}/close", response_model=ChatSessionOut)
def close_session(session_id: int, db: DbSession, user: CurrentUser) -> ChatSessionOut:
    session = _own_session(db, session_id, user.user_id)
    session.status = ChatStatus.closed
    session.ended_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(session)

    count = db.scalar(
        select(func.count(ChatMessage.message_id)).where(ChatMessage.chat_session_id == session_id)
    )
    return _to_session_out(session, count or 0)
