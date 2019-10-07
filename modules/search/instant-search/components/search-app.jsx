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

		// TODO: Rework these lines. We shouldn't reassign properties.
		this.props.resultFormat = 'minimal';
		this.props.aggregations = buildFilterAggregations( this.props.options.widgets );
		this.props.widgets = this.props.options.widgets ? this.props.options.widgets : [];

		this.state = {
			isLoading: false,
			query: this.props.initialValue,
			response: {},
			sort: this.props.initialSort,
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

	getResults = ( query, filter, sort, pageHandle ) => {
		if ( query ) {
			this.requestId++;
			const requestId = this.requestId;

			this.setState( { isLoading: true }, () => {
				search( {
					// Skip aggregations when requesting for paged results
					aggregations: !! pageHandle ? this.props.aggregations : {},
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
		} else {
			this.setState( { response: {}, isLoading: false } );
		}
	};

	loadNextPage = () => {
		this.getResults(
			this.state.query,
			getFilterQuery(),
			getSortQuery(),
			this.state.response.page_handle
		);
	};

	render() {
		const { query, response } = this.state;
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
								query={ query }
							/>
						</Portal>
					) ) }

				<Portal into={ this.props.themeOptions.results_selector }>
					<SearchResults
						hasNextPage={ !! response.page_handle }
						isLoading={ this.state.isLoading }
						loadMoreAction={ this.loadMore }
						onLoadNextPage={ this.loadNextPage }
						query={ query }
						result_format={ this.props.options.resultFormat }
						resultFormat={ this.props.options.resultFormat }
						{ ...response }
					/>
				</Portal>
			</Preact.Fragment>
		);
	}
}

export default SearchApp;
