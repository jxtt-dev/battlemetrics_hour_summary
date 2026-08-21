import type {
    FiberPlayerDataPayload,
    FiberDataRelayMessage,
} from '../shared/types';
import { DATA_INIT_MESSAGE, FIBER_DATA_TIMEOUT_MS } from '../shared/constants';

let port: MessagePort | null = null;
let currentPayload: FiberPlayerDataPayload | null = null;
const listeners = new Set<(payload: FiberPlayerDataPayload) => void>();

/**
 * Open the MessageChannel with the MAIN-world observer and cache relayed
 * fiber data updates. Call once at extension startup.
 *
 * The data store is only reachable from the page's MAIN world (main.ts), so
 * the content script (ISOLATED world) hands one end of a MessageChannel to the
 * page via window.postMessage(DATA_INIT_MESSAGE, [port1]). main.ts keeps that
 * port and pushes store snapshots back over it.
 */
export function initFiberDataManager(): void {
    if (port !== null) return;

    const channel = new MessageChannel();
    port = channel.port2;
    port.onmessage = (event: MessageEvent) => {
        const data = event.data as FiberDataRelayMessage | null;
        if (data?.payload == null) return;
        currentPayload = data.payload;
        for (const listener of listeners) {
            listener(currentPayload);
        }
    };

    window.postMessage({ [DATA_INIT_MESSAGE]: true }, location.origin, [
        channel.port1,
    ]);
}

/**
 * Wait for a relayed payload matching predicate up to timeoutMs
 */
function waitForMatchingPayload(
    predicate: (payload: FiberPlayerDataPayload) => boolean,
    timeoutMs: number
): Promise<FiberPlayerDataPayload | null> {
    return new Promise((resolve) => {
        let timer: ReturnType<typeof setTimeout>;
        const cleanup = () => {
            clearTimeout(timer);
            listeners.delete(onUpdate);
        };
        const onUpdate = (payload: FiberPlayerDataPayload) => {
            if (!predicate(payload)) return;
            cleanup();
            resolve(payload);
        };
        timer = setTimeout(() => {
            cleanup();
            resolve(null);
        }, timeoutMs);
        listeners.add(onUpdate);
    });
}

/**
 * Request fresh data from the MAIN world and resolve player data for playerId
 */
export async function getFiberPlayerData(
    playerId: string,
    timeoutMs = FIBER_DATA_TIMEOUT_MS
): Promise<FiberPlayerDataPayload | null> {
    if (
        currentPayload?.serverInfoByPlayer &&
        playerId in currentPayload.serverInfoByPlayer
    ) {
        return currentPayload;
    }

    // Ping main.ts with requested playerId
    if (port !== null) {
        try {
            port.postMessage({ type: 'GET_PLAYER_DATA', playerId });
        } catch {}
    }

    const payload = await waitForMatchingPayload(
        (p) =>
            p.serverInfoByPlayer !== undefined &&
            playerId in p.serverInfoByPlayer,
        timeoutMs
    );

    return payload;
}
