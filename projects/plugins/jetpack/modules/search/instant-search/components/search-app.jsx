/**
 * External dependencies
 */
import React, { Component, Fragment } from 'react';
import { createPortal } from 'react-dom';
// NOTE: We only import the debounce function here for reduced bundle size.
//       Do not import the entire lodash library!
// eslint-disable-next-line lodash/import-scope
import debounce from 'lodash/debounce';
import { connect } from 'react-redux';
import stringify from 'fast-json-stable-stringify';

/**
 * Internal dependencies
 */
import CustomizerEventHandler from './customizer-event-handler';
import DomEventHandler from './dom-event-handler';
import Overlay from './overlay';
import SearchResults from './search-results';
import {
	disableAnalytics,
	identifySite,
	initializeTracks,
	resetTrackingCookies,
} from '../lib/tracks';
import { MULTISITE_NO_GROUP_VALUE, RESULT_FORMAT_EXPANDED } from '../lib/constants';
import { getAvailableStaticFilters } from '../lib/filters';
import { getResultFormatQuery, restorePreviousHref } from '../lib/query-string';
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
import './search-app.scss';

class SearchApp extends Component {
	static defaultProps = {
		overlayOptions: {},
		widgets: [],
	};

	constructor() {
		super( ...arguments );

		this.state = {
			isVisible: !! this.props.initialIsVisible, // initialIsVisible can be undefined
			overlayOptionsCustomizerOverride: {},
		};

		this.getResults = debounce( this.getResults, 200 );
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
		// By debouncing this upon mounting, we avoid making unnecessary requests.
		//
		// E.g. Given `/?s=apple`, the search app will mount with search query "" and invoke getResults.
		//      Once our Redux effects have executed, the search query will be updated to "apple" and
		//      getResults will be invoked once more.
		this.getResults();

		if ( this.props.hasActiveQuery ) {
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

	initializeAnalytics() {
		initializeTracks();
		resetTrackingCookies();
		identifySite( this.props.options.siteId );
	}

	getResultFormat = () => {
		// Override the result format from the query string if result_format= is specified
		const resultFormatQuery = getResultFormatQuery();

		// Override the result format if group static filter is selected, always use expanded.
		const isMultiSite =
			this.props.staticFilters &&
			this.props.staticFilters.group_id &&
			this.props.staticFilters.group_id !== MULTISITE_NO_GROUP_VALUE;
		if ( isMultiSite ) {
			return RESULT_FORMAT_EXPANDED;
		}

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
			sort: this.props.sort,
			postsPerPage: this.props.options.postsPerPage,
			adminQueryFilter: this.props.options.adminQueryFilter,
			isInCustomizer: this.props.isInCustomizer,
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
						hasOverlayWidgets={ this.props.hasOverlayWidgets }
						isVisible={ this.state.isVisible }
					>
						<SearchResults
							closeOverlay={ this.hideResults }
							enableLoadOnScroll={ this.state.overlayOptions.enableInfScroll }
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
