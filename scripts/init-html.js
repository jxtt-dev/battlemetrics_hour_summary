// Setup initial HTML
const initHTML = () => {
    // #############
    // HOUR SUMMARY
    // #############

    const serversDiv = document.querySelector(SERVERS_DIV_SELECTOR);

    // Create wrapper div for hour summary
    const hourWrapperDiv = document.createElement('div');
    hourWrapperDiv.setAttribute('id', 'bm-hour-wrapper');
    hourWrapperDiv.setAttribute('class', 'row');

    // Add title
    hourWrapperDiv.innerHTML = '<div><h4>Hour summary</h4></div>';

    // Insert hour summary after details div
    serversDiv.parentNode.insertBefore(hourWrapperDiv, serversDiv);

    // Create inner div
    const summaryDiv = document.createElement('div');
    summaryDiv.setAttribute('id', 'bm-hour-summary');

    // Add loading info to inner div
    summaryDiv.classList.toggle('loading-state');
    summaryDiv.innerHTML = '<p>Loading Hour Summary...</p>';

    // Insert inner div
    hourWrapperDiv.appendChild(summaryDiv);

    // ####################
    // PREVIOUS IDENTIFIERS
    // ####################

    // Create wrapper div for previous identifiers
    const prevIdsWrapperDiv = document.createElement('div');
    prevIdsWrapperDiv.setAttribute('id', 'bm-ids-wrapper');
    prevIdsWrapperDiv.setAttribute('class', 'row');

    // Add title
    const prevIdsTitleDiv = document.createElement('div');
    prevIdsTitleDiv.setAttribute('id', 'bm-ids-title');

    // Create show/hide button
    const showButton = document.createElement('input');
    showButton.setAttribute('type', 'checkbox');
    showButton.setAttribute('id', `prev-ids-show-more`);

    const showLabel = document.createElement('label');
    showLabel.setAttribute('for', `prev-ids-show-more`);
    showLabel.setAttribute('id', 'show-ids-label');
    showLabel.innerHTML = 'Show previous identifiers';

    // Create previous ids div, hidden on first load
    const prevIdsDiv = document.createElement('div');
    prevIdsDiv.setAttribute('id', 'bm-ids-div');
    prevIdsDiv.innerHTML =
        '<div id="prev-id-title"><h4>Previous Identifiers</h4></div>';

    prevIdsWrapperDiv.appendChild(showButton);
    prevIdsWrapperDiv.appendChild(showLabel);
    prevIdsWrapperDiv.appendChild(prevIdsDiv);

    // Insert previous ids after details div
    const usernameDiv = document.querySelector(USERNAME_SELECTOR);
    usernameDiv.parentNode.insertBefore(
        prevIdsWrapperDiv,
        usernameDiv.nextSibling
    );
};
