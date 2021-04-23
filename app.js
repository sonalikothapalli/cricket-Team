const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());

db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT *
    FROM player_details;
    `;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT *
    FROM player_details
    WHERE 
    player_id = ${playerId};
    `;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE player_details
    SET 
       player_name = '${playerName}'
    WHERE 
      player_id = ${playerId};
    `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT *
    FROM match_details
    WHERE 
    match_id = ${matchId};
    `;
  const match = await db.get(getMatchQuery);
  response.send(convertMatchDbObjectToResponseObject(match));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchesQuery = `
    SELECT match_details.match_id,match_details.match,match_details.year
    FROM match_details NATURAL JOIN player_match_score
    WHERE 
    player_id = ${playerId};
    `;
  const matchesArray = await db.all(playerMatchesQuery);
  response.send(
    matchesArray.map((eachMatch) =>
      convertMatchDbObjectToResponseObject(eachMatch)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playersOfSpecificMatchQuery = `
    SELECT player_details.player_id,player_details.player_name
    FROM player_details NATURAL JOIN player_match_score
    WHERE 
    match_id = ${matchId};
    `;
  const playersList = await db.all(playersOfSpecificMatchQuery);
  response.send(
    playersList.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersScoresQuery = `
    SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes
    FROM player_details NATURAL JOIN player_match_score
    WHERE 
    player_id = ${playerId};
    `;
  const playerScore = await db.get(getPlayersScoresQuery);
  response.send(playerScore);
});

module.exports = app;
