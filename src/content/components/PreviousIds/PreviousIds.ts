import { GLOBAL_STATE } from '../../services';
import { USERNAME_SELECTOR } from '../../../shared/constants';
import {
    prepPrevIdsToggle,
    addPrevIdSearchListener,
} from './PreviousIds.logic';

import './PreviousIds.css';

/**
 * Init Previous Identifier HTML
 */
export function initPrevIdsHTML(hasApiKey = true): void {
    if (document.getElementById('bmhs-prev-ids-wrapper')) {
        return;
    }
    const usernameDiv = document.querySelector(USERNAME_SELECTOR);
    if (usernameDiv === null || usernameDiv.parentNode === null) {
        throw new Error('Unable to find USERNAME_SELECTOR');
    }

    // Create document fragment and wrapper div for previous identifiers
    const prevIdsWrapperFragment = document.createDocumentFragment();
    const prevIdsWrapperDiv = document.createElement('div');
    prevIdsWrapperDiv.id = 'bmhs-prev-ids-wrapper';
    prevIdsWrapperDiv.className = 'row';

    if (!hasApiKey) {
        prevIdsWrapperDiv.innerHTML = `
            <input id="bmhs-prev-ids-show-more" type="checkbox" disabled>
            <label
                id="bmhs-show-ids-label"
                class="bmhs-disabled"
                title="Viewing previous identifiers requires a BattleMetrics API key. View the options page for more information."
            >
                Show previous identifiers
            </label>
        `;
    } else {
        prevIdsWrapperDiv.innerHTML = `
            <input id="bmhs-prev-ids-show-more" type="checkbox">
            <label id="bmhs-show-ids-label" for="bmhs-prev-ids-show-more">
                Show previous identifiers
            </label>

            <div id="bmhs-ids-div">
                <div id="bmhs-prev-id-title-wrapper">
                    <div>
                        <h4 id="bmhs-prev-id-title">Previous Identifiers</h4>
                        <h6 id="bmhs-prev-id-count"></h6>
                    </div>
                    <input id="bmhs-prev-id-search" class="form-control" type="search" placeholder="Search previous identifiers..."/>
                </div>
            </div>
        `;
    }

    prevIdsWrapperFragment.appendChild(prevIdsWrapperDiv);

    // Insert previous ids before details div
    usernameDiv.parentNode.insertBefore(
        prevIdsWrapperFragment,
        usernameDiv.nextSibling
    );
}

/**
 * Populate Previous Identifier HTML, setup event listeners
 */
export function populatePrevIdsHTML(): void {
    if (GLOBAL_STATE.identifierData.length === 0) {
        throw new Error('identifierData not found in GLOBAL_STATE');
    }
    const pastIdentifiers = GLOBAL_STATE.identifierData;

    // Display past identifier count
    const prevIdCount = document.getElementById('bmhs-prev-id-count');
    if (prevIdCount === null) {
        throw new Error('Previous IDs HTML is malformed');
    }
    prevIdCount.innerText = `${pastIdentifiers.length}`;

    const prevIdDiv = document.getElementById('bmhs-ids-div');
    if (prevIdDiv === null) {
        throw new Error('Previous IDs HTML is malformed');
    }

    // Reusable date formatter
    const lastSeenDateFormatter = new Intl.DateTimeFormat([], {
        dateStyle: 'medium',
        timeStyle: 'short',
    });

    // Document fragment for all previous ids
    const prevIdsFragment = document.createDocumentFragment();

    // Add a div for each previous identifier
    pastIdentifiers.forEach((identifier) => {
        const lastSeenDate = new Date(
            Date.parse(identifier.attributes.lastSeen)
        );
        const formattedLastSeen = lastSeenDateFormatter.format(lastSeenDate);

        const identifierDiv = document.createElement('div');
        identifierDiv.className = 'bmhs-prev-id';

        const identifierName = document.createElement('b');
        identifierName.textContent = identifier.attributes.identifier;
        const lastSeenText = document.createElement('p');
        lastSeenText.title = 'Last Seen';
        lastSeenText.textContent = formattedLastSeen;

        identifierDiv.append(identifierName, lastSeenText);

        // Add previous identifier div to fragment
        prevIdsFragment.appendChild(identifierDiv);
    });
    prevIdDiv.appendChild(prevIdsFragment);

    // Setup event listeners for previous id button toggle and previous id search
    prepPrevIdsToggle();
    addPrevIdSearchListener();
}
