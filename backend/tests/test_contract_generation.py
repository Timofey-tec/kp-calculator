import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


SAMPLE_PAYLOAD = {
    "client": {
        "companyName": "ООО Завод Металлоконструкций",
        "inn": "7701234567",
        "contactPerson": "Сидоров Сидор Сидорович",
        "phone": "+7 900 123-45-67",
        "email": "client@example.com",
    },
    "items": [
        {"id": "1", "name": "Металлопрокат листовой", "quantity": 10, "unitPrice": 1500, "discountPercent": 5},
        {"id": "2", "name": "Монтажные работы", "quantity": 1, "unitPrice": 20000, "discountPercent": 0},
    ],
    "settings": {
        "vatEnabled": True,
        "vatRate": 20,
        "freeDeliveryEnabled": True,
        "deliveryCost": 3000,
    },
}


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_calculate_endpoint(client):
    response = client.post("/api/calculate", json=SAMPLE_PAYLOAD)
    assert response.status_code == 200
    data = response.json()
    assert data["deliveryDistributed"] is True
    assert data["deliveryCostTotal"] == 0
    assert data["grandTotal"] == 44700.0


def test_calculate_rejects_empty_items(client):
    payload = {**SAMPLE_PAYLOAD, "items": []}
    response = client.post("/api/calculate", json=payload)
    assert response.status_code == 422


def test_calculate_rejects_negative_quantity(client):
    payload = {
        **SAMPLE_PAYLOAD,
        "items": [{"id": "1", "name": "Товар", "quantity": -1, "unitPrice": 100, "discountPercent": 0}],
    }
    response = client.post("/api/calculate", json=payload)
    assert response.status_code == 422


def test_generate_contract_returns_valid_docx_and_appears_in_history(client):
    response = client.post("/api/contract/generate", json=SAMPLE_PAYLOAD)
    assert response.status_code == 200
    assert response.headers["content-type"] == (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    assert "attachment" in response.headers["content-disposition"]
    # .docx это ZIP-архив, должен начинаться с сигнатуры PK
    assert response.content[:2] == b"PK"

    history_response = client.get("/api/quotes")
    assert history_response.status_code == 200
    history = history_response.json()
    assert len(history) >= 1
    latest = history[0]
    assert latest["companyName"] == "ООО Завод Металлоконструкций"

    download_response = client.get(f"/api/quotes/{latest['id']}/download")
    assert download_response.status_code == 200
    assert download_response.content[:2] == b"PK"


def test_download_missing_quote_returns_404(client):
    response = client.get("/api/quotes/999999/download")
    assert response.status_code == 404
