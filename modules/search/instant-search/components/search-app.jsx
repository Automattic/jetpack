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
} from '../lib/query-string';
import { removeChildren, hideElements, hideChildren, showChildren } from '../lib/dom';

class SearchApp extends Component {
	static defaultProps = {
		resultFormat: 'minimal',
		widgets: [],
	};

	constructor() {
		super( ...arguments );
		this.input = Preact.createRef();
		this.requestId = 0;

		// TODO: Rework this line; we shouldn't reassign properties.
		this.props.aggregations = buildFilterAggregations( this.props.options.widgets );

		this.state = {
			isLoading: false,
			query: this.props.initialValue,
			response: {},
			sort: this.props.initialSort,
		};
		this.getDebouncedResults = debounce( this.getResults, 200 );
		this.prepareDomForMounting();
	}

	componentDidMount() {
		this.getResults( this.state.query, getFilterQuery(), this.state.sort, null );
		if ( this.props.grabFocus ) {
			this.input.current.focus();
		}
	}

	prepareDomForMounting() {
		// Clean up the page prior to mounting component
		hideElements( this.props.themeOptions.elementSelectors );
		if ( this.hasActiveQuery() ) {
			this.activateResults();
		}
		document
			.querySelectorAll( '.jetpack-instant-search-wrapper' )
			.forEach( widget => removeChildren( widget ) );
		document
			.querySelectorAll( this.props.themeOptions.searchFormSelector )
			.forEach( searchForm => removeChildren( searchForm ) );
	}

	hasActiveQuery() {
		return this.state.query !== '' || hasFilter();
	}

	hasNextPage() {
		return !! this.state.response.page_handle;
	}

	isSearchPage() {
		return this.props.initialValue !== '';
	}

	activateResults() {
		if ( ! this.state.resultsActive ) {
			hideChildren( this.props.themeOptions.resultsSelector );
			this.setState( { resultsActive: true } );
		}
	}

	maybeDeactivateResults() {
		if ( this.isSearchPage() || this.hasActiveQuery() ) {
			return;
		}
		if ( this.state.resultsActive ) {
			this.setState( { resultsActive: false }, () => {
				showChildren( this.props.themeOptions.resultsSelector );
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

	renderWidgets() {
		return this.props.options.widgets.map( widget => (
			<Portal into={ `#${ widget.widget_id }-wrapper` }>
				<div id={ `${ widget.widget_id }-portaled-wrapper` }>
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
					<SearchFilters
						initialValues={ this.props.initialFilters }
						onChange={ this.onChangeFilter }
						loading={ this.state.isLoading }
						locale={ this.props.options.locale }
						postTypes={ this.props.options.postTypes }
						results={ this.state.response }
						widget={ widget }
					/>
				</div>
			</Portal>
		) );
	}
	renderSearchForms() {
		const searchForms = Array.from(
			document.querySelectorAll( this.props.themeOptions.searchFormSelector )
		);
		return (
			searchForms &&
			searchForms.map( elem => (
				<Portal into={ elem }>
					<SearchBox
						onChangeQuery={ this.onChangeQuery }
						appRef={ this.input }
						query={ this.state.query }
					/>
				</Portal>
			) )
		);
	}

	render() {
		return (
			<Preact.Fragment>
				{ this.renderWidgets() }
				{ this.renderSearchForms() }
				{ this.state.resultsActive && (
					<Portal into={ this.props.themeOptions.resultsSelector }>
						<SearchResults
							hasNextPage={ this.hasNextPage() }
							isLoading={ this.state.isLoading }
							onLoadNextPage={ this.loadNextPage }
							locale={ this.props.options.locale }
							query={ this.state.query }
							response={ this.state.response }
							resultFormat={ this.props.options.resultFormat }
							enableLoadOnScroll={ this.props.options.enableLoadOnScroll }
						/>
					</Portal>
				) }
			</Preact.Fragment>
		);
	}
}

export default SearchApp;
