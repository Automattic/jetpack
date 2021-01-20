/** @jsx h */

/**
 * External dependencies
 */
import { Component, createRef, h } from 'preact';
import { createPortal } from 'preact/compat';
// NOTE: We only import the debounce package here for to reduced bundle size.
//       Do not import the entire lodash library!
// eslint-disable-next-line lodash/import-scope
import debounce from 'lodash/debounce';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import Overlay from './overlay';
import SearchResults from './search-results';
import { getResultFormatQuery, restorePreviousHref } from '../lib/query-string';
import {
	initializeQueryValues,
	makeSearchRequest,
	setFilter,
	setSearchQuery,
	setSort,
} from '../store/actions';
import {
	getFilters,
	getResponse,
	getSearchQuery,
	getSort,
	getWidgetOutsideOverlay,
	hasError,
	hasFilters,
	hasNextPage,
	isLoading,
} from '../store/selectors';
import { bindCustomizerChanges } from '../lib/customize';
import './search-app.scss';

class SearchApp extends Component {
	static defaultProps = {
		widgets: [],
	};

	constructor() {
		super( ...arguments );
		this.input = createRef();
		this.state = {
			overlayOptions: { ...this.props.initialOverlayOptions },
			showResults: this.props.initialShowResults,
		};
		this.getResults = debounce( this.getResults, 200 );
		this.props.initializeQueryValues( {
			defaultSort: this.props.defaultSort,
		} );
	}

	componentDidMount() {
		this.getResults();
		this.getResults.flush();

		this.addEventListeners();
		this.disableAutocompletion();

		if ( this.hasActiveQuery() ) {
			this.showResults();
		}
	}

	componentDidUpdate( prevProps ) {
		if (
			prevProps.searchQuery !== this.props.searchQuery ||
			prevProps.sort !== this.props.sort ||
			prevProps.filters !== this.props.filters
		) {
			this.onChangeQueryString();
		}
	}

	componentWillUnmount() {
		this.removeEventListeners();
		this.restoreBodyScroll();
	}

	addEventListeners() {
		bindCustomizerChanges( this.handleOverlayOptionsUpdate );

		window.addEventListener( 'popstate', this.handleBrowserHistoryNavigation );

		// Add listeners for input and submit
		document.querySelectorAll( this.props.themeOptions.searchInputSelector ).forEach( input => {
			input.form.addEventListener( 'submit', this.handleSubmit );
			input.addEventListener( 'input', this.handleInput );
		} );

		document.querySelectorAll( this.props.themeOptions.overlayTriggerSelector ).forEach( button => {
			button.addEventListener( 'click', this.handleOverlayTriggerClick, true );
		} );

		document.querySelectorAll( this.props.themeOptions.filterInputSelector ).forEach( element => {
			element.addEventListener( 'click', this.handleFilterInputClick );
		} );
	}

	removeEventListeners() {
		window.removeEventListener( 'popstate', this.handleBrowserHistoryNavigation );

		document.querySelectorAll( this.props.themeOptions.searchInputSelector ).forEach( input => {
			input.form.removeEventListener( 'submit', this.handleSubmit );
			input.removeEventListener( 'input', this.handleInput );
		} );

		document.querySelectorAll( this.props.themeOptions.overlayTriggerSelector ).forEach( button => {
			button.removeEventListener( 'click', this.handleOverlayTriggerClick, true );
		} );

		document.querySelectorAll( this.props.themeOptions.filterInputSelector ).forEach( element => {
			element.removeEventListener( 'click', this.handleFilterInputClick );
		} );
	}

	disableAutocompletion() {
		document.querySelectorAll( this.props.themeOptions.searchInputSelector ).forEach( input => {
			input.setAttribute( 'autocomplete', 'off' );
			input.form.setAttribute( 'autocomplete', 'off' );
		} );
	}

	preventBodyScroll() {
		document.body.style.overflowY = 'hidden';
	}

	restoreBodyScroll() {
		document.body.style.overflowY = null;
	}

	getResultFormat = () => {
		// Override the result format from the query string if result_format= is specified
		const resultFormatQuery = getResultFormatQuery();
		return resultFormatQuery || this.state.overlayOptions.resultFormat;
	};

	hasActiveQuery() {
		return this.props.searchQuery !== '' || this.props.hasFilters;
	}

	handleBrowserHistoryNavigation = () => {
		// Treat history navigation as brand new query values; re-initialize.
		this.props.initializeQueryValues( {
			defaultSort: this.props.defaultSort,
		} );
	};

	handleSubmit = event => {
		event.preventDefault();
		this.handleInput.flush();
	};

	handleInput = debounce( event => {
		// Reference: https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes
		if ( event.inputType.includes( 'format' ) || event.target.value === '' ) {
			return;
		}
		this.props.setSearchQuery( event.target.value );

		if ( this.state.overlayOptions.overlayTrigger === 'immediate' ) {
			this.showResults();
		}
		if ( this.state.overlayOptions.overlayTrigger === 'results' ) {
			this.props.response?.results && this.showResults();
		}
	}, 200 );

	handleFilterInputClick = event => {
		event.preventDefault();
		if ( event.currentTarget.dataset.filterType ) {
			if ( event.currentTarget.dataset.filterType === 'taxonomy' ) {
				this.props.setFilter(
					event.currentTarget.dataset.taxonomy,
					event.currentTarget.dataset.val
				);
			} else {
				this.props.setFilter(
					event.currentTarget.dataset.filterType,
					event.currentTarget.dataset.val
				);
			}
		}
		this.showResults();
	};

	handleOverlayTriggerClick = event => {
		event.stopImmediatePropagation();
		this.showResults();
	};

	handleOverlayOptionsUpdate = newOverlayOptions => {
		this.setState(
			state => ( { overlayOptions: { ...state.overlayOptions, ...newOverlayOptions } } ),
			() => {
				this.showResults();
			}
		);
	};

	showResults = () => {
		this.setState( { showResults: true } );
		this.preventBodyScroll();
	};

	hideResults = () => {
		this.restoreBodyScroll();
		restorePreviousHref( this.props.initialHref, () => {
			this.setState( { showResults: false } );
		} );
	};

	onChangeQueryString = () => {
		this.getResults();

		if ( this.hasActiveQuery() && ! this.state.showResults ) {
			this.showResults();
		}

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
			excludedPostTypes: this.props.options.excludedPostTypes,
			filter: this.props.filters,
			pageHandle,
			query: this.props.searchQuery,
			resultFormat: this.getResultFormat(),
			siteId: this.props.options.siteId,
			sort: this.props.sort,
			postsPerPage: this.props.options.postsPerPage,
			adminQueryFilter: this.props.options.adminQueryFilter,
		} );
	};

	render() {
		const resultFormat = this.getResultFormat();

		return createPortal(
			<Overlay
				closeColor={ this.state.overlayOptions.closeColor }
				closeOverlay={ this.hideResults }
				colorTheme={ this.state.overlayOptions.colorTheme }
				hasOverlayWidgets={ this.props.hasOverlayWidgets }
				isVisible={ this.state.showResults }
				opacity={ this.state.overlayOptions.opacity }
			>
				<SearchResults
					closeOverlay={ this.hideResults }
					enableLoadOnScroll={ this.state.overlayOptions.enableInfScroll }
					enableSort={ this.state.overlayOptions.enableSort }
					filters={ this.props.filters }
					hasError={ this.props.hasError }
					hasNextPage={ this.props.hasNextPage }
					highlightColor={ this.state.overlayOptions.highlightColor }
					isLoading={ this.props.isLoading }
					isPrivateSite={ this.props.options.isPrivateSite }
					isVisible={ this.state.showResults }
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
				/>
			</Overlay>,
			document.body
		);
	}
}

export default connect(
	state => ( {
		filters: getFilters( state ),
		hasError: hasError( state ),
		hasFilters: hasFilters( state ),
		hasNextPage: hasNextPage( state ),
		isLoading: isLoading( state ),
		response: getResponse( state ),
		searchQuery: getSearchQuery( state ),
		sort: getSort( state ),
		widgetOutsideOverlay: getWidgetOutsideOverlay( state ),
	} ),
	{ initializeQueryValues, makeSearchRequest, setFilter, setSearchQuery, setSort }
)( SearchApp );
