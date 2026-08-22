export const PLAYER_PAGE_URL = 'https://www.battlemetrics.com/players/';
export const SERVER_PAGE_URL = 'https://www.battlemetrics.com/servers/';
export const BM_API = 'https://www.battlemetrics.com/_api/';

export const SERVERS_DIV_SELECTOR = '#PlayerPage > .row:last-of-type';
export const USERNAME_SELECTOR = '#PlayerPage > h1';
export const PLAYER_PAGE_ID = 'PlayerPage';
export const ACTIVE_PLAYER_TABLE_CLASS = 'css-x8ka1x';

// Timeout waiting for a signing session from main.ts
export const SESSION_TIMEOUT_MS = 5000;

// Timeout waiting for session rotation after a 401
export const SESSION_RECOVERY_WAIT_MS = 8000;

// Maximum number of consecutive 429 retries before giving up
export const MAX_API_RETRY_COUNT = 15;

// Player overview page pattern. Matches /players/<numeric id> with optional
// trailing slash, e.g. https://www.battlemetrics.com/players/12345
export const PLAYER_OVERVIEW_PAGE_REGEX = /^\/players\/\d+\/?$/;

// Server page pattern. Matches any /servers/ path, e.g.
// https://www.battlemetrics.com/servers/12345
export const SERVER_PAGE_REGEX = /^\/servers\//;

