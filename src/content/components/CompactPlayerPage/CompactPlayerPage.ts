import { GLOBAL_STATE, fetchServerInfo } from '../../services';
import {
    generateSessionDurationString,
    generateServerLink,
    getCurrentServerId,
    getCurrentSession,
    waitForElement,
} from '../../../utils/helpers';
import { isApiKeyConfigured } from '../../../utils/extensionOptionHelpers';

import './CompactPlayerPage.css';

/**
 * Applies compact layout to player page
 */
export async function compactPlayerPage(sessionDataReady: Promise<void>) {
    try {
        if (document.querySelector('.bmhs-compact-details-wrapper')) {
            return;
        }
        await waitForElement('#PlayerPage');
        const playerPage = document.getElementById('PlayerPage');
        if (!playerPage) {
            throw new Error('PlayerPage not found');
        }
        const playerName = playerPage.querySelector('h1') as HTMLElement;

        const rowDivs = playerPage.querySelectorAll(
            ':scope > div.row:not([id])'
        );
        const detailsDiv = rowDivs[0] as HTMLDivElement | undefined;

        const descriptionList = detailsDiv?.querySelector('dl');
        if (!detailsDiv || !descriptionList) return;

        // Get relevant information from details list
        const firstSeenWrapper = descriptionList.querySelector(
            'dd:nth-child(2)'
        ) as HTMLElement | null;
        const lastSeenWrapper = descriptionList.querySelector(
            'dd:nth-child(4)'
        ) as HTMLElement | null;
        if (!firstSeenWrapper || !lastSeenWrapper) return;

        const hasApiKey = await isApiKeyConfigured();

        // Add current server and session duration to details div (requires API key)
        const sessionInfoColumn = hasApiKey
            ? `
                <div class="bmhs-compact-details-column" id="bmhs-compact-session-info">
                <div class="bmhs-compact-details-row" id="bmhs-compact-session-duration">
                    <b>Session Duration</b>
                    <p>Loading...</p>
                </div>
                <div class="bmhs-compact-details-row">
                    <b>Current Server</b>
                    <span data-slot="bmhs-compact-current-server"></span>
                </div>
                </div>
            `
            : '';

        // HTML template for compact mode
        const template = document.createElement('template');
        template.innerHTML = `
            <div class="bmhs-compact-details-wrapper">
                <div class="bmhs-compact-details-column">
                <div class="bmhs-compact-details-row">
                    <b>First Seen</b>
                    <span data-slot="bmhs-compact-first-seen"></span>
                </div>
                <div class="bmhs-compact-details-row">
                    <b>Last Seen</b>
                    <span data-slot="bmhs-compact-last-seen"></span>
                </div>
                </div>
                ${sessionInfoColumn}
            </div>
        `;

        const root = template.content.firstElementChild as HTMLDivElement;
        root.querySelector('[data-slot="bmhs-compact-first-seen"]')!.append(
            firstSeenWrapper
        );
        root.querySelector('[data-slot="bmhs-compact-last-seen"]')!.append(
            lastSeenWrapper
        );

        // Append after player name
        playerName.after(root);

        // Hide details row
        detailsDiv.style.display = 'none';

        if (!hasApiKey) return;

        await sessionDataReady;
        if (GLOBAL_STATE.sessionData === null) return;
        const currentSession = getCurrentSession(GLOBAL_STATE.sessionData);

        // Player is offline or on multiple servers
        const sessionInfo = root.querySelector(
            '#bmhs-compact-session-info'
        ) as HTMLElement;
        if (currentSession === null) {
            sessionInfo.style.display = 'none';
            return;
        }

        // Add current server link
        const currentServerId = getCurrentServerId(currentSession);
        if (currentServerId) {
            const currentServerInfo = await fetchServerInfo(currentServerId);
            root.querySelector(
                '[data-slot="bmhs-compact-current-server"]'
            )!.append(generateServerLink(currentServerId, currentServerInfo));
        }

        // Set session duration text
        const sessionDurationText = root.querySelector(
            '#bmhs-compact-session-duration p'
        ) as HTMLElement;
        sessionDurationText.textContent = generateSessionDurationString(
            currentSession.attributes.start
        );
    } catch (e) {
        console.error(
            `[BattleMetrics Hour Summary] Error rendering compact mode: ${e}`
        );
        console.error(e);
    }
}
