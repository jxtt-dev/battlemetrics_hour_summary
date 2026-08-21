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
 * Shared rate-limit budget for BattleMetrics API requests.
 */
export interface RateLimitState {
    remaining: number;
    resetTime: number;
    lastRequestTime: number;
    retryPromise: null | Promise<void>;
}

/**
 * Raw server-playtime record as stored in Redux players.serverInfo[playerId]
 */
export interface RawPlayerServerInfo {
    serverId: string | number;
    playerId?: string | number;
    firstSeen?: string | number;
    lastSeen?: string | number;
    online?: boolean;
    timePlayed: number;
}

/**
 * Raw server record as stored in Redux servers.servers[serverId]
 */
export interface RawServerInfo {
    id: string | number;
    game_id?: string;
    gameId?: string;
    name?: string;
    address?: string;
    status?: string;
    private?: boolean;
    details?: Record<string, unknown>;
}

/**
 * Raw session record as stored in Redux sessions.sessions[sessionId]
 */
export interface RawSessionInfo {
    id: string;
    player_id?: string | number;
    server_id?: string | number;
    start: string | number;
    stop?: string | number | null;
    name?: string;
    firstTime?: boolean;
    private?: boolean;
    identifierIds?: Array<string | number>;
}

/**
 * Payload of player, server, and session data extracted from Redux store
 */
export interface FiberPlayerDataPayload {
    serverInfoByPlayer: Record<string, Record<string, RawPlayerServerInfo>>;
    servers: Record<string, RawServerInfo>;
    sessions?: Record<string, RawSessionInfo>;
}

/**
 * Message relayed from main.ts over the data MessageChannel
 */
export interface FiberDataRelayMessage {
    payload: FiberPlayerDataPayload;
}

/**
 * Thrown when no BattleMetrics player data could be captured from the Redux store
 */
export class FiberDataUnavailableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FiberDataUnavailableError';
    }
}
