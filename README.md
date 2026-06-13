# World Cup Fever

A portfolio-ready static app that predicts the most likely World Cup winner using Klement’s model. The model combines GDP per capita, population, football culture, world ranking, and live match performance.

## What this app does

- Ranks teams by a weighted prediction score
- Tracks ongoing match results and recalculates odds instantly
- Displays a live match feed and a visual probability leaderboard
- Includes a simple update form to simulate score changes

## How the model works

Klement’s model in this version uses:

- GDP per capita: proxy for infrastructure and investment
- Population size: proxy for player depth and talent base
- Football culture: how entrenched football is in society
- World ranking: current competitive status
- Performance from recent and ongoing matches

## Getting started

1. Open `index.html` in a browser.
2. Use the **Update a match** form to simulate live performance updates.
3. The leaderboard recalculates automatically.

## Deploy live on GitHub Pages

1. Create a new GitHub repository named `world-cup-fever`.
2. Push this folder to the repository.
3. On GitHub, enable Pages from the repository settings and use the `main` branch.
4. Share the link as a portfolio project.

## Live FIFA 2026 integration

This version fetches live match data from `https://worldcupjson.net` and updates the app in real time when matches are available.

- Uses `/matches/current` and `/matches/today` to display live FIFA 2026 scoreboard data
- Refresh the feed with the **Refresh now** button
- Falls back to built-in simulated score data when no live match feed is available

## Future improvements

- Add a backend for real match APIs and live score ingestion
- Support all teams and tournament brackets
- Add user comments, filtering, and historical data views
- Convert the model to a server-side formula with match weighting
