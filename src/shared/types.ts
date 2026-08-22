/**
 * BattleMetrics relationship, used for servers, players, and identifiers
 */
export interface BMRelationship {
    type: string;
    id: string;
}

/**
 * BattleMetrics Server Attributes
 */
export interface BMServerAttributes {
    id: string;
    name: string;
    address: string;
    status: string;
    private: boolean;
}

/**
 * BattleMetrics Server Record returned from API
 */
export interface BMServerRecord {
    type: 'server';
    id: string;
    attributes: BMServerAttributes;
    relationships: {
        game: {
            data: BMRelationship;
        };
    };
    meta?: {
        timePlayed: number;
        firstSeen: string;
        lastSeen: string;
        online: boolean;
    };
}

/**
 * BattleMetrics Identifier Attributes
 */
export interface BMIdentifierAttributes {
    identifier: string;
    lastSeen: string;
    private: boolean;
}

/**
 * BattleMetrics Identifier Record returned from API
 */
export interface BMIdentifierRecord {
    type: 'identifier';
    id: string;
    attributes: BMIdentifierAttributes;
    relationships: {
        player: {
            data: BMRelationship;
        };
    };
}

/**
 * BattleMetrics Session Attributes
 *
 * If stop is null, session is ongoing
 */
export interface BMSessionAttributes {
    start: string;
    stop: string | null;
    firstTime: boolean;
    name: string;
    private: boolean;
}

/**
 * BattleMetrics Session Record returned from API
 */
export interface BMSessionRecord {
    type: 'session';
    id: string;
    attributes: BMSessionAttributes;
    relationships: {
        server: {
            data: BMRelationship;
        };
        player: {
            data: BMRelationship;
        };
        identifiers: {
            data: BMRelationship;
        };
    };
}

/**
 * Total playtime for a server
 */
export interface ServerPlaytime {
    serverName: string;
    serverPlayTime: number;
}

/**
 * Total playtime for a single game
 */
export interface GamePlaytime {
    playTime: number;
    serverList: ServerPlaytime[];
}

/**
 * Playtime for every game, key is gameId
 */
export type GamePlaytimes = Record<string, GamePlaytime>;

/**
 * Playtime in hours for each game, by day.
 *
 * Keys are game ids; each value holds one number per day (hours played),
 * with index 0 being today, 1 yesterday, and so on backwards.
 */
export type DailyPlaytime = Record<string, number[]>;

/**
 * Pagination links of a BattleMetrics page response
 */
export interface SessionLinks {
    next: string | null;
    prev: string | null;
}

/**
 * A page of BattleMetrics session records, with linked server records
 */
export interface SessionData {
    data: BMSessionRecord[];
    included: BMServerRecord[];
    links: SessionLinks;
}

/**
 * Graph visualization type
 */
export type GraphType = 'bar' | 'heatmap';

/**
 * Page-scoped data store, reset on each player-page render
 */
export interface GlobalStore {
    playerId: string | null;
    serverData: BMServerRecord[];
    identifierData: BMIdentifierRecord[];
    gamePlaytime: GamePlaytimes;
    dailyPlaytime: DailyPlaytime;
    sessionData: SessionData | null;
    graphType: GraphType;
}

/**
 * Shared rate-limit budget for BattleMetrics /_api/ requests.
 *
 * `remaining`/`resetTime` track the per-minute window from the API's
 * X-Rate-Limit-* response headers (falling back to local constants when
 * absent), `lastRequestTime` throttles to the max requests-per-second, and
 * `retryPromise` lets concurrent callers share a single 429 retry wait.
 */
export interface RateLimitState {
    remaining: number;
    resetTime: number;
    lastRequestTime: number;
    retryPromise: null | Promise<void>;
}

/**
 * BattleMetrics request-signing session from data store (`env` slice)
 */
export interface SigningSession {
    seed: string;
    instanceId: string;
}

/**
 * Message relayed from main.ts over the session MessageChannel
 */
export interface SessionRelayMessage {
    session: SigningSession;
}

/**
 * Thrown when no BattleMetrics request session could be captured within the timeout
 */
export class SessionUnavailableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SessionUnavailableError';
    }
}

/**
 * Thrown when the request session is stale and could not be recovered
 */
export class SessionExpiredError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SessionExpiredError';
    }
}
