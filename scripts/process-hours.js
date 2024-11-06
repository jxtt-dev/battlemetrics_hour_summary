// Fetch player server data from BattleMetrics API
// API documentation: https://www.battlemetrics.com/developers/documentation#link-GET-player-/players/{(%23%2Fdefinitions%2Fplayer%2Fdefinitions%2Fidentity)}
const fetchServerData = async (playerId) => {
    const url =
        BM_API +
        playerId +
        '?' +
        new URLSearchParams({ include: 'server' }).toString();
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(
                `BattleMetrics API Response status: ${response.status}`
            );
        }

        const json = await response.json();
        if (!('included' in json)) {
            throw new Error(`BattleMetrics API returned incorrect data`);
        }
        return json.included;
    } catch (e) {
        throw e;
    }
};

// Calculate hour summary
const calculateHours = (serverData) => {
    let timeData = {};

    serverData.forEach((server) => {
        const serverName = server.attributes.name;
        const serverGame = server.relationships.game.data.id;
        const timePlayed = server.meta.timePlayed;

        // Populate game info if it hasn't been seen before
        !(serverGame in timeData) &&
            (timeData[serverGame] = {
                playTime: 0,
                serverList: [],
            });

        // Add playtime to game total
        timeData[serverGame]['playTime'] += timePlayed;

        // Add server to server list for game
        timeData[serverGame]['serverList'].push({
            serverName: serverName,
            serverPlayTime: timePlayed,
        });
    });

    const formatTime = (time) => (time / 3600).toFixed(2);

    // Sort serverList for each game by playtime and convert playtime from seconds to hours
    Object.keys(timeData).forEach((gameId) => {
        const gameData = timeData[gameId];

        // Sort serverList by playtime
        timeData[gameId].serverList.sort(
            (a, b) => b.serverPlayTime - a.serverPlayTime
        );

        // Convert total playtime of game
        timeData[gameId].playTime = formatTime(gameData.playTime);

        // Convert playtime for each server in serverList
        timeData[gameId].serverList = gameData.serverList.map((serverData) => {
            serverData.serverPlayTime = formatTime(serverData.serverPlayTime);
            return serverData;
        });
    });

    return timeData;
};
