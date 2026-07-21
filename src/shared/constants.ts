export const PLAYER_PAGE_URL = 'https://www.battlemetrics.com/players/';
export const SERVER_PAGE_URL = 'https://www.battlemetrics.com/servers/';
export const BM_API = 'https://api.battlemetrics.com/players/';
export const BM_API_TOKEN_PAGE_URL =
    'https://www.battlemetrics.com/developers';

/** browser.storage.local key holding the BattleMetrics API token */
export const API_KEY_STORAGE_KEY = 'bmApiKey';

/** Runtime message type used by the content script to reach the API proxy */
export const BM_API_REQUEST_MESSAGE = 'bmhs:api-request';

export const SERVERS_DIV_SELECTOR = '#PlayerPage > .row:last-of-type';
export const USERNAME_SELECTOR = '#PlayerPage > h1';
export const DATA_STORE_ID = 'storeBootstrap';
export const PLAYER_PAGE_ID = 'PlayerPage';
export const ACTIVE_PLAYER_TABLE_CLASS = 'css-1y3vvw9';
