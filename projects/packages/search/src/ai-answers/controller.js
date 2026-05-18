import { fetchEventSource } from '@microsoft/fetch-event-source';

export const AI_ANSWER_ENDPOINT =
	'https://public-api.wordpress.com/wpcom/v2/ai/agent/jetpack-workflow-search_summarizer';

export const AI_ANSWER_MIN_QUERY_LENGTH = 3;

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
 * Build the JSON-RPC request body for one AI Answers stream.
 *
 * @param {object}      args           - Request arguments.
 * @param {string}      args.query     - Search query.
 * @param {string}      args.siteId    - WPCOM site ID.
 * @param {object}      args.options   - Server-provided options.
 * @param {object}      args.filters   - Active search filters.
 * @param {string}      args.format    - Answer format, either 'brief' or 'extended'.
 * @param {string|null} args.sessionId - Previous brief-answer session ID.
 * @return {object} JSON-RPC request body.
 */
export function buildAiAnswerRequestBody( {
	query,
	siteId,
	options = {},
	filters = {},
	format,
	sessionId = null,
} ) {
	return {
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
								site_url: options.homeUrl || '',
								filters,
								locale: options.locale || 'en',
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
	};
}

/**
 * Create the internal state object for the dual-answer flow.
 *
 * @return {object} AI Answers state.
 */
export function createInitialAiAnswerState() {
	return {
		query: '',
		briefStatus: 'idle',
		briefText: '',
		briefCitations: [],
		briefError: null,
		extendedStatus: 'idle',
		extendedText: '',
		extendedCitations: [],
		extendedError: null,
		extendedLoadingText: '',
		showExtended: false,
		sessionId: null,
	};
}

/**
 * Project internal dual-answer state into the display shape the panel needs.
 *
 * @param {object} state - Internal AI Answers state.
 * @return {object} Display state.
 */
export function getAiAnswerDisplayState( state ) {
	let status = state.briefStatus;
	if ( state.showExtended ) {
		status = state.extendedStatus === 'loading' ? 'streaming' : state.extendedStatus;
	}

	let text = state.briefText;
	if ( state.showExtended && state.extendedText ) {
		text = `${ state.briefText }\n\n${ state.extendedText }`;
	}

	let citations = state.briefCitations;
	if ( state.showExtended && state.extendedStatus === 'done' ) {
		citations = state.extendedCitations;
	}

	let loadingHint = null;
	if ( state.showExtended && state.extendedStatus === 'loading' ) {
		loadingHint = state.extendedLoadingText;
	}

	return {
		status,
		text,
		citations,
		error: state.showExtended ? state.extendedError : state.briefError,
		loadingHint,
		canShowMore: ! state.showExtended && state.briefStatus === 'done',
		showExtended: state.showExtended,
	};
}

/**
 * Create a streaming AI Answers controller.
 *
 * @param {object}   args            - Controller arguments.
 * @param {string}   args.siteId     - WPCOM site ID.
 * @param {object}   args.options    - Server-provided options.
 * @param {Function} args.getFilters - Callback returning active filters.
 * @param {Function} args.onUpdate   - Callback receiving display state.
 * @param {object}   args.strings    - UI strings.
 * @return {{start: Function, showMore: Function, abort: Function, getState: Function}} Controller.
 */
export function createAiAnswersController( {
	siteId,
	options = {},
	getFilters = () => ( {} ),
	onUpdate = () => {},
	strings = {},
} ) {
	let state = createInitialAiAnswerState();
	let briefController = null;
	let extendedController = null;

	const emit = () => onUpdate( getAiAnswerDisplayState( state ) );

	const abort = () => {
		if ( briefController ) {
			briefController.abort();
			briefController = null;
		}
		if ( extendedController ) {
			extendedController.abort();
			extendedController = null;
		}
	};

	const reset = () => {
		abort();
		state = createInitialAiAnswerState();
		emit();
	};

	const stream = ( { controller, statePrefix, query, format, sessionId = null } ) => {
		const keys = {
			status: `${ statePrefix }Status`,
			text: `${ statePrefix }Text`,
			citations: `${ statePrefix }Citations`,
			error: `${ statePrefix }Error`,
		};
		state = {
			...state,
			[ keys.status ]: 'loading',
			[ keys.text ]: '',
			[ keys.citations ]: [],
			[ keys.error ]: null,
		};
		emit();

		let httpError = null;

		fetchEventSource( AI_ANSWER_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(
				buildAiAnswerRequestBody( {
					query,
					siteId,
					options,
					filters: getFilters(),
					format,
					sessionId,
				} )
			),
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
					if ( data.result?.sessionId ) {
						state = { ...state, sessionId: data.result.sessionId };
					}
					if ( data.method === 'message/delta' && data.params?.delta?.deltaType === 'content' ) {
						state = {
							...state,
							[ keys.status ]: 'streaming',
							[ keys.text ]: state[ keys.text ] + ( data.params.delta.content ?? '' ),
						};
						emit();
					} else if (
						data.result?.type === 'TaskStatusUpdateEvent' &&
						data.result?.status?.state === 'completed'
					) {
						const parts = data.result.status.message?.parts || [];
						const dataPart = parts.find( p => p.type === 'data' );
						const citations = dataPart?.data?.sources || dataPart?.data?.strict_sources || [];
						state = { ...state, [ keys.status ]: 'done', [ keys.citations ]: citations };
						emit();
					} else if ( data.result?.status?.state === 'failed' || data.error ) {
						const textPart = data.result?.status?.message?.parts?.find( p => p.type === 'text' );
						const message = data.error?.message || textPart?.text || 'Request failed';
						const code = data.error?.code ?? null;
						state = {
							...state,
							[ keys.status ]: 'error',
							[ keys.error ]: { message, code, source: 'api' },
						};
						emit();
					}
				} catch {
					// Ignore unparseable events.
				}
			},
			onerror: () => {
				throw new Error( 'onerror' );
			},
		} ).catch( () => {
			if ( ! controller.signal.aborted ) {
				state = {
					...state,
					[ keys.status ]: 'error',
					[ keys.error ]: httpError ?? {
						message: 'Network request error',
						code: null,
						source: 'network',
					},
				};
				emit();
			}
		} );
	};

	return {
		start( query ) {
			const normalizedQuery = ( query ?? '' ).trim();
			if (
				! siteId ||
				! normalizedQuery ||
				normalizedQuery.length < AI_ANSWER_MIN_QUERY_LENGTH ||
				options.aiAnswersEnabled === false
			) {
				reset();
				return;
			}
			if ( normalizedQuery === state.query && state.briefStatus !== 'idle' ) {
				return;
			}

			abort();
			state = { ...createInitialAiAnswerState(), query: normalizedQuery };
			briefController = new AbortController();
			stream( {
				controller: briefController,
				statePrefix: 'brief',
				query: normalizedQuery,
				format: 'brief',
			} );
		},

		showMore() {
			if ( ! state.query || state.showExtended ) {
				return;
			}

			if ( extendedController ) {
				extendedController.abort();
			}
			extendedController = new AbortController();
			state = {
				...state,
				showExtended: true,
				extendedLoadingText: strings.aiAnswersExtendedLoading || 'Finding a more complete answer…',
			};
			emit();
			stream( {
				controller: extendedController,
				statePrefix: 'extended',
				query: state.query,
				format: 'extended',
				sessionId: state.sessionId,
			} );
		},

		abort,

		getState() {
			return state;
		},
	};
}
