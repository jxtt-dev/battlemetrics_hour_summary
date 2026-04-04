import { RateLimitState } from '../shared/types';

const RATE_LIMIT_PER_MINUTE = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_RPS = 15;
const MIN_REQUEST_INTERVAL_MS: number = 1000 / MAX_RPS;

const rateLimitState: RateLimitState = {
    remaining: RATE_LIMIT_PER_MINUTE,
    resetTime: Date.now() + RATE_LIMIT_WINDOW_MS,
    lastRequestTime: 0,
    retryPromise: null,
};

const sleep = (ms: number): Promise<void> =>
    new Promise((r) => setTimeout(r, ms));

/**
 * Fetching from BM API with rate limit protections
 *
 *
 * @returns Promise<Response>
 */
export async function fetchWithRateLimit(
    url: string,
    options = {}
): Promise<Response> {
    // Wait if a retry request is already in progress
    if (rateLimitState.retryPromise) {
        await rateLimitState.retryPromise;
    }

    const now = Date.now();

    // Limit requests per second
    const timeSinceLast = now - rateLimitState.lastRequestTime;
    if (timeSinceLast < MIN_REQUEST_INTERVAL_MS) {
        await sleep(MIN_REQUEST_INTERVAL_MS - timeSinceLast);
    }

    // Limit requests per minute
    if (rateLimitState.remaining <= 0) {
        const waitMs = rateLimitState.resetTime - Date.now();
        if (waitMs > 0) {
            console.info(
                `[Battlemetrics Hour Summary] API Rate limit budget exhausted. Waiting ${waitMs}ms for reset.`
            );
            await sleep(waitMs);
        }
        // Reset state for the new window
        rateLimitState.remaining = RATE_LIMIT_PER_MINUTE;
        rateLimitState.resetTime = Date.now() + RATE_LIMIT_WINDOW_MS;
    }

    rateLimitState.lastRequestTime = Date.now();

    const response = await fetch(url, options);

    // Sync rateLimitState with API response
    const limitRemaining = response.headers.get('X-Rate-Limit-Remaining');
    if (limitRemaining !== null) {
        rateLimitState.remaining = parseInt(limitRemaining, 10);
    }

    // Handle 429 return code
    if (response.status === 429) {
        if (!rateLimitState.retryPromise) {
            const retryAfter = response.headers.get('Retry-After');
            let waitMs: number;
            const fallback = rateLimitState.resetTime - Date.now();

            if (retryAfter) {
                const seconds = Number(retryAfter);
                waitMs = isNaN(seconds)
                    ? new Date(retryAfter).getTime() - Date.now()
                    : seconds * 1000;
            } else {
                waitMs = fallback > 0 ? fallback : RATE_LIMIT_WINDOW_MS;
            }

            console.info(
                `[Battlemetrics Hour Summary] Return code 429 Too Many Requests - received. Retrying after ${waitMs}ms.`
            );

            rateLimitState.retryPromise = sleep(waitMs).then(() => {
                rateLimitState.remaining = RATE_LIMIT_PER_MINUTE;
                rateLimitState.resetTime = Date.now() + RATE_LIMIT_WINDOW_MS;
                rateLimitState.retryPromise = null; // reset
            });
        }

        // Wait if a retry request is already in progress
        await rateLimitState.retryPromise;
        return fetchWithRateLimit(url, options);
    }

    return response;
}
