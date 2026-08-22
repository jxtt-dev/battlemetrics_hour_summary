import { GLOBAL_STATE } from '../../services';
import {
    SERVERS_DIV_SELECTOR,
    PLAYER_PAGE_ID,
} from '../../../shared/constants';
import {
    SessionExpiredError,
    SessionUnavailableError,
} from '../../../shared/types';
import type { ExtensionOptionsState } from '../../../shared/extensionOptions';
import {
    generateSessionDurationString,
    getCurrentSession,
    waitForElement,
} from '../../../utils/helpers';
import { getExtensionOptions } from '../../../utils/extensionOptionHelpers';
import { triggerSessionRecoveryReload } from '../../../utils/sessionRecovery';
import { initPrevIdsHTML, populatePrevIdsHTML } from '../PreviousIds';
import { generateTabButtons, generateGameTabs } from '../GameTab';

import './HourSummary.css';

/**
 * Ensure the hour summary wrapper exists in the DOM, creating it if missing.
 *
 * @returns the hour summary wrapper div
 */
function ensureHourSummaryWrapper(): HTMLDivElement {
    const existing = document.getElementById('bmhs-hour-wrapper');
    if (existing) {
        return existing as HTMLDivElement;
    }

    const hourWrapperDiv = document.createElement('div');
    hourWrapperDiv.id = 'bmhs-hour-wrapper';
    hourWrapperDiv.className = 'row';

    // Add title and GitHub link
    const titleWrapper = document.createElement('div');
    titleWrapper.id = 'bmhs-hour-summary-title-wrapper';
    titleWrapper.innerHTML = `
        <h4>Hour summary</h4>
        <a id="bmhs-github-link" href="https://github.com/jxtt-dev/battlemetrics_hour_summary" target="_blank" rel="noopener noreferrer">
            <svg width="98" height="96" viewBox="0 0 98 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_730_27126)">
                    <path d="M41.4395 69.3848C28.8066 67.8535 19.9062 58.7617 19.9062 46.9902C19.9062 42.2051 21.6289 37.0371 24.5 33.5918C23.2559 30.4336 23.4473 23.7344 24.8828 20.959C28.7109 20.4805 33.8789 22.4902 36.9414 25.2656C40.5781 24.1172 44.4062 23.543 49.0957 23.543C53.7852 23.543 57.6133 24.1172 61.0586 25.1699C64.0254 22.4902 69.2891 20.4805 73.1172 20.959C74.457 23.543 74.6484 30.2422 73.4043 33.4961C76.4668 37.1328 78.0937 42.0137 78.0937 46.9902C78.0937 58.7617 69.1934 67.6621 56.3691 69.2891C59.623 71.3945 61.8242 75.9883 61.8242 81.252L61.8242 91.2051C61.8242 94.0762 64.2168 95.7031 67.0879 94.5547C84.4102 87.9512 98 70.6289 98 49.1914C98 22.1074 75.9883 6.69539e-07 48.9043 4.309e-07C21.8203 1.92261e-07 -1.9479e-07 22.1074 -4.3343e-07 49.1914C-6.20631e-07 70.4375 13.4941 88.0469 31.6777 94.6504C34.2617 95.6074 36.75 93.8848 36.75 91.3008L36.75 83.6445C35.4102 84.2188 33.6875 84.6016 32.1562 84.6016C25.8398 84.6016 22.1074 81.1563 19.4277 74.7441C18.375 72.1602 17.2266 70.6289 15.0254 70.3418C13.877 70.2461 13.4941 69.7676 13.4941 69.1934C13.4941 68.0449 15.4082 67.1836 17.3223 67.1836C20.0977 67.1836 22.4902 68.9063 24.9785 72.4473C26.8926 75.2227 28.9023 76.4668 31.2949 76.4668C33.6875 76.4668 35.2187 75.6055 37.4199 73.4043C39.0469 71.7773 40.291 70.3418 41.4395 69.3848Z" fill="currentColor"/>
                </g>
                <defs>
                    <clipPath id="clip0_730_27126">
                        <rect width="98" height="96" fill="none"/>
                    </clipPath>
                </defs>
            </svg>
            <span>jxtt-dev</span>
        </a>
    `;
    hourWrapperDiv.appendChild(titleWrapper);

    // Create inner div to hold the summary content
    const summaryDiv = document.createElement('div');
    summaryDiv.id = 'bmhs-hour-summary';
    hourWrapperDiv.appendChild(summaryDiv);

    const serversDiv = document.querySelector(SERVERS_DIV_SELECTOR);
    if (!serversDiv?.parentNode) {
        throw new Error('Unable to find SERVERS_DIV_SELECTOR');
    }
    serversDiv.parentNode.insertBefore(hourWrapperDiv, serversDiv);

    return hourWrapperDiv;
}

/**
 * Init Hour Summary HTML, with loading state
 */
async function initSummaryHTML(): Promise<void> {
    if (document.getElementById('bmhs-hour-wrapper')) {
        return;
    }
    // Wait for active players table to render
    await waitForElement(SERVERS_DIV_SELECTOR);

    const hourWrapperDiv = ensureHourSummaryWrapper();
    const summaryDiv = hourWrapperDiv.querySelector(
        '#bmhs-hour-summary'
    ) as HTMLDivElement | null;
    if (summaryDiv === null) {
        throw new Error('Unable to find bmhs-hour-summary');
    }
    summaryDiv.className = 'bmhs-loading-state';
    summaryDiv.innerHTML = '<p>Loading Hour Summary...</p>';
}

/**
 * Populate summary HTML with data
 */
async function populateSummaryHTML(
    extensionOptions: ExtensionOptionsState,
    sessionDataReady: Promise<void>
): Promise<void> {
    if (Object.keys(GLOBAL_STATE.gamePlaytime).length === 0) {
        throw new Error('gamePlaytime not found in GLOBAL_STATE');
    }
    const gamePlaytime = GLOBAL_STATE.gamePlaytime;

    const summaryDiv = document.getElementById('bmhs-hour-summary');
    if (summaryDiv === null) {
        console.error(
            '[BattleMetrics Hour Summary] Cannot find Hour Summary div'
        );
        throw new Error('Hour Summary HTML is malformed');
    }

    // Disable summary if no server data found
    if (Object.keys(gamePlaytime).length === 0) {
        summaryDiv.style.display = 'none';

        console.error(
            '[BattleMetrics Hour Summary] No server data found, cannot render hour summary.'
        );
        return;
    }

    // Clear loading state, set height to fit vertical tabs
    summaryDiv.classList.toggle('bmhs-loading-state');
    summaryDiv.innerHTML = '';

    // Add tab buttons for each game
    generateTabButtons();

    // Add tab content for each game
    generateGameTabs();

    // Add current session duration if not in compact mode
    if (!extensionOptions['playerPageCompactMode']) {
        await renderCurrentSessionDuration(sessionDataReady);
    }
}

async function updateCurrentSessionDuration(
    currentSessionTitle: HTMLElement,
    currentSessionValue: HTMLElement,
    sessionDataReady: Promise<void>
): Promise<void> {
    try {
        await sessionDataReady;
        if (GLOBAL_STATE.sessionData === null) return;
        const currentSession = getCurrentSession(GLOBAL_STATE.sessionData);
        if (currentSession === null) {
            currentSessionTitle.style.display = 'none';
            currentSessionValue.style.display = 'none';
            return;
        }

        currentSessionValue.textContent = generateSessionDurationString(
            currentSession.attributes.start
        );
    } catch {
        currentSessionTitle.style.display = 'none';
        currentSessionValue.style.display = 'none';
    }
}

/**
 * Display current session length if player is currently online (non-compact mode)
 */
async function renderCurrentSessionDuration(
    sessionDataReady: Promise<void>
): Promise<void> {
    const playerPage = document.getElementById(
        PLAYER_PAGE_ID
    ) as HTMLDivElement | null;
    if (playerPage === null) {
        throw new Error('Unable to find PLAYER_PAGE_ID');
    }

    // Handles presence of "This player has been seen on over 250 servers" banner
    const rowDivs = playerPage.querySelectorAll(':scope > div.row:not([id])');

    let detailsDiv: HTMLDivElement;
    if (rowDivs.length === 3) {
        detailsDiv = rowDivs[1] as HTMLDivElement;
    } else if (rowDivs.length === 2) {
        detailsDiv = rowDivs[0] as HTMLDivElement;
    } else {
        throw new Error('Unable to find detailsDiv');
    }

    const descriptionList = detailsDiv.querySelector('dl') as HTMLElement;

    const currentServerList = descriptionList.querySelector(
        'dd:last-child > ul'
    ) as HTMLElement;
    // Player is offline
    if (!currentServerList) {
        return;
    }

    // Remove margin on current server(s) list
    currentServerList.style.setProperty('margin-bottom', '0');

    // Add placeholder session duration to details div
    const currentSessionTitle = document.createElement('dt');
    currentSessionTitle.textContent = 'Session Duration';
    const currentSessionValue = document.createElement('dd');
    currentSessionValue.textContent = 'Loading...';

    descriptionList.appendChild(currentSessionTitle);
    descriptionList.appendChild(currentSessionValue);

    // Set session duration text once session data is ready
    updateCurrentSessionDuration(
        currentSessionTitle,
        currentSessionValue,
        sessionDataReady
    );
}

/**
 * Render an error state into the hour summary area
 */
export function renderError(error?: unknown): void {
    const hourWrapperDiv = ensureHourSummaryWrapper();

    const summaryDiv = hourWrapperDiv.querySelector('#bmhs-hour-summary');
    if (summaryDiv === null) {
        return;
    }
    summaryDiv.classList.remove('bmhs-loading-state');
    summaryDiv.classList.add('bmhs-error-state');

    const message = document.createElement('p');
    if (error instanceof SessionExpiredError) {
        message.textContent =
            'BM did not establish a valid session on page load - reload to try again.';
        summaryDiv.replaceChildren(message, renderReloadButton());
    } else if (error instanceof SessionUnavailableError) {
        message.textContent =
            'Unable to capture a session — reload to try again.';
        summaryDiv.replaceChildren(message, renderReloadButton());
    } else {
        message.textContent = 'Error generating Hour Summary.';
        summaryDiv.replaceChildren(message);
    }
}

/**
 * Render the reload button for session recovery errors
 */
function renderReloadButton(): HTMLButtonElement {
    const reloadButton = document.createElement('button');
    reloadButton.textContent = 'Reload';
    reloadButton.addEventListener('click', () =>
        triggerSessionRecoveryReload()
    );
    return reloadButton;
}

/**
 * Render all components on hour summary page
 *
 * Errors are handled by the caller (content.ts), which renders the error state
 */
export async function render(sessionDataReady: Promise<void>): Promise<void> {
    // Setup HTML with loading state
    await initSummaryHTML();

    // Fetch extension options
    const extensionOptions = await getExtensionOptions();

    // Initialize previous identifiers link
    initPrevIdsHTML();

    // Populate previous identifiers if identifiers exist
    if (GLOBAL_STATE.identifierData.length > 0) {
        populatePrevIdsHTML();
    }

    // Populate hour summary with fetched data
    await populateSummaryHTML(extensionOptions, sessionDataReady);
}

