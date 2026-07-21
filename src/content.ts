import {
    PLAYER_PAGE_URL,
    PLAYER_PAGE_ID,
    SERVER_PAGE_URL,
    ACTIVE_PLAYER_TABLE_CLASS,
} from './shared/constants';
import {
    resetState,
    fetchAndStoreHourSummaryData,
    fetchAndStoreSessionData,
} from './content/services';
import { getExtensionOptions } from './utils/extensionOptionHelpers';
import { compactPlayerPage } from './content/components/CompactPlayerPage';
import { renderApiKeyNotice } from './content/components/ApiKeyNotice';
import { BMApiError } from './utils/bmApi';
import { render as renderHourSummary } from './content/components/HourSummary';
import {
    render as renderPlayerSearch,
    removeSearchShortcutListener,
} from './content/components/PlayerSearch';

import './shared/global.css';

// Store last URL to prevent double rendering
let lastHandledUrl: string | null = null;
let isRendering = false;

/**
 * Initialize MutationObserver for page, using page title
 */
function addLocationObserver(callback: MutationCallback) {
    // Options for the observer (which mutations to observe)
    const config = { attributes: false, childList: true, subtree: false };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing page title for mutations
    const titleElement: HTMLTitleElement | null =
        document.querySelector('head > title');

    if (!titleElement) {
        console.error('[BattleMetrics Hour Summary] Title element not found.');
        return;
    }
    observer.observe(titleElement, config);
}

/**
 * Conditionally render content based on current URL
 */
async function handleLocationChange(): Promise<void> {
    try {
        // Prevent duplicate rendering for same URL or while rendering
        const currentUrl = window.location.href;
        if (isRendering || currentUrl === lastHandledUrl) return;
        isRendering = true;
        lastHandledUrl = currentUrl;

        // Reset data store
        resetState();

        // Remove search shortcut listener
        removeSearchShortcutListener();

        const extensionOptions = await getExtensionOptions();

        // Player summary page
        if (
            window.location.href.startsWith(PLAYER_PAGE_URL) &&
            !document.getElementById('bmhs-hour-wrapper')
        ) {
            // Fetch initial server, identifier data then store in GLOBAL_STATE
            const summaryDataPromise = fetchAndStoreHourSummaryData();
            const sessionDataPromise = fetchAndStoreSessionData();

            // Both requests fail together when the API token is missing or
            // invalid, so keep the session rejection from going unhandled
            sessionDataPromise.catch(() => {});

            // Await summaryDataPromise first, as it generally resolves faster
            // sessionDataPromise will be awaited closer to the UI elements that need it
            // to prevent the slower request from blocking UI rendering
            await summaryDataPromise;

            if (extensionOptions['playerPageCompactMode']) {
                await compactPlayerPage(sessionDataPromise);
            }

            // Render Hour Summary page
            await renderHourSummary(sessionDataPromise);
            console.log('[BattleMetrics Hour Summary] Finished generating summary');
        }
        // Server page
        else if (
            window.location.href.startsWith(SERVER_PAGE_URL) &&
            !document.getElementById('bmhs-player-search')
        ) {
            await renderPlayerSearch(extensionOptions);
            console.log('[BattleMetrics Hour Summary] Added player search bar');
        }
    } catch (e) {
        // Tell the user when the API token is the problem, as the summary
        // cannot render at all without a valid one
        if (e instanceof BMApiError && e.isTokenProblem) {
            renderApiKeyNotice(e);
        }
        console.error(`[BattleMetrics Hour Summary] Error: ${e}`);
        console.error(e);
    } finally {
        isRendering = false;
    }
}

(async () => {
    try {
        addLocationObserver(handleLocationChange);
        await handleLocationChange();
    } catch (e) {
        console.error(`[BattleMetrics Hour Summary] Startup error: ${e}`);
        console.error(e);
    }
})();
