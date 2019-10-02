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
import { search, buildFilterAggregations } from '../lib/api';
import { setSearchQuery, setFilterQuery, getFilterQuery } from '../lib/query-string';
import { removeChildren, hideSearchHeader } from '../lib/dom';

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
			sort: this.props.initialSort,
			results: {},
		};
		this.getResults = debounce( this.getResults, 500 );
		this.getResults( this.state.query, getFilterQuery(), this.state.sort );
	}

	componentDidMount() {
		if ( this.props.grabFocus ) {
			this.input.current.focus();
		}

		hideSearchHeader();
		removeChildren( document.querySelector( 'main' ) );
		this.props.widgets.forEach( function( widget ) {
			removeChildren( document.getElementById( widget.widget_id ) );
		} );
	}

	onChangeQuery = event => {
		const query = event.target.value;
		this.setState( { query } );
		setSearchQuery( query );
		this.getResults( query, this.state.sort );
	};

	onChangeFilter = ( filterName, filterValue ) => {
		setFilterQuery( filterName, filterValue );
		this.getResults( this.state.query, getFilterQuery() );
	};

	getResults = ( query, filter, sort ) => {
		if ( query ) {
			this.requestId++;
			const requestId = this.requestId;

			search( {
				aggregations: this.props.aggregations,
				filter,
				query,
				resultFormat: this.props.options.resultFormat,
				siteId: this.props.options.siteId,
				sort,
			} ).then( results => {
				if ( this.requestId === requestId ) {
					this.setState( { results } );
				}
			} );
		} else {
			this.setState( { results: [] } );
		}
	};

	render() {
		const { query, results } = this.state;
		return (
			<Preact.Fragment>
				{ this.props.widgets.map( ( widget, index ) => (
					<Portal into={ `#${ widget.widget_id }` }>
						<div id={ `${ widget.widget_id }-wrapper` }>
							<div className="search-form">
								{ /* TODO: Add support for preserving label text */ }
								<input
									className="search-field"
									onInput={ this.onChangeQuery }
									ref={ index === 0 ? this.input : null }
									type="search"
									value={ query }
								/>
								<button type="submit" className="search-submit">
									<svg className="icon icon-search" aria-hidden="true" role="img">
										<use href="#icon-search" />
									</svg>
									<span className="screen-reader-text">Search</span>
								</button>
							</div>
							<div className="jetpack-search-sort-wrapper">
								<SearchSortWidget widget={ widget } />
							</div>
							<SearchFiltersWidget
								initialValues={ this.props.initialFilters }
								onChange={ this.onChangeFilter }
								postTypes={ this.props.options.postTypes }
								results={ this.state.results }
								widget={ widget }
							/>
						</div>
					</Portal>
				) ) }

				<Portal into="main">
					<SearchResults
						query={ query }
						{ ...results }
						result_format={ this.props.options.resultFormat }
					/>
				</Portal>
			</Preact.Fragment>
		);
	}
}

export default SearchApp;
