import { BMIdentifierRecord, BMServerRecord } from '../../shared/types';
import { GLOBAL_STATE } from '../services';
import { extractPlayerId } from '../../utils/helpers';
import {
    fetchPlayerData,
    fetchSessionData,
    calculateGamePlaytimes,
} from '../services';

function fetchAndSetPlayerId(): void {
    const playerID = extractPlayerId(window.location.href);
    if (playerID === '') throw new Error('Player ID not found');
    GLOBAL_STATE.playerId = playerID;
}

/**
 * Fetches and calculates required data for hour summary, then stores in GLOBAL_STATE
 */
export async function fetchAndStoreHourSummaryData(): Promise<void> {
    // Get Player ID if not already set
    if (GLOBAL_STATE.playerId === null) fetchAndSetPlayerId();

    // Fetch player hour data
    const playerData = await fetchPlayerData();
    if (playerData === null) {
        throw new Error('Failed to get player data');
    }

    // Split server data and previous identifier data, then store in GLOBAL_STATE
    const reducedPlayerData = playerData.reduce(
        (acc, record) => {
            if (record.type === 'server') {
                acc.server.push(record as BMServerRecord);
            } else {
                acc.identifier.push(record as BMIdentifierRecord);
            }
            return acc;
        },
        {
            server: [] as BMServerRecord[],
            identifier: [] as BMIdentifierRecord[],
        }
    );
    GLOBAL_STATE.serverData = reducedPlayerData['server'];
    GLOBAL_STATE.identifierData = reducedPlayerData['identifier'];

    // Calculate hour summary
    GLOBAL_STATE.gamePlaytime = calculateGamePlaytimes();
}

/**
 * Fetches and stores first page of session data in GLOBAL_STATE
 */
export async function fetchAndStoreSessionData(): Promise<void> {
    // Get Player ID if not already set
    if (GLOBAL_STATE.playerId === null) fetchAndSetPlayerId();

    // Fetch first page of session data
    const sessionData = await fetchSessionData();
    if (sessionData === null) {
        throw new Error('Failed to get session data');
    }
    GLOBAL_STATE.sessionData = sessionData;
}
