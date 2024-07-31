const generateTabButtons = (summaryDiv, timeData) => {
    // Div to hold tabs
    const tabDiv = document.createElement('div');
    tabDiv.classList.add('tab');

    // Tab button for each game
    Object.keys(timeData).forEach(gameId => {
        const tabButton = document.createElement('button');
        tabButton.textContent = gameIdName(gameId);
        tabButton.id = `${gameId}-button`;
        tabButton.classList.add('tablinks');
        tabDiv.appendChild(tabButton);
    });

    // Append to summaryDiv
    summaryDiv.appendChild(tabDiv);
};

const generateTabContents = (summaryDiv, timeData) => {
    // Tab content for each game
    Object.keys(timeData).forEach((gameId, idx) => {
        const tabContentDiv = document.createElement('div');
        tabContentDiv.setAttribute('id', `${gameId}-tab`);
        tabContentDiv.setAttribute('class', 'tabcontent');

        let tabInnerHTML = '';
        tabInnerHTML += `
            <h3>${gameIdName(gameId)}</h3>
            <h4 id="hour-text">${timeData[gameId].playTime} hrs on BattleMetrics</h4>
        `;

        // List top servers by playtime
        tabInnerHTML += `
            <h5>Highest playtime: </h5>
            <div class="server-playtimes">
        `
        tabInnerHTML += '<ol>';
        timeData[gameId].serverList.slice(0, 20).forEach(server => {
            tabInnerHTML += `<li>${server.serverName} — <b>${server.serverPlayTime} hrs</b></li>`
        });
        tabInnerHTML += '</ol></div>';

        tabContentDiv.innerHTML = tabInnerHTML;

        // If more than 5 servers played, render show more toggle
        if (timeData[gameId].serverList.length > 5) {
            const showMoreButton = document.createElement('input');
            showMoreButton.setAttribute('type', 'checkbox');
            showMoreButton.setAttribute('id', `${gameId}-show-more`);

            const showMoreLabel = document.createElement('label');
            showMoreLabel.setAttribute('for', `${gameId}-show-more`);
            showMoreLabel.setAttribute('id', 'show-more-label')
            showMoreLabel.innerHTML = 'Show more...';

            tabContentDiv.appendChild(showMoreButton);
            tabContentDiv.appendChild(showMoreLabel);
        }

        // Append to summaryDiv
        summaryDiv.appendChild(tabContentDiv);
    });
}

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
}

// Expand most played server list when show more toggle is pressed
const expandList = (checkbox, gameId) => {
    const gameTab = document.getElementById(`${gameId}-tab`);
    gameTab.classList.toggle('show-rest');
    const showMoreLabel = document.querySelector('label[for=' + `${gameId}-show-more` + ']');
    showMoreLabel.innerHTML = checkbox.checked ? 'Show less...' : 'Show more...';
}