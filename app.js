const teams = [
  {
    id: "BRA",
    name: "Brazil",
    gdpPerCapita: 9000,
    population: 214000000,
    footballCulture: 10,
    worldRanking: 1,
  },
  {
    id: "FRA",
    name: "France",
    gdpPerCapita: 42000,
    population: 67000000,
    footballCulture: 9,
    worldRanking: 2,
  },
  {
    id: "ARG",
    name: "Argentina",
    gdpPerCapita: 10000,
    population: 46000000,
    footballCulture: 10,
    worldRanking: 3,
  },
  {
    id: "ENG",
    name: "England",
    gdpPerCapita: 43000,
    population: 56000000,
    footballCulture: 8,
    worldRanking: 4,
  },
  {
    id: "ESP",
    name: "Spain",
    gdpPerCapita: 30000,
    population: 47000000,
    footballCulture: 8,
    worldRanking: 5,
  },
  {
    id: "GER",
    name: "Germany",
    gdpPerCapita: 50000,
    population: 84000000,
    footballCulture: 8,
    worldRanking: 7,
  },
  {
    id: "POR",
    name: "Portugal",
    gdpPerCapita: 24000,
    population: 10200000,
    footballCulture: 7,
    worldRanking: 6,
  },
  {
    id: "USA",
    name: "USA",
    gdpPerCapita: 70000,
    population: 333000000,
    footballCulture: 5,
    worldRanking: 15,
  },
];

const matches = [
  {
    id: "M001",
    teamA: "BRA",
    teamB: "FRA",
    scoreA: 1,
    scoreB: 0,
    status: "finished",
    description: "Quarterfinal clash completed.",
  },
  {
    id: "M002",
    teamA: "ARG",
    teamB: "ENG",
    scoreA: 2,
    scoreB: 2,
    status: "ongoing",
    description: "Group stage match. Drama in the second half.",
  },
  {
    id: "M003",
    teamA: "ESP",
    teamB: "GER",
    scoreA: 0,
    scoreB: 1,
    status: "ongoing",
    description: "Tight game with Germany controlling possession.",
  },
  {
    id: "M004",
    teamA: "POR",
    teamB: "USA",
    scoreA: 1,
    scoreB: 1,
    status: "finished",
    description: "A balanced contest and solid defensive organization.",
  },
];

const LIVE_API_BASE = "https://worldcup26.ir";
const LIVE_API_GAMES_PATH = "/get/games";
const LIVE_API_TEAMS_PATH = "/get/teams";
let externalMatches = [];
let apiTeamCodeByName = {};
let apiTeamNameByCode = {};
let apiTeamCodeById = {};

const weights = {
  gdp: 0.2,
  population: 0.15,
  footballCulture: 0.2,
  ranking: 0.25,
  performance: 0.2,
};

const elements = {
  leaderboard: document.getElementById("leaderboard"),
  matchFeed: document.getElementById("matchFeed"),
  liveMatchCount: document.getElementById("liveMatchCount"),
  liveSourceStatus: document.getElementById("liveSourceStatus"),
  refreshButton: document.getElementById("refreshButton"),
  matchSelect: document.getElementById("matchSelect"),
  scoreA: document.getElementById("scoreA"),
  scoreB: document.getElementById("scoreB"),
  statusSelect: document.getElementById("statusSelect"),
  updateForm: document.getElementById("updateForm"),
};

function getTeamById(id) {
  return teams.find((team) => team.id === id);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function loadLiveTeamMap() {
  apiTeamCodeByName = {};
  apiTeamNameByCode = {};
  apiTeamCodeById = {};

  return fetchJson(`${LIVE_API_BASE}${LIVE_API_TEAMS_PATH}`)
    .then((data) => {
      if (!data || !Array.isArray(data.teams)) return;
      data.teams.forEach((team) => {
        const id = String(team.id || team._id || "").trim();
        const name = String(team.name_en || team.name || "").trim();
        const code = String(team.fifa_code || team.code || team.iso2 || "").trim();

        if (id) {
          apiTeamCodeById[id] = code || name;
        }
        if (name) {
          apiTeamCodeByName[name.toLowerCase()] = code || name;
        }
        if (code) {
          apiTeamNameByCode[code] = name;
        }
      });
    })
    .catch((error) => {
      console.warn("Failed to load live team mapping:", error);
    });
}

function normalizeApiMatch(rawMatch) {
  const homeName = String(rawMatch.home_team_name_en || rawMatch.home_team_name_fa || rawMatch.home_team || "").trim();
  const awayName = String(rawMatch.away_team_name_en || rawMatch.away_team_name_fa || rawMatch.away_team || "").trim();
  const teamA = apiTeamCodeById[rawMatch.home_team_id] || apiTeamCodeByName[homeName.toLowerCase()] || rawMatch.home_team_id || homeName;
  const teamB = apiTeamCodeById[rawMatch.away_team_id] || apiTeamCodeByName[awayName.toLowerCase()] || rawMatch.away_team_id || awayName;
  const rawStatus = String(rawMatch.time_elapsed || rawMatch.finished || rawMatch.status || "").toLowerCase();
  const finishedFlag = String(rawMatch.finished || "").toLowerCase();
  const mappedStatus =
    finishedFlag === "true" || rawStatus.includes("finished") || rawStatus === "ft"
      ? "finished"
      : rawStatus.includes("live") || rawStatus.includes("halftime") || rawStatus.includes("1st") || rawStatus.includes("2nd") || rawStatus.includes("in progress")
      ? "ongoing"
      : "upcoming";

  const descriptionParts = [];
  if (rawMatch.group) descriptionParts.push(`Group ${rawMatch.group}`);
  if (rawMatch.matchday) descriptionParts.push(`Matchday ${rawMatch.matchday}`);

  return {
    id: `API-${rawMatch.id || rawMatch._id}`,
    teamA,
    teamB,
    teamAName: homeName,
    teamBName: awayName,
    scoreA: Number(rawMatch.home_score ?? rawMatch.homeScore ?? rawMatch.home ?? 0),
    scoreB: Number(rawMatch.away_score ?? rawMatch.awayScore ?? rawMatch.away ?? 0),
    status: mappedStatus,
    description: descriptionParts.join(" • ") || rawMatch.type || "FIFA match",
    rawStatus: rawMatch.time_elapsed,
  };
}

function renderLiveSourceStatus(message, isError = false) {
  elements.liveSourceStatus.textContent = message;
  elements.liveSourceStatus.style.color = isError ? "#fb7185" : "var(--muted)";
}

async function loadLiveScoreboard() {
  renderLiveSourceStatus("Refreshing live scoreboard...");
  let apiMatches = [];
  let liveError = null;

  try {
    await loadLiveTeamMap();
    const response = await fetchJson(`${LIVE_API_BASE}${LIVE_API_GAMES_PATH}`);
    const rawGames = response?.games ?? [];
    if (!Array.isArray(rawGames)) {
      throw new Error("Unexpected live API response format");
    }
    apiMatches = rawGames.map(normalizeApiMatch);
  } catch (error) {
    liveError = error;
    console.warn("Live scoreboard fetch failed:", error);
    apiMatches = [];
  }

  externalMatches = apiMatches;

  if (externalMatches.length) {
    const ongoingCount = externalMatches.filter((match) => match.status === "ongoing").length;
    renderLiveSourceStatus(`Live FIFA feed loaded (${externalMatches.length} match${
      externalMatches.length === 1 ? "" : "es"
    }, ${ongoingCount} ongoing)`);
  } else if (liveError) {
    renderLiveSourceStatus("Unable to load live scoreboard; using static data.", true);
  } else {
    renderLiveSourceStatus("No live FIFA matches found; showing simulated data.");
  }

  renderMatches();
  renderLeaderboard();
  populateMatchSelect();
}

function getActiveMatches() {
  return externalMatches.length ? externalMatches : matches;
}

function computeLivePerformance(teamId) {
  const teamMatches = getActiveMatches().filter(
    (match) => match.teamA === teamId || match.teamB === teamId
  );

  const completedMatches = teamMatches.filter((match) => match.status === "finished");
  const liveMatches = teamMatches.filter((match) => match.status === "ongoing");

  let score = 0;
  let weight = 0;

  completedMatches.forEach((match) => {
    const isTeamA = match.teamA === teamId;
    const ownScore = isTeamA ? match.scoreA : match.scoreB;
    const oppScore = isTeamA ? match.scoreB : match.scoreA;
    const opponentId = isTeamA ? match.teamB : match.teamA;
    const opponentTeam = getTeamById(opponentId);
    const opponentRanking = opponentTeam ? opponentTeam.worldRanking : 16;

    if (ownScore > oppScore) score += 1.2 * (16 / opponentRanking);
    else if (ownScore === oppScore) score += 0.75 * (16 / opponentRanking);
    else score += 0.3 * (16 / opponentRanking);

    weight += 1;
  });

  liveMatches.forEach((match) => {
    const isTeamA = match.teamA === teamId;
    const ownScore = isTeamA ? match.scoreA : match.scoreB;
    const oppScore = isTeamA ? match.scoreB : match.scoreA;
    const goalDiff = ownScore - oppScore;
    score += 0.25 + Math.max(goalDiff, -2) * 0.05;
    weight += 0.8;
  });

  if (!weight) return 0.5;
  return Math.min(Math.max(score / weight, 0), 1);
}

function computeTeamScore(team) {
  const gdpScore = Math.log10(team.gdpPerCapita + 1) / 5;
  const populationScore = Math.log10(team.population + 1) / 9;
  const cultureScore = team.footballCulture / 10;
  const rankingScore = 1 / Math.log10(team.worldRanking + 1);
  const performanceScore = computeLivePerformance(team.id);

  const rawScore =
    gdpScore * weights.gdp +
    populationScore * weights.population +
    cultureScore * weights.footballCulture +
    rankingScore * weights.ranking +
    performanceScore * weights.performance;

  return rawScore;
}

function getPredictionData() {
  return teams
    .map((team) => ({
      ...team,
      score: computeTeamScore(team),
      performance: computeLivePerformance(team.id),
    }))
    .sort((a, b) => b.score - a.score)
    .map((team, index, array) => ({
      ...team,
      probability: Math.round((team.score / array[0].score) * 100),
    }));
}

function renderLeaderboard() {
  const prediction = getPredictionData();
  elements.leaderboard.innerHTML = prediction
    .map(
      (team, index) => `
      <div class="team-card">
        <h3>
          <span>${index + 1}. ${team.name}</span>
          <span>${team.probability}%</span>
        </h3>
        <p>World ranking: ${team.worldRanking}</p>
        <p>Football culture: ${team.footballCulture}/10</p>
        <p>Live performance multiplier: ${team.performance.toFixed(2)}</p>
        <div class="progress-bar">
          <span style="width:${team.probability}%;"></span>
        </div>
      </div>
    `
    )
    .join("\n");
}

function renderMatches() {
  const activeMatches = getActiveMatches();
  const ongoingCount = activeMatches.filter((match) => match.status === "ongoing").length;
  elements.liveMatchCount.textContent = `${ongoingCount} ongoing match${ongoingCount === 1 ? "" : "es"}`;

  elements.matchFeed.innerHTML = activeMatches
    .map((match) => {
      const teamA = getTeamById(match.teamA);
      const teamB = getTeamById(match.teamB);
      const teamAName = teamA ? teamA.name : match.teamA;
      const teamBName = teamB ? teamB.name : match.teamB;
      return `
      <div class="match-card">
        <strong>${teamAName} ${match.scoreA} — ${match.scoreB} ${teamBName}</strong>
        <p>${match.description}</p>
        <p>Status: ${match.status}</p>
      </div>
    `;
    })
    .join("\n");
}

function populateMatchSelect() {
  const activeMatches = getActiveMatches();
  elements.matchSelect.innerHTML = activeMatches
    .map((match, index) => {
      const teamA = getTeamById(match.teamA);
      const teamB = getTeamById(match.teamB);
      const teamAName = teamA ? teamA.name : match.teamA;
      const teamBName = teamB ? teamB.name : match.teamB;
      return `<option value="${index}">${teamAName} vs ${teamBName} — ${match.status}</option>`;
    })
    .join("");

  if (activeMatches.length) {
    updateMatchFormFields(0);
  }
}

function updateMatchFormFields(matchIndex) {
  const activeMatches = getActiveMatches();
  const match = activeMatches[matchIndex];
  if (!match) {
    elements.scoreA.value = 0;
    elements.scoreB.value = 0;
    elements.statusSelect.value = "ongoing";
    return;
  }

  elements.scoreA.value = match.scoreA;
  elements.scoreB.value = match.scoreB;
  elements.statusSelect.value = match.status;
}

elements.matchSelect.addEventListener("change", (event) => {
  updateMatchFormFields(Number(event.target.value));
});

elements.updateForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const matchIndex = Number(elements.matchSelect.value);
  const activeMatches = getActiveMatches();
  const match = activeMatches[matchIndex];

  if (!match) return;

  match.scoreA = Number(elements.scoreA.value);
  match.scoreB = Number(elements.scoreB.value);
  match.status = elements.statusSelect.value;

  renderMatches();
  renderLeaderboard();
  populateMatchSelect();
});

elements.refreshButton.addEventListener("click", () => {
  loadLiveScoreboard();
});

function init() {
  renderLeaderboard();
  renderMatches();
  populateMatchSelect();
  loadLiveScoreboard();
}

init();
