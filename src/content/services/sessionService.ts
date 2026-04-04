import { SessionData, DailyPlaytime } from '../../shared/types';
import { BM_API } from '../../shared/constants';
import { GLOBAL_STATE } from './globalState';
import { fetchWithRateLimit } from '../../utils/fetchWithRateLimit';
import { dedupeIncluded } from '../../utils/helpers';

/**
 * Check if oldest session fetched is before the periodEnd cutoff
 *
 * @param cumulativeData SessionData
 * @param periodEnd number
 *
 * @returns boolean
 */
function sessionEndReached(
    cumulativeData: SessionData,
    periodEnd: number
): boolean {
    const lastSession = cumulativeData.data.at(-1);
    if (lastSession === undefined) {
        throw new Error('No sessions found');
    }

    const lastSessionStart = Date.parse(lastSession.attributes.start);
    const lastSessionStop = lastSession.attributes.stop
        ? Date.parse(lastSession.attributes.stop)
        : null;

    // True if last session starts or ends before periodEnd cutoff
    return (
        lastSessionStart < periodEnd ||
        (lastSessionStop !== null && lastSessionStop < periodEnd)
    );
}

/**
 * Fetch session data from BattleMetrics API
 *
 * Continues fetching pages from where previous request left off
 *
 * @returns Promise<SessionData | null>
 */
export async function fetchSessionData(
    numberOfDays: number | null = null
): Promise<SessionData | null> {
    if (GLOBAL_STATE.playerId === null) {
        throw new Error('playerId not found in GLOBAL_STATE');
    }
    const playerId = GLOBAL_STATE.playerId;

    // Example URL: https://api.battlemetrics.com/players/[playerId]/relationships/sessions?include=server&page%5Bsize%5D=100
    const baseUrl =
        BM_API +
        playerId +
        '/relationships/sessions' +
        '?' +
        new URLSearchParams({
            'include': 'server',
            'page[size]': '100',
        }).toString();

    const fetchPage = async (pageUrl: string) => {
        const response = await fetchWithRateLimit(pageUrl);

        if (!response.ok) {
            throw new Error(
                `BattleMetrics API Response status: ${response.status}`
            );
        }

        const json = await response.json();
        if (!('data' in json)) {
            throw new Error(`BattleMetrics API returned incorrect data`);
        }

        return json;
    };

    // Fetch and return first page of sessions if numberOfDays isnt provided
    if (numberOfDays == null) {
        const json = await fetchPage(baseUrl);

        return {
            data: json.data,
            included: dedupeIncluded(json.included ?? []),
            links: {
                next: json?.links?.next || null,
                prev: json?.links?.prev || null,
            },
        };
    }

    // Keep fetching data until periodEnd date is reached
    let sessionData: SessionData = {
        data: [], // Array of sessions objects
        included: [], // Array of servers that sessions occurred on
        links: {
            next: null,
            prev: null,
        },
    };

    const periodEndDate = new Date();
    periodEndDate.setUTCDate(periodEndDate.getUTCDate() - numberOfDays);
    const periodEnd: number = periodEndDate.getTime();

    // Continue fetching pages from where previous request stopped if possible
    let nextUrl = baseUrl;
    const pageLinks = GLOBAL_STATE?.sessionData?.links;

    if (pageLinks) {
        if (pageLinks.next !== null) {
            nextUrl = pageLinks.next;
        }
    }

    do {
        const json = await fetchPage(nextUrl);

        // Add current pages data to sessionData object
        sessionData.data.push(...json.data);
        sessionData.included.push(...(json.included ?? []));
        sessionData.links.next = json.links?.next || null;
        sessionData.links.prev = json.links?.prev || null;

        // Break if last page reached
        nextUrl = json.links?.next;
        if (!nextUrl) break;
    } while (!sessionEndReached(sessionData, periodEnd));

    sessionData.included = dedupeIncluded(sessionData.included);

    return sessionData;
}

/**
 * Convert session data into an array of total playtime by day
 *
 * @returns DailyPlaytime (Record<string, number[]>)
 */
export function calculatePastSessions(
    sessionData: SessionData,
    numberOfDays: number
): DailyPlaytime {
    const HOUR_MS = 3_600_000;
    const DAY_MS = 24 * HOUR_MS;

    const now = Date.now();

    // Midnight UTC of today
    const todayMidnightTs = now - (now % DAY_MS);

    // Map server to game
    const serverGameMap = new Map<string, string>();
    for (const item of sessionData.included) {
        if (item.type === 'server') {
            serverGameMap.set(item.id, item.relationships.game.data.id);
        }
    }

    const windowStart = todayMidnightTs - (numberOfDays - 1) * DAY_MS;

    // Using Float64Arrays internally for better performance
    const accumulator = Object.create(null);

    // Loop each session once
    for (const session of sessionData.data) {
        const { start, stop } = session.attributes;
        const serverId = session.relationships?.server?.data?.id;
        if (!serverId) continue;

        const gameName = serverGameMap.get(serverId);
        if (gameName === undefined) continue;

        const startTs = Date.parse(start);

        // Handle sessions without stop times
        // If the session started over 72 hours ago, discard as it is likely invalid data
        // Otherwise treat it as an ongoing session
        let stopTs;
        const MAX_SESSION_DURATION = 72 * HOUR_MS;

        if (stop) {
            stopTs = Date.parse(stop);
        } else {
            if (now - startTs > MAX_SESSION_DURATION) {
                continue;
            }
            stopTs = now;
        }

        const effectiveStart = Math.max(startTs, windowStart);
        const effectiveStop = Math.min(stopTs, now);
        if (effectiveStart >= effectiveStop) continue;

        // Initialize array for unseen game
        if (accumulator[gameName] === undefined) {
            accumulator[gameName] = new Float64Array(numberOfDays);
        }
        const buckets = accumulator[gameName];

        // Split multi day sessions into buckets
        let cursor = effectiveStart;

        while (cursor < effectiveStop) {
            const cursorDayMidnight = cursor - (cursor % DAY_MS);
            const nextDayMidnight = cursorDayMidnight + DAY_MS;
            const sliceEnd = Math.min(effectiveStop, nextDayMidnight);

            // dayIndex: 0 = today, 1 = yesterday, …
            const dayIndex = Math.floor(
                (todayMidnightTs - cursorDayMidnight) / DAY_MS
            );

            // Convert to hours
            if (dayIndex >= 0 && dayIndex < numberOfDays) {
                buckets[dayIndex] += (sliceEnd - cursor) / HOUR_MS;
            }

            cursor = nextDayMidnight;
        }
    }

    // Convert back to plain JS array
    const pastSessions: Record<string, number[]> = Object.create(null);
    for (const game in accumulator) {
        pastSessions[game] = Array.from(accumulator[game]);
    }

    return pastSessions;
}
