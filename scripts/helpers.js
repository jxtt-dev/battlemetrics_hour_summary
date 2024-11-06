const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Extract player ID from URL
const extractPlayerId = (currentURL) => {
    const url = new URL(currentURL);
    return url.pathname.replace('/players/', '');
};

const toTitleCase = (str) => {
    return str.replace(
        /\w\S*/g,
        (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
};

// Fetch game name from mapping file. If not found default to title case version of gameId
const gameIdName = (gameId) => {
    return gameId in GAME_NAME_MAPPING
        ? GAME_NAME_MAPPING[gameId]
        : toTitleCase(gameId);
};

// Set up event listener for previous ids toggle
const prepPreviousIDsToggle = () => {
    const prevIdCheckbox = document.getElementById('prev-ids-show-more');
    const prevIdDiv = document.getElementById('bm-ids-div');
    prevIdCheckbox.addEventListener('change', () => {
        prevIdDiv.classList.toggle('bm-ids-show-more');
        const showMoreLabel = document.querySelector(
            'label[for=' + `prev-ids-show-more` + ']'
        );
        showMoreLabel.innerHTML = prevIdCheckbox.checked
            ? 'Hide previous identifiers'
            : 'Show previous identifiers';
    });
};

const prepTabs = (timeData) => {
    // Get all elements with class="tabcontent" and hide all except first
    // Set first element with class="tablinks" to "active"
    const tabLinks = document.getElementsByClassName('tablinks');
    const tabContent = document.getElementsByClassName('tabcontent');
    for (i = 0; i < tabContent.length; i++) {
        if (i === 0) {
            tabContent[0].style.display = 'block';
            tabLinks[0].className += ' active';
        } else {
            tabContent[i].style.display = 'none';
        }
    }

    // Add event listener to each tab button
    Object.keys(timeData).forEach((gameId) => {
        const tabButton = document.getElementById(`${gameId}-button`);
        tabButton.addEventListener('click', () => openTab(tabButton, gameId));
    });

    // Add event listener to each games show more toggle
    Object.keys(timeData).forEach((gameId) => {
        const showMoreCheckbox = document.getElementById(`${gameId}-show-more`);
        if (showMoreCheckbox) {
            showMoreCheckbox.addEventListener('change', () =>
                expandList(showMoreCheckbox, gameId)
            );
        }
    });
};
