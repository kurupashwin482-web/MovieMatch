def test_create_rating(client, auth_headers):
    # Inception TMDB ID: 27205
    response = client.post(
        "/ratings",
        json={"movie_id": 27205, "rating": 5.0},
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["movie_id"] == 27205
    assert data["rating"] == 5.0
    assert data["movie"]["title"] == "Inception"


def test_update_existing_rating(client, auth_headers):
    # First rate 4.0
    client.post(
        "/ratings",
        json={"movie_id": 27205, "rating": 4.0},
        headers=auth_headers
    )
    # Update to 4.5 via POST
    response = client.post(
        "/ratings",
        json={"movie_id": 27205, "rating": 4.5},
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json()["rating"] == 4.5

    # Check total ratings count is 1 (no duplicates)
    summary = client.get("/ratings/me", headers=auth_headers).json()
    assert summary["total_ratings"] == 1
    assert summary["ratings"][0]["rating"] == 4.5


def test_put_rating(client, auth_headers):
    client.post(
        "/ratings",
        json={"movie_id": 27205, "rating": 3.0},
        headers=auth_headers
    )
    response = client.put(
        "/ratings/27205",
        json={"rating": 5.0},
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["rating"] == 5.0


def test_delete_rating(client, auth_headers):
    client.post(
        "/ratings",
        json={"movie_id": 27205, "rating": 4.0},
        headers=auth_headers
    )
    del_resp = client.delete("/ratings/27205", headers=auth_headers)
    assert del_resp.status_code == 204

    # Verify deleted
    summary = client.get("/ratings/me", headers=auth_headers).json()
    assert summary["total_ratings"] == 0


def test_ratings_progress_counter(client, auth_headers):
    # Rate 3 movies
    movie_ids = [27205, 367412, 157336]
    for mid in movie_ids:
        client.post(
            "/ratings",
            json={"movie_id": mid, "rating": 4.5},
            headers=auth_headers
        )

    summary = client.get("/ratings/me", headers=auth_headers).json()
    assert summary["total_ratings"] == 3
    assert summary["required_ratings"] == 5
    assert summary["personalized_unlocked"] is False

    # Rate 2 more movies to reach 5
    more_ids = [77338, 399106]
    for mid in more_ids:
        client.post(
            "/ratings",
            json={"movie_id": mid, "rating": 4.0},
            headers=auth_headers
        )

    summary_unlocked = client.get("/ratings/me", headers=auth_headers).json()
    assert summary_unlocked["total_ratings"] == 5
    assert summary_unlocked["personalized_unlocked"] is True
