"""Pydantic-модели запроса/ответа. Зеркалят типы frontend/src/types/quote.ts."""

from __future__ import annotations

from pydantic import BaseModel, Field


class LineItemInput(BaseModel):
    id: str
    name: str = Field(min_length=1)
    quantity: float = Field(ge=0)
    unit_price: float = Field(ge=0, alias="unitPrice")
    discount_percent: float = Field(default=0, ge=0, le=100, alias="discountPercent")

    model_config = {"populate_by_name": True}


class ClientInfo(BaseModel):
    company_name: str = Field(min_length=1, alias="companyName")
    inn: str | None = None
    contact_person: str = Field(min_length=1, alias="contactPerson")
    phone: str | None = None
    email: str | None = None

    model_config = {"populate_by_name": True}


class QuoteSettings(BaseModel):
    vat_enabled: bool = Field(default=True, alias="vatEnabled")
    vat_rate: float = Field(default=20, ge=0, le=100, alias="vatRate")
    free_delivery_enabled: bool = Field(default=False, alias="freeDeliveryEnabled")
    delivery_cost: float = Field(default=0, ge=0, alias="deliveryCost")

    model_config = {"populate_by_name": True}


class QuoteInput(BaseModel):
    client: ClientInfo
    items: list[LineItemInput] = Field(min_length=1)
    settings: QuoteSettings

    model_config = {"populate_by_name": True}


class LineItemCalculated(BaseModel):
    id: str
    name: str
    quantity: float
    unit_price: float = Field(alias="unitPrice")
    discount_percent: float = Field(alias="discountPercent")
    base_line_total: float = Field(alias="baseLineTotal")
    delivery_surcharge: float = Field(alias="deliverySurcharge")
    final_line_total: float = Field(alias="finalLineTotal")

    model_config = {"populate_by_name": True}


class QuoteCalculationResult(BaseModel):
    items: list[LineItemCalculated]
    subtotal_before_delivery: float = Field(alias="subtotalBeforeDelivery")
    delivery_cost_total: float = Field(alias="deliveryCostTotal")
    delivery_distributed: bool = Field(alias="deliveryDistributed")
    subtotal_after_delivery: float = Field(alias="subtotalAfterDelivery")
    vat_amount: float = Field(alias="vatAmount")
    grand_total: float = Field(alias="grandTotal")

    model_config = {"populate_by_name": True}


class QuoteHistoryItem(BaseModel):
    id: int
    company_name: str = Field(alias="companyName")
    contact_person: str = Field(alias="contactPerson")
    total_amount: float = Field(alias="totalAmount")
    created_at: str = Field(alias="createdAt")

    model_config = {"populate_by_name": True}
