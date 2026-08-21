import {
    resetState,
    fetchAndStoreHourSummaryData,
    fetchAndStoreSessionData,
} from './content/services';
import { getExtensionOptions } from './utils/extensionOptionHelpers';
import { initFiberDataManager } from './utils/fiberDataManager';
import { isPlayerOverviewPage, isServerPage } from './utils/helpers';
import { compactPlayerPage } from './content/components/CompactPlayerPage';
import {
    render as renderHourSummary,
    renderError,
} from './content/components/HourSummary';
import {
    render as renderPlayerSearch,
    removePlayerSearchObserver,
    removeSearchShortcutListener,
} from './content/components/PlayerSearch';

import './shared/global.css';

// Store last URL to prevent double rendering
let lastHandledUrl: string | null = null;
let isRendering = false;

// Outcome of the last render attempt for lastHandledUrl
let renderStatus: 'none' | 'rendered' | 'error' = 'none';

/**
 * True if the page content for the given URL is already rendered.
 * Non-relevant pages are treated as rendered, since nothing needs to be done.
 */
function isAlreadyRendered(currentUrl: string): boolean {
    if (isPlayerOverviewPage(currentUrl)) {
        return (
            renderStatus === 'rendered' &&
            document.getElementById('bmhs-hour-wrapper') !== null
        );
    }
    if (isServerPage(currentUrl)) {
        return (
            renderStatus === 'rendered' &&
            document.getElementById('bmhs-player-search') !== null
        );
    }
    return true;
}

/**
 * Initialize MutationObserver for page, watching URL changes and DOM mount
 */
function addLocationObserver(callback: () => void) {
    const observer = new MutationObserver(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastHandledUrl) {
            callback();
        } else if (
            !isRendering &&
            renderStatus !== 'error' &&
            !isAlreadyRendered(currentUrl)
        ) {
            callback();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const titleElement = document.querySelector('head > title');
    if (titleElement) {
        observer.observe(titleElement, { childList: true });
    }
}

/**
 * Conditionally render content based on current URL
 */
async function handleLocationChange(): Promise<void> {
    try {
        const currentUrl = window.location.href;
        if (isRendering) return;

        // Skip if already rendered for this URL
        if (currentUrl === lastHandledUrl && isAlreadyRendered(currentUrl)) {
            return;
        }

        isRendering = true;
        lastHandledUrl = currentUrl;
        renderStatus = 'none';

        // Reset data store
        resetState();

        // Remove search shortcut listener and player table observer
        removeSearchShortcutListener();
        removePlayerSearchObserver();

        const extensionOptions = await getExtensionOptions();

        // Player overview page
        if (isPlayerOverviewPage(currentUrl)) {
            const summaryDataPromise = fetchAndStoreHourSummaryData();
            const sessionDataPromise = fetchAndStoreSessionData();

            try {
                await summaryDataPromise;

                if (extensionOptions['playerPageCompactMode']) {
                    await compactPlayerPage(sessionDataPromise);
                }

                // Render Hour Summary page
                await renderHourSummary(sessionDataPromise);
                renderStatus = 'rendered';
                console.log(
                    '[BattleMetrics Hour Summary] Finished generating summary'
                );
            } catch (e) {
                renderStatus = 'error';
                console.error(
                    `[BattleMetrics Hour Summary] Error rendering player page: ${e}`
                );
                console.error(e);
                renderError(e);
            }
        }
        // Server page
        else if (isServerPage(currentUrl)) {
            await renderPlayerSearch(extensionOptions);
            renderStatus = 'rendered';
            console.log('[BattleMetrics Hour Summary] Added player search bar');
        }
    } catch (e) {
        console.error(`[BattleMetrics Hour Summary] Error: ${e}`);
        console.error(e);
    } finally {
        isRendering = false;
    }
}

(async () => {
    try {
        initFiberDataManager();

        addLocationObserver(handleLocationChange);
        window.addEventListener('popstate', () => handleLocationChange());
        await handleLocationChange();
    } catch (e) {
        console.error(`[BattleMetrics Hour Summary] Startup error: ${e}`);
        console.error(e);
    }
})();
