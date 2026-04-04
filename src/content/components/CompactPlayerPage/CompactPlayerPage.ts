import { GLOBAL_STATE } from '../../services';
import { SessionData } from '../../../shared/types';
import { generateSessionDurationString, waitForElement } from '../../../utils/helpers';

import './CompactPlayerPage.css';

function getSessionDurationString(sessionData: SessionData): string {
    // In rare cases, there can be multiple current sessions
    // Only render a if there is a single current session
    let currentSessionCount = 0;
    let currentSessionIndex = -1;

    for (let i = 0; i < sessionData.data.length; i++) {
        if (sessionData.data[i].attributes.stop === null) {
            currentSessionCount++;
            if (currentSessionCount > 1) {
                return '';
            }
            currentSessionIndex = i;
        }
    }
    if (currentSessionIndex === -1) {
        return '';
    }

    const currentSessionStart =
        sessionData.data[currentSessionIndex].attributes.start;
    return generateSessionDurationString(currentSessionStart);
}

/**
 * Applies compact layout to player page
 */
export async function compactPlayerPage(sessionDataReady: Promise<void>) {
    try {
        await waitForElement('#PlayerPage');
        const playerPage = document.getElementById('PlayerPage');
        if (!playerPage) {
            throw new Error('PlayerPage not found');
        }
        const playerName = playerPage.querySelector('h1') as HTMLElement;
        const rows = Array.from(playerPage.children).filter(
            (e) => e.className === 'row' && e.id === ''
        );

        // Handle "player has been seen on over 250 servers banner"
        const detailsRowIndex = rows.length === 3 ? 1 : 0;
        const detailsRow = rows[detailsRowIndex] as HTMLDivElement;
        if (!detailsRow) {
            throw new Error('Details row not found');
        }

        const detailsColumns = detailsRow.querySelector(
            '.col-md-4'
        ) as HTMLDivElement;

        // Get relevant information from details column
        const firstSeenWrapper = detailsColumns.querySelector(
            'dl > dd:nth-child(2)'
        ) as HTMLElement;
        const lastSeenWrapper = detailsColumns.querySelector(
            'dl > dd:nth-child(4)'
        ) as HTMLElement;
        const currentServerWrapper = detailsColumns.querySelector(
            'dl > dd:nth-child(6)'
        ) as HTMLElement;
        const currentServers = currentServerWrapper.getElementsByTagName('a');

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
                <div class="bmhs-compact-details-column">
                <div class="bmhs-compact-details-row" id="bmhs-compact-session-duration">
                    <b>Session Duration</b>
                    <p>Loading...</p>
                </div>
                <div class="bmhs-compact-details-row">
                    <b>Current Server(s)</b>
                    <span data-slot="bmhs-compact-current-servers"></span>
                </div>
                </div>
            </div>
        `;

        const root = template.content.firstElementChild as HTMLDivElement;
        root.querySelector('[data-slot="bmhs-compact-first-seen"]')!.append(
            firstSeenWrapper
        );
        root.querySelector('[data-slot="bmhs-compact-last-seen"]')!.append(
            lastSeenWrapper
        );
        root.querySelector(
            '[data-slot="bmhs-compact-current-servers"]'
        )!.append(currentServerWrapper);

        // Append after player name
        playerName.after(root);

        // Hide details row
        detailsRow.style.display = 'none';

        // Render session duration last as it is dependant on sessionDataReady
        const sessionDurationRow = root.querySelector(
            '#bmhs-compact-session-duration'
        ) as HTMLDivElement;

        // Only render session duration if player is on a single server
        if (currentServers.length === 1) {
            const sessionDurationText = sessionDurationRow.querySelector(
                'p'
            ) as HTMLElement;
            // Await session data here to prevent other UI from being blocked
            await sessionDataReady;
            if (GLOBAL_STATE.sessionData === null) {
                throw new Error('sessionData not found in GLOBAL_STATE');
            }
            const sessionData = GLOBAL_STATE.sessionData;
            sessionDurationText.innerHTML =
                getSessionDurationString(sessionData);
        } else {
            sessionDurationRow.style.display = 'none';
        }
    } catch (e) {
        console.error(
            `[BattleMetrics Hour Summary] Error rendering compact mode: ${e}`
        );
        console.error(e);
    }
}
