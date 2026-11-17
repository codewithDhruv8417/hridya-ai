from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import ChatMessage
from schemas import ChatIn, ChatOut

router = APIRouter(prefix="/chat", tags=["chat"])


# No AI model yet, so replies are based on keywords - good enough for a prototype
def get_reply(text: str, language: str) -> str:
    t = text.lower()

    if "sleep" in t or "neend" in t or "नींद" in t:
        return ("Neend ki kami stress ko aur badha deti hai. 4-7-8 breathing try karein?"
                if language == "en" else "नींद की कमी तनाव बढ़ा देती है। 4-7-8 सांस की तकनीक आजमाएं?")
    if "exam" in t or "pariksha" in t or "परीक्षा" in t or "future" in t:
        return ("Exam pressure normal hai, par akele carry mat karein. Ek chhota screening karein?"
                if language == "en" else "परीक्षा का दबाव सामान्य है, अकेले मत सहें। छोटी स्क्रीनिंग करें?")
    return ("I hear you. Aap chahein to 2-minute screening se apna stress level samajh sakte hain."
            if language == "en" else "मैं समझ रही हूँ। 2 मिनट की स्क्रीनिंग से अपना तनाव स्तर जान सकते हैं।")


# Save the message and send a reply, both messages go into the DB
@router.post("/message", response_model=ChatOut)
def send_message(data: ChatIn, db: Session = Depends(get_db)):
    reply = get_reply(data.text, data.language)

    db.add(ChatMessage(user_id=data.user_id, sender="user", message_text=data.text))
    db.add(ChatMessage(user_id=data.user_id, sender="assistant", message_text=reply))
    db.commit()

    return {"reply": reply}
