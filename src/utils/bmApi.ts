import browser from 'webextension-polyfill';
import { BM_API_REQUEST_MESSAGE } from '../shared/constants';
import {
    BMApiErrorReason,
    BMApiRequestMessage,
    BMApiResponseMessage,
} from '../shared/types';

/**
 * Error thrown when a BattleMetrics API request fails, carrying the reason so
 * the UI can tell an expired token apart from a plain network failure.
 */
export class BMApiError extends Error {
    reason: BMApiErrorReason;
    status: number;

    constructor(reason: BMApiErrorReason, status: number, message: string) {
        super(message);
        this.name = 'BMApiError';
        this.reason = reason;
        this.status = status;
    }

    /** True when the user needs to add or replace their API token */
    get isTokenProblem(): boolean {
        return (
            this.reason === 'missing-key' ||
            this.reason === 'unauthorized' ||
            this.reason === 'forbidden'
        );
    }
}

/**
 * Fetch a BattleMetrics API URL through the background proxy, which attaches
 * the stored API token.
 *
 * @returns Promise<unknown> - parsed JSON body
 */
export async function fetchFromBMApi(url: string): Promise<unknown> {
    const message: BMApiRequestMessage = {
        type: BM_API_REQUEST_MESSAGE,
        url,
    };

    let response: BMApiResponseMessage | undefined;
    try {
        response = (await browser.runtime.sendMessage(message)) as
            | BMApiResponseMessage
            | undefined;
    } catch (e) {
        throw new BMApiError(
            'network',
            0,
            `Could not reach the extension background script: ${e}`
        );
    }

    if (!response) {
        throw new BMApiError(
            'network',
            0,
            'No response from the extension background script'
        );
    }

    if (!response.ok) {
        throw new BMApiError(response.reason, response.status, response.message);
    }

    return response.data;
}
