from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db import get_db
from app.models_db import Quote
from app.schemas import QuoteHistoryItem

router = APIRouter(prefix="/api/quotes", tags=["history"])

GENERATED_DIR = Path(__file__).resolve().parent.parent.parent / "generated_contracts"


@router.get("", response_model=list[QuoteHistoryItem], response_model_by_alias=True)
def list_quotes(db: Session = Depends(get_db)) -> list[QuoteHistoryItem]:
    quotes = db.query(Quote).order_by(Quote.created_at.desc()).all()
    return [
        QuoteHistoryItem(
            id=q.id,
            companyName=q.company_name,
            contactPerson=q.contact_person,
            totalAmount=q.total_amount,
            createdAt=q.created_at.isoformat(),
        )
        for q in quotes
    ]


@router.get("/{quote_id}/download")
def download_quote(quote_id: int, db: Session = Depends(get_db)) -> FileResponse:
    quote = db.get(Quote, quote_id)
    if quote is None:
        raise HTTPException(status_code=404, detail="КП не найдено")

    file_path = GENERATED_DIR / quote.file_path
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Файл договора не найден на сервере")

    return FileResponse(
        path=file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=quote.file_path,
    )
