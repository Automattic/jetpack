type RtcTransport = 'pinghub' | 'http-polling';

interface JetpackRtcGlobals {
	providers?: string[];
	currentPostId?: number;
	currentPostType?: string;
}

/**
 * Read the server-provided RTC globals off `window`.
 *
 * @return The `window.jetpackRTC` config, or an empty object when absent.
 */
function getRtcGlobals(): JetpackRtcGlobals {
	return ( window as unknown as { jetpackRTC?: JetpackRtcGlobals } ).jetpackRTC ?? {};
}

/**
 * Determine the active RTC transport from the providers configured by the server.
 *
 * @return 'pinghub' when the PingHub WebSocket provider is active, otherwise 'http-polling'.
 */
export function getTransport(): RtcTransport {
	const { providers } = getRtcGlobals();
	return Array.isArray( providers ) && providers.includes( 'pinghub' ) ? 'pinghub' : 'http-polling';
}
