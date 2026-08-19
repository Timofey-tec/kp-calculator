import pytest

from app.schemas import ClientInfo, LineItemInput, QuoteInput, QuoteSettings
from app.services.calculations import calculate_quote
from app.services.number_to_words import amount_to_words_ru


def make_item(id_, name, quantity, unit_price, discount_percent=0):
    return LineItemInput(
        id=id_,
        name=name,
        quantity=quantity,
        unit_price=unit_price,
        discount_percent=discount_percent,
    )


DEFAULT_CLIENT = ClientInfo(
    company_name="ООО Тест", contact_person="Иванов Иван", inn=None, phone=None, email=None
)


def test_basic_totals_no_discount_no_vat_no_delivery():
    quote = QuoteInput(
        client=DEFAULT_CLIENT,
        items=[make_item("1", "Товар", 2, 100)],
        settings=QuoteSettings(vat_enabled=False, vat_rate=20, free_delivery_enabled=False, delivery_cost=0),
    )
    result = calculate_quote(quote)
    assert result.items[0].base_line_total == 200
    assert result.subtotal_after_delivery == 200
    assert result.vat_amount == 0
    assert result.grand_total == 200


def test_discount_applied_per_line():
    quote = QuoteInput(
        client=DEFAULT_CLIENT,
        items=[make_item("1", "Товар", 10, 100, discount_percent=10)],
        settings=QuoteSettings(vat_enabled=False, vat_rate=20, free_delivery_enabled=False, delivery_cost=0),
    )
    result = calculate_quote(quote)
    assert result.items[0].base_line_total == pytest.approx(900)


def test_vat_applied_to_subtotal_after_delivery():
    quote = QuoteInput(
        client=DEFAULT_CLIENT,
        items=[make_item("1", "Товар", 1, 1000)],
        settings=QuoteSettings(vat_enabled=True, vat_rate=20, free_delivery_enabled=False, delivery_cost=0),
    )
    result = calculate_quote(quote)
    assert result.vat_amount == pytest.approx(200)
    assert result.grand_total == pytest.approx(1200)


def test_delivery_not_free_shown_as_separate_amount():
    quote = QuoteInput(
        client=DEFAULT_CLIENT,
        items=[make_item("1", "Товар", 1, 1000)],
        settings=QuoteSettings(vat_enabled=False, vat_rate=20, free_delivery_enabled=False, delivery_cost=300),
    )
    result = calculate_quote(quote)
    assert result.delivery_distributed is False
    assert result.delivery_cost_total == 300
    assert result.items[0].final_line_total == pytest.approx(1000)
    assert result.subtotal_after_delivery == pytest.approx(1300)


def test_free_delivery_distributed_proportionally():
    quote = QuoteInput(
        client=DEFAULT_CLIENT,
        items=[
            make_item("1", "Товар A", 1, 1000),  # доля 1000/4000 = 25%
            make_item("2", "Товар B", 1, 3000),  # доля 75%
        ],
        settings=QuoteSettings(vat_enabled=False, vat_rate=20, free_delivery_enabled=True, delivery_cost=400),
    )
    result = calculate_quote(quote)
    assert result.delivery_distributed is True
    assert result.delivery_cost_total == 0
    assert result.items[0].delivery_surcharge == pytest.approx(100)  # 25% от 400
    assert result.items[1].delivery_surcharge == pytest.approx(300)  # 75% от 400
    assert result.items[0].final_line_total == pytest.approx(1100)
    assert result.items[1].final_line_total == pytest.approx(3300)
    # Итог не показывает доставку отдельной строкой, но она включена в сумму позиций
    assert result.subtotal_after_delivery == pytest.approx(4400)


def test_free_delivery_with_zero_subtotal_not_distributed():
    quote = QuoteInput(
        client=DEFAULT_CLIENT,
        items=[make_item("1", "Товар", 0, 0)],
        settings=QuoteSettings(vat_enabled=False, vat_rate=20, free_delivery_enabled=True, delivery_cost=500),
    )
    result = calculate_quote(quote)
    # Нечего распределять пропорционально - доставка остаётся отдельной суммой
    assert result.delivery_distributed is False
    assert result.delivery_cost_total == 500


def test_amount_to_words_basic():
    assert amount_to_words_ru(1234.5) == "Одна тысяча двести тридцать четыре рубля 50 копеек"


def test_amount_to_words_single_ruble_and_kopeck():
    assert amount_to_words_ru(1.01) == "Один рубль 01 копейка"


def test_amount_to_words_rounds_up_kopecks():
    # 100 копеек округления -> переносим в рубли
    assert amount_to_words_ru(9.999).startswith("Десять рублей")
