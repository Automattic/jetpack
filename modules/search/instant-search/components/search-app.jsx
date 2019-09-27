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
import SearchBox from './search-box';
import { search, buildFilterAggregations } from '../lib/api';
import { setSearchQuery, setFilterQuery, getFilterQuery } from '../lib/query-string';
import { removeChildren, hideElements } from '../lib/dom';

class SearchApp extends Component {
	constructor() {
		super( ...arguments );
		this.input = Preact.createRef();
		this.requestId = 0;
		this.props.resultFormat = 'minimal';
		this.props.aggregations = buildFilterAggregations( this.props.options.widgets );
		this.props.widgets = this.props.options.widgets ? this.props.options.widgets : [];
		this.state = {
			query: this.props.initialValue,
			results: {},
			loading: false,
		};
		this.getResults = debounce( this.getResults, 200 );
		this.getResults( this.state.query, getFilterQuery() );
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
		this.getResults( query );
	};

	onChangeFilter = ( filterName, filterValue ) => {
		setFilterQuery( filterName, filterValue );
		this.getResults( this.state.query, getFilterQuery() );
	};

	getResults = ( query, filter ) => {
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
			} )
				.then( response => response.json() )
				.then( json => {
					if ( this.requestId === requestId ) {
						this.setState( {
							results: json,
							loading: false,
						} );
					}
				} );
		} else {
			this.setState( {
				results: [],
				loading: false,
			} );
		}
	};

	render() {
		const { query, results } = this.state;
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
									showIcon={ true }
								/>
							</div>
							<div className="jetpack-search-sort-wrapper" />
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
					/>
				</Portal>
			</Preact.Fragment>
		);
	}
}

export default SearchApp;
