import {
    SigningSession,
    RateLimitState,
    SessionExpiredError,
    SessionUnavailableError,
} from '../shared/types';
import {
    SESSION_TIMEOUT_MS,
    SESSION_RECOVERY_WAIT_MS,
    MAX_API_RETRY_COUNT,
} from '../shared/constants';
import { buildSignatureMessage, hmacSha256Hex } from '../shared/signing';
import { getSession, waitForSessionUpdate } from './sessionManager';
import { resetSessionRecoveryReloads } from './sessionRecovery';

const RATE_LIMIT_PER_MINUTE = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_RPS = 15;
const MIN_REQUEST_INTERVAL_MS = 1000 / MAX_RPS;

// 401 details that mean the signing session expired or was invalidated
const SESSION_STALE_ERROR_DETAILS = [
    'Guest token must be verified via PoW.',
    'Guest token expired or invalid.',
    'Guest token bound to different IP/User-Agent.',
    'Invalid API request signature.',
];

// Recoverable stale session messages
const SESSION_RECOVERABLE_DETAILS = [
    'Guest token must be verified via PoW.',
    'Guest token expired or invalid.',
];

// True once a stale-session recovery cycle has run, reset
// whenever a request succeeds against a healthy session
let isSessionRecoveryExhausted = false;

const rateLimitState: RateLimitState = {
    remaining: RATE_LIMIT_PER_MINUTE,
    resetTime: Date.now() + RATE_LIMIT_WINDOW_MS,
    lastRequestTime: 0,
    retryPromise: null,
};

let consecutiveRetryCount = 0;

const sleep = (ms: number): Promise<void> =>
    new Promise((r) => setTimeout(r, ms));

function normalizeApiUrl(url: string): string {
    const normalizedUrl = new URL(url, location.origin);
    if (normalizedUrl.hostname === 'api.battlemetrics.com') {
        normalizedUrl.hostname = 'www.battlemetrics.com';
        normalizedUrl.pathname = '/_api' + normalizedUrl.pathname;
    }
    return normalizedUrl.toString();
}

// Read the page path live so it stays correct after SPA navigation
function buildAuditLog(pathname: string, instanceId: string): string {
    return `t=Player;p=${pathname};h=${crypto.randomUUID()};id=${instanceId}`;
}

// BattleMetrics requires an HMAC-SHA256 request signature:
//   message  = `${pathname+search}_${timestamp}_${instanceId}${SIGNING_SUFFIX}`
//   signature= HMAC-SHA256(seed, message)
async function buildSignedInit(
    url: string,
    options: RequestInit,
    session: SigningSession
): Promise<RequestInit> {
    const signedUrl = new URL(url, location.origin);
    const path = signedUrl.pathname + signedUrl.search;
    const timestamp = Date.now().toString();
    const signature = await hmacSha256Hex(
        buildSignatureMessage(path, timestamp, session.instanceId),
        session.seed
    );

    const headers = new Headers(options.headers ?? {});
    headers.set('accept', headers.get('accept') ?? 'application/json');
    headers.set('accept-version', headers.get('accept-version') ?? '^0.1.0');
    headers.set('x-api-signature', signature);
    headers.set('x-api-timestamp', timestamp);
    headers.set('x-api-instance', session.instanceId);
    headers.set(
        'x-audit-log',
        buildAuditLog(window.location.pathname, session.instanceId)
    );

    return {
        method: options.method ?? 'GET',
        credentials: 'include',
        headers,
        body: options.body,
    };
}

async function readSessionErrorDetail(
    response: Response
): Promise<string | null> {
    try {
        const errorBody = await response.json();
        const detail = errorBody?.errors?.[0]?.detail;
        return typeof detail === 'string' ? detail : null;
    } catch {
        return null;
    }
}

async function staleSessionDetail(response: Response): Promise<string | null> {
    if (response.status !== 401) return null;
    const detail = await readSessionErrorDetail(response);
    if (detail !== null && SESSION_STALE_ERROR_DETAILS.includes(detail)) {
        return detail;
    }
    return null;
}

// The MAIN-world observer may relay the session late, so check twice
async function requireSession(): Promise<SigningSession> {
    const session = await getSession(SESSION_TIMEOUT_MS);
    if (session !== null) return session;
    const lateSession = await getSession(0);
    if (lateSession !== null) return lateSession;
    throw new SessionUnavailableError(
        'Could not capture a BattleMetrics request session.'
    );
}

// Used to prompt manual reload
function throwExpiredSession(staleDetail: string): never {
    throw new SessionExpiredError(
        `BattleMetrics request session expired (${staleDetail})`
    );
}

// On fresh contexts, initial requests fail until the site completes its guest
// handshake and rotates credentials. Wait for the updated session and retry.
async function recoverFromStaleSession(
    url: string,
    options: RequestInit,
    usedSession: SigningSession,
    staleDetail: string
): Promise<Response> {
    const failRecovery = (): never => {
        isSessionRecoveryExhausted = true;
        return throwExpiredSession(staleDetail);
    };

    if (isSessionRecoveryExhausted) return failRecovery();

    if (!SESSION_RECOVERABLE_DETAILS.includes(staleDetail)) {
        return failRecovery();
    }

    const recoveredSession = await waitForSessionUpdate(
        usedSession,
        SESSION_RECOVERY_WAIT_MS
    );
    if (recoveredSession === null) return failRecovery();

    return fetchWithRateLimit(url, options);
}

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

// Only the first caller after a 429 schedules the wait; concurrent callers
// share the same retry promise.
async function waitForRateLimitRetry(response: Response): Promise<void> {
    if (!rateLimitState.retryPromise) {
        const waitMs = retryWaitMsFromResponse(response);
        console.info(
            `[BattleMetrics Hour Summary] Return code 429 Too Many Requests - received. Retrying after ${waitMs}ms.`
        );
        rateLimitState.retryPromise = sleep(waitMs).then(() => {
            rateLimitState.remaining = RATE_LIMIT_PER_MINUTE;
            rateLimitState.resetTime = Date.now() + RATE_LIMIT_WINDOW_MS;
            rateLimitState.retryPromise = null; // reset
        });
    }

    await rateLimitState.retryPromise;
}

// Wait for the rate limit to allow a request: any pending 429 retry, the
// per-second spacing, and the per-minute budget.
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

/**
 * Fetching from BM API with rate limit protections
 */
export async function fetchWithRateLimit(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    await awaitRateLimitSlot();

    rateLimitState.lastRequestTime = Date.now();

    const apiUrl = normalizeApiUrl(url);
    const session = await requireSession();
    const signedOptions = await buildSignedInit(apiUrl, options, session);
    const response = await fetch(apiUrl, signedOptions);

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

    const staleDetail = await staleSessionDetail(response);
    if (staleDetail !== null) {
        return recoverFromStaleSession(url, options, session, staleDetail);
    }

    isSessionRecoveryExhausted = false;
    resetSessionRecoveryReloads();
    return response;
}
