import {
    SessionData,
    DailyPlaytime,
    BMSessionRecord,
    RawSessionInfo,
} from '../../shared/types';
import { BM_API } from '../../shared/constants';
import { GLOBAL_STATE } from './globalState';
import { fetchApi } from '../../utils/fetchApi';
import { dedupeIncluded, toIsoString } from '../../utils/helpers';
import { isApiKeyConfigured } from '../../utils/extensionOptionHelpers';
import { getFiberPlayerData } from '../../utils/fiberDataManager';

interface BMSessionPage {
    data: SessionData['data'];
    included?: SessionData['included'];
    links?: SessionData['links'];
}

/**
 * Check if oldest session fetched is before the periodEnd cutoff
 */
function sessionEndReached(
    cumulativeData: SessionData,
    periodEnd: number
): boolean {
    const lastSession = cumulativeData.data.at(-1);
    if (lastSession === undefined) {
        return true;
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
 * Strip invalid parameters off pagination cursors if present
 */
function fixPaginationCursor(pageUrl: string | null): string | null {
    if (pageUrl === null) return null;
    try {
        const url = new URL(pageUrl, BM_API);
        const cursor = url.searchParams.get('page[key]');
        if (cursor !== null) {
            const comma = cursor.indexOf(',');
            if (comma > 0) {
                url.searchParams.set('page[key]', cursor.slice(0, comma));
            }
        }
        return url.toString();
    } catch {
        return pageUrl;
    }
}

/**
 * Base URL for the session list of a player
 */
function sessionBaseUrl(playerId: string): string {
    return (
        BM_API +
        'players/' +
        playerId +
        '/relationships/sessions' +
        '?' +
        new URLSearchParams({
            'include': 'server',
            'page[size]': '100',
        }).toString()
    );
}

/**
 * Fetch one page of session data from the BattleMetrics API
 */
async function fetchPage(pageUrl: string): Promise<BMSessionPage> {
    const body = await fetchApi<BMSessionPage>(pageUrl);
    if (!body || !('data' in body)) {
        throw new Error(`BattleMetrics API returned incorrect data`);
    }

    return body;
}

/**
 * Convert a raw data session record into a BMSessionRecord
 */
function toSessionRecord(
    id: string,
    s: RawSessionInfo,
    playerId: string
): BMSessionRecord {
    return {
        type: 'session',
        id: String(s.id ?? id),
        attributes: {
            start: toIsoString(s.start),
            stop: s.stop ? toIsoString(s.stop) : null,
            firstTime: Boolean(s.firstTime),
            name: s.name ?? '',
            private: Boolean(s.private),
        },
        relationships: {
            server: {
                data: {
                    type: 'server',
                    id: String(s.server_id ?? ''),
                },
            },
            player: {
                data: {
                    type: 'player',
                    id: String(s.player_id ?? playerId),
                },
            },
            identifiers: {
                data: {
                    type: 'identifier',
                    id: '',
                },
            },
        },
    };
}

/**
 * Extract available session data from the data store
 */
async function fetchSessionsFromStore(playerId: string): Promise<SessionData> {
    const fiberPayload = await getFiberPlayerData(playerId);
    const rawSessions = fiberPayload?.sessions;

    const sessionsData: BMSessionRecord[] = rawSessions
        ? Object.entries(rawSessions)
              .filter(
                  ([, s]) =>
                      !s.player_id || String(s.player_id) === String(playerId)
              )
              .map(([id, s]) => toSessionRecord(id, s, playerId))
        : [];

    return {
        data: sessionsData,
        included: GLOBAL_STATE.serverData,
        links: {
            next: null,
            prev: null,
        },
    };
}

/**
 * Fetch and return the first page of sessions
 */
async function fetchFirstSessionPage(playerId: string): Promise<SessionData> {
    const body = await fetchPage(sessionBaseUrl(playerId));

    return {
        data: body.data,
        included: dedupeIncluded(body.included ?? []),
        links: {
            next: fixPaginationCursor(body.links?.next ?? null),
            prev: body.links?.prev ?? null,
        },
    };
}

/**
 * Keep fetching session pages until the periodEnd cutoff is reached
 */
async function fetchSessionsUntilPeriodEnd(
    playerId: string,
    numberOfDays: number
): Promise<SessionData> {
    const sessionData: SessionData = {
        data: [],
        included: [],
        links: {
            next: null,
            prev: null,
        },
    };

    const periodEndDate = new Date();
    periodEndDate.setUTCHours(0, 0, 0, 0);
    periodEndDate.setUTCDate(periodEndDate.getUTCDate() - numberOfDays);
    const periodEnd: number = periodEndDate.getTime();

    // Continue fetching from where the previous request stopped if possible
    let nextUrl: string | null =
        fixPaginationCursor(GLOBAL_STATE?.sessionData?.links?.next ?? null) ??
        sessionBaseUrl(playerId);

    do {
        const page = await fetchPage(nextUrl);

        sessionData.data.push(...page.data);
        sessionData.included.push(...(page.included ?? []));
        sessionData.links.next = fixPaginationCursor(page.links?.next ?? null);
        sessionData.links.prev = page.links?.prev ?? null;

        const nextPageUrl = sessionData.links.next;
        if (nextPageUrl === null || nextPageUrl === nextUrl) break;
        nextUrl = nextPageUrl;
    } while (!sessionEndReached(sessionData, periodEnd));

    sessionData.included = dedupeIncluded(sessionData.included);

    return sessionData;
}

/**
 * Fetch session data from the BattleMetrics API or data store
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

    // If no API key is provided, get available session data from data store
    if (!(await isApiKeyConfigured())) {
        return fetchSessionsFromStore(playerId);
    }

    // When API key is provided, fetch from BattleMetrics API
    if (numberOfDays == null) {
        return fetchFirstSessionPage(playerId);
    }

    return fetchSessionsUntilPeriodEnd(playerId, numberOfDays);
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
    const MAX_SESSION_DURATION = 72 * HOUR_MS;

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
    const pastSessions: Record<string, number[]> = {};

    // Loop each session once
    for (const session of sessionData.data) {
        const { start, stop } = session.attributes;
        const serverId = session.relationships?.server?.data?.id;
        if (!serverId) continue;

        const gameName = serverGameMap.get(serverId);
        if (gameName === undefined) continue;

        const startTs = Date.parse(start);

        // Handle sessions without stop times
        let stopTs;

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

        if (!pastSessions[gameName]) {
            pastSessions[gameName] = new Array(numberOfDays).fill(0);
        }

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
                pastSessions[gameName][dayIndex] += (sliceEnd - cursor) / HOUR_MS;
            }

            cursor = nextDayMidnight;
        }
    }

    return pastSessions;
}
