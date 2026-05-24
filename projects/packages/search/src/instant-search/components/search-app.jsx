import { fetchEventSource } from '@microsoft/fetch-event-source';
import { __ } from '@wordpress/i18n';
import debounce from 'debounce';
import stringify from 'fast-json-stable-stringify';
import * as React from 'react';
import { Component, Fragment } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { connect } from 'react-redux';
import {
	MULTISITE_NO_GROUP_VALUE,
	RESULT_FORMAT_EXPANDED,
	SERVER_OBJECT_NAME,
} from '../lib/constants';
import { getAvailableStaticFilters } from '../lib/filters';
import { getResultFormatQuery, restorePreviousHref } from '../lib/query-string';
import {
	disableAnalytics,
	identifySite,
	initializeTracks,
	resetTrackingCookies,
} from '../lib/tracks';
import {
	clearQueryValues,
	disableQueryStringIntegration,
	initializeQueryValues,
	makeSearchRequest,
	setFilter,
	setStaticFilter,
	setSearchQuery,
	setSort,
} from '../store/actions';
import {
	getFilters,
	getStaticFilters,
	getResponse,
	getSearchQuery,
	getSort,
	getWidgetOutsideOverlay,
	hasActiveQuery,
	hasError,
	hasNextPage,
	isHistoryNavigation,
	isLoading,
} from '../store/selectors';
import CustomizerEventHandler from './customizer-event-handler';
import DomEventHandler from './dom-event-handler';
import Overlay from './overlay';
import SearchResults from './search-results';
import './search-app.scss';

class SearchApp extends Component {
	static defaultProps = {
		overlayOptions: {},
		widgets: [],
	};

	constructor() {
		super( ...arguments );

		this.state = {
			// TODO: Migrate visibility state to Redux.
			isVisible: !! this.props.initialIsVisible, // initialIsVisible can be undefined
			overlayOptionsCustomizerOverride: {},
			// AI Answers state — brief (fast) answer
			aiBriefStatus: 'idle', // 'idle' | 'loading' | 'streaming' | 'done' | 'error'
			aiBriefText: '',
			aiBriefCitations: [],
			aiBriefError: null,
			// AI Answers state — extended (verbose) answer
			aiExtendedStatus: 'idle',
			aiExtendedText: '',
			aiExtendedCitations: [],
			aiExtendedError: null,
			aiExtendedLoadingText: '',
			// Which answer the panel is currently showing
			aiShowExtended: false,
			// Session ID returned by the brief request, reused for the extended request
			aiSessionId: null,
		};

		this.getResults = debounce( this.getResults, 200 );
		this.aiBriefController = null;
		this.aiExtendedController = null;
		this.getAiAnswer = debounce( this.getAiAnswer, 500 );
		this.props.enableAnalytics ? this.initializeAnalytics() : disableAnalytics();

		if ( this.props.shouldIntegrateWithDom ) {
			this.props.initializeQueryValues();
		} else {
			this.props.disableQueryStringIntegration();
		}
	}

	static getDerivedStateFromProps( props, state ) {
		return {
			overlayOptions: {
				...props.overlayOptions,
				...state.overlayOptionsCustomizerOverride,
			},
		};
	}

	componentDidMount() {
		// This condition can only occur within Customberg or the Customizer.
		if (
			( this.props.initialShowResults && this.props.initialIsVisible ) ||
			this.props.isInCustomizer
		) {
			this.getResults();
		}

		if ( this.props.hasActiveQuery && this.props.overlayOptions.enableFilteringOpensOverlay ) {
			this.showResults();
		}
	}

	componentDidUpdate( prevProps, prevState ) {
		if (
			prevProps.searchQuery !== this.props.searchQuery ||
			prevProps.sort !== this.props.sort ||
			// Note the special handling for filters prop, which use object values.
			stringify( prevProps.filters ) !== stringify( this.props.filters ) ||
			stringify( prevProps.staticFilters ) !== stringify( this.props.staticFilters )
		) {
			this.onChangeQueryString( this.props.isHistoryNavigation );
		}

		if ( prevProps.searchQuery !== this.props.searchQuery ) {
			this.getAiAnswer();
		}

		// These conditions can only occur in the Gutenberg preview context.
		if ( prevState.overlayOptions.defaultSort !== this.state.overlayOptions.defaultSort ) {
			this.props.setSort( this.state.overlayOptions.defaultSort );
		}
		if (
			stringify( prevState.overlayOptions.excludedPostTypes ) !==
			stringify( this.state.overlayOptions.excludedPostTypes )
		) {
			this.getResults();
		}
	}

	componentWillUnmount() {
		if ( this.aiBriefController ) {
			this.aiBriefController.abort();
		}
		if ( this.aiExtendedController ) {
			this.aiExtendedController.abort();
		}
		this.getAiAnswer.clear();
	}

	initializeAnalytics() {
		initializeTracks();
		! window[ SERVER_OBJECT_NAME ].preventTrackingCookiesReset && resetTrackingCookies();
		identifySite( this.props.options.siteId );
	}

	getResultFormat = () => {
		// Override the result format if group static filter is selected, always use expanded.
		const isMultiSite =
			this.props.staticFilters &&
			this.props.staticFilters.group_id &&
			this.props.staticFilters.group_id !== MULTISITE_NO_GROUP_VALUE;
		if ( isMultiSite ) {
			return RESULT_FORMAT_EXPANDED;
		}

		// Override the result format from the query string if result_format= is specified
		const resultFormatQuery = getResultFormatQuery();
		return resultFormatQuery || this.state.overlayOptions.resultFormat;
	};

	/**
	 * Initialize static filters if we have none in the state.
	 */
	initializeStaticFilters = () => {
		const availableStaticFilters = getAvailableStaticFilters();

		if (
			availableStaticFilters.length > 0 &&
			Object.keys( this.props.staticFilters ).length === 0
		) {
			availableStaticFilters.forEach( filter =>
				this.props.setStaticFilter( filter.filter_id, filter.selected, true )
			);
		}
	};

	hideResults = isHistoryNav => {
		if ( ! this.props.shouldIntegrateWithDom ) {
			return;
		}

		restorePreviousHref(
			this.props.initialHref,
			() => {
				this.setState( { isVisible: false } );
				this.props.clearQueryValues();
			},
			isHistoryNav
		);
	};

	// Used for showResults and Customizer integration.
	toggleResults = isVisible => {
		// Prevent interaction if being shown in Customberg context.
		if ( ! this.props.shouldIntegrateWithDom ) {
			return;
		}

		// Necessary when reacting to onMessage transport Customizer controls.
		// Both bindCustomizerChanges and bindCustomizerMessages are bound to such controls.
		if ( this.state.isVisible === isVisible ) {
			return;
		}

		// If there are static filters available, but they are not part of the url/state, we will set their default value
		isVisible && this.initializeStaticFilters();

		this.setState( { isVisible } );
	};

	showResults = this.toggleResults.bind( this, true );

	onChangeQueryString = isHistoryNav => {
		this.getResults();

		if ( this.props.hasActiveQuery && ! this.state.isVisible ) {
			this.showResults();
		}

		if ( ! this.props.hasActiveQuery && isHistoryNav ) {
			this.hideResults( isHistoryNav );
		}

		this.props.searchQuery !== null &&
			document.querySelectorAll( this.props.themeOptions.searchInputSelector ).forEach( input => {
				input.value = this.props.searchQuery;
			} );
	};

	loadNextPage = () => {
		this.props.hasNextPage && this.getResults( { pageHandle: this.props.response.page_handle } );
	};

	getResults = ( { pageHandle } = {} ) => {
		this.props.makeSearchRequest( {
			// Skip aggregations when requesting for paged results
			aggregations: pageHandle ? {} : this.props.aggregations,
			excludedPostTypes: this.state.overlayOptions.excludedPostTypes,
			filter: this.props.filters,
			staticFilters: this.props.staticFilters,
			pageHandle,
			query: this.props.searchQuery,
			resultFormat: this.getResultFormat(),
			siteId: this.props.options.siteId,
			additionalBlogIds: this.props.options.additionalBlogIds,
			sort: this.props.sort,
			postsPerPage: this.props.options.postsPerPage,
			adminQueryFilter: this.props.options.adminQueryFilter,
			highlightFields: this.props.options.highlightFields,
			customResults: this.props.options.customResults,
			isInCustomizer: this.props.isInCustomizer,
		} );
	};

	/**
	 * Stream a single AI answer request and write results into the given state slice.
	 *
	 * @param {object}          args             - Arguments.
	 * @param {AbortController} args.controller  - AbortController for this request.
	 * @param {string}          args.statePrefix - 'aiBrief' or 'aiExtended'.
	 * @param {string}          args.query       - The search query.
	 * @param {string}          args.siteId      - The site ID.
	 * @param {object}          args.options     - The server options object.
	 * @param {string}          args.format      - 'brief' or 'extended'.
	 * @param {string|null}     args.sessionId   - Session ID from the brief request, for extended.
	 * @param {Function|null}   args.onSessionId - Callback invoked with the session ID when received.
	 */
	streamAiAnswer = ( {
		controller,
		statePrefix,
		query,
		siteId,
		options,
		format,
		sessionId = null,
		onSessionId = null,
	} ) => {
		const keys = {
			status: statePrefix + 'Status',
			text: statePrefix + 'Text',
			citations: statePrefix + 'Citations',
			error: statePrefix + 'Error',
		};

		this.setState( {
			[ keys.status ]: 'loading',
			[ keys.text ]: '',
			[ keys.citations ]: [],
			[ keys.error ]: null,
		} );

		const url =
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

		// Captured by onopen before onerror fires, so .catch sees the real HTTP error.
		let httpError = null;

		fetchEventSource( url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
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
										site_url: options.homeUrl || '',
										filters: this.props.filters,
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
						// flushSync forces a synchronous render for each token so the
						// text streams visibly rather than batching into one update
						// (React 18 automatic batching would otherwise collapse rapid
						// SSE events into a single render).
						flushSync( () => {
							this.setState( state => ( {
								[ keys.status ]: 'streaming',
								[ keys.text ]: state[ keys.text ] + ( data.params.delta.content ?? '' ),
							} ) );
						} );
					} else if (
						data.result?.type === 'TaskStatusUpdateEvent' &&
						data.result?.status?.state === 'completed'
					) {
						const parts = data.result.status.message?.parts || [];
						const dataPart = parts.find( p => p.type === 'data' );
						const citations = dataPart?.data?.sources || dataPart?.data?.strict_sources || [];
						this.setState( { [ keys.status ]: 'done', [ keys.citations ]: citations } );
					} else if ( data.result?.status?.state === 'failed' || data.error ) {
						const textPart = data.result?.status?.message?.parts?.find( p => p.type === 'text' );
						const message = data.error?.message || textPart?.text || 'Request failed';
						const code = data.error?.code ?? null;
						this.setState( {
							[ keys.status ]: 'error',
							[ keys.error ]: { message, code, source: 'api' },
						} );
					}
				} catch {
					// Ignore unparseable events.
				}
			},
			onerror: () => {
				// Rethrow without setting state — .catch handles all error state
				// so httpError captured in onopen isn't overwritten.
				throw new Error( 'onerror' );
			},
		} ).catch( () => {
			if ( ! controller.signal.aborted ) {
				this.setState( {
					[ keys.status ]: 'error',
					[ keys.error ]: httpError ?? {
						message: 'Network request error',
						code: null,
						source: 'network',
					},
				} );
			}
		} );
	};

	getAiAnswer = () => {
		const query = this.props.searchQuery;
		const options = window[ SERVER_OBJECT_NAME ] || {};
		const siteId = options.siteId;
		// Honour a props-level override of the AI Answers gate when one is
		// passed (customberg drives the preview from React state); otherwise
		// fall back to the page-load snapshot used by the public overlay.
		const aiAnswersEnabled =
			this.props.options && this.props.options.aiAnswersEnabled !== undefined
				? this.props.options.aiAnswersEnabled
				: options.aiAnswersEnabled;

		const idleState = {
			aiBriefStatus: 'idle',
			aiBriefText: '',
			aiBriefCitations: [],
			aiBriefError: null,
			aiExtendedStatus: 'idle',
			aiExtendedText: '',
			aiExtendedCitations: [],
			aiExtendedError: null,
			aiExtendedLoadingText: '',
			aiShowExtended: false,
			aiSessionId: null,
		};

		if ( ! query || query.length < 3 ) {
			this.setState( idleState );
			return;
		}

		// Respect the admin's AI Answers toggle.
		if ( aiAnswersEnabled === false ) {
			this.setState( idleState );
			return;
		}

		// Abort any in-flight requests from the previous query.
		if ( this.aiBriefController ) {
			this.aiBriefController.abort();
		}
		if ( this.aiExtendedController ) {
			this.aiExtendedController.abort();
			this.aiExtendedController = null;
		}
		this.aiBriefController = new AbortController();

		this.setState( { aiShowExtended: false } );

		this.streamAiAnswer( {
			controller: this.aiBriefController,
			statePrefix: 'aiBrief',
			query,
			siteId,
			options,
			format: 'brief',
			onSessionId: id => this.setState( { aiSessionId: id } ),
		} );
	};

	handleShowMore = () => {
		const query = this.props.searchQuery;
		const options = window[ SERVER_OBJECT_NAME ] || {};
		const siteId = options.siteId;

		// Source strings deliberately omit a trailing `…` — answers-panel.jsx
		// appends an animated three-dot ellipsis right after the label, so a
		// static one would render as a doubled "Searching harder… …".
		// Mirrors `Search_Blocks::build_ai_extended_loading_hints()` so the
		// overlay and the embedded `jetpack-search/ai-answer` block share
		// translation keys.
		const loadingMessages = [
			__( 'Searching harder', 'jetpack-search-pkg' ),
			__( 'Looking deeper into this', 'jetpack-search-pkg' ),
			__( 'Finding a more complete answer', 'jetpack-search-pkg' ),
			__( 'Analyzing additional sources', 'jetpack-search-pkg' ),
			__( 'Gathering more details', 'jetpack-search-pkg' ),
			__( 'Pulling in more context', 'jetpack-search-pkg' ),
			__( 'Expanding the search', 'jetpack-search-pkg' ),
			__( 'Rolling up my virtual sleeves', 'jetpack-search-pkg' ),
			__( 'Digging through the archives', 'jetpack-search-pkg' ),
			__( 'Putting on my reading glasses', 'jetpack-search-pkg' ),
			__( 'Checking under the digital couch cushions', 'jetpack-search-pkg' ),
			__( 'Consulting the oracle', 'jetpack-search-pkg' ),
			__( 'Asking a smarter algorithm', 'jetpack-search-pkg' ),
			__( 'Brewing a fresh batch of insights', 'jetpack-search-pkg' ),
			__( 'Unleashing the full power of search', 'jetpack-search-pkg' ),
		];
		const aiExtendedLoadingText =
			loadingMessages[ Math.floor( Math.random() * loadingMessages.length ) ];

		this.aiExtendedController = new AbortController();
		this.setState( { aiShowExtended: true, aiExtendedLoadingText } );
		this.streamAiAnswer( {
			controller: this.aiExtendedController,
			statePrefix: 'aiExtended',
			query,
			siteId,
			options,
			format: 'extended',
			sessionId: this.state.aiSessionId,
		} );
	};

	updateOverlayOptions = ( newOverlayOptions, callback ) => {
		this.setState(
			state => ( {
				overlayOptionsCustomizerOverride: {
					...state.overlayOptionsCustomizerOverride,
					...newOverlayOptions,
				},
			} ),
			callback
		);
	};

	render() {
		const noop = input => input;
		const resultFormat = this.getResultFormat();

		const {
			aiBriefStatus,
			aiBriefText,
			aiBriefCitations,
			aiBriefError,
			aiExtendedStatus,
			aiExtendedText,
			aiExtendedCitations,
			aiExtendedError,
			aiExtendedLoadingText,
			aiShowExtended,
		} = this.state;

		// When showing extended: brief text stays visible; extended text is appended as it arrives.
		// Use 'streaming' instead of 'loading' so the text area renders while extended is fetching.
		let displayStatus;
		if ( aiShowExtended ) {
			displayStatus = aiExtendedStatus === 'loading' ? 'streaming' : aiExtendedStatus;
		} else {
			displayStatus = aiBriefStatus;
		}

		let displayText;
		if ( aiShowExtended ) {
			displayText = aiExtendedText ? aiBriefText + '\n\n' + aiExtendedText : aiBriefText;
		} else {
			displayText = aiBriefText;
		}

		let displayCitations;
		if ( aiShowExtended ) {
			displayCitations = aiExtendedStatus === 'done' ? aiExtendedCitations : aiBriefCitations;
		} else {
			displayCitations = aiBriefCitations;
		}

		const displayError = aiShowExtended ? aiExtendedError : aiBriefError;

		// Show loading hint below brief answer while extended request hasn't started streaming yet.
		const aiLoadingHint =
			aiShowExtended && aiExtendedStatus === 'loading' ? aiExtendedLoadingText : null;

		// null  = extended mode active — render full content without collapse
		// fn    = brief is done and extended not yet shown — render "Show more" button
		// undef = no dual-answer flow — render standard overflow toggle
		let onShowMoreAiAnswer;
		if ( aiShowExtended ) {
			onShowMoreAiAnswer = null;
		} else if ( aiBriefStatus === 'done' ) {
			onShowMoreAiAnswer = this.handleShowMore;
		}

		const portalFn = this.props.shouldCreatePortal ? createPortal : noop;

		return (
			<Fragment>
				{ this.props.isInCustomizer && (
					<CustomizerEventHandler
						showResults={ this.showResults }
						toggleResults={ this.toggleResults }
						updateOverlayOptions={ this.updateOverlayOptions }
					/>
				) }
				{ this.props.shouldIntegrateWithDom && (
					<DomEventHandler
						initializeQueryValues={ this.props.initializeQueryValues }
						isVisible={ this.state.isVisible }
						overlayOptions={ this.state.overlayOptions }
						setFilter={ this.props.setFilter }
						setSearchQuery={ this.props.setSearchQuery }
						showResults={ this.showResults }
						themeOptions={ this.props.themeOptions }
					/>
				) }
				{ portalFn(
					<Overlay
						closeColor={ this.state.overlayOptions.closeColor }
						closeOverlay={ this.hideResults }
						colorTheme={ this.state.overlayOptions.colorTheme }
						hasOverlayWidgets={
							this.props.hasOverlayWidgets ||
							( aiShowExtended ? aiExtendedCitations.length > 0 : aiBriefCitations.length > 0 )
						}
						isVisible={ this.state.isVisible }
					>
						<SearchResults
							aiStatus={ displayStatus }
							aiText={ displayText }
							aiCitations={ displayCitations }
							aiError={ displayError }
							aiLoadingHint={ aiLoadingHint }
							onShowMoreAiAnswer={ onShowMoreAiAnswer }
							closeOverlay={ this.hideResults }
							enableLoadOnScroll={ this.state.overlayOptions.enableInfScroll }
							enableFilteringOpensOverlay={ this.state.overlayOptions.enableFilteringOpensOverlay }
							enableSort={ this.state.overlayOptions.enableSort }
							filters={ this.props.filters }
							staticFilters={ this.props.staticFilters }
							hasError={ this.props.hasError }
							hasNextPage={ this.props.hasNextPage }
							highlightColor={ this.state.overlayOptions.highlightColor }
							isLoading={ this.props.isLoading }
							isPhotonEnabled={ this.props.options.isPhotonEnabled }
							isPrivateSite={ this.props.options.isPrivateSite }
							isVisible={ this.state.isVisible }
							locale={ this.props.options.locale }
							onChangeSearch={ this.props.setSearchQuery }
							onSelectFilter={ ( taxonomy, slug ) => {
								this.props.setFilter( taxonomy, slug );
								this.props.setSearchQuery( '' );
							} }
							onChangeSort={ this.props.setSort }
							onLoadNextPage={ this.loadNextPage }
							overlayTrigger={ this.state.overlayOptions.overlayTrigger }
							postTypes={ this.props.options.postTypes }
							response={ this.props.response }
							resultFormat={ resultFormat }
							searchQuery={ this.props.searchQuery }
							showPoweredBy={ this.state.overlayOptions.showPoweredBy }
							sort={ this.props.sort }
							widgets={ this.props.options.widgets }
							widgetOutsideOverlay={ this.props.widgetOutsideOverlay }
							hasNonSearchWidgets={ this.props.options.hasNonSearchWidgets }
							additionalBlogIds={ this.props.options.additionalBlogIds }
							showPostDate={ this.state.overlayOptions.enablePostDate }
							enableFallbackImage={ this.state.overlayOptions.enableFallbackImage }
							fallbackImageUrl={ this.state.overlayOptions.fallbackImageUrl }
							showProductPrice={ this.state.overlayOptions.enableProductPrice }
							suggestionsEnabled={ !! this.props.options.searchSuggestionsEnabled }
							siteId={ this.props.options.siteId }
						/>
					</Overlay>,
					document.body
				) }
			</Fragment>
		);
	}
}

export default connect(
	( state, props ) => ( {
		filters: getFilters( state ),
		staticFilters: getStaticFilters( state ),
		hasActiveQuery: hasActiveQuery( state ),
		hasError: hasError( state ),
		isHistoryNavigation: isHistoryNavigation( state ),
		hasNextPage: hasNextPage( state ),
		isLoading: isLoading( state ),
		response: getResponse( state ),
		searchQuery: getSearchQuery( state ),
		sort: getSort( state, props.overlayOptions.defaultSort ),
		widgetOutsideOverlay: getWidgetOutsideOverlay( state ),
	} ),
	{
		clearQueryValues,
		disableQueryStringIntegration,
		initializeQueryValues,
		makeSearchRequest,
		setStaticFilter,
		setFilter,
		setSearchQuery,
		setSort,
	}
)( SearchApp );
