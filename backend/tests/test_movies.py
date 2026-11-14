def test_get_genres(client):
    response = client.get("/movies/genres")
    assert response.status_code == 200
    genres = response.json()
    assert isinstance(genres, list)
    assert len(genres) == 20
    assert "Action" in genres
    assert "Drama" in genres


def test_search_movies_query(client):
    response = client.get("/movies/search?query=inception")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    titles = [m["title"].lower() for m in data["movies"]]
    assert any("inception" in t for t in titles)


def test_search_movies_genre(client):
    response = client.get("/movies/search?genre=Animation&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data["movies"]) <= 5
    for movie in data["movies"]:
        assert "Animation" in movie["genres"]


def test_get_movie_by_id_success(client):
    # Inception TMDB ID: 27205
    response = client.get("/movies/27205")
    assert response.status_code == 200
    movie = response.json()
    assert movie["tmdbId"] == 27205
    assert "Inception" in movie["title"]
    assert movie["release_year"] == 2010


def test_get_movie_by_id_not_found(client):
    response = client.get("/movies/999999999")
    assert response.status_code == 404
