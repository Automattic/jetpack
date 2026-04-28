import { fetchEventSource } from '@microsoft/fetch-event-source';
import debounce from 'debounce';
import stringify from 'fast-json-stable-stringify';
import * as React from 'react';
import { Component, Fragment } from 'react';
import { createPortal } from 'react-dom';
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
			// AI Answers state
			aiStatus: 'idle', // 'idle' | 'loading' | 'streaming' | 'done' | 'error'
			aiText: '',
			aiCitations: [],
			aiError: null,
		};

		this.getResults = debounce( this.getResults, 200 );
		this.aiController = null;
		this.getAiAnswer = debounce( this.getAiAnswer, 400 );
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
		if ( this.aiController ) {
			this.aiController.abort();
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

	getAiAnswer = () => {
		const query = this.props.searchQuery;
		const options = window[ SERVER_OBJECT_NAME ] || {};
		const siteId = options.aiAnswersSiteId || options.siteId;

		if ( ! query || query.length < 3 ) {
			this.setState( { aiStatus: 'idle', aiText: '', aiCitations: [], aiError: null } );
			return;
		}

		if ( this.aiController ) {
			this.aiController.abort();
		}
		this.aiController = new AbortController();
		const controller = this.aiController; // local capture to avoid race in .catch()

		this.setState( { aiStatus: 'loading', aiText: '', aiCitations: [], aiError: null } );

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
				id: `req-${ Date.now() }`,
				method: 'message/stream',
				constructor_arguments: {},
				params: {
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
									},
								},
								metadata: {},
							},
						],
						kind: 'message',
						messageId: `msg-${ Date.now() }`,
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
					if ( data.method === 'message/delta' && data.params?.delta?.deltaType === 'content' ) {
						this.setState( state => ( {
							aiStatus: 'streaming',
							aiText: state.aiText + ( data.params.delta.content ?? '' ),
						} ) );
					} else if (
						data.result?.type === 'TaskStatusUpdateEvent' &&
						data.result?.status?.state === 'completed'
					) {
						const parts = data.result.status.message?.parts || [];
						const dataPart = parts.find( p => p.type === 'data' );
						const citations = dataPart?.data?.sources || dataPart?.data?.strict_sources || [];
						this.setState( { aiStatus: 'done', aiCitations: citations } );
					} else if ( data.result?.status?.state === 'failed' || data.error ) {
						const textPart = data.result?.status?.message?.parts?.find( p => p.type === 'text' );
						const message = data.error?.message || textPart?.text || 'Request failed';
						const code = data.error?.code ?? null;
						this.setState( {
							aiStatus: 'error',
							aiError: { message, code, source: 'api' },
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
					aiStatus: 'error',
					aiError: httpError ?? { message: 'Network request error', code: null, source: 'network' },
				} );
			}
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
						hasOverlayWidgets={ this.props.hasOverlayWidgets || this.state.aiCitations.length > 0 }
						isVisible={ this.state.isVisible }
					>
						<SearchResults
							aiStatus={ this.state.aiStatus }
							aiText={ this.state.aiText }
							aiCitations={ this.state.aiCitations }
							aiError={ this.state.aiError }
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
