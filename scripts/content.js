const PLAYER_PAGE_URL = 'https://www.battlemetrics.com/players/';
const BM_API = `https://api.battlemetrics.com/players/`;

const DETAILS_DIV_SELECTOR = '#PlayerPage > div:nth-child(2)';
const DATA_STORE_ID = 'storeBootstrap';
const PLAYER_PAGE_ID = 'PlayerPage';

// Extract player ID from URL
const extractPlayerId = (currentURL) => {
    const url = new URL(currentURL);
    return url.pathname.replace('/players/', '');
}

// Fetch player server data from BattleMetrics API
// API documentation: https://www.battlemetrics.com/developers/documentation#link-GET-player-/players/{(%23%2Fdefinitions%2Fplayer%2Fdefinitions%2Fidentity)}
const fetchServerData = async (playerId) => {
    const url = BM_API + playerId + '?' + new URLSearchParams({ include: 'server' }).toString();
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`BattleMetrics API Response status: ${response.status}`);
        }

        const json = await response.json();
        if (!('included' in json)) {
            throw new Error(`BattleMetrics API returned incorrect data`);
        }
        return json.included;
    } catch (e) {
        throw e;
    }
}

// Calculate hour summary
const calculateHours = (serverData) => {
    let timeData = new Object();

    serverData.forEach((server) => {
        const serverName = server.attributes.name;
        const serverGame = server.relationships.game.data.id;
        const timePlayed = server.meta.timePlayed;

        // Populate game info if it hasn't been seen before
        !(serverGame in timeData) && (timeData[serverGame] = {
            'playTime': 0,
            'serverList': [],
        })

        // Add playtime to game total
        timeData[serverGame]['playTime'] += timePlayed;

        // Add server to server list for game
        timeData[serverGame]['serverList'].push({
            'serverName': serverName,
            'serverPlayTime': timePlayed,
        });
    });

    const formatTime = (time) => (time / 3600).toFixed(2);

    // Sort serverList for each game by playtime and convert playtime from seconds to hours
    Object.keys(timeData).forEach(gameId => {
        const gameData = timeData[gameId];

        // Sort serverList by playtime
        timeData[gameId].serverList.sort((a, b) => b.serverPlayTime - a.serverPlayTime);

        // Convert total playtime of game
        timeData[gameId].playTime = formatTime(gameData.playTime);

        // Convert playtime for each server in serverList
        timeData[gameId].serverList = gameData.serverList.map(serverData => {
            serverData.serverPlayTime = formatTime(serverData.serverPlayTime);
            return serverData;
        });
    });

    return timeData;
}

// Setup initial HTML and add spinner while calculating hour summary
const initHTML = () => {
    const detailsDiv = document.querySelector(DETAILS_DIV_SELECTOR);

    // Create wrapper div
    const wrapperDiv = document.createElement('div');
    wrapperDiv.setAttribute('id', 'bm-hour-wrapper');
    wrapperDiv.setAttribute('class', 'row');

    // Add title
    wrapperDiv.innerHTML = '<div><h4>Hour summary</h4></div>';

    // Insert wrapper after details div
    detailsDiv.parentNode.insertBefore(wrapperDiv, detailsDiv.nextSibling);
    
    // Create inner div
    const summaryDiv = document.createElement('div');
    summaryDiv.setAttribute('id', 'bm-hour-summary');

    // Add spinner to inner div
    summaryDiv.classList.toggle('loading-summary');
    summaryDiv.innerHTML = '<p>Loading Hour Summary...</p>';

    // Insert inner div
    wrapperDiv.appendChild(summaryDiv);
}

// Update HTML with hour summary content
const updateHTML = (timeData) => {
    const summaryDiv = document.getElementById('bm-hour-summary');
    
    // Clear loading state, set height to fit vertical tabs
    summaryDiv.classList.toggle('loading-summary');
    summaryDiv.innerHTML = '';
    summaryDiv.style.setProperty('height', `${64 * Object.keys(timeData).length}px`);
    
    // Add tab buttons
    generateTabButtons(summaryDiv, timeData);

    // Add tab content
    generateTabContents(summaryDiv, timeData);

    // Setup tab buttons
    prepTabs(timeData);
}

const renderHourSummary = async () => {
    try {
        // Setup HTML with loading state
        initHTML();

        // Calculate hour summary
        const playerId = extractPlayerId(window.location.href);
        const serverData = await fetchServerData(playerId);
        const gameTime = calculateHours(serverData);

        // Populate HTML with summary data
        updateHTML(gameTime);
        console.log('BattleMetrics Hour Summary - Finished generating content');
    } catch (e) {
        console.log(`BattleMetrics Hour Summary - ERROR: ${e}`);
    }
}

// Use MutationObserver to trigger renderHourSummary when on a new page
// Required since page content on battlemetrics.com is ajaxed in
const addLocationObserver = (callback) => {
    // Options for the observer (which mutations to observe)
    const config = { attributes: false, childList: true, subtree: false }

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback)

    // Start observing page title for mutations
    const title = document.querySelector('head > title');
    observer.observe(title, config);
}

// Verify that user is on player overview page
const observerCallback = async () => {
    if (
        window.location.href.startsWith(PLAYER_PAGE_URL) 
        && document.getElementById(PLAYER_PAGE_ID)
        && !document.getElementById('bm-hour-wrapper') // Prevent double rendering
    ) {
        await renderHourSummary();
    }
}

(async () => {
    addLocationObserver(observerCallback);
    await observerCallback();
})();
