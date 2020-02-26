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
	getSearchQuery,
	getSortQuery,
	getResultFormatQuery,
	hasFilter,
	setSearchQuery,
	setSortQuery,
	getSortKeyFromSortOption,
	getSortOptionFromSortKey,
	setFilterQuery,
	restorePreviousHref,
} from '../lib/query-string';
import { bindCustomizerChanges } from '../lib/customize';

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
			showResults: false,
		};
		this.getResults = debounce( this.getResults, 200 );
	}

	componentDidMount() {
		this.getResults( { sort: this.props.initialSort } );
		this.getResults.flush();

		this.addEventListeners();

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

		document.querySelectorAll( this.props.themeOptions.searchInputSelector ).forEach( input => {
			input.form.addEventListener( 'submit', this.handleSubmit );
			input.addEventListener( 'input', this.handleInput );
		} );

		document.querySelectorAll( this.props.themeOptions.searchSortSelector ).forEach( select => {
			select.addEventListener( 'change', this.handleSortChange );
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

		document.querySelectorAll( this.props.themeOptions.searchSortSelector ).forEach( select => {
			select.removeEventListener( 'change', this.handleSortChange );
		} );

		document.querySelectorAll( this.props.themeOptions.filterInputSelector ).forEach( element => {
			element.removeEventListener( 'click', this.handleFilterInputClick );
		} );
	}

	preventBodyScroll() {
		document.body.style.overflowY = 'hidden';
	}

	restoreBodyScroll() {
		document.body.style.overflowY = null;
	}

	hasActiveQuery() {
		return getSearchQuery() !== '' || hasFilter();
	}

	hasNextPage() {
		return !! this.state.response.page_handle && ! this.state.hasError;
	}

	handleSubmit = event => {
		event.preventDefault();
		this.showResults();
	};

	handleInput = event => {
		setSearchQuery( event.target.value );
	};

	handleSortChange = event => {
		setSortQuery( getSortKeyFromSortOption( event.target.value ) );
	};

	handleFilterInputClick = event => {
		event.preventDefault();

		if ( event.target.dataset.filterType ) {
			if ( event.target.dataset.filterType === 'taxonomy' ) {
				setFilterQuery( event.target.dataset.taxonomy, event.target.dataset.val );
			} else {
				setFilterQuery( event.target.dataset.filterType, event.target.dataset.val );
			}
		}
		this.showResults();
	};

	handleOverlayOptionsUpdate = ( { key, value } ) => {
		this.setState( { overlayOptions: { ...this.state.overlayOptions, [ key ]: value } } );
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

	onChangeQuery = event => setSearchQuery( event.target.value );

	onPopstate = () => {
		this.showResults();
		this.onChangeQueryString();
	};

	onChangeQueryString = () => {
		this.getResults();

		document.querySelectorAll( this.props.themeOptions.searchInputSelector ).forEach( input => {
			input.value = getSearchQuery();
		} );

		document.querySelectorAll( this.props.themeOptions.searchSortSelector ).forEach( select => {
			select.value = getSortOptionFromSortKey( getSortQuery() );
		} );
	};

	loadNextPage = () => {
		this.hasNextPage() && this.getResults( { pageHandle: this.state.response.page_handle } );
	};

	getResults = ( {
		query = getSearchQuery(),
		filter = getFilterQuery(),
		sort = getSortQuery(),
		resultFormat = getResultFormatQuery(),
		pageHandle,
	} = {} ) => {
		const requestId = this.state.requestId + 1;

		this.setState( { requestId, isLoading: true }, () => {
			search( {
				// Skip aggregations when requesting for paged results
				aggregations: !! pageHandle ? {} : this.props.aggregations,
				filter,
				pageHandle,
				query,
				resultFormat,
				siteId: this.props.options.siteId,
				sort,
				postsPerPage: this.props.options.postsPerPage,
			} )
				.then( newResponse => {
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
						this.setState( { response, hasError: false } );
					}
					this.setState( { isLoading: false } );
				} )
				.catch( error => {
					if ( error instanceof ProgressEvent ) {
						this.setState( { isLoading: false, hasError: true } );
						return;
					}
					throw error;
				} );
		} );
	};

	render() {
		return createPortal(
			<Overlay
				closeColor={ this.state.overlayOptions.closeColor }
				closeOverlay={ this.hideResults }
				colorTheme={ this.state.overlayOptions.colorTheme }
				isVisible={ this.state.showResults }
				opacity={ this.state.overlayOptions.opacity }
			>
				<SearchResults
					closeOverlay={ this.hideResults }
					enableLoadOnScroll={ this.state.overlayOptions.enableInfScroll }
					hasError={ this.state.hasError }
					hasNextPage={ this.hasNextPage() }
					highlightColor={ this.state.overlayOptions.highlightColor }
					isLoading={ this.state.isLoading }
					isVisible={ this.state.showResults }
					locale={ this.props.options.locale }
					onLoadNextPage={ this.loadNextPage }
					postTypes={ this.props.options.postTypes }
					query={ getSearchQuery() }
					response={ this.state.response }
					resultFormat={ getResultFormatQuery() }
					showPoweredBy={ this.state.overlayOptions.showPoweredBy }
					widgets={ this.props.options.widgets }
				/>
			</Overlay>,
			document.body
		);
	}
}

export default SearchApp;
