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
 * Playtime for each game, by day.
 */
export type DailyPlaytime = Record<string, number[]>;

export interface SessionData {
    data: BMSessionRecord[];
    included: BMServerRecord[];
    links: {
        next: string | null;
        prev: string | null;
    };
}

/**
 * GlobalStore
 */
export interface GlobalStore {
    playerId: string | null;
    serverData: BMServerRecord[];
    identifierData: BMIdentifierRecord[];
    gamePlaytime: GamePlaytimes;
    dailyPlaytime: DailyPlaytime;
    sessionData: SessionData | null;
    graphType: boolean;
}

/**
 * State for rate limit aware fetch
 */
export interface RateLimitState {
    remaining: number;
    resetTime: number;
    lastRequestTime: number;
    retryPromise: null | Promise<void>;
}
