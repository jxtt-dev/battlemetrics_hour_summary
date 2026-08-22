/**
 * BattleMetrics request-signing primitives
 */

export const SIGNING_SUFFIX = '_BattleMetricsRequestSignature_2026';
export const SESSION_INIT_MESSAGE = '__bmhsInit';

const enc = new TextEncoder();

export function bytesToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

export async function hmacSha256Hex(
    message: string,
    seed: string
): Promise<string> {
    const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(seed),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        enc.encode(message)
    );
    return bytesToHex(signature);
}

/**
 * Build the signed message for a request:
 * `${pathname+search}_${timestamp}_${instanceId}${SIGNING_SUFFIX}`
 */
export function buildSignatureMessage(
    path: string,
    timestamp: string,
    instanceId: string
): string {
    return `${path}_${timestamp}_${instanceId}${SIGNING_SUFFIX}`;
}
