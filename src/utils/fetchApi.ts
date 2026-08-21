import browser from 'webextension-polyfill';

/**
 * Send API request to background service worker
 */
export async function fetchApi<T>(url: string): Promise<T> {
    return (await browser.runtime.sendMessage({
        type: 'FETCH_API',
        url,
    })) as T;
}
