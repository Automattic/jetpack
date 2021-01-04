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

/**
 * Internal dependencies
 */
import Overlay from './overlay';
import SearchResults from './search-results';
import { search } from '../lib/api';
import {
	getFilterQuery,
	getResultFormatQuery,
	getSearchQuery,
	getSortQuery,
	hasFilter,
	setSearchQuery,
	setSortQuery,
	setFilterQuery,
	restorePreviousHref,
} from '../lib/query-string';
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
			hasError: false,
			isLoading: false,
			overlayOptions: { ...this.props.initialOverlayOptions },
			requestId: 0,
			response: {},
			showResults: this.props.initialShowResults,
		};
		this.getResults = debounce( this.getResults, 200 );
	}

	componentDidMount() {
		this.getResults( { sort: this.props.initialSort } );
		this.getResults.flush();

		this.addEventListeners();
		this.disableAutocompletion();

		if ( this.hasActiveQuery() ) {
			this.showResults();
		}
	}

	componentWillUnmount() {
		this.removeEventListeners();
		this.restoreBodyScroll();
	}

	addEventListeners() {
		bindCustomizerChanges( this.handleOverlayOptionsUpdate );

		window.addEventListener( 'popstate', this.onPopstate );
		window.addEventListener( 'queryStringChange', this.onChangeQueryString );

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
		window.removeEventListener( 'popstate', this.onPopstate );
		window.removeEventListener( 'queryStringChange', this.onChangeQueryString );

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

	getSort = () => getSortQuery( this.props.initialSort );

	hasActiveQuery() {
		return getSearchQuery() !== '' || hasFilter();
	}

	hasNextPage() {
		return !! this.state.response.page_handle && ! this.state.hasError;
	}

	handleSubmit = event => {
		event.preventDefault();
		this.handleInput.flush();
	};

	handleInput = debounce( event => {
		// Reference: https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes
		if ( event.inputType.includes( 'delete' ) || event.inputType.includes( 'format' ) ) {
			return;
		}

		if ( this.state.overlayOptions.overlayTrigger === 'immediate' ) {
			this.showResults();
		}

		setSearchQuery( event.target.value );
	}, 200 );

	handleFilterInputClick = event => {
		event.preventDefault();
		if ( event.currentTarget.dataset.filterType ) {
			if ( event.currentTarget.dataset.filterType === 'taxonomy' ) {
				setFilterQuery( event.currentTarget.dataset.taxonomy, event.currentTarget.dataset.val );
			} else {
				setFilterQuery( event.currentTarget.dataset.filterType, event.currentTarget.dataset.val );
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

	onPopstate = () => {
		this.onChangeQueryString();
	};

	onChangeQueryString = () => {
		this.getResults().then( () => {
			if ( ( !! getSearchQuery() || hasFilter() ) && ! this.state.showResults ) {
				this.showResults();
			}
		} );

		document.querySelectorAll( this.props.themeOptions.searchInputSelector ).forEach( input => {
			input.value = getSearchQuery();
		} );

		// NOTE: This is necessary to ensure that the search query has been propagated to SearchBox
		this.forceUpdate();
	};

	onChangeSort = sort => setSortQuery( sort );

	loadNextPage = () => {
		this.hasNextPage() && this.getResults( { pageHandle: this.state.response.page_handle } );
	};

	getResults = ( {
		query = getSearchQuery(),
		filter = getFilterQuery(),
		sort = this.getSort(),
		pageHandle,
	} = {} ) => {
		const requestId = this.state.requestId + 1;

		this.setState( { requestId, isLoading: true } );
		return search( {
			// Skip aggregations when requesting for paged results
			aggregations: !! pageHandle ? {} : this.props.aggregations,
			excludedPostTypes: this.props.options.excludedPostTypes,
			filter,
			pageHandle,
			query,
			siteId: this.props.options.siteId,
			sort,
			postsPerPage: this.props.options.postsPerPage,
			adminQueryFilter: this.props.options.adminQueryFilter,
		} )
			.then( newResponse => {
				if ( newResponse === null ) {
					// Request has been cancelled by a more recent request
					return;
				}

				if ( this.state.requestId === requestId ) {
					const response = { ...newResponse };
					if ( !! pageHandle ) {
						response.aggregations = {
							...( 'aggregations' in this.state.response && ! Array.isArray( this.state.response )
								? this.state.response.aggregations
								: {} ),
							...( ! Array.isArray( newResponse.aggregations ) ? newResponse.aggregations : {} ),
						};
						response.results = [
							...( 'results' in this.state.response ? this.state.response.results : [] ),
							...newResponse.results,
						];
					}
					this.setState( { response, hasError: false, isLoading: false } );
					return;
				}
				this.setState( { isLoading: false } );
			} )
			.catch( error => {
				// XHR errors are instances of ProgressEvents.
				if ( error instanceof ProgressEvent ) {
					this.setState( { isLoading: false, hasError: true } );
					return;
				}
				// Stop loading indicator before throwing.
				this.setState( { isLoading: false } );
				throw error;
			} );
	};

	render() {
		// Override the result format from the query string if result_format= is specified
		const resultFormatQuery = getResultFormatQuery();

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
					hasError={ this.state.hasError }
					hasNextPage={ this.hasNextPage() }
					highlightColor={ this.state.overlayOptions.highlightColor }
					isLoading={ this.state.isLoading }
					isPrivateSite={ this.props.options.isPrivateSite }
					isVisible={ this.state.showResults }
					locale={ this.props.options.locale }
					onChangeSort={ this.onChangeSort }
					onLoadNextPage={ this.loadNextPage }
					overlayTrigger={ this.state.overlayOptions.overlayTrigger }
					postTypes={ this.props.options.postTypes }
					query={ getSearchQuery() }
					response={ this.state.response }
					resultFormat={ resultFormatQuery || this.state.overlayOptions.resultFormat }
					showPoweredBy={ this.state.overlayOptions.showPoweredBy }
					sort={ this.getSort() }
					widgets={ this.props.options.widgets }
					widgetsOutsideOverlay={ this.props.options.widgetsOutsideOverlay }
				/>
			</Overlay>,
			document.body
		);
	}
}

export default SearchApp;
