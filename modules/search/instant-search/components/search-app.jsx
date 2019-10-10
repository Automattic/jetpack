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
		this.props.resultFormat = 'minimal';
		this.props.aggregations = buildFilterAggregations( this.props.options.widgets );
		this.props.widgets = this.props.options.widgets ? this.props.options.widgets : [];
		this.isSearchPage = this.props.initialValue !== '';
		this.state = {
			query: this.props.initialValue,
			sort: this.props.initialSort,
			results: {},
			loading: false,
		};
		this.getDebouncedResults = debounce( this.getResults, 200 );
		this.getResults( this.state.query, getFilterQuery(), this.state.sort );

		//clean up the page in prep for adding component
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
		if ( this.props.grabFocus ) {
			this.input.current.focus();
		}
	}

	hasActiveQuery() {
		return this.state.query !== '' || hasFilter();
	}

	activateResults() {
		if ( ! this.state.resultsActive ) {
			this.setState( { resultsActive: true } );
			hideChildren( this.props.themeOptions.results_selector );
		}
	}

	maybeDeactivateResults() {
		if ( this.isSearchPage || this.hasActiveQuery() ) {
			return;
		}
		if ( this.state.resultsActive ) {
			this.setState( { resultsActive: false } );
			showChildren( this.props.themeOptions.results_selector );
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
		this.getDebouncedResults( query, getFilterQuery(), getSortQuery() );
	};

	onChangeFilter = ( filterName, filterValue ) => {
		setFilterQuery( filterName, filterValue );
		if ( this.hasActiveQuery() ) {
			this.activateResults();
		}
		this.maybeDeactivateResults();
		this.getResults( this.state.query, getFilterQuery(), getSortQuery() );
	};

	onChangeSort = sort => {
		setSortQuery( sort );
		if ( this.hasActiveQuery() ) {
			this.getResults( this.state.query, getFilterQuery(), getSortQuery() );
		}
	};

	getResults = ( query, filter, sort ) => {
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
	};

	render() {
		const { query, results, resultsActive } = this.state;
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

				{ resultsActive && (
					<Portal into={ this.props.themeOptions.results_selector }>
						<SearchResults
							query={ query }
							loading={ this.state.loading }
							{ ...results }
							result_format={ this.props.options.resultFormat }
						/>
					</Portal>
				) }
			</Preact.Fragment>
		);
	}
}

export default SearchApp;
