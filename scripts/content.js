const renderContent = async () => {
    try {
        // Setup HTML with loading state
        initHTML();

        // Calculate hour summary
        const playerId = extractPlayerId(window.location.href);
        const serverData = await fetchServerData(playerId);
        const gameTime = calculateHours(serverData);

        // Populate HTML with summary data
        updateHTML(gameTime);

        // Render past usernames
        await renderPastIdentifiers(playerId);

        // Empty object to store session data
        let timeframeData = {};

        // Setup event listener to handle changes to timeframe dropdown
        setupTimeframeListener(timeframeData, gameTime, playerId);

        console.log('BattleMetrics Hour Summary - Finished generating content');
    } catch (e) {
        console.log(`BattleMetrics Hour Summary - ERROR: ${e}`);
        renderError();
    }
};

// Use MutationObserver to trigger renderContent when on a new page
// Required since page content on battlemetrics.com is ajaxed in
const addLocationObserver = (callback) => {
    // Options for the observer (which mutations to observe)
    const config = { attributes: false, childList: true, subtree: false };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing page title for mutations
    const title = document.querySelector('head > title');
    observer.observe(title, config);
};

// Verify that user is on player overview page, then render summary
const observerCallback = async () => {
    if (
        window.location.href.startsWith(PLAYER_PAGE_URL) &&
        document.getElementById(PLAYER_PAGE_ID) &&
        !document.getElementById('bm-hour-wrapper') // Prevent double rendering
    ) {
        await renderContent();
    }
};

// Call renderContent once user is on a player overview page
(async () => {
    addLocationObserver(observerCallback);
    await observerCallback();
})();
