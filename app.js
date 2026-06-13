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
let apiTeamMetaByCode = {};

const localTeamMeta = {
  BRA: { name: "Brazil", flag: "https://flagcdn.com/w40/br.png" },
  FRA: { name: "France", flag: "https://flagcdn.com/w40/fr.png" },
  ARG: { name: "Argentina", flag: "https://flagcdn.com/w40/ar.png" },
  ENG: { name: "England", flag: "https://flagcdn.com/w40/gb-eng.png" },
  ESP: { name: "Spain", flag: "https://flagcdn.com/w40/es.png" },
  GER: { name: "Germany", flag: "https://flagcdn.com/w40/de.png" },
  POR: { name: "Portugal", flag: "https://flagcdn.com/w40/pt.png" },
  USA: { name: "USA", flag: "https://flagcdn.com/w40/us.png" },
};

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
  todayFixturesCount: document.getElementById("todayFixturesCount"),
  topGoalTeamList: document.getElementById("topGoalTeamList"),
  matchSelect: document.getElementById("matchSelect"),
  scoreA: document.getElementById("scoreA"),
  scoreB: document.getElementById("scoreB"),
  statusSelect: document.getElementById("statusSelect"),
  updateForm: document.getElementById("updateForm"),
};

function getTeamById(id) {
  return teams.find((team) => team.id === id);
}

function resolveTeamCode(value) {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";

  const upperValue = rawValue.toUpperCase();
  const lowerValue = rawValue.toLowerCase();

  if (localTeamMeta[upperValue]) return upperValue;
  if (apiTeamCodeById[rawValue]) return apiTeamCodeById[rawValue];
  if (apiTeamCodeById[upperValue]) return apiTeamCodeById[upperValue];
  if (apiTeamCodeById[lowerValue]) return apiTeamCodeById[lowerValue];
  if (apiTeamMetaByCode[rawValue]) return apiTeamMetaByCode[rawValue].code || rawValue;
  if (apiTeamMetaByCode[upperValue]) return apiTeamMetaByCode[upperValue].code || upperValue;
  if (apiTeamMetaByCode[lowerValue]) return apiTeamMetaByCode[lowerValue].code || rawValue;
  if (apiTeamCodeByName[lowerValue]) return apiTeamCodeByName[lowerValue];

  const knownLocal = Object.values(localTeamMeta).find((meta) => meta.name.toLowerCase() === lowerValue);
  if (knownLocal) return knownLocal.code;

  return rawValue;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function formatApiDate(rawDate) {
  if (!rawDate) return "";
  const date = parseApiDate(rawDate);
  if (!date) return "Date TBD";
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

function parseApiDate(rawDate) {
  if (!rawDate) return null;
  const normalized = String(rawDate).trim();

  const dmYMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})$/);
  if (dmYMatch) {
    const [, day, month, year, hour, minute] = dmYMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const ymdMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})(?:Z)?$/);
  if (ymdMatch) {
    const [, year, month, day, hour, minute] = ymdMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const looseDate = new Date(normalized.replace(/\s+/g, "T"));
  return Number.isNaN(looseDate.getTime()) ? null : looseDate;
}

function isToday(rawDate) {
  const date = parseApiDate(rawDate);
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function buildMatchSummary(rawMatch, homeName, awayName, scoreA, scoreB, statusLabel) {
  const group = rawMatch.group ? `Group ${rawMatch.group}` : "World Cup fixture";
  if (statusLabel === "Finished") {
    const result = scoreA > scoreB ? `${homeName} edged past ${awayName}` : scoreA < scoreB ? `${awayName} upset ${homeName}` : `${homeName} and ${awayName} played out a draw`;
    return `${result} in ${group}.`;
  }
  if (statusLabel === "Ongoing") {
    return `Live now: ${homeName} vs ${awayName} — follow the action from ${group}.`;
  }
  return `${homeName} and ${awayName} face off in ${group}.`;
}

function countTodayFixtures(matches) {
  return matches.filter((match) => isToday(match.rawDate)).length;
}

function getStatusLabel(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "finished" || normalized === "ft") return "Finished";
  if (normalized === "ongoing" || normalized.includes("live") || normalized.includes("halftime")) return "Ongoing";
  return "Upcoming";
}

function getMatchDateLabel(match) {
  if (match.dateLabel) {
    const label = String(match.dateLabel).trim();
    if (label && !label.toLowerCase().includes("invalid date")) return label;
  }
  if (match.rawDate) {
    const formatted = formatApiDate(match.rawDate);
    if (formatted && !formatted.toLowerCase().includes("invalid date")) return formatted;
  }
  return "Date TBD";
}

function getMatchSummary(match, teamAName, teamBName, statusLabel) {
  if (match.summary) return match.summary;
  if (match.description) return match.description;
  return buildMatchSummary(match, teamAName, teamBName, Number(match.scoreA || 0), Number(match.scoreB || 0), statusLabel);
}

function getTopGoalTeams(matches, limit = 3) {
  const goals = {};
  matches.forEach((match) => {
    const teamA = match.teamA;
    const teamB = match.teamB;
    if (!goals[teamA]) goals[teamA] = 0;
    if (!goals[teamB]) goals[teamB] = 0;
    goals[teamA] += Number(match.scoreA || 0);
    goals[teamB] += Number(match.scoreB || 0);
  });

  const sorted = Object.entries(goals)
    .map(([team, goalsScored]) => ({ team, goals: goalsScored }))
    .sort((a, b) => b.goals - a.goals)
    .slice(0, limit);

  return sorted.map(({ team, goals }) => {
    const teamMeta = getTeamMetaByCode(team);
    return {
      code: team,
      name: teamMeta.name || team,
      flag: teamMeta.flag || "",
      goals,
    };
  });
}

function renderTopGoalTeams(teams) {
  if (!teams.length) {
    return `<p class="stat-value">N/A</p>`;
  }
  return `<div class="top-goal-grid">${teams
    .map(
      (team, index) => `
      <div class="top-goal-item">
        <span class="top-goal-rank">#${index + 1}</span>
        <div class="top-goal-team">
          ${team.flag ? `<img src="${team.flag}" alt="${team.name} flag" loading="lazy" />` : ""}
          <span>${team.name}</span>
        </div>
        <span class="top-goal-score">${team.goals} goals</span>
      </div>
    `
    )
    .join("")}</div>`;
}

function updateHeroStats(matches) {
  const topGoals = getTopGoalTeams(matches);
  elements.todayFixturesCount.textContent = `${countTodayFixtures(matches)} today`;
  elements.topGoalTeamList.innerHTML = renderTopGoalTeams(topGoals);
  return topGoals[0]?.code || null;
}

function getTeamMetaByCode(code) {
  const normalized = String(code || "").trim();
  if (!normalized) {
    return { code: "", name: "Unknown", iso2: "", flag: "" };
  }

  const exact = apiTeamMetaByCode[normalized] || apiTeamMetaByCode[normalized.toLowerCase()] || apiTeamMetaByCode[normalized.toUpperCase()];
  if (exact) return exact;

  const upper = normalized.toUpperCase();
  if (localTeamMeta[upper]) return localTeamMeta[upper];

  const knownLocal = Object.values(localTeamMeta).find((meta) => meta.name.toLowerCase() === normalized.toLowerCase());
  if (knownLocal) return knownLocal;

  const knownApi = Object.values(apiTeamMetaByCode).find((meta) => meta.name && meta.name.toLowerCase() === normalized.toLowerCase());
  if (knownApi) return knownApi;

  return { code: normalized, name: normalized, iso2: "", flag: "" };
}

function loadLiveTeamMap() {
  apiTeamCodeByName = {};
  apiTeamNameByCode = {};
  apiTeamCodeById = {};
  apiTeamMetaByCode = {};

  return fetchJson(`${LIVE_API_BASE}${LIVE_API_TEAMS_PATH}`)
    .then((data) => {
      if (!data || !Array.isArray(data.teams)) return;
      data.teams.forEach((team) => {
        const id = String(team.id || team._id || "").trim();
        const name = String(team.name_en || team.name || "").trim();
        const code = String(team.fifa_code || team.code || team.iso2 || "").trim();
        const iso2 = String(team.iso2 || "").trim();
        const flag = String(team.flag || "").trim() || (iso2 ? `https://flagcdn.com/w40/${iso2.toLowerCase()}.png` : "");
        const meta = { id, name, code: code || name, iso2, flag };

              if (id) {
          apiTeamCodeById[id] = code || name;
          apiTeamMetaByCode[id] = meta;
          apiTeamMetaByCode[id.toString().toLowerCase()] = meta;
          apiTeamMetaByCode[id.toString().toUpperCase()] = meta;
        }
        if (name) {
          apiTeamCodeByName[name.toLowerCase()] = code || name;
          apiTeamMetaByCode[name.toLowerCase()] = meta;
          apiTeamMetaByCode[name] = meta;
          apiTeamMetaByCode[name.toUpperCase()] = meta;
        }
        if (code) {
          apiTeamNameByCode[code] = name;
          apiTeamMetaByCode[code] = meta;
          apiTeamMetaByCode[code.toLowerCase()] = meta;
          apiTeamMetaByCode[code.toUpperCase()] = meta;
        }
        if (name && !apiTeamMetaByCode[name]) {
          apiTeamMetaByCode[name] = meta;
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
  const numericElapsed = /^\d{1,3}(?:\+\d{1,3})?$/.test(rawStatus);
  const mappedStatus =
    finishedFlag === "true" || rawStatus.includes("finished") || rawStatus === "ft"
      ? "finished"
      : numericElapsed || rawStatus.includes("live") || rawStatus.includes("halftime") || rawStatus.includes("1st") || rawStatus.includes("2nd") || rawStatus.includes("in progress")
      ? "ongoing"
      : "upcoming";

  const descriptionParts = [];
  if (rawMatch.group) descriptionParts.push(`Group ${rawMatch.group}`);
  if (rawMatch.matchday) descriptionParts.push(`Matchday ${rawMatch.matchday}`);

  const rawDate = rawMatch.local_date || rawMatch.date || rawMatch.localDate || rawMatch.utc_date || rawMatch.utcDate;
  return {
    id: `API-${rawMatch.id || rawMatch._id}`,
    teamA: resolveTeamCode(teamA),
    teamB: resolveTeamCode(teamB),
    teamAName: homeName,
    teamBName: awayName,
    scoreA: Number(rawMatch.home_score ?? rawMatch.homeScore ?? rawMatch.home ?? 0),
    scoreB: Number(rawMatch.away_score ?? rawMatch.awayScore ?? rawMatch.away ?? 0),
    status: mappedStatus,
    statusLabel: mappedStatus === "finished" ? "Finished" : mappedStatus === "ongoing" ? "Ongoing" : "Upcoming",
    description: descriptionParts.join(" • ") || rawMatch.type || "FIFA match",
    summary: buildMatchSummary(rawMatch, homeName, awayName, Number(rawMatch.home_score ?? rawMatch.homeScore ?? rawMatch.home ?? 0), Number(rawMatch.away_score ?? rawMatch.awayScore ?? rawMatch.away ?? 0), mappedStatus === "finished" ? "Finished" : mappedStatus === "ongoing" ? "Ongoing" : "Upcoming"),
    dateLabel: formatApiDate(rawDate),
    rawDate,
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
  const topGoalTeamCode = getTopGoalTeams(getActiveMatches())[0]?.code;
  elements.leaderboard.innerHTML = prediction
    .map((team, index) => {
      const teamMeta = getTeamMetaByCode(team.id);
      const isTopScorer = topGoalTeamCode && team.id === topGoalTeamCode;
      return `
      <div class="team-card ${isTopScorer ? "top-scorer-card" : ""}">
        <div class="team-card-header">
          <div class="leaderboard-team">
            ${teamMeta.flag ? `<img src="${teamMeta.flag}" alt="${team.name} flag" loading="lazy" />` : ""}
            <span>${index + 1}. ${team.name}</span>
          </div>
          <div class="leaderboard-pill-group">
            ${isTopScorer ? `<span class="top-scorer-badge">Top scorer</span>` : ""}
            <span class="probability-pill">${team.probability}%</span>
          </div>
        </div>
        <p>World ranking: ${team.worldRanking}</p>
        <p>Football culture: ${team.footballCulture}/10</p>
        <p>Live performance multiplier: ${team.performance.toFixed(2)}</p>
        <div class="progress-bar">
          <span style="width:${team.probability}%;"></span>
        </div>
      </div>
    `;
    })
    .join("\n");
}

function renderMatchCard(match) {
  const teamA = getTeamById(match.teamA);
  const teamB = getTeamById(match.teamB);
  const teamAName = teamA ? teamA.name : match.teamAName || match.teamA;
  const teamBName = teamB ? teamB.name : match.teamBName || match.teamB;
  const teamAMeta = getTeamMetaByCode(match.teamA);
  const teamBMeta = getTeamMetaByCode(match.teamB);
  const statusLabel = match.statusLabel || getStatusLabel(match.status);
  const statusClass = statusLabel === "Ongoing" ? "status-ongoing" : statusLabel === "Finished" ? "status-finished" : "status-upcoming";
  const dateLabel = getMatchDateLabel(match);
  const summary = getMatchSummary(match, teamAName, teamBName, statusLabel);

  return `
    <div class="match-card">
      <div class="match-header">
        <div class="match-teams">
          <div class="team-pill">
            ${teamAMeta.flag ? `<img src="${teamAMeta.flag}" alt="${teamAName} flag" loading="lazy" />` : ""}
            <span>${teamAName}</span>
          </div>
          <div class="match-score">${match.scoreA ?? 0} — ${match.scoreB ?? 0}</div>
          <div class="team-pill">
            ${teamBMeta.flag ? `<img src="${teamBMeta.flag}" alt="${teamBName} flag" loading="lazy" />` : ""}
            <span>${teamBName}</span>
          </div>
        </div>
        <span class="status-badge ${statusClass}">${statusLabel}</span>
      </div>
      <p class="match-meta">${dateLabel} · ${statusLabel}</p>
      <p class="match-summary">${summary}</p>
    </div>
  `;
}

function renderMatchGroup(title, matches, emptyText, id, collapsed = false) {
  return `
    <div class="match-group${collapsed ? " collapsed" : ""}" data-group="${id}">
      <div class="match-group-header">
        <div>
          <h3>${title}</h3>
          <span>${matches.length} ${matches.length === 1 ? "match" : "matches"}</span>
        </div>
        <button type="button" class="group-toggle" data-group="${id}">${collapsed ? "Expand" : "Collapse"}</button>
      </div>
      <div class="match-group-list">
        ${matches.length ? matches.map(renderMatchCard).join("\n") : `<p class="empty-group">${emptyText}</p>`}
      </div>
    </div>
  `;
}

function attachGroupToggles() {
  document.querySelectorAll(".group-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const groupId = button.getAttribute("data-group");
      const group = document.querySelector(`.match-group[data-group="${groupId}"]`);
      if (!group) return;
      const collapsed = group.classList.toggle("collapsed");
      button.textContent = collapsed ? "Expand" : "Collapse";
    });
  });
}

function renderMatches() {
  const activeMatches = getActiveMatches();
  const ongoingCount = activeMatches.filter((match) => match.status === "ongoing").length;
  elements.liveMatchCount.textContent = `${ongoingCount} ongoing match${ongoingCount === 1 ? "" : "es"}`;
  updateHeroStats(activeMatches);

  const liveMatches = activeMatches.filter((match) => match.status === "ongoing");
  const todayMatches = activeMatches.filter((match) => match.status === "upcoming" && isToday(match.rawDate));
  const upcomingMatches = activeMatches.filter((match) => match.status === "upcoming" && !isToday(match.rawDate));
  const recentMatches = activeMatches.filter((match) => match.status === "finished");

  elements.matchFeed.innerHTML = [
    renderMatchGroup("Live matches", liveMatches, "No live matches right now.", "live"),
    renderMatchGroup("Today’s fixtures", todayMatches, "No fixtures scheduled for today.", "today"),
    renderMatchGroup("Upcoming fixtures", upcomingMatches, "No more upcoming games.", "upcoming", true),
    renderMatchGroup("Recent results", recentMatches, "No completed matches yet.", "recent"),
  ].join("\n");

  attachGroupToggles();
}

function populateMatchSelect() {
  const activeMatches = getActiveMatches();
  elements.matchSelect.innerHTML = activeMatches
    .map((match, index) => {
      const teamA = getTeamById(match.teamA);
      const teamB = getTeamById(match.teamB);
      const teamAName = teamA ? teamA.name : match.teamAName || match.teamA;
      const teamBName = teamB ? teamB.name : match.teamBName || match.teamB;
      return `<option value="${index}">${teamAName} vs ${teamBName} — ${getMatchDateLabel(match)}</option>`;
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
