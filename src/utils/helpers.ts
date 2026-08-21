import {
    PLAYER_OVERVIEW_PAGE_REGEX,
    SERVER_PAGE_REGEX,
} from '../shared/constants';
import { BMSessionRecord, BMServerRecord, SessionData } from '../shared/types';
import { GAME_NAME_MAPPING } from '../shared/gameNameMapping';

/**
 * String to title case
 */
export function toTitleCase(str: string): string {
    return str.replace(
        /\w\S*/g,
        (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
}

/**
 * Add a debounce to a function
 *
 * @param func function to debounce
 * @param delay delay in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        const context = this;
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

/**
 * Waits for a DOM element to appear, using a MutationObserver
 * Resolves with the element when found, or rejects after a timeout
 */
export function waitForElement<T extends Element>(
    selector: string,
    timeout = 5000
): Promise<T> {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector<T>(selector);
        if (existing) {
            resolve(existing);
            return;
        }

        const timer = setTimeout(() => {
            observer.disconnect();
            reject(
                new Error(
                    `[BattleMetrics Hour Summary] Timed out waiting for element: ${selector}`
                )
            );
        }, timeout);

        const observer = new MutationObserver(() => {
            const el = document.querySelector<T>(selector);
            if (el) {
                clearTimeout(timer);
                observer.disconnect();
                resolve(el);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
}

/**
 * Check if a gameId contains only letters and digits
 */
export function isValidGameId(gameId: string): boolean {
    return /^[a-z0-9]+$/i.test(gameId);
}

/**
 * Fetch game name from mapping file. If not found default, return title case gameId
 */
export function getGameNameFromId(gameId: string): string {
    return gameId in GAME_NAME_MAPPING
        ? GAME_NAME_MAPPING[gameId]
        : toTitleCase(gameId);
}

/**
 * Convert session start and end into duration string
 */
export function generateSessionDurationString(
    sessionStart: string,
    sessionEnd: string | null = null
): string {
    const start = new Date(sessionStart);
    let end: Date;
    // Set session end to current time if value not provided
    if (sessionEnd === null) {
        end = new Date();
    } else {
        end = new Date(sessionEnd);
    }

    const duration = Math.abs(end.getTime() - start.getTime());
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);

    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}`;
}

/**
 * Convert a timestamp (epoch ms number or string) to an ISO string
 */
export function toIsoString(value: string | number): string {
    return typeof value === 'number'
        ? new Date(value).toISOString()
        : String(value);
}

/**
 * Check if URL is a Player Overview page (e.g. /players/12345)
 */
export function isPlayerOverviewPage(currentURL: string): boolean {
    try {
        const url = new URL(currentURL);
        return PLAYER_OVERVIEW_PAGE_REGEX.test(url.pathname);
    } catch {
        return false;
    }
}

/**
 * Check if URL is a Server page (e.g. /servers/...)
 */
export function isServerPage(currentURL: string): boolean {
    try {
        const url = new URL(currentURL);
        return SERVER_PAGE_REGEX.test(url.pathname);
    } catch {
        return false;
    }
}

/**
 * Extract player ID from currentURL
 */
export function extractPlayerId(currentURL: string): string {
    const url = new URL(currentURL);
    const match = url.pathname.match(/\/players\/(\d+)/);
    return match ? match[1] : '';
}

/**
 * Dedupe array of session records
 */
export function dedupeSessions(sessions: BMSessionRecord[]): BMSessionRecord[] {
    const map = new Map<string, BMSessionRecord>();
    sessions.forEach((s) => map.set(s.id, s));
    return [...map.values()];
}

/**
 * Dedupe array of server records
 */
export function dedupeIncluded(included: BMServerRecord[]): BMServerRecord[] {
    const seen = new Set<string>();
    return included.filter((x) => {
        if (seen.has(x.id)) return false;
        seen.add(x.id);
        return true;
    });
}

/**
 * Return the single ongoing session (stop === null), or null if there is none
 * or multiple ongoing sessions
 */
export function getCurrentSession(
    sessionData: SessionData
): BMSessionRecord | null {
    let currentSession: BMSessionRecord | null = null;
    let currentSessionCount = 0;

    for (const session of sessionData.data) {
        if (session.attributes.stop !== null) continue;
        currentSessionCount++;
        if (currentSessionCount > 1) {
            return null;
        }
        currentSession = session;
    }

    return currentSession;
}

/**
 * Generates an array of UTC Date objects for the past N days.
 * Returns in reverse order for charts
 * @param {number} numDays - The number of days to look back.
 * @returns {Date[]} Array of Date objects in UTC.
 */
export function getPastUTCDatesReversed(numDays: number): Date[] {
    const dates: Date[] = [];

    for (let i = 0; i < numDays; i++) {
        const d = new Date();
        // Subtract 'i' days from the current UTC date
        d.setUTCDate(d.getUTCDate() - i);

        // Normalize time to midnight UTC if you only want the dates
        d.setUTCHours(0, 0, 0, 0);

        dates.push(d);
    }

    dates.reverse();
    return dates;
}
