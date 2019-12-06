/** @jsx h */

/**
 * External dependencies
 */
import { Component, createRef, Fragment, h } from 'preact';
import { createPortal } from 'preact/compat';
// NOTE: We only import the debounce package here for to reduced bundle size.
//       Do not import the entire lodash library!
// eslint-disable-next-line lodash/import-scope
import debounce from 'lodash/debounce';

/**
 * Internal dependencies
 */
import SearchBox from './search-box';
import SearchResults from './search-results';
import SearchWidget from './search-widget';
import { search } from '../lib/api';
import {
	getFilterQuery,
	getSearchQuery,
	getSortQuery,
	getResultFormatQuery,
	hasFilter,
	restorePreviousHref,
} from '../lib/query-string';
import { removeChildren, hideElements, hideChildren, showChildren } from '../lib/dom';

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
		this.prepareDomForMounting();
	}

	componentDidMount() {
		this.getResults( { sort: this.props.initialSort } );

		this.getResults.flush();

		if ( this.hasActiveQuery() ) {
			this.showResults();
		}

		if ( this.props.grabFocus ) {
			this.input.current.focus();
		}

		window.addEventListener( 'popstate', this.onChangeQueryString );
		window.addEventListener( 'queryStringChange', this.onChangeQueryString );
	}

	componentWillUnmount() {
		window.removeEventListener( 'popstate', this.onChangeQueryString );
		window.removeEventListener( 'queryStringChange', this.onChangeQueryString );
	}

	prepareDomForMounting() {
		// Clean up the page prior to mounting component
		hideElements( this.props.themeOptions.elementSelectors );
		document
			.querySelectorAll( '.jetpack-instant-search-wrapper' )
			.forEach( widget => removeChildren( widget ) );
		document
			.querySelectorAll( this.props.themeOptions.searchFormSelector )
			.forEach( searchForm => removeChildren( searchForm ) );
	}

	hasActiveQuery() {
		return getSearchQuery() !== '' || hasFilter();
	}

	hasNextPage() {
		return !! this.state.response.page_handle && ! this.state.hasError;
	}

	showResults = () => {
		if ( this.hasActiveQuery() && ! this.state.showResults ) {
			hideChildren( this.props.themeOptions.resultsSelector );
			this.setState( { showResults: true } );
		}
	};

	hideResults = () => {
		if ( this.props.isSearchPage || this.hasActiveQuery() || ! this.state.showResults ) {
			return;
		}

		this.setState( { showResults: false }, () => {
			showChildren( this.props.themeOptions.resultsSelector );
			restorePreviousHref( this.props.initialHref );
		} );
	};

	onChangeQueryString = () => {
		if ( this.hasActiveQuery() ) {
			this.showResults();
		} else {
			this.hideResults();
		}
		this.getResults();
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

	renderWidgets() {
		return this.props.options.widgets.map( widget => (
			<SearchWidget
				isLoading={ this.state.isLoading }
				locale={ this.props.options.locale }
				onSearchBlur={ this.hideResults }
				onSearchFocus={ this.showResults }
				postTypes={ this.props.options.postTypes }
				response={ this.state.response }
				widget={ widget }
			/>
		) );
	}

	renderSearchForms() {
		const searchForms = Array.from(
			document.querySelectorAll( this.props.themeOptions.searchFormSelector )
		);
		return (
			searchForms &&
			searchForms.map( searchForm =>
				createPortal(
					<SearchBox
						onChangeQuery={ this.onChangeQuery }
						appRef={ this.input }
						query={ getSearchQuery() }
					/>,
					searchForm
				)
			)
		);
	}

	render() {
		return (
			<Fragment>
				{ this.renderWidgets() }
				{ this.renderSearchForms() }
				{ this.state.showResults &&
					createPortal(
						<SearchResults
							hasError={ this.state.hasError }
							hasNextPage={ this.hasNextPage() }
							isLoading={ this.state.isLoading }
							onLoadNextPage={ this.loadNextPage }
							locale={ this.props.options.locale }
							query={ getSearchQuery() }
							response={ this.state.response }
							resultFormat={ getResultFormatQuery() }
							enableLoadOnScroll={ this.props.options.enableLoadOnScroll }
						/>,
						document.querySelector( this.props.themeOptions.resultsSelector )
					) }
			</Fragment>
		);
	}
}

export default SearchApp;
