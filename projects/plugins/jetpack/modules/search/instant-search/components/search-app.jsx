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
import stringify from 'fast-json-stable-stringify';

/**
 * Internal dependencies
 */
import Overlay from './overlay';
import SearchResults from './search-results';
import { getResultFormatQuery, restorePreviousHref } from '../lib/query-string';
import {
	clearQueryValues,
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
	hasActiveQuery,
	hasError,
	hasNextPage,
	isHistoryNavigation,
	isLoading,
} from '../store/selectors';
import { bindCustomizerChanges, isInCustomizer } from '../lib/customize';
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
			showResults: !! this.props.initialShowResults, // initialShowResults can be undefined
		};
		this.getResults = debounce( this.getResults, 200 );
		this.props.initializeQueryValues();
	}

	componentDidMount() {
		this.getResults();
		this.getResults.flush();

		this.addEventListeners();
		this.disableAutocompletion();

		if ( this.props.hasActiveQuery ) {
			this.showResults();
		}
	}

	componentDidUpdate( prevProps ) {
		if (
			prevProps.searchQuery !== this.props.searchQuery ||
			prevProps.sort !== this.props.sort ||
			// Note the special handling for filters prop, which use object values.
			stringify( prevProps.filters ) !== stringify( this.props.filters )
		) {
			this.onChangeQueryString( this.props.isHistoryNavigation );
		}
	}

	componentWillUnmount() {
		this.removeEventListeners();
		this.restoreBodyScroll();
	}

	addEventListeners() {
		bindCustomizerChanges( this.handleOverlayOptionsUpdate );

		window.addEventListener( 'popstate', this.handleHistoryNavigation );

		// Add listeners for input and submit
		document.querySelectorAll( this.props.themeOptions.searchInputSelector ).forEach( input => {
			input.form.addEventListener( 'submit', this.handleSubmit );
			input.addEventListener( 'keydown', this.handleKeydown );
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
		window.removeEventListener( 'popstate', this.handleHistoryNavigation );

		document.querySelectorAll( this.props.themeOptions.searchInputSelector ).forEach( input => {
			input.form.removeEventListener( 'submit', this.handleSubmit );
			input.removeEventListener( 'keydown', this.handleKeydown );
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

	handleHistoryNavigation = () => {
		// Treat history navigation as brand new query values; re-initialize.
		// Note that this re-initialization will trigger onChangeQueryString via side effects.
		this.props.initializeQueryValues( { isHistoryNavigation: true } );
	};

	handleSubmit = event => {
		event.preventDefault();
		this.handleInput.flush();

		// handleInput didn't respawn the overlay. Do it manually -- form submission must spawn an overlay.
		if ( ! this.state.showResults ) {
			const value = event.target.querySelector( this.props.themeOptions.searchInputSelector )
				?.value;
			// Don't do a falsy check; empty string is an allowed value.
			typeof value === 'string' && this.props.setSearchQuery( value );
			this.showResults();
		}
	};

	handleKeydown = event => {
		// If user presses enter, propagate the query value and immediately show the results.
		if ( event.key === 'Enter' ) {
			this.props.setSearchQuery( event.target.value );
			this.showResults();
		}
	};

	handleInput = debounce( event => {
		// Reference: https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes
		// NOTE: inputType is not compatible with IE11, so we use optional chaining here. https://caniuse.com/mdn-api_inputevent_inputtype
		if ( event.inputType?.includes( 'format' ) || event.target.value === '' ) {
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

	// Treat overlay trigger clicks to be equivalent to setting an empty string search query.
	handleOverlayTriggerClick = event => {
		event.stopImmediatePropagation();
		this.props.setSearchQuery( '' );
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

	hideResults = isHistoryNav => {
		this.restoreBodyScroll();
		restorePreviousHref(
			this.props.initialHref,
			() => {
				this.setState( { showResults: false } );
				this.props.clearQueryValues();
			},
			isHistoryNav
		);
	};

	onChangeQueryString = isHistoryNav => {
		this.getResults();

		if ( this.props.hasActiveQuery && ! this.state.showResults ) {
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
			excludedPostTypes: this.props.options.excludedPostTypes,
			filter: this.props.filters,
			pageHandle,
			query: this.props.searchQuery,
			resultFormat: this.getResultFormat(),
			siteId: this.props.options.siteId,
			sort: this.props.sort,
			postsPerPage: this.props.options.postsPerPage,
			adminQueryFilter: this.props.options.adminQueryFilter,
			isInCustomizer: isInCustomizer(),
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
					isPhotonEnabled={ this.props.options.isPhotonEnabled }
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
	( state, props ) => ( {
		filters: getFilters( state ),
		hasActiveQuery: hasActiveQuery( state ),
		hasError: hasError( state ),
		isHistoryNavigation: isHistoryNavigation( state ),
		hasNextPage: hasNextPage( state ),
		isLoading: isLoading( state ),
		response: getResponse( state ),
		searchQuery: getSearchQuery( state ),
		sort: getSort( state, props.defaultSort ),
		widgetOutsideOverlay: getWidgetOutsideOverlay( state ),
	} ),
	{
		clearQueryValues,
		initializeQueryValues,
		makeSearchRequest,
		setFilter,
		setSearchQuery,
		setSort,
	}
)( SearchApp );
