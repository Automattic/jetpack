/** @jsx h */

/**
 * External dependencies
 */
import Preact, { h, Component } from 'preact';
import Portal from 'preact-portal';
// NOTE: We only import the debounce package here for to reduced bundle size.
//       Do not import the entire lodash library!
// eslint-disable-next-line lodash/import-scope
import debounce from 'lodash/debounce';

/**
 * Internal dependencies
 */
import SearchResults from './search-results';
import SearchFiltersWidget from './search-filters-widget';
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
} from '../lib/query-string';
import { removeChildren, hideElements, hideChildren, showChildren } from '../lib/dom';

class SearchApp extends Component {
	constructor() {
		super( ...arguments );
		this.input = Preact.createRef();
		this.requestId = 0;

		// TODO: Rework these lines. We shouldn't reassign properties.
		this.props.resultFormat = 'minimal';
		this.props.aggregations = buildFilterAggregations( this.props.options.widgets );
		this.props.widgets = this.props.options.widgets ? this.props.options.widgets : [];
		this.isSearchPage = this.props.initialValue !== '';

		this.state = {
			isLoading: false,
			query: this.props.initialValue,
			response: {},
			sort: this.props.initialSort,
		};
		this.getDebouncedResults = debounce( this.getResults, 200 );

		//clean up the page in prep for adding component
		// we can manipulate the existing DOM on the page, but not this component because
		// it hasn't mounted yet.
		hideElements( this.props.themeOptions.elem_selectors );
		if ( this.hasActiveQuery() ) {
			this.activateResults();
		}
		this.props.widgets.forEach( function( widget ) {
			removeChildren( document.getElementById( widget.widget_id ) );
		} );
		const searchForms = document.querySelectorAll( this.props.themeOptions.search_form_selector );
		searchForms.forEach( function( elem ) {
			removeChildren( elem );
		} );
	}

	componentDidMount() {
		this.getResults( this.state.query, getFilterQuery(), this.state.sort, null );
		if ( this.props.grabFocus ) {
			this.input.current.focus();
		}
	}

	hasActiveQuery() {
		return this.state.query !== '' || hasFilter();
	}

	hasNextPage() {
		return !! this.state.response.page_handle;
	}

	activateResults() {
		if ( ! this.state.resultsActive ) {
			hideChildren( this.props.themeOptions.results_selector );
			this.setState( { resultsActive: true } );
		}
	}

	maybeDeactivateResults() {
		if ( this.isSearchPage || this.hasActiveQuery() ) {
			return;
		}
		if ( this.state.resultsActive ) {
			this.setState( { resultsActive: false }, () => {
				showChildren( this.props.themeOptions.results_selector );
			} );
		}
	}

	onSearchFocus = () => {
		this.activateResults();
	};

	onSearchBlur = () => {
		this.maybeDeactivateResults();
	};

	onChangeQuery = event => {
		this.activateResults();
		const query = event.target.value;
		this.setState( { query } );
		setSearchQuery( query );
		this.getDebouncedResults( query, getFilterQuery(), getSortQuery(), null );
	};

	onChangeFilter = ( filterName, filterValue ) => {
		setFilterQuery( filterName, filterValue );
		this.getResults( this.state.query, getFilterQuery(), getSortQuery(), null );
		if ( this.hasActiveQuery() ) {
			this.activateResults();
		} else {
			this.maybeDeactivateResults();
		}
	};

	onChangeSort = sort => {
		setSortQuery( sort );
		if ( this.hasActiveQuery() ) {
			this.getResults( this.state.query, getFilterQuery(), getSortQuery(), null );
		}
	};

	loadNextPage = () => {
		this.hasNextPage() &&
			this.getResults(
				this.state.query,
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

	render() {
		const searchForms = Array.from(
			document.querySelectorAll( this.props.themeOptions.search_form_selector )
		);
		return (
			<Preact.Fragment>
				{ this.props.widgets.map( widget => (
					<Portal into={ `#${ widget.widget_id }` }>
						<div id={ `${ widget.widget_id }-wrapper` }>
							<div className="search-form">
								<SearchBox
									onChangeQuery={ this.onChangeQuery }
									onFocus={ this.onSearchFocus }
									onBlur={ this.onSearchBlur }
									appRef={ this.input }
									query={ this.state.query }
								/>
							</div>
							<div className="jetpack-search-sort-wrapper">
								<SearchSortWidget
									initialValue={ this.props.initialSort }
									onChange={ this.onChangeSort }
								/>
							</div>
							<SearchFiltersWidget
								initialValues={ this.props.initialFilters }
								onChange={ this.onChangeFilter }
								loading={ this.state.isLoading }
								postTypes={ this.props.options.postTypes }
								results={ this.state.response }
								widget={ widget }
							/>
						</div>
					</Portal>
				) ) }

				{ searchForms &&
					searchForms.map( elem => (
						<Portal into={ elem }>
							<SearchBox
								onChangeQuery={ this.onChangeQuery }
								appRef={ this.input }
								query={ this.state.query }
							/>
						</Portal>
					) ) }

				{ this.state.resultsActive && (
					<Portal into={ this.props.themeOptions.results_selector }>
						<SearchResults
							hasNextPage={ this.hasNextPage() }
							isLoading={ this.state.isLoading }
							onLoadNextPage={ this.loadNextPage }
							query={ this.state.query }
							response={ this.state.response }
							resultFormat={ this.props.options.resultFormat }
						/>
					</Portal>
				) }
			</Preact.Fragment>
		);
	}
}

export default SearchApp;
