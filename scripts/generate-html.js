// Update HTML with hour summary content
const updateHTML = (totalData) => {
    const summaryDiv = document.getElementById('bm-hour-summary');

    // Clear loading state, set height to fit vertical tabs
    summaryDiv.classList.toggle('loading-state');
    summaryDiv.innerHTML = '';
    summaryDiv.style.setProperty(
        'height',
        `${70 * Object.keys(totalData).length}px`
    );

    // Setup previous IDs toggle
    prepPreviousIDsToggle();

    // Add tab buttons
    generateTabButtons(summaryDiv, totalData);

    // Add tab content
    generateTabContents(summaryDiv, totalData);

    // Setup tab buttons
    prepTabs(totalData);
};

// Render error state
const renderError = () => {
    const summaryDiv = document.getElementById('bm-hour-summary');
    summaryDiv.classList.add('loading-state');
    summaryDiv.innerHTML = '<p>Error generating Hour Summary<p>';
};

const generateTabButtons = (summaryDiv, timeData) => {
    // Div to hold tabs
    const tabDiv = document.createElement('div');
    tabDiv.classList.add('tab');

    // Tab button for each game
    Object.keys(timeData).forEach((gameId) => {
        const tabButton = document.createElement('button');
        tabButton.textContent = gameIdName(gameId);
        tabButton.id = `${gameId}-button`;
        tabButton.classList.add('tablinks');
        tabDiv.appendChild(tabButton);
    });

    // Append to summaryDiv
    summaryDiv.appendChild(tabDiv);
};

// Tab content for each game
const generateTabContents = (summaryDiv, timeData) => {
    Object.keys(timeData).forEach((gameId) => {
        const tabContentDiv = document.createElement('div');
        tabContentDiv.setAttribute('id', `${gameId}-tab`);
        tabContentDiv.setAttribute('class', 'tabcontent');

        tabContentDiv.innerHTML = `
            <h3>${gameIdName(gameId)}</h3>
            <h4>${timeData[gameId].playTime} hrs on BattleMetrics</h4>
        `;

        // Show hours in past X weeks
        // TODO: add hover tooltip (title="...") that shows the date being calculated to
        const pastWeeksHoursDiv = document.createElement('div');
        pastWeeksHoursDiv.setAttribute('id', `${gameId}-past-weeks-hours`);
        pastWeeksHoursDiv.setAttribute('class', `past-weeks-hours`);

        // Option value is number of weeks
        pastWeeksHoursDiv.innerHTML = `
            <label for="${gameId}-timeframe-selector">— hours past</label>
            <select
                id="${gameId}-timeframe-selector"
                name="${gameId}-timeframe-selector"
                title="Select time frame"
                required
            >
                <option value="" disabled selected>Select</option>
                <option value="2">2 weeks</option>
                <option value="4">1 month</option>
                <option value="12">3 months</option>
                <option value="24">6 months</option>
                <option value="52">1 year</option>
            </select>
            <p class="timeframe-estimation-text">&nbsp;(estimated, public sessions only)</p>
        `;

        tabContentDiv.appendChild(pastWeeksHoursDiv);

        // List top servers by playtime
        const topServersDiv = document.createElement('div');
        topServersDiv.setAttribute('class', 'server-playtimes');
        let topServersDivInnerHTML =
            '<h5 id="highest-playtime-header">Highest playtime: </h5>';

        topServersDivInnerHTML += '<ol>';
        timeData[gameId].serverList.slice(0, 20).forEach((server) => {
            topServersDivInnerHTML += `<li>${server.serverName} — <b>${server.serverPlayTime} hrs</b></li>`;
        });
        topServersDivInnerHTML += '</ol></div>';

        topServersDiv.innerHTML = topServersDivInnerHTML;
        tabContentDiv.appendChild(topServersDiv);

        // If more than 5 servers played, render show more toggle
        if (timeData[gameId].serverList.length > 5) {
            const showMoreButton = document.createElement('input');
            showMoreButton.setAttribute('type', 'checkbox');
            showMoreButton.setAttribute('id', `${gameId}-show-more`);

            const showMoreLabel = document.createElement('label');
            showMoreLabel.setAttribute('for', `${gameId}-show-more`);
            showMoreLabel.setAttribute('id', 'show-more-label');
            showMoreLabel.innerHTML = 'Show more...';

            tabContentDiv.appendChild(showMoreButton);
            tabContentDiv.appendChild(showMoreLabel);
        }

        // Append to summaryDiv
        summaryDiv.appendChild(tabContentDiv);
    });
};

// Open tab when button is pressed
const openTab = (button, gameId) => {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName('tabcontent');
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = 'none';
    }
    tablinks = document.getElementsByClassName('tablinks');
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(' active', '');
    }
    document.getElementById(`${gameId}-tab`).style.display = 'block';
    button.className += ' active';
};

// Expand most played server list when show more toggle is pressed
const expandList = (checkbox, gameId) => {
    const gameTab = document.getElementById(`${gameId}-tab`);
    gameTab.classList.toggle('show-rest');
    const showMoreLabel = document.querySelector(
        'label[for=' + `${gameId}-show-more` + ']'
    );
    showMoreLabel.innerHTML = checkbox.checked
        ? 'Show less...'
        : 'Show more...';
};

// Add event listener for past timeframe dropdown
const setupTimeframeListener = async (timeframeData, totalData, playerId) => {
    const onChange = async (selectorValue, gameId) => {
        const timeframeLabel = document.querySelector(
            `label[for=${gameId}-timeframe-selector]`
        );

        // Set label to loading spinner while fetching data
        timeframeLabel.innerHTML = '<div class="css-loader"></div> hours past';

        // Fetch and update timeframeData if additional data is required
        timeframeData = await onTimeframeChange(
            timeframeData,
            playerId,
            selectorValue
        );

        // console.log(timeframeData);

        // Calculate total time placed in selected timeframe
        const gameTimeframData = timeframeData[gameId];
        let timeFrameTotal = gameTimeframData
            .slice(0, selectorValue)
            .reduce((a, b) => a + b, 0);
        timeFrameTotal = Math.round(timeFrameTotal * 100) / 100; // Round to 2 decimal places

        // Update HTML
        timeframeLabel.innerHTML = `${timeFrameTotal} hours past`;
    };

    // Setup event listener for each game
    Object.keys(totalData).forEach((gameId) => {
        const timeframeSelector = document.getElementById(
            `${gameId}-timeframe-selector`
        );

        timeframeSelector.addEventListener('change', async (event) => {
            const selectorValue = parseInt(event.target.value);
            onChange(selectorValue, gameId);
        });
    });
};

const onTimeframeChange = async (timeframeData, playerId, numberOfWeeks) => {
    // Check if sessions up to numberOfWeeks have already been processed
    if (
        Object.keys(timeframeData).length !== 0 &&
        Object.values(timeframeData)[0].length >= numberOfWeeks - 1
    ) {
        return timeframeData;
    }
    // Otherwise fetch additional data required and update timeframeData
    const sessionData = await fetchSessionData(playerId, numberOfWeeks);
    const newTimeframeData = calculatePastSessions(sessionData, numberOfWeeks);

    return newTimeframeData;
};
