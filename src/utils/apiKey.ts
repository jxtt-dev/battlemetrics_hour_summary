import browser from 'webextension-polyfill';
import { API_KEY_STORAGE_KEY } from '../shared/constants';

/**
 * The API token is kept in storage.local rather than storage.sync so it is
 * never pushed to the browser account sync servers.
 */

/**
 * Read the stored BattleMetrics API token
 *
 * @returns string - empty string when no token is stored
 */
export async function getApiKey(): Promise<string> {
    const stored = await browser.storage.local.get(API_KEY_STORAGE_KEY);
    const key = stored[API_KEY_STORAGE_KEY];

    return typeof key === 'string' ? key.trim() : '';
}

/**
 * Store the BattleMetrics API token, removing it when given an empty value
 */
export async function setApiKey(key: string): Promise<void> {
    const trimmed = key.trim();

    if (trimmed === '') {
        await browser.storage.local.remove(API_KEY_STORAGE_KEY);
        return;
    }

    await browser.storage.local.set({ [API_KEY_STORAGE_KEY]: trimmed });
}
