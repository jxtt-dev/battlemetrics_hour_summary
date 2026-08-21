import { RateLimitState } from '../shared/types';
import { MAX_API_RETRY_COUNT } from '../shared/constants';
import { getApiKey } from './extensionOptionHelpers';

const RATE_LIMIT_PER_MINUTE = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_RPS = 15;
const MIN_REQUEST_INTERVAL_MS = 1000 / MAX_RPS;

const rateLimitState: RateLimitState = {
    remaining: RATE_LIMIT_PER_MINUTE,
    resetTime: Date.now() + RATE_LIMIT_WINDOW_MS,
    lastRequestTime: 0,
    retryPromise: null,
};

let consecutiveRetryCount = 0;

const sleep = (ms: number): Promise<void> =>
    new Promise((r) => setTimeout(r, ms));

function retryWaitMsFromResponse(response: Response): number {
    const retryAfter = response.headers.get('Retry-After');
    const fallback =
        Math.max(0, rateLimitState.resetTime - Date.now()) ||
        RATE_LIMIT_WINDOW_MS;

    if (retryAfter === null) {
        return fallback;
    }

    const seconds = Number(retryAfter);
    if (!isNaN(seconds)) {
        return seconds * 1000;
    }

    const retryDate = new Date(retryAfter).getTime();
    if (!isNaN(retryDate)) {
        return Math.max(0, retryDate - Date.now());
    }

    return fallback;
}

async function waitForRateLimitRetry(response: Response): Promise<void> {
    if (!rateLimitState.retryPromise) {
        const waitMs = retryWaitMsFromResponse(response);
        console.info(
            `[BattleMetrics Hour Summary] Return code 429 Too Many Requests - received. Retrying after ${waitMs}ms.`
        );
        rateLimitState.retryPromise = sleep(waitMs).then(() => {
            rateLimitState.remaining = RATE_LIMIT_PER_MINUTE;
            rateLimitState.resetTime = Date.now() + RATE_LIMIT_WINDOW_MS;
            rateLimitState.retryPromise = null;
        });
    }

    await rateLimitState.retryPromise;
}

async function awaitRateLimitSlot(): Promise<void> {
    if (rateLimitState.retryPromise) {
        await rateLimitState.retryPromise;
    }

    const timeSinceLast = Date.now() - rateLimitState.lastRequestTime;
    if (timeSinceLast < MIN_REQUEST_INTERVAL_MS) {
        await sleep(MIN_REQUEST_INTERVAL_MS - timeSinceLast);
    }

    if (rateLimitState.remaining > 0) return;
    const waitMs = rateLimitState.resetTime - Date.now();
    if (waitMs > 0) {
        console.info(
            `[BattleMetrics Hour Summary] API Rate limit budget exhausted. Waiting ${waitMs}ms for reset.`
        );
        await sleep(waitMs);
    }
    rateLimitState.remaining = RATE_LIMIT_PER_MINUTE;
    rateLimitState.resetTime = Date.now() + RATE_LIMIT_WINDOW_MS;
}

function syncRateLimitFromResponse(response: Response): void {
    const limitRemaining = response.headers.get('X-Rate-Limit-Remaining');
    if (limitRemaining !== null) {
        rateLimitState.remaining = parseInt(limitRemaining, 10);
    }
}

function assertBattleMetricsUrl(url: string): void {
    let hostname: string;
    try {
        hostname = new URL(url).hostname;
    } catch {
        throw new Error(`Not a BattleMetrics URL: ${url}`);
    }

    if (
        hostname !== 'battlemetrics.com' &&
        !hostname.endsWith('.battlemetrics.com')
    ) {
        throw new Error(`Not a BattleMetrics URL: ${url}`);
    }
}

/**
 * Fetching from BM API with rate limit protections and optional API key
 */
export async function fetchWithRateLimit(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    assertBattleMetricsUrl(url);

    await awaitRateLimitSlot();

    rateLimitState.lastRequestTime = Date.now();

    const headers = new Headers(options.headers ?? {});
    if (!headers.has('Authorization')) {
        const apiKey = await getApiKey();
        if (apiKey !== null) {
            headers.set('Authorization', `Bearer ${apiKey}`);
        }
    }

    const fetchOptions: RequestInit = {
        ...options,
        headers,
    };

    const response = await fetch(url, fetchOptions);

    syncRateLimitFromResponse(response);

    if (response.status === 429) {
        if (consecutiveRetryCount >= MAX_API_RETRY_COUNT) {
            consecutiveRetryCount = 0;
            throw new Error(
                `BattleMetrics API rate limit retries exhausted (${MAX_API_RETRY_COUNT} attempts)`
            );
        }
        consecutiveRetryCount++;
        await waitForRateLimitRetry(response);
        return fetchWithRateLimit(url, options);
    }

    consecutiveRetryCount = 0;

    return response;
}
