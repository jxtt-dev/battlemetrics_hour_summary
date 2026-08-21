import browser from 'webextension-polyfill';
import { fetchWithRateLimit } from './utils/fetchWithRateLimit';

// Show update page after update is installed
browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'update') {
        browser.tabs.create({
            url: browser.runtime.getURL('update/update.html'),
        });
    }
});

// Fetch from API using background worker
browser.runtime.onMessage.addListener(async (message: unknown) => {
    if (
        message !== null &&
        typeof message === 'object' &&
        'type' in message &&
        message.type === 'FETCH_API' &&
        'url' in message &&
        typeof message.url === 'string'
    ) {
        const response = await fetchWithRateLimit(message.url);
        if (!response.ok) {
            throw new Error(
                `BattleMetrics API Response status: ${response.status}`
            );
        }
        return await response.json();
    }
});
