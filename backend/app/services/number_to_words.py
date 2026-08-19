"""Перевод суммы в рублях в текстовое представление ("Триста рублей 00 копеек")."""

from __future__ import annotations

from num2words import num2words


def _pluralize_ru(n: int, forms: tuple[str, str, str]) -> str:
    n_abs = abs(n) % 100
    if 11 <= n_abs <= 19:
        return forms[2]
    last_digit = n_abs % 10
    if last_digit == 1:
        return forms[0]
    if 2 <= last_digit <= 4:
        return forms[1]
    return forms[2]


RUBLE_FORMS = ("рубль", "рубля", "рублей")
KOPECK_FORMS = ("копейка", "копейки", "копеек")


def amount_to_words_ru(amount: float) -> str:
    rubles = int(amount)
    kopecks = round((amount - rubles) * 100)
    if kopecks >= 100:
        rubles += 1
        kopecks -= 100

    rubles_words = num2words(rubles, lang="ru").capitalize()
    ruble_word = _pluralize_ru(rubles, RUBLE_FORMS)
    kopeck_word = _pluralize_ru(kopecks, KOPECK_FORMS)

    return f"{rubles_words} {ruble_word} {kopecks:02d} {kopeck_word}"
