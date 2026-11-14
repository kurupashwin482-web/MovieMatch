def test_register_success(client):
    response = client.post(
        "/auth/register",
        json={"username": "alice", "email": "alice@example.com", "password": "password123"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "alice"
    assert data["user"]["email"] == "alice@example.com"
    assert data["user"]["ratings_count"] == 0


def test_register_duplicate_username(client):
    client.post(
        "/auth/register",
        json={"username": "bob", "email": "bob@example.com", "password": "password123"}
    )
    response = client.post(
        "/auth/register",
        json={"username": "bob", "email": "bob2@example.com", "password": "password123"}
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_register_duplicate_email(client):
    client.post(
        "/auth/register",
        json={"username": "user1", "email": "shared@example.com", "password": "password123"}
    )
    response = client.post(
        "/auth/register",
        json={"username": "user2", "email": "shared@example.com", "password": "password123"}
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_login_success_with_username(client):
    client.post(
        "/auth/register",
        json={"username": "charlie", "email": "charlie@example.com", "password": "mypassword123"}
    )
    response = client.post(
        "/auth/login",
        json={"username": "charlie", "password": "mypassword123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "charlie"


def test_login_success_with_email(client):
    client.post(
        "/auth/register",
        json={"username": "david", "email": "david@example.com", "password": "mypassword123"}
    )
    response = client.post(
        "/auth/login",
        json={"username": "david@example.com", "password": "mypassword123"}
    )
    assert response.status_code == 200
    assert response.json()["user"]["username"] == "david"


def test_login_invalid_password(client):
    client.post(
        "/auth/register",
        json={"username": "eve", "email": "eve@example.com", "password": "mypassword123"}
    )
    response = client.post(
        "/auth/login",
        json={"username": "eve", "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_get_me_authenticated(client, auth_headers):
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["username"] == "moviefan"


def test_get_me_unauthorized(client):
    response = client.get("/auth/me")
    assert response.status_code == 401
