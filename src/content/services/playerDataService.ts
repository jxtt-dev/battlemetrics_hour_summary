import { BM_API } from '../../shared/constants';
import {
    BMIdentifierRecord,
    BMServerRecord,
    GamePlaytimes,
} from '../../shared/types';
import { GLOBAL_STATE } from './globalState';
import { fetchFromBMApi } from '../../utils/bmApi';

/**
 * Fetch player server data and past IDs
 *
 * @return (BMIdentifierRecord | BMServerRecord)[]
 */
export async function fetchPlayerData(): Promise<
    (BMIdentifierRecord | BMServerRecord)[] | null
> {
    if (GLOBAL_STATE.playerId == null) {
        throw new Error('playerId not found in GLOBAL_STATE');
    }
    const playerId = GLOBAL_STATE.playerId;
    const url =
        BM_API +
        playerId +
        '?' +
        new URLSearchParams({ include: 'server,identifier' }).toString();

    const json = (await fetchFromBMApi(url)) as Record<string, unknown>;
    if (!json || !('included' in json)) {
        throw new Error(`BattleMetrics API returned incorrect data`);
    }
    return json.included as (BMIdentifierRecord | BMServerRecord)[];
}

/**
 * Calculate total time played per game
 *
 * @returns GamePlaytimes
 */
export function calculateGamePlaytimes(): GamePlaytimes {
    if (GLOBAL_STATE.serverData.length === 0) {
        throw new Error('serverData not found in GLOBAL_STATE');
    }
    const serverData = GLOBAL_STATE.serverData;

    let timeData: GamePlaytimes = {};

    serverData.forEach((server) => {
        const serverName = server.attributes.name;
        const serverGame = server.relationships.game.data.id;
        if (server.meta === undefined) return;
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

    const formatTime = (time: number) => parseFloat((time / 3600).toFixed(2));

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
}
