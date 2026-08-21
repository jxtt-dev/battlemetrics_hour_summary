import { BM_API } from '../../shared/constants';
import {
    BMIdentifierRecord,
    BMServerRecord,
    GamePlaytimes,
    FiberPlayerDataPayload,
    FiberDataUnavailableError,
} from '../../shared/types';
import { GLOBAL_STATE } from './globalState';
import { fetchApi } from '../../utils/fetchApi';
import { isValidGameId, toIsoString } from '../../utils/helpers';
import { isApiKeyConfigured } from '../../utils/extensionOptionHelpers';
import { getFiberPlayerData } from '../../utils/fiberDataManager';

/**
 * Transform data store player and server data into standard BMServerRecord array
 */
export function transformFiberPayloadToRecords(
    playerId: string,
    payload: FiberPlayerDataPayload
): BMServerRecord[] {
    const playerServers = payload.serverInfoByPlayer[playerId];
    if (!playerServers) return [];

    const serverRecords: BMServerRecord[] = [];

    for (const [serverId, info] of Object.entries(playerServers)) {
        const serverMeta = payload.servers[serverId];
        const gameId = serverMeta?.game_id ?? serverMeta?.gameId ?? 'unknown';
        const serverName = serverMeta?.name ?? `Server ${serverId}`;
        const address = serverMeta?.address ?? '';
        const status = serverMeta?.status ?? 'unknown';
        const isPrivate = Boolean(serverMeta?.private);

        const firstSeenStr = toIsoString(
            info.firstSeen ?? new Date().toISOString()
        );

        const lastSeenStr = toIsoString(
            info.lastSeen ?? new Date().toISOString()
        );

        const record: BMServerRecord = {
            type: 'server',
            id: String(info.serverId ?? serverId),
            attributes: {
                id: String(info.serverId ?? serverId),
                name: serverName,
                address: address,
                status: status,
                private: isPrivate,
            },
            relationships: {
                game: {
                    data: {
                        type: 'game',
                        id: gameId,
                    },
                },
            },
            meta: {
                timePlayed: info.timePlayed,
                firstSeen: firstSeenStr,
                lastSeen: lastSeenStr,
                online: Boolean(info.online),
            },
        };

        serverRecords.push(record);
    }

    return serverRecords;
}

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

    // Use paid API if API key is provided
    if (await isApiKeyConfigured()) {
        const url =
            BM_API +
            'players/' +
            playerId +
            '?' +
            new URLSearchParams({
                'include': 'server,identifier',
                'fields[server]': 'name,address,status,private',
                'fields[identifier]': 'identifier,lastSeen,private',
            }).toString();

        const json = await fetchApi<{
            included?: (BMIdentifierRecord | BMServerRecord)[];
        }>(url);
        if (!json || !('included' in json) || !json.included) {
            throw new Error(`BattleMetrics API returned incorrect data`);
        }
        return json.included;
    }

    // Default: Extract data from data store
    const fiberPayload = await getFiberPlayerData(playerId);
    if (fiberPayload === null) {
        throw new FiberDataUnavailableError(
            `Unable to retrieve player data from page state for player ${playerId}`
        );
    }

    const records = transformFiberPayloadToRecords(playerId, fiberPayload);
    return records;
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
        if (!isValidGameId(serverGame)) return;
        if (server.meta === undefined) return;
        const timePlayed = server.meta.timePlayed;

        // Populate game info if it hasn't been seen before
        if (!(serverGame in timeData)) {
            timeData[serverGame] = {
                playTime: 0,
                serverList: [],
            };
        }

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
