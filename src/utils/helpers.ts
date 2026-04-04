import { BMSessionRecord, BMServerRecord } from '../shared/types';
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
        // Already present — resolve immediately
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
 * Extract player ID from currentURL
 */
export function extractPlayerId(currentURL: string): string {
    const url = new URL(currentURL);
    return url.pathname.replace('/players/', '');
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
