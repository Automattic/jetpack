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
import SearchResults from './search-results';
import SearchFilters from './search-filters';
import SearchSortWidget from './search-sort-widget';
import SearchBox from './search-box';
import { search, buildFilterAggregations } from '../lib/api';
import {
	setSearchQuery,
	setFilterQuery,
	getFilterQuery,
	setSortQuery,
	getSortQuery,
	hasFilter,
	restorePreviousHref,
	getSearchQuery,
} from '../lib/query-string';
import { removeChildren, hideElements, hideChildren, showChildren } from '../lib/dom';

class SearchApp extends Component {
	static defaultProps = {
		resultFormat: 'minimal',
		widgets: [],
	};

	constructor() {
		super( ...arguments );
		this.input = createRef();
		this.requestId = 0;

		// TODO: Rework this line; we shouldn't reassign properties.
		this.props.aggregations = buildFilterAggregations( this.props.options.widgets );

		this.state = { isLoading: false, response: {}, showResults: false };
		this.getDebouncedResults = debounce( this.getResults, 200 );
		this.prepareDomForMounting();
	}

	componentDidMount() {
		this.getResults( getSearchQuery(), getFilterQuery(), this.props.initialSort, null );
		if ( this.hasActiveQuery() ) {
			this.showResults();
		}
		if ( this.props.grabFocus ) {
			this.input.current.focus();
		}

		window.addEventListener( 'queryStringChange', this.onChangeQueryString );
	}
	componentWillUnmount() {
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
		return !! this.state.response.page_handle;
	}

	showResults() {
		if ( ! this.state.showResults ) {
			hideChildren( this.props.themeOptions.resultsSelector );
			this.setState( { showResults: true } );
		}
	}

	hideResults() {
		if ( this.props.isSearchPage || this.hasActiveQuery() || ! this.state.showResults ) {
			return;
		}

		this.setState( { showResults: false }, () => {
			showChildren( this.props.themeOptions.resultsSelector );
			restorePreviousHref( this.props.initialHref );
		} );
	}

	onSearchFocus = () => {
		if ( this.hasActiveQuery() ) {
			this.showResults();
		}
	};

	onSearchBlur = () => {
		if ( this.state.showResults ) {
			this.hideResults();
		}
	};

	onChangeQuery = event => {
		setSearchQuery( event.target.value );
	};

	onChangeQueryString = () => {
		if ( this.hasActiveQuery() ) {
			this.showResults();
		} else {
			this.hideResults();
		}
		this.getDebouncedResults( getSearchQuery(), getFilterQuery(), getSortQuery(), null );
	};

	onChangeFilter = ( filterName, filterValue ) => {
		setFilterQuery( filterName, filterValue );
	};

	onChangeSort = sort => {
		setSortQuery( sort );
	};

	loadNextPage = () => {
		this.hasNextPage() &&
			this.getResults(
				getSearchQuery(),
				getFilterQuery(),
				getSortQuery(),
				this.state.response.page_handle
			);
	};

	getResults = ( query, filter, sort, pageHandle ) => {
		this.requestId++;
		const requestId = this.requestId;

		this.setState( { isLoading: true }, () => {
			search( {
				// Skip aggregations when requesting for paged results
				aggregations: !! pageHandle ? {} : this.props.aggregations,
				filter,
				pageHandle,
				query,
				resultFormat: this.props.options.resultFormat,
				siteId: this.props.options.siteId,
				sort,
			} ).then( newResponse => {
				if ( this.requestId === requestId ) {
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
					this.setState( { response } );
				}
				this.setState( { isLoading: false } );
			} );
		} );
	};

	renderWidgets() {
		return this.props.options.widgets.map( widget =>
			createPortal(
				<div id={ `${ widget.widget_id }-portaled-wrapper` }>
					<div className="search-form">
						<SearchBox
							onChangeQuery={ this.onChangeQuery }
							onFocus={ this.onSearchFocus }
							onBlur={ this.onSearchBlur }
							appRef={ this.input }
							query={ getSearchQuery() }
						/>
					</div>
					<div className="jetpack-search-sort-wrapper">
						<SearchSortWidget onChange={ this.onChangeSort } value={ getSortQuery() } />
					</div>
					<SearchFilters
						filters={ getFilterQuery() }
						loading={ this.state.isLoading }
						locale={ this.props.options.locale }
						onChange={ this.onChangeFilter }
						postTypes={ this.props.options.postTypes }
						results={ this.state.response }
						widget={ widget }
					/>
				</div>,
				document.getElementById( `${ widget.widget_id }-wrapper` )
			)
		);
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
							hasNextPage={ this.hasNextPage() }
							isLoading={ this.state.isLoading }
							onLoadNextPage={ this.loadNextPage }
							locale={ this.props.options.locale }
							query={ getSearchQuery() }
							response={ this.state.response }
							resultFormat={ this.props.options.resultFormat }
							enableLoadOnScroll={ this.props.options.enableLoadOnScroll }
						/>,
						document.querySelector( this.props.themeOptions.resultsSelector )
					) }
			</Fragment>
		);
	}
}

export default SearchApp;
