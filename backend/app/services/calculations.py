"""Чистая бизнес-логика расчёта КП.

Портирована 1:1 с frontend/src/logic/quoteCalculations.ts — существует
как отдельный модуль без побочных эффектов, чтобы /api/calculate мог
независимо проверить (продублировать) то, что посчитал фронтенд.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.schemas import LineItemInput, QuoteInput


@dataclass
class CalculatedLineItem:
    id: str
    name: str
    quantity: float
    unit_price: float
    discount_percent: float
    base_line_total: float
    delivery_surcharge: float
    final_line_total: float


@dataclass
class QuoteCalculation:
    items: list[CalculatedLineItem]
    subtotal_before_delivery: float
    delivery_cost_total: float
    delivery_distributed: bool
    subtotal_after_delivery: float
    vat_amount: float
    grand_total: float


def calculate_base_line_total(item: LineItemInput) -> float:
    return item.quantity * item.unit_price * (1 - item.discount_percent / 100)


def distribute_delivery(
    items: list[LineItemInput],
    delivery_cost: float,
    free_delivery_enabled: bool,
) -> tuple[list[CalculatedLineItem], bool]:
    base_totals = [calculate_base_line_total(item) for item in items]
    subtotal = sum(base_totals)

    delivery_distributed = free_delivery_enabled and delivery_cost > 0 and subtotal > 0

    calculated: list[CalculatedLineItem] = []
    for item, base_total in zip(items, base_totals):
        if delivery_distributed:
            share = base_total / subtotal
            surcharge = share * delivery_cost
        else:
            surcharge = 0.0
        calculated.append(
            CalculatedLineItem(
                id=item.id,
                name=item.name,
                quantity=item.quantity,
                unit_price=item.unit_price,
                discount_percent=item.discount_percent,
                base_line_total=base_total,
                delivery_surcharge=surcharge,
                final_line_total=base_total + surcharge,
            )
        )
    return calculated, delivery_distributed


def calculate_quote(quote_input: QuoteInput) -> QuoteCalculation:
    settings = quote_input.settings
    items, delivery_distributed = distribute_delivery(
        quote_input.items, settings.delivery_cost, settings.free_delivery_enabled
    )

    subtotal_before_delivery = sum(item.base_line_total for item in items)
    delivery_cost_total = 0.0 if delivery_distributed else settings.delivery_cost
    subtotal_after_delivery = sum(item.final_line_total for item in items) + (
        0.0 if delivery_distributed else delivery_cost_total
    )

    vat_amount = (
        subtotal_after_delivery * settings.vat_rate / 100 if settings.vat_enabled else 0.0
    )
    grand_total = subtotal_after_delivery + vat_amount

    return QuoteCalculation(
        items=items,
        subtotal_before_delivery=subtotal_before_delivery,
        delivery_cost_total=delivery_cost_total,
        delivery_distributed=delivery_distributed,
        subtotal_after_delivery=subtotal_after_delivery,
        vat_amount=vat_amount,
        grand_total=grand_total,
    )
