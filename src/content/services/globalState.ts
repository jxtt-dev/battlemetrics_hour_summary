import { GlobalStore } from '../../shared/types';

/**
 * Stores all required state for a player on the player page
 */
export let GLOBAL_STATE: GlobalStore = {
    playerId: null,
    serverData: [],
    identifierData: [],
    gamePlaytime: {},
    dailyPlaytime: {},
    sessionData: null,
    graphType: false, // Default to bar graph
};

/**
 * Reset GLOBAL_STATE
 */
export function resetState(): void {
    GLOBAL_STATE = {
        playerId: null,
        serverData: [],
        identifierData: [],
        gamePlaytime: {},
        dailyPlaytime: {},
        sessionData: null,
        graphType: false, // Default to bar graph
    };
}
