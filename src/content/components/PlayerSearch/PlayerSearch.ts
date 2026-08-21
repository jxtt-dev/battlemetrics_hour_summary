import { ACTIVE_PLAYER_TABLE_CLASS } from '../../../shared/constants';
import type { ExtensionOptionsState } from '../../../shared/extensionOptions';
import { waitForElement } from '../../../utils/helpers';
import {
    addPlayerSearchListener,
    addSearchShortcutListener,
} from './PlayerSearch.logic';

import './PlayerSearch.css';

async function initPlayerSearchHTML(
    extensionOptions: ExtensionOptionsState
): Promise<void> {
    // Prevent double rendering
    const existingWrapper = document.getElementById(
        'bmhs-player-title-wrapper'
    );
    if (existingWrapper) {
        return;
    }

    // Wait for active players table to render
    await waitForElement(`.${ACTIVE_PLAYER_TABLE_CLASS}`);

    const activePlayersTable = document.getElementsByClassName(
        ACTIVE_PLAYER_TABLE_CLASS
    )[0];
    const tableWrapper = activePlayersTable.parentNode as HTMLDivElement;
    const activePlayerTitle = tableWrapper.querySelector('h4');

    if (!activePlayerTitle) {
        throw new Error('Active player table not found');
    }

    // Wrap table title in div, add player search input
    const activePlayerTitleWrapper = document.createElement('div');
    activePlayerTitleWrapper.id = 'bmhs-player-title-wrapper';

    tableWrapper.insertBefore(activePlayerTitleWrapper, activePlayerTitle);
    activePlayerTitleWrapper.appendChild(activePlayerTitle);

    // Wrapper for search input
    const searchWrapper = document.createElement('div');
    searchWrapper.id = 'bmhs-player-search-wrapper';

    // Create search input
    const activePlayerSearchInput = document.createElement('input');
    activePlayerSearchInput.id = 'bmhs-player-search';
    activePlayerSearchInput.className = 'form-control';
    activePlayerSearchInput.type = 'search';
    const placeholderTextAddition = extensionOptions['ctrlFAutoSearch']
        ? '(CTRL+F to search)'
        : '';
    activePlayerSearchInput.setAttribute(
        'placeholder',
        `Search for a player... ${placeholderTextAddition}`
    );

    searchWrapper.append(activePlayerSearchInput);

    // Matching player count
    const matchingPlayerCountText = document.createElement('p');
    matchingPlayerCountText.id = 'bmhs-player-search-matching-count';
    matchingPlayerCountText.textContent = '';

    searchWrapper.append(matchingPlayerCountText);

    activePlayerTitleWrapper.append(searchWrapper);
}

export async function render(extensionOptions: ExtensionOptionsState) {
    try {
        await initPlayerSearchHTML(extensionOptions);
        addPlayerSearchListener();
        addSearchShortcutListener(extensionOptions);
    } catch (e) {
        console.error(
            `[BattleMetrics Hour Summary] Error rendering player search: ${e}`
        );
        console.error(e);
    }
}
