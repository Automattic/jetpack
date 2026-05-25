/**
 * Server-Sent-Events streaming for the AI Answers endpoint.
 *
 * Wraps `fetchEventSource` against the WPCOM AI Agent's search summariser so
 * the Interactivity store can drive the brief / extended response flow
 * without inlining the SSE protocol details into every consumer. Mirrors the
 * shape used by the instant-search overlay's `streamAiAnswer` so a single
 * answer endpoint serves both surfaces.
 */
import { fetchEventSource } from '@microsoft/fetch-event-source';

const ENDPOINT_URL =
	'https://public-api.wordpress.com/wpcom/v2/ai/agent/jetpack-workflow-search_summarizer';

const HTTP_STATUS_NAMES = {
	400: 'Bad Request',
	401: 'Unauthorized',
	403: 'Forbidden',
	404: 'Not Found',
	429: 'Too Many Requests',
	500: 'Internal Server Error',
	502: 'Bad Gateway',
	503: 'Service Unavailable',
	504: 'Gateway Timeout',
};

/**
 * Open a streaming AI answer request and route incoming events through the
 * supplied callbacks. Returns nothing; callers manage the AbortController.
 *
 * The handlers are split rather than passing a single onEvent function so
 * each store action stays a thin dispatcher over its own state keys without
 * embedding SSE-protocol parsing in two places. Errors come through a single
 * `onError({ message, code, source })` shape so the panel can render the same
 * message regardless of whether the failure came from HTTP, the API payload,
 * or the network.
 *
 * @param {object}             args               - Request args.
 * @param {AbortController}    args.controller    - Caller-owned abort handle.
 * @param {string}             args.query         - Search query text.
 * @param {number|string}      args.siteId        - WPCOM site ID for the answer agent.
 * @param {object}             args.filters       - Active filters payload passed through to the agent.
 * @param {string}             args.locale        - BCP47 locale.
 * @param {string}             args.homeUrl       - Public URL of the site.
 * @param {'brief'|'extended'} args.format        - Which answer length to request.
 * @param {string|null}        [args.sessionId]   - Session ID returned by an earlier brief call (so the extended
 *                                                response can reuse context).
 * @param {Function}           args.onDelta       - Called with each streamed token: `(textChunk)`.
 * @param {Function}           args.onDone        - Called with the final citations array on completion.
 * @param {Function}           args.onError       - Called once on any failure: `({ message, code, source })`.
 * @param {Function}           [args.onSessionId] - Called with the session ID when the server emits it.
 */
export function streamAiAnswer( {
	controller,
	query,
	siteId,
	filters,
	locale,
	homeUrl,
	format,
	sessionId = null,
	onDelta,
	onDone,
	onError,
	onSessionId = null,
} ) {
	let httpError = null;

	fetchEventSource( ENDPOINT_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify( {
			jsonrpc: '2.0',
			id: `req-${ format }`,
			method: 'message/stream',
			constructor_arguments: {},
			params: {
				...( sessionId ? { sessionId } : {} ),
				message: {
					role: 'user',
					parts: [
						{ type: 'text', text: query },
						{
							type: 'data',
							data: {
								clientContext: {
									selectedSiteId: siteId,
									site_url: homeUrl || '',
									filters: filters || {},
									locale: locale || 'en',
									aiAnswersFormat: format,
								},
							},
							metadata: {},
						},
					],
					kind: 'message',
					messageId: `msg-${ format }`,
				},
			},
			tokenStreaming: true,
		} ),
		signal: controller.signal,
		onopen: async response => {
			if ( ! response.ok ) {
				httpError = {
					message: HTTP_STATUS_NAMES[ response.status ] || `HTTP ${ response.status }`,
					code: response.status,
					source: 'http',
				};
				throw new Error( `HTTP ${ response.status }` );
			}
		},
		onmessage: event => {
			try {
				const data = JSON.parse( event.data );
				if ( data.result?.sessionId && onSessionId ) {
					onSessionId( data.result.sessionId );
				}
				if ( data.method === 'message/delta' && data.params?.delta?.deltaType === 'content' ) {
					onDelta( data.params.delta.content ?? '' );
				} else if (
					data.result?.type === 'TaskStatusUpdateEvent' &&
					data.result?.status?.state === 'completed'
				) {
					const parts = data.result.status.message?.parts || [];
					const dataPart = parts.find( p => p.type === 'data' );
					const citations = dataPart?.data?.sources || dataPart?.data?.strict_sources || [];
					onDone( citations );
				} else if ( data.result?.status?.state === 'failed' || data.error ) {
					const textPart = data.result?.status?.message?.parts?.find( p => p.type === 'text' );
					const message = data.error?.message || textPart?.text || 'Request failed';
					const code = data.error?.code ?? null;
					onError( { message, code, source: 'api' } );
				}
			} catch {
				// Ignore unparseable events.
			}
		},
		onerror: () => {
			// `.catch()` below owns terminal error state so the httpError captured
			// in onopen isn't overwritten between callbacks.
			throw new Error( 'onerror' );
		},
	} ).catch( () => {
		if ( ! controller.signal.aborted ) {
			onError(
				httpError ?? {
					message: 'Network request error',
					code: null,
					source: 'network',
				}
			);
		}
	} );
}
