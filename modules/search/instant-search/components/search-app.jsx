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
} from '../lib/query-string';
import { removeChildren, hideElements } from '../lib/dom';

class SearchApp extends Component {
	constructor() {
		super( ...arguments );
		this.input = Preact.createRef();
		this.requestId = 0;
		this.newResults = true;
		this.props.resultFormat = 'minimal';
		this.props.aggregations = buildFilterAggregations( this.props.options.widgets );
		this.props.widgets = this.props.options.widgets ? this.props.options.widgets : [];
		this.state = {
			query: this.props.initialValue,
			sort: this.props.initialSort,
			results: {},
			loading: false,
		};
		this.getResults = debounce( this.getResults, 200 );
		this.getResults( this.state.query, getFilterQuery(), this.state.sort );
	}

	componentDidMount() {
		if ( this.props.grabFocus ) {
			this.input.current.focus();
		}

		hideElements( this.props.themeOptions.elem_selectors );
		removeChildren( document.querySelector( this.props.themeOptions.results_selector ) );
		this.props.widgets.forEach( function( widget ) {
			removeChildren( document.getElementById( widget.widget_id ) );
		} );
		const searchForms = document.querySelectorAll( this.props.themeOptions.search_form_selector );
		searchForms.forEach( function( elem ) {
			removeChildren( elem );
		} );
	}

	onChangeQuery = event => {
		const query = event.target.value;
		this.newResults = true;
		this.setState( { query } );
		setSearchQuery( query );
		this.getResults( query, getFilterQuery(), getSortQuery() );
	};

	onChangeFilter = ( filterName, filterValue ) => {
		setFilterQuery( filterName, filterValue );
		this.getResults( this.state.query, getFilterQuery(), getSortQuery() );
	};

	onChangeSort = sort => {
		setSortQuery( sort );
		this.getResults( this.state.query, getFilterQuery(), getSortQuery() );
	};

	getResults = ( query, filter, sort, pageHandle = false ) => {
		if ( query ) {
			this.requestId++;
			const requestId = this.requestId;

			this.setState( {
				loading: true,
			} );
			search( {
				aggregations: this.props.aggregations,
				filter,
				query,
				resultFormat: this.props.options.resultFormat,
				siteId: this.props.options.siteId,
				sort,
			} ).then( results => {
				if ( this.requestId === requestId ) {
					this.setState( {
						results,
						loading: false,
					} );
				}
			} );

			//don't need to query aggs when paging
			const aggs = pageHandle === false ? this.props.aggregations : {};

			this.setState( { loading: true } );
			search(
				this.props.options.siteId,
				query,
				aggs,
				{},
				this.props.options.resultFormat,
				pageHandle
			)
				.then( response => response.json() )
				.then( json => {
					if ( this.requestId === requestId ) {
						if ( this.newResults ) {
							this.setState( {
								results: json,
								loading: false,
							} );
						} else {
							this.setState( {
								results: json,
								loading: false,
							} );
						}
					}
				} );
		} else {
			this.setState( {
				results: [],
				loading: false,
			} );
		}
	};

	loadMore = () => {
		this.newResults = false;
		this.getResults( this.state.query, this.state.results.page_handle );
	};

	render() {
		const { query, results, loading } = this.state;
		const searchForms = Array.from(
			document.querySelectorAll( this.props.themeOptions.search_form_selector )
		);
		const moreToLoad = !! results.page_handle;
		return (
			<Preact.Fragment>
				{ this.props.widgets.map( widget => (
					<Portal into={ `#${ widget.widget_id }` }>
						<div id={ `${ widget.widget_id }-wrapper` }>
							<div className="search-form">
								<SearchBox
									onChangeQuery={ this.onChangeQuery }
									appRef={ this.input }
									query={ query }
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
								loading={ this.state.loading }
								postTypes={ this.props.options.postTypes }
								results={ this.state.results }
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
								query={ query }
							/>
						</Portal>
					) ) }

				<Portal into={ this.props.themeOptions.results_selector }>
					<SearchResults
						query={ query }
						loading={ this.state.loading }
						{ ...results }
						result_format={ this.props.options.resultFormat }
						moreToLoad={ moreToLoad }
						loading={ loading }
						loadMoreAction={ this.loadMore }
					/>
				</Portal>
			</Preact.Fragment>
		);
	}
}

export default SearchApp;
