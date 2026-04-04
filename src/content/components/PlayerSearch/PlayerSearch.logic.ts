import { ACTIVE_PLAYER_TABLE_CLASS } from '../../../shared/constants';
import { debounce } from '../../../utils/helpers';

/**
 * Filter active players table by search value
 *
 * Returns number of players matching search term
 */
const filterPlayerRows = (): number => {
    const activePlayerSearchInput = document.getElementById(
        'bmhs-player-search'
    ) as HTMLInputElement;
    const inputValue = activePlayerSearchInput.value;

    const filter = inputValue.toLowerCase();

    const activePlayersTable = document.getElementsByClassName(
        ACTIVE_PLAYER_TABLE_CLASS
    )[0];
    const activePlayersTableRows =
        activePlayersTable.getElementsByTagName('tr');

    // Hide rows that don't match search term
    const visibleRows = [];
    const hiddenRows = [];

    for (let i = 0; i < activePlayersTableRows.length; i++) {
        // Skip the header
        if (i === 0) {
            continue;
        }
        const firstCell =
            activePlayersTableRows[i].getElementsByTagName('td')[0];
        if (!firstCell) {
            continue;
        }
        const textValue = firstCell.textContent || firstCell.innerText;
        const matchesFilter = textValue.toLowerCase().includes(filter);
        if (matchesFilter) {
            visibleRows.push(i);
        } else {
            hiddenRows.push(i);
        }
    }

    // Apply layout changes separately to prevent forced reflow violations
    for (const i of visibleRows) {
        activePlayersTableRows[i].style.display = '';
    }
    for (const i of hiddenRows) {
        activePlayersTableRows[i].style.display = 'none';
    }

    return visibleRows.length;
};

/**
 * Display matching player count
 */
const displayMatchingPlayerCount = (
    activePlayerSearchInput: HTMLInputElement,
    matchingCount: number
): void => {
    const matchingPlayerCountText = document.getElementById(
        'bmhs-player-search-matching-count'
    ) as HTMLParagraphElement;
    if (!activePlayerSearchInput.value) {
        matchingPlayerCountText.textContent = '';
    } else if (matchingCount === 1) {
        matchingPlayerCountText.textContent = `${matchingCount} match`;
    } else {
        matchingPlayerCountText.textContent = `${matchingCount} matches`;
    }
};

function handlePlayerSearchInput(): void {
    const activePlayerSearchInput = document.getElementById(
        'bmhs-player-search'
    ) as HTMLInputElement;
    const matchingPlayerCount = filterPlayerRows();
    displayMatchingPlayerCount(activePlayerSearchInput, matchingPlayerCount);
}

/**
 * MutationObserver to automatically filter new rows added to table
 */
const mutationCallback = function (mutationsList: MutationRecord[]) {
    for (const mutation of mutationsList) {
        if (mutation.type !== 'childList') {
            continue;
        }
        // Re-apply search filter
        if (
            mutation.addedNodes.length > 0 ||
            mutation.removedNodes.length > 0
        ) {
            filterPlayerRows();
            break;
        }
    }
};

/**
 * Adds event listener player search input
 */
export function addPlayerSearchListener(): void {
    const activePlayersTable = document.getElementsByClassName(
        ACTIVE_PLAYER_TABLE_CLASS
    )[0];
    const activePlayersTableBody =
        activePlayersTable.getElementsByTagName('tbody')[0];

    const activePlayerSearchInput = document.getElementById(
        'bmhs-player-search'
    ) as HTMLInputElement;

    // Add oninput listener with 200ms debounce
    const debouncedPlayerSearchInput = debounce(handlePlayerSearchInput, 200);
    activePlayerSearchInput.oninput = debouncedPlayerSearchInput;

    // Create observer and start observing active player table childList
    const observer = new MutationObserver(mutationCallback);
    observer.observe(activePlayersTableBody, { childList: true });
}

/**
 * Store listener reference so it can be removed later
 */
let searchShortcutListener: ((event: KeyboardEvent) => void) | null = null;

/**
 * Adds event listener to window for player search shortcut
 *
 * Default is forward slash, CTRL+F can be enabled in extension options
 */
export function addSearchShortcutListener(
    extensionOptions: Record<string, unknown>
): void {
    // Remove existing listener
    removeSearchShortcutListener();

    searchShortcutListener = (event: KeyboardEvent) => {
        // Ignore if already typing in an editable element
        const isEditable =
            document.activeElement!.tagName === 'INPUT' ||
            document.activeElement!.tagName === 'TEXTAREA' ||
            (document.activeElement as HTMLInputElement)!.isContentEditable;

        if (isEditable) return;

        const isSlash = event.key === '/';
        const isCtrlF = (event.ctrlKey || event.metaKey) && event.key === 'f';

        // Only use CTRL + F as trigger if enabled in extensionOptions
        if (isSlash || (extensionOptions['ctrlFAutoSearch'] && isCtrlF)) {
            const activePlayerSearchInput = document.getElementById(
                'bmhs-player-search'
            ) as HTMLInputElement;
            if (activePlayerSearchInput === null) {
                throw new Error('Unable to find activePlayerSearchInput');
            }

            event.preventDefault();
            activePlayerSearchInput.focus();
            activePlayerSearchInput.select();
        }
    };

    window.addEventListener('keydown', searchShortcutListener);
}

/**
 * Removes existing search shortcut listener if there is one
 */
export function removeSearchShortcutListener(): void {
    if (searchShortcutListener) {
        window.removeEventListener('keydown', searchShortcutListener);
        searchShortcutListener = null;
    }
}
