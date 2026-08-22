import { GLOBAL_STATE } from '../../services';
import { SessionData } from '../../../shared/types';
import {
    generateSessionDurationString,
    getCurrentSession,
    waitForElement,
} from '../../../utils/helpers';

import './CompactPlayerPage.css';

function getSessionDurationString(sessionData: SessionData): string {
    const currentSession = getCurrentSession(sessionData);
    if (currentSession === null) {
        return '';
    }

    return generateSessionDurationString(currentSession.attributes.start);
}

async function updateSessionDuration(
    sessionDurationText: HTMLElement,
    sessionDataReady: Promise<void>
): Promise<void> {
    try {
        await sessionDataReady;
        if (GLOBAL_STATE.sessionData !== null) {
            sessionDurationText.textContent = getSessionDurationString(
                GLOBAL_STATE.sessionData
            );
        }
    } catch {}
}

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
            // Update session duration asynchronously so subsequent UI rendering is not blocked
            updateSessionDuration(sessionDurationText, sessionDataReady);
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
