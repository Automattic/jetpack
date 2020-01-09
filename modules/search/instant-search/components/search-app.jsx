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
} from '../lib/query-string';

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
	}

	addEventListeners() {
		window.addEventListener( 'popstate', this.onChangeQueryString );
		window.addEventListener( 'queryStringChange', this.onChangeQueryString );

		document.querySelectorAll( this.props.themeOptions.searchInputSelector ).forEach( input => {
			input.form.addEventListener( 'submit', this.handleSubmit );
			input.addEventListener( 'input', this.handleInput );
		} );

		document.querySelectorAll( this.props.themeOptions.searchSortSelector ).forEach( select => {
			select.addEventListener( 'change', this.handleSortChange );
		} );
	}

	removeEventListeners() {
		window.removeEventListener( 'popstate', this.onChangeQueryString );
		window.removeEventListener( 'queryStringChange', this.onChangeQueryString );

		document.querySelectorAll( this.props.themeOptions.searchInputSelector ).forEach( input => {
			input.form.removeEventListener( 'submit', this.handleSubmit );
			input.removeEventListener( 'input', this.handleInput );
		} );

		document.querySelectorAll( this.props.themeOptions.searchSortSelector ).forEach( select => {
			select.removeEventListener( 'change', this.handleSortChange );
		} );
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

	showResults = () => this.setState( { showResults: true } );
	hideResults = () => this.setState( { showResults: false } );

	onChangeQuery = event => setSearchQuery( event.target.value );

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
			<Overlay shouldShowOverlay={ this.state.showResults } closeOverlay={ this.hideResults }>
				<SearchResults
					enableLoadOnScroll={ this.props.options.enableLoadOnScroll }
					hasError={ this.state.hasError }
					hasNextPage={ this.hasNextPage() }
					isLoading={ this.state.isLoading }
					locale={ this.props.options.locale }
					onLoadNextPage={ this.loadNextPage }
					query={ getSearchQuery() }
					response={ this.state.response }
					resultFormat={ getResultFormatQuery() }
				/>
			</Overlay>,
			document.body
		);
	}
}

export default SearchApp;
