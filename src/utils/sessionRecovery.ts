// Manual page-reload recovery for the site's fresh-load session bug.
// Reloads are capped per tab session

// Reload budget, persisted in sessionStorage
// Cleared whenever a request succeeds.
const RELOAD_STORAGE_KEY = 'bmhs_session_reloads';

// Maximum reloads per tab session
const MAX_AUTO_RELOADS = 2;

// At most one reload is scheduled per page load.
let reloadScheduledThisLoad = false;

/**
 * Trigger a page reload to let BattleMetrics re-establish its session, unless
 * one was already scheduled for this load or the budget is exhausted.
 */
export function triggerSessionRecoveryReload(): void {
    if (reloadScheduledThisLoad) {
        return;
    }

    const attempts = Number(sessionStorage.getItem(RELOAD_STORAGE_KEY) ?? 0);
    if (attempts >= MAX_AUTO_RELOADS) {
        return;
    }
    sessionStorage.setItem(RELOAD_STORAGE_KEY, String(attempts + 1));
    reloadScheduledThisLoad = true;

    window.location.reload();
}

/**
 * Clear the reload budget. Called whenever a request succeeds.
 */
export function resetSessionRecoveryReloads(): void {
    sessionStorage.removeItem(RELOAD_STORAGE_KEY);
    reloadScheduledThisLoad = false;
}
