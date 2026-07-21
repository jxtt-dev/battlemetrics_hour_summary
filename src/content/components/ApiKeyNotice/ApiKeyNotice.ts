import { PLAYER_PAGE_ID, BM_API_TOKEN_PAGE_URL } from '../../../shared/constants';
import { BMApiError } from '../../../utils/bmApi';

import './ApiKeyNotice.css';

const NOTICE_ID = 'bmhs-api-key-notice';

/**
 * Render a banner telling the user to add or fix their BattleMetrics API
 * token, since nothing can be fetched without one.
 */
export function renderApiKeyNotice(error: BMApiError): void {
    if (document.getElementById(NOTICE_ID)) return;

    const playerPage = document.getElementById(PLAYER_PAGE_ID);
    if (playerPage === null) return;

    const message =
        error.reason === 'missing-key'
            ? 'Hour Summary needs a BattleMetrics API token to load player data.'
            : error.reason === 'forbidden'
              ? 'Your BattleMetrics API token is missing the permissions needed to read player data.'
              : 'BattleMetrics rejected your API token. It may have been revoked or expired.';

    const notice = document.createElement('div');
    notice.id = NOTICE_ID;
    notice.className = 'row';
    notice.innerHTML = `
        <div class="bmhs-api-key-notice-inner">
            <strong>BattleMetrics Hour Summary</strong>
            <p>${message}</p>
            <p>
                Create a token at
                <a href="${BM_API_TOKEN_PAGE_URL}" target="_blank" rel="noopener noreferrer">battlemetrics.com/developers</a>,
                then paste it into the extension popup and refresh this page.
            </p>
        </div>
    `;

    playerPage.insertBefore(notice, playerPage.firstChild);
}
