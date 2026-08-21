// Runs in the page's MAIN world at document_start to extract player and server data
// from the data store and relay it over a MessageChannel.

import { DATA_INIT_MESSAGE } from './shared/constants';
import type {
    FiberPlayerDataPayload,
    FiberDataRelayMessage,
    RawPlayerServerInfo,
    RawServerInfo,
    RawSessionInfo,
} from './shared/types';
import { extractPlayerId, isPlayerOverviewPage } from './utils/helpers';

interface DataStore {
    getState(): {
        players?: {
            serverInfo?: Record<string, Record<string, RawPlayerServerInfo>>;
        };
        servers?: { servers?: Record<string, RawServerInfo> };
        sessions?: { sessions?: Record<string, RawSessionInfo> };
    };
    subscribe(listener: () => void): () => void;
}

let cachedStore: DataStore | null = null;
let port: MessagePort | null = null;
let activeUnsubscribe: (() => void) | null = null;

/**
 * Locate the BattleMetrics data store on the root element.
 */
function getStore(): DataStore | null {
    if (cachedStore) return cachedStore;

    const root = document.getElementById('root') as Record<string, any> | null;
    if (!root) return null;

    const fiberKey = Object.keys(root).find(
        (k) => k.startsWith('__reactContainer') || k.startsWith('__reactFiber')
    );
    if (!fiberKey) return null;

    let fiber = root[fiberKey];
    while (fiber) {
        const store = fiber.memoizedProps?.store;
        if (typeof store?.getState === 'function') {
            cachedStore = store;
            return store;
        }
        fiber = fiber.child ?? fiber.sibling;
    }

    return null;
}

/**
 * Wait until the data store is mounted in the DOM.
 */
function waitForStore(): Promise<DataStore> {
    const immediate = getStore();
    if (immediate) return Promise.resolve(immediate);

    return new Promise((resolve) => {
        const observer = new MutationObserver(() => {
            const store = getStore();
            if (store) {
                observer.disconnect();
                resolve(store);
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    });
}

/**
 * Extract the minimal data slice required for a single player.
 */
function slicePlayerData(
    store: DataStore,
    playerId: string
): FiberPlayerDataPayload | null {
    try {
        const state = store.getState();
        const playerServers = state?.players?.serverInfo?.[playerId];
        const allServers = state?.servers?.servers;
        if (!playerServers || !allServers) return null;

        const relevantServers: Record<string, RawServerInfo> = {};
        for (const serverId of Object.keys(playerServers)) {
            if (allServers[serverId]) {
                relevantServers[serverId] = allServers[serverId];
            }
        }

        let playerSessions: Record<string, RawSessionInfo> | undefined;
        if (state.sessions?.sessions) {
            playerSessions = {};
            for (const [id, s] of Object.entries(state.sessions.sessions)) {
                if (!s.player_id || String(s.player_id) === String(playerId)) {
                    playerSessions[id] = s;
                }
            }
        }

        return {
            serverInfoByPlayer: { [playerId]: playerServers },
            servers: relevantServers,
            sessions: playerSessions,
        };
    } catch {
        return null;
    }
}

/**
 * Fulfill a player data request by sending immediate data or subscribing until loaded.
 */
async function fulfillPlayerRequest(playerId: string): Promise<void> {
    if (!port || !playerId) return;

    if (activeUnsubscribe) {
        activeUnsubscribe();
        activeUnsubscribe = null;
    }

    const store = await waitForStore();

    // Player data is already present in data store
    const immediate = slicePlayerData(store, playerId);
    if (immediate) {
        port.postMessage({
            payload: immediate,
        } satisfies FiberDataRelayMessage);
        return;
    }

    // Slow path: wait for data store to receive player data, then send and unsubscribe
    const unsubscribe = store.subscribe(() => {
        const payload = slicePlayerData(store, playerId);
        if (payload) {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
            activeUnsubscribe = null;
            port?.postMessage({ payload } satisfies FiberDataRelayMessage);
        }
    });

    if (typeof unsubscribe === 'function') {
        activeUnsubscribe = unsubscribe;
    }
}

function initMainRelay(): void {
    window.addEventListener('message', (event: MessageEvent) => {
        if (
            event.source !== window ||
            event.data?.[DATA_INIT_MESSAGE] !== true
        ) {
            return;
        }

        const incomingPort = event.ports?.[0];
        if (!incomingPort) return;
        port = incomingPort;

        port.onmessage = (portEvent: MessageEvent) => {
            const playerId =
                portEvent.data?.playerId ||
                (isPlayerOverviewPage(location.href)
                    ? extractPlayerId(location.href)
                    : '');
            void fulfillPlayerRequest(playerId);
        };

        if (isPlayerOverviewPage(location.href)) {
            void fulfillPlayerRequest(extractPlayerId(location.href));
        }
    });
}

(() => {
    const win = window as unknown as { __bmhsObserverInstalled?: boolean };
    if (win.__bmhsObserverInstalled) return;
    win.__bmhsObserverInstalled = true;
    initMainRelay();
})();
