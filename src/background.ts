import browser from 'webextension-polyfill';
import { BM_API_REQUEST_MESSAGE } from './shared/constants';
import { BMApiRequestMessage, BMApiResponseMessage } from './shared/types';
import { fetchWithRateLimit } from './utils/fetchWithRateLimit';
import { getApiKey } from './utils/apiKey';

const BM_API_ORIGIN = 'https://api.battlemetrics.com';

/**
 * The BattleMetrics API now requires a token, and attaching an Authorization
 * header from a content script would need a CORS preflight the API does not
 * answer. Requests are therefore proxied through the background script, which
 * is exempt from CORS thanks to the api.battlemetrics.com host permission.
 * It also keeps the token out of every page the content script runs on.
 */

function isBattleMetricsUrl(url: string): boolean {
    try {
        return new URL(url).origin === BM_API_ORIGIN;
    } catch {
        return false;
    }
}

async function handleApiRequest(url: string): Promise<BMApiResponseMessage> {
    if (!isBattleMetricsUrl(url)) {
        return {
            ok: false,
            reason: 'bad-response',
            status: 0,
            message: `Refusing to proxy non-BattleMetrics URL: ${url}`,
        };
    }

    const apiKey = await getApiKey();
    if (apiKey === '') {
        return {
            ok: false,
            reason: 'missing-key',
            status: 0,
            message: 'No BattleMetrics API token saved',
        };
    }

    let response: Response;
    try {
        response = await fetchWithRateLimit(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json',
            },
        });
    } catch (e) {
        return {
            ok: false,
            reason: 'network',
            status: 0,
            message: `Request to the BattleMetrics API failed: ${e}`,
        };
    }

    if (response.status === 401) {
        return {
            ok: false,
            reason: 'unauthorized',
            status: 401,
            message: 'BattleMetrics rejected the API token',
        };
    }

    if (response.status === 403) {
        return {
            ok: false,
            reason: 'forbidden',
            status: 403,
            message: 'The API token is missing the required permissions',
        };
    }

    if (!response.ok) {
        return {
            ok: false,
            reason: 'bad-response',
            status: response.status,
            message: `BattleMetrics API Response status: ${response.status}`,
        };
    }

    try {
        return { ok: true, data: await response.json() };
    } catch (e) {
        return {
            ok: false,
            reason: 'bad-response',
            status: response.status,
            message: `BattleMetrics API returned invalid JSON: ${e}`,
        };
    }
}

browser.runtime.onMessage.addListener((
    message: unknown
): Promise<BMApiResponseMessage> | undefined => {
    const request = message as Partial<BMApiRequestMessage>;

    if (request?.type !== BM_API_REQUEST_MESSAGE || typeof request.url !== 'string') {
        return undefined;
    }

    // Returning a promise keeps the message channel open until it settles
    return handleApiRequest(request.url);
});
