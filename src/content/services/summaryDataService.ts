import { BMIdentifierRecord, BMServerRecord } from '../../shared/types';
import { GLOBAL_STATE } from './globalState';
import { extractPlayerId } from '../../utils/helpers';
import { fetchPlayerData, calculateGamePlaytimes } from './playerDataService';
import { fetchSessionData } from './sessionService';

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
    const serverData: BMServerRecord[] = [];
    const identifierData: BMIdentifierRecord[] = [];

    for (const record of playerData) {
        if (record.type === 'server') {
            serverData.push(record);
        } else if (record.type === 'identifier') {
            identifierData.push(record);
        }
    }

    GLOBAL_STATE.serverData = serverData;
    GLOBAL_STATE.identifierData = identifierData;

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
