import {
    GLOBAL_STATE,
    fetchSessionData,
    calculatePastSessions,
} from '../../services';
import { dedupeSessions, dedupeIncluded } from '../../../utils/helpers';
import { renderPlaytimeBarGraph } from '../BarGraph';
import { renderPlaytimeHeatmapGraph } from '../HeatmapGraph';

/**
 * Convert numberOfDays into a timestamp
 */
function getCutoffTimestamp(numberOfDays: number): number {
    const now = new Date();
    const startOfTodayUTC = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
    );
    const MS_PER_DAY = 24 * 3_600_000;
    return startOfTodayUTC - numberOfDays * MS_PER_DAY;
}

/**
 * Check if GLOBAL_STATE.sessionData has enough data to perform calculation
 * otherwise more data needs to be fetched
 */
function sessionDataNeedsRefresh(cutoff: number): boolean {
    const { sessionData } = GLOBAL_STATE;
    if (!sessionData?.links?.next) return false;

    const lastSession = sessionData.data.at(-1);
    if (!lastSession) return false;

    const lastSessionStart = new Date(lastSession.attributes.start).getTime();
    const lastSessionStop = lastSession.attributes.stop
        ? new Date(lastSession.attributes.stop).getTime()
        : Date.now();

    return lastSessionStart > cutoff && lastSessionStop > cutoff;
}

/**
 * Fetches new session data and merges it into GLOBAL_STATE
 */
async function fetchAndMergeSessionData(numberOfDays: number): Promise<void> {
    const additionalSessionData = await fetchSessionData(numberOfDays);
    if (additionalSessionData === null) {
        throw new Error('Failed to fetch additionalSessionData');
    }

    GLOBAL_STATE.sessionData = {
        data: dedupeSessions([
            ...GLOBAL_STATE.sessionData!.data,
            ...additionalSessionData.data,
        ]),
        included: dedupeIncluded([
            ...GLOBAL_STATE.sessionData!.included,
            ...additionalSessionData.included,
        ]),
        links: additionalSessionData.links,
    };
}

/**
 * Calculates total playtime in given timeframe
 */
function calculateTimeframeTotal(gameId: string, numberOfDays: number): number {
    const gameTimeframeData = GLOBAL_STATE.dailyPlaytime[gameId];
    if (!gameTimeframeData) return 0;

    const total = gameTimeframeData
        .slice(0, numberOfDays)
        .reduce((a, b) => a + b, 0);

    return Math.round(total * 100) / 100;
}

/**
 * Generate new graphs for selected timeframe
 */
function generateGraphs(
    gameId: string,
    numberOfDays: number,
    data: number[] | null
) {
    let formattedData: number[];
    // Reverse data for graphs
    // Create zero array if no data
    if (data === null || data === undefined || data.length === 0) {
        formattedData = new Array<number>(numberOfDays).fill(0);
    } else {
        formattedData = data.toReversed();
    }

    const barGraphWrapper = document.getElementById(
        `${gameId}-playtime-bar-graph-wrapper`
    ) as HTMLDivElement;
    const heatmapGraphWrapper = document.getElementById(
        `${gameId}-playtime-heatmap-graph-wrapper`
    ) as HTMLDivElement;

    // Clear graph wrappers
    heatmapGraphWrapper.innerHTML = '';
    barGraphWrapper.innerHTML = '';

    // Generate new graphs
    renderPlaytimeBarGraph(barGraphWrapper, numberOfDays, formattedData);
    renderPlaytimeHeatmapGraph(
        heatmapGraphWrapper,
        numberOfDays,
        formattedData
    );
}

/**
 * Fetches and calculates total playtime in given timeframe
 *
 * Also triggers bar and heatmap generation
 */
export async function periodPlaytimeEventListener(
    numberOfDays: number,
    gameId: string,
    timeframeLabel: HTMLLabelElement
) {
    try {
        if (GLOBAL_STATE.playerId == null) {
            throw new Error('playerId not found in GLOBAL_STATE');
        }
        if (GLOBAL_STATE.sessionData == null) {
            throw new Error('sessionData not found in GLOBAL_STATE');
        }

        const cutoff = getCutoffTimestamp(numberOfDays);

        if (sessionDataNeedsRefresh(cutoff)) {
            timeframeLabel.innerHTML =
                '<div class="bmhs-css-loader"></div> hours past';
            await fetchAndMergeSessionData(numberOfDays);
        }

        GLOBAL_STATE.dailyPlaytime = calculatePastSessions(
            GLOBAL_STATE.sessionData!,
            numberOfDays
        );

        // Render new graphs
        const gameTimeframeData = GLOBAL_STATE.dailyPlaytime[gameId];
        generateGraphs(gameId, numberOfDays, gameTimeframeData);

        // Update text
        const timeframeTotal = calculateTimeframeTotal(gameId, numberOfDays);
        timeframeLabel.innerHTML = `${timeframeTotal} hours past`;
    } catch (e) {
        timeframeLabel.innerHTML =
            '<span class="bmhs-error-text">Error, try again!</span>';
        console.error(
            `[BattleMetrics Hour Summary] Error calculating playtime in period: ${e}`
        );
        console.error(e);
    }
}
