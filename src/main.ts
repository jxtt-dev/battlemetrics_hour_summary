import { SESSION_INIT_MESSAGE } from './shared/signing';
import type { SigningSession, SessionRelayMessage } from './shared/types';

const SEED_RE = /^[0-9a-f]{64}$/;
const INSTANCE_ID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface StoreLike {
    getState(): unknown;
    subscribe(listener: () => void): unknown;
}

let cachedStore: StoreLike | null = null;
let cachedFiberKey: string | null = null;
let subscribed = false;
let port: MessagePort | null = null;
let lastSeed = '';
let lastInstanceId = '';
let observer: MutationObserver | null = null;

function getFiberKey(root: HTMLElement): string | null {
    if (cachedFiberKey !== null && cachedFiberKey in root) {
        return cachedFiberKey;
    }
    for (const key in root) {
        if (
            key.startsWith('__reactContainer') ||
            key.startsWith('__reactFiber')
        ) {
            cachedFiberKey = key;
            return key;
        }
    }
    return null;
}

function findStore(): StoreLike | null {
    if (cachedStore !== null) return cachedStore;

    const root = document.getElementById('root');
    if (root === null) return null;

    const fiberKey = getFiberKey(root);
    if (fiberKey === null) return null;

    const stack: unknown[] = [
        (root as unknown as Record<string, unknown>)[fiberKey],
    ];

    while (stack.length > 0) {
        const fiber = stack.pop();
        if (fiber === null || fiber === undefined) continue;

        const props = (fiber as { memoizedProps?: unknown }).memoizedProps;
        if (
            props !== null &&
            typeof props === 'object' &&
            'store' in (props as object)
        ) {
            const store = (props as { store: unknown }).store;
            if (
                store !== null &&
                typeof store === 'object' &&
                typeof (store as { getState?: unknown }).getState === 'function'
            ) {
                cachedStore = store as StoreLike;
                return cachedStore;
            }
        }

        const sibling = (fiber as { sibling?: unknown }).sibling;
        if (sibling !== null && sibling !== undefined) stack.push(sibling);
        const child = (fiber as { child?: unknown }).child;
        if (child !== null && child !== undefined) stack.push(child);
    }

    return null;
}

function readSession(): SigningSession | null {
    const store = findStore();
    if (store === null) return null;
    try {
        const state = store.getState() as {
            env?: { signatureSeed?: unknown; instanceId?: unknown };
        } | null;
        const env = state?.env;
        if (!env || typeof env !== 'object') return null;

        const seed = env.signatureSeed;
        const instanceId = env.instanceId;
        if (typeof seed !== 'string' || !SEED_RE.test(seed)) return null;
        if (
            typeof instanceId !== 'string' ||
            !INSTANCE_ID_RE.test(instanceId)
        ) {
            return null;
        }
        return { seed, instanceId };
    } catch {
        return null;
    }
}

function sendSession(): void {
    if (port === null) return;
    const session = readSession();
    if (session === null) return;
    if (session.seed === lastSeed && session.instanceId === lastInstanceId) {
        return;
    }
    lastSeed = session.seed;
    lastInstanceId = session.instanceId;
    port.postMessage({ session } satisfies SessionRelayMessage);
}

function checkStore(): void {
    const store = findStore();
    if (store !== null && !subscribed) {
        subscribed = true;
        try {
            store.subscribe(sendSession);
        } catch {}
        if (observer !== null) {
            observer.disconnect();
            observer = null;
        }
    }
    sendSession();
}

function initObserver(): void {
    checkStore();

    if (!subscribed) {
        observer = new MutationObserver(() => {
            checkStore();
        });
        observer.observe(document, { childList: true, subtree: true });
    }

    window.addEventListener('message', (event: MessageEvent) => {
        if (
            event.source !== window ||
            event.data === null ||
            typeof event.data !== 'object'
        ) {
            return;
        }
        const messageData = event.data as Record<string, unknown>;
        if (messageData[SESSION_INIT_MESSAGE] !== true) return;
        const incomingPort = event.ports?.[0];
        if (incomingPort === undefined) return;
        port = incomingPort;
        lastSeed = '';
        lastInstanceId = '';
        checkStore();
    });
}

(() => {
    const win = window as unknown as { __bmhsObserverInstalled?: boolean };
    if (win.__bmhsObserverInstalled) return;
    win.__bmhsObserverInstalled = true;
    initObserver();
})();
