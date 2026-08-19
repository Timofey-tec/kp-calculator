from __future__ import annotations

import io
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote as url_quote

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db import get_db
from app.models_db import Quote
from app.schemas import LineItemCalculated, QuoteCalculationResult, QuoteInput
from app.services.calculations import QuoteCalculation, calculate_quote
from app.services.docx_generator import generate_contract

router = APIRouter(prefix="/api", tags=["quote"])

GENERATED_DIR = Path(__file__).resolve().parent.parent.parent / "generated_contracts"


def _to_result_schema(calc: QuoteCalculation) -> QuoteCalculationResult:
    return QuoteCalculationResult(
        items=[
            LineItemCalculated(
                id=i.id,
                name=i.name,
                quantity=i.quantity,
                unitPrice=i.unit_price,
                discountPercent=i.discount_percent,
                baseLineTotal=i.base_line_total,
                deliverySurcharge=i.delivery_surcharge,
                finalLineTotal=i.final_line_total,
            )
            for i in calc.items
        ],
        subtotalBeforeDelivery=calc.subtotal_before_delivery,
        deliveryCostTotal=calc.delivery_cost_total,
        deliveryDistributed=calc.delivery_distributed,
        subtotalAfterDelivery=calc.subtotal_after_delivery,
        vatAmount=calc.vat_amount,
        grandTotal=calc.grand_total,
    )


@router.post("/calculate", response_model=QuoteCalculationResult, response_model_by_alias=True)
def calculate(quote_input: QuoteInput) -> QuoteCalculationResult:
    calc = calculate_quote(quote_input)
    return _to_result_schema(calc)


@router.post("/contract/generate")
def generate(quote_input: QuoteInput, db: Session = Depends(get_db)) -> StreamingResponse:
    calc = calculate_quote(quote_input)
    contract_number = str(db.query(Quote).count() + 1)

    buffer = generate_contract(
        client=quote_input.client,
        calculation=calc,
        vat_enabled=quote_input.settings.vat_enabled,
        vat_rate=quote_input.settings.vat_rate,
        contract_number=contract_number,
    )

    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    # Имя файла на диске/в БД - ASCII, чтобы не ловить проблемы с
    # заголовками/файловыми системами; человекочитаемое имя с кириллицей
    # отдаём отдельно через Content-Disposition (RFC 5987, filename*).
    stored_filename = f"dogovor_{contract_number}_{timestamp}.docx"
    file_path = GENERATED_DIR / stored_filename

    file_bytes = buffer.getvalue()
    file_path.write_bytes(file_bytes)

    db.add(
        Quote(
            company_name=quote_input.client.company_name,
            contact_person=quote_input.client.contact_person,
            total_amount=calc.grand_total,
            file_path=str(stored_filename),
        )
    )
    db.commit()

    display_name = f"dogovor_{quote_input.client.company_name}_{timestamp}.docx"
    encoded_display_name = url_quote(display_name)

    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{stored_filename}"; '
                f"filename*=UTF-8''{encoded_display_name}"
            )
        },
    )
