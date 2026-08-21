import { GLOBAL_STATE } from '../../services';
import { getGameNameFromId } from '../../../utils/helpers';
import { generatePeriodPlaytime } from '../PeriodPlaytime';
import { addGraphWrapper } from '../GraphWrapper';
import { generateTopServersList } from '../TopServers';
import { prepGameTabs } from './GameTab.logic';

import './GameTab.css';

/**
 * Generate tab button for each game
 */
export function generateTabButtons() {
    const gamePlaytime = GLOBAL_STATE.gamePlaytime;

    const summaryDiv = document.getElementById('bmhs-hour-summary');
    if (summaryDiv === null) {
        throw new Error('Hour Summary HTML is malformed');
    }

    // Div to hold tabs
    const tabDiv = document.createElement('div');
    tabDiv.className = 'bmhs-tab';

    // Tab button for each game
    Object.keys(gamePlaytime).forEach((gameId) => {
        const tabButton = document.createElement('button');
        tabButton.textContent = getGameNameFromId(gameId);
        tabButton.id = `${gameId}-button`;
        tabButton.className = 'bmhs-tablinks';
        tabDiv.appendChild(tabButton);
    });

    // Append to summaryDiv
    summaryDiv.appendChild(tabDiv);
}

/**
 * Generate tab with summary for each game
 */
export function generateGameTabs(hasApiKey = false) {
    const gamePlaytime = GLOBAL_STATE.gamePlaytime;
    const summaryDiv = document.getElementById('bmhs-hour-summary');
    if (summaryDiv === null) {
        throw new Error('Hour Summary HTML is malformed');
    }

    // Document fragment for all tabs
    const gameTabFragment = document.createDocumentFragment();

    // Set tab height based on number of games
    const minHeight = Math.max(300, 70 * Object.keys(gamePlaytime).length);

    // Create tab for each game
    Object.keys(gamePlaytime).forEach((gameId) => {
        const tabContentDiv = document.createElement('div');
        tabContentDiv.id = `${gameId}-tab`;
        tabContentDiv.className = 'bmhs-tabcontent';
        tabContentDiv.style.minHeight = `${minHeight}px`;

        tabContentDiv.innerHTML = `
            <h3>${getGameNameFromId(gameId)}</h3>
            <div class="bmhs-hour-count-wrapper"
                title="All hours shown are an estimation based on data available on BattleMetrics. Playtime from deleted servers, private sessions, or servers not tracked by BattleMetrics are not included in this summary. All data is based on UTC time."
            >
                <h4>${gamePlaytime[gameId].playTime} hrs on BattleMetrics</h4>
                <!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE -->
                <svg id="bmhs-help-icon" alt="Help icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M11.95 18q.525 0 .888-.363t.362-.887t-.362-.888t-.888-.362t-.887.363t-.363.887t.363.888t.887.362m.05 4q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m.1-12.3q.625 0 1.088.4t.462 1q0 .55-.337.975t-.763.8q-.575.5-1.012 1.1t-.438 1.35q0 .35.263.588t.612.237q.375 0 .638-.25t.337-.625q.1-.525.45-.937t.75-.788q.575-.55.988-1.2t.412-1.45q0-1.275-1.037-2.087T12.1 6q-.95 0-1.812.4T8.975 7.625q-.175.3-.112.638t.337.512q.35.2.725.125t.625-.425q.275-.375.688-.575t.862-.2"/></svg>
            </div>
        `;

        // Append period playtime display and selector
        const periodPlaytime: HTMLDivElement = generatePeriodPlaytime(
            gameId,
            hasApiKey
        );
        tabContentDiv.appendChild(periodPlaytime);

        // Add graph wrapper and buttons
        addGraphWrapper(tabContentDiv, gameId);

        // Append top servers list
        const topServersDiv: DocumentFragment = generateTopServersList(gameId);
        tabContentDiv.appendChild(topServersDiv);

        gameTabFragment.appendChild(tabContentDiv);
    });
    summaryDiv.appendChild(gameTabFragment);

    // Add event listeners for all game tab buttons
    prepGameTabs();
}
