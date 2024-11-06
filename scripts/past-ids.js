// Render all previous usernames seen on BattleMetrics
const renderPastIdentifiers = async (playerId) => {
    let pastIdentifiers = [];
    try {
        pastIdentifiers = await fetchPastIdentifiers(playerId);
    } catch (e) {
        throw e;
    }

    const prevIdDiv = document.getElementById('bm-ids-div');

    // Render a div for each previous identifier
    pastIdentifiers.forEach((identifier) => {
        // Format last seen time
        const lastSeenDate = new Date(
            Date.parse(identifier.attributes.lastSeen)
        );
        const lastSeenText = `${lastSeenDate.toLocaleString([], {
            dateStyle: 'medium',
            timeStyle: 'short',
        })}`;

        const identifierDiv = document.createElement('div');
        identifierDiv.setAttribute('class', 'prev-id');
        identifierDiv.innerHTML = `
            <b>${identifier.attributes.identifier}</b>
            <p title="Last Seen">${lastSeenText}</p>
        `;

        // Add previous identifier div to main div
        prevIdDiv.appendChild(identifierDiv);
    });
};

// Fetch all previous usernames seen on BattleMetrics
const fetchPastIdentifiers = async (playerId) => {
    // Fetch past identifiers
    const url =
        BM_API +
        playerId +
        '?' +
        new URLSearchParams({ include: 'identifier' }).toString();
    try {
        const response = await fetch(url);
        const json = await response.json();
        const pastIdentifiers = json.included;

        return pastIdentifiers;
    } catch (e) {
        throw e;
    }
};
