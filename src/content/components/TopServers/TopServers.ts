import { GLOBAL_STATE } from '../../services';
import { showMoreButtonEventListener } from './TopServers.logic';

import './TopServers.css';

/**
 * Generate list of top servers by playtime from GLOBAL_STATE data
 */
export function generateTopServersList(gameId: string): DocumentFragment {
    const topServersFragment = document.createDocumentFragment();
    const topServersDiv = document.createElement('div');
    topServersDiv.className = 'bmhs-server-playtimes';
    topServersDiv.innerHTML =
        '<h5 id="bmhs-highest-playtime-header">Highest playtime: </h5>';

    const gameServerList = GLOBAL_STATE.gamePlaytime[gameId].serverList;

    // Create list of servers
    const topServersList = document.createElement('ol');
    const topServersListFragment = document.createDocumentFragment();
    gameServerList.slice(0, 20).forEach((server) => {
        const serverEntry = document.createElement('li');
        serverEntry.innerHTML += `${server.serverName} — <b>${server.serverPlayTime} hrs</b>`;
        topServersListFragment.appendChild(serverEntry);
    });

    topServersList.appendChild(topServersListFragment);
    topServersDiv.appendChild(topServersList);
    topServersFragment.appendChild(topServersDiv);

    // If more than 5 servers played, render show more toggle
    if (gameServerList.length > 5) {
        const showMoreButton = document.createElement(
            'input'
        ) as HTMLInputElement;
        showMoreButton.type = 'checkbox';
        showMoreButton.className = 'bmhs-show-more-button';
        showMoreButton.id = `${gameId}-show-more`;

        const showMoreLabel = document.createElement(
            'label'
        ) as HTMLLabelElement;
        showMoreLabel.htmlFor = `${gameId}-show-more`;
        showMoreLabel.className = 'bmhs-show-more-label';
        showMoreLabel.innerHTML = 'Show more...';

        topServersFragment.appendChild(showMoreButton);
        topServersFragment.appendChild(showMoreLabel);

        // Add event listener to showMoreButton
        showMoreButton.addEventListener('change', () =>
            showMoreButtonEventListener(
                showMoreButton,
                showMoreLabel,
                topServersList
            )
        );
    }

    return topServersFragment;
}
