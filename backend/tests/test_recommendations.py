def test_popularity_recommendations(client, auth_headers):
    # Rate Inception (27205)
    client.post(
        "/ratings",
        json={"movie_id": 27205, "rating": 5.0},
        headers=auth_headers
    )

    response = client.get("/recommendations/popularity", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm"] == "popularity"
    assert len(data["movies"]) == 10

    # Inception must be EXCLUDED because it was rated
    movie_ids = [m["tmdbId"] for m in data["movies"]]
    assert 27205 not in movie_ids
    # Next highest should be Planet Earth II or Whiplash
    titles = [m["title"] for m in data["movies"]]
    assert any("Planet Earth" in t or "Whiplash" in t for t in titles)


def test_tfidf_requires_minimum_five_ratings(client, auth_headers):
    # Only rate 2 movies
    client.post("/ratings", json={"movie_id": 27205, "rating": 4.5}, headers=auth_headers)
    client.post("/ratings", json={"movie_id": 367412, "rating": 4.0}, headers=auth_headers)

    response = client.get("/recommendations/tfidf", headers=auth_headers)
    assert response.status_code == 400
    assert "At least 5 movie ratings are required" in response.json()["detail"]


def test_genre_requires_minimum_five_ratings(client, auth_headers):
    # Only rate 2 movies
    client.post("/ratings", json={"movie_id": 27205, "rating": 4.5}, headers=auth_headers)
    client.post("/ratings", json={"movie_id": 367412, "rating": 4.0}, headers=auth_headers)

    response = client.get("/recommendations/genre", headers=auth_headers)
    assert response.status_code == 400
    assert "At least 5 movie ratings are required" in response.json()["detail"]


def test_tfidf_personalized_recommendations_matches_notebook(client, auth_headers):
    # Use exact sample ratings from Notebook 03:
    # 98344: 5.0, 351863: 4.5, 73941: 3.0, 257109: 1.5, 315669: 2.0
    sample_ratings = {
        98344: 5.0,
        351863: 4.5,
        73941: 3.0,
        257109: 1.5,
        315669: 2.0
    }
    for mid, score in sample_ratings.items():
        resp = client.post("/ratings", json={"movie_id": mid, "rating": score}, headers=auth_headers)
        assert resp.status_code == 201

    response = client.get("/recommendations/tfidf", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm"] == "tfidf"
    assert data["personalized_unlocked"] is True
    assert len(data["movies"]) == 10

    # Exclude rated movies
    rec_ids = [m["tmdbId"] for m in data["movies"]]
    for mid in sample_ratings:
        assert mid not in rec_ids

    # Top recommendation in notebook was "Prologue"
    top_movie = data["movies"][0]
    assert top_movie["title"] == "Prologue"
    assert top_movie["score"] > 0.14

    # Second recommendation in notebook was "Alien vs. Ninja"
    second_movie = data["movies"][1]
    assert second_movie["title"] == "Alien vs. Ninja"


def test_genre_personalized_recommendations(client, auth_headers):
    # Rate 5 movies
    sample_ratings = {
        98344: 5.0,
        351863: 4.5,
        73941: 3.0,
        257109: 1.5,
        315669: 2.0
    }
    for mid, score in sample_ratings.items():
        client.post("/ratings", json={"movie_id": mid, "rating": score}, headers=auth_headers)

    response = client.get("/recommendations/genre", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm"] == "genre"
    assert data["personalized_unlocked"] is True
    assert len(data["movies"]) == 10

    # Exclude rated movies
    rec_ids = [m["tmdbId"] for m in data["movies"]]
    for mid in sample_ratings:
        assert mid not in rec_ids

    # Check score properties
    for m in data["movies"]:
        assert m["score"] is not None
        assert 0.0 <= m["score"] <= 1.0
