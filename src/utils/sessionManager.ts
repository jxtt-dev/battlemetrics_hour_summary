import type { SigningSession, SessionRelayMessage } from '../shared/types';
import { SESSION_TIMEOUT_MS } from '../shared/constants';
import { SESSION_INIT_MESSAGE } from '../shared/signing';

let port: MessagePort | null = null;
let currentSession: SigningSession | null = null;
const listeners = new Set<(session: SigningSession) => void>();

/**
 * Open the MessageChannel with the MAIN-world observer and cache relayed
 * session updates. Call once at startup.
 */
export function initSessionManager(): void {
    if (port !== null) return; // already initialized

    const channel = new MessageChannel();
    port = channel.port2;
    port.onmessage = (event: MessageEvent) => {
        const data = event.data as SessionRelayMessage | null;
        if (data?.session == null) return;
        currentSession = data.session;
        for (const listener of listeners) listener(currentSession);
    };

    // Transfer the other port to the observer. Only this init broadcast is
    // page-visible; session data flows over the port afterwards.
    window.postMessage({ [SESSION_INIT_MESSAGE]: true }, location.origin, [
        channel.port1,
    ]);
}

/**
 * True when the signing material (seed or instance id) changed.
 */
function isMeaningfulUpdate(
    usedSession: SigningSession,
    update: SigningSession
): boolean {
    return (
        update.seed !== usedSession.seed ||
        update.instanceId !== usedSession.instanceId
    );
}

/**
 * Wait for a relayed session update matching `predicate`, up to `timeoutMs`.
 *
 * @returns the matching session, or null on timeout
 */
function waitForMatchingUpdate(
    predicate: (update: SigningSession) => boolean,
    timeoutMs: number
): Promise<SigningSession | null> {
    return new Promise((resolve) => {
        let timer: ReturnType<typeof setTimeout>;
        const cleanup = () => {
            clearTimeout(timer);
            listeners.delete(onUpdate);
        };
        const onUpdate = (session: SigningSession) => {
            if (!predicate(session)) return;
            cleanup();
            resolve(session);
        };
        timer = setTimeout(() => {
            cleanup();
            resolve(null);
        }, timeoutMs);
        listeners.add(onUpdate);
    });
}

/**
 * Wait for the next meaningful update after `usedSession`, up to `timeoutMs`,
 * or resolve immediately if one has already arrived.
 *
 * @returns the updated session, or null on timeout
 */
export function waitForSessionUpdate(
    usedSession: SigningSession,
    timeoutMs: number
): Promise<SigningSession | null> {
    if (
        currentSession !== null &&
        isMeaningfulUpdate(usedSession, currentSession)
    ) {
        return Promise.resolve(currentSession);
    }

    return waitForMatchingUpdate(
        (update) => isMeaningfulUpdate(usedSession, update),
        timeoutMs
    );
}

/**
 * Resolve the latest captured session, waiting up to `timeoutMs`
 *
 * @returns the session, or null on timeout
 */
export function getSession(
    timeoutMs = SESSION_TIMEOUT_MS
): Promise<SigningSession | null> {
    if (currentSession !== null) return Promise.resolve(currentSession);
    return waitForMatchingUpdate(() => true, timeoutMs);
}
