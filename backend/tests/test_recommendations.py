def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["models"]["catalogue"] is True
    assert data["models"]["popularity"] is True
    assert data["models"]["tfidf"] is True
    assert data["models"]["genre"] is True


def test_popularity_recommendations_get(client):
    response = client.get("/recommendations/popularity?k=10")
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm"] == "popularity"
    assert len(data["movies"]) == 10
    # Inception should be top rank when unrated
    assert data["movies"][0]["tmdbId"] == 27205


def test_popularity_recommendations_post_excludes_rated(client):
    # Exclude Inception (27205)
    response = client.post(
        "/recommendations/popularity",
        json={"rated_movie_ids": [27205], "k": 10}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["movies"]) == 10
    movie_ids = [m["tmdbId"] for m in data["movies"]]
    assert 27205 not in movie_ids
    # Next should be Planet Earth II or Whiplash
    titles = [m["title"] for m in data["movies"]]
    assert any("Planet Earth" in t or "Whiplash" in t for t in titles)


def test_tfidf_requires_minimum_five_ratings(client):
    # Send only 2 ratings
    response = client.post(
        "/recommendations/tfidf",
        json={"ratings": {"27205": 5.0, "367412": 4.5}, "k": 10}
    )
    assert response.status_code == 400
    assert "At least 5 movie ratings are required" in response.json()["detail"]


def test_genre_requires_minimum_five_ratings(client):
    # Send only 2 ratings
    response = client.post(
        "/recommendations/genre",
        json={"ratings": {"27205": 5.0, "367412": 4.5}, "k": 10}
    )
    assert response.status_code == 400
    assert "At least 5 movie ratings are required" in response.json()["detail"]


def test_tfidf_personalized_recommendations_matches_notebook(client):
    # Sample ratings from Notebook 03:
    # 98344: 5.0, 351863: 4.5, 73941: 3.0, 257109: 1.5, 315669: 2.0
    payload = {
        "ratings": {
            98344: 5.0,
            351863: 4.5,
            73941: 3.0,
            257109: 1.5,
            315669: 2.0
        },
        "k": 10
    }
    response = client.post("/recommendations/tfidf", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm"] == "tfidf"
    assert data["ratings_count"] == 5
    assert data["personalized_unlocked"] is True
    assert len(data["movies"]) == 10

    # Exclude rated movies
    rec_ids = [m["tmdbId"] for m in data["movies"]]
    for mid in payload["ratings"]:
        assert mid not in rec_ids

    # Top recommendation in notebook was "Prologue"
    top_movie = data["movies"][0]
    assert top_movie["title"] == "Prologue"
    assert top_movie["score"] > 0.14

    # Second recommendation in notebook was "Alien vs. Ninja"
    second_movie = data["movies"][1]
    assert second_movie["title"] == "Alien vs. Ninja"


def test_tfidf_with_list_input_format(client):
    payload = {
        "ratings": [
            {"movie_id": 98344, "rating": 5.0},
            {"movie_id": 351863, "rating": 4.5},
            {"movie_id": 73941, "rating": 3.0},
            {"movie_id": 257109, "rating": 1.5},
            {"movie_id": 315669, "rating": 2.0}
        ],
        "k": 5
    }
    response = client.post("/recommendations/tfidf", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["movies"]) == 5
    assert data["movies"][0]["title"] == "Prologue"


def test_genre_personalized_recommendations(client):
    payload = {
        "ratings": {
            98344: 5.0,
            351863: 4.5,
            73941: 3.0,
            257109: 1.5,
            315669: 2.0
        },
        "k": 10
    }
    response = client.post("/recommendations/genre", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm"] == "genre"
    assert data["ratings_count"] == 5
    assert data["personalized_unlocked"] is True
    assert len(data["movies"]) == 10

    # Exclude rated movies
    rec_ids = [m["tmdbId"] for m in data["movies"]]
    for mid in payload["ratings"]:
        assert mid not in rec_ids

    for m in data["movies"]:
        assert m["score"] is not None
        assert 0.0 <= m["score"] <= 1.0


def test_different_ratings_produce_different_recommendations(client):
    # Action/Sci-Fi profile
    action_ratings = {
        27205: 5.0,   # Inception
        157336: 5.0,  # Interstellar
        123025: 5.0,  # Batman
        244786: 5.0,  # Whiplash
        76203: 4.5    # 12 Years a Slave
    }
    # Animation/Comedy profile
    comedy_ratings = {
        399106: 5.0,  # Piper
        140420: 5.0,  # Paperman
        77338: 5.0,   # The Intouchables
        409696: 4.5,  # Over the Garden Wall
        315669: 4.0   # Comedy
    }

    resp1 = client.post("/recommendations/genre", json={"ratings": action_ratings, "k": 10})
    resp2 = client.post("/recommendations/genre", json={"ratings": comedy_ratings, "k": 10})

    recs1 = [m["title"] for m in resp1.json()["movies"]]
    recs2 = [m["title"] for m in resp2.json()["movies"]]

    # They should produce distinct recommendation lists
    assert recs1 != recs2
