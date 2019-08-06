/** @jsx h */

/**
 * External dependencies
 */
import { h, Component, render } from 'preact';
// NOTE: We only import the debounce package here for to reduced bundle size.
//       Do not import the entire lodash library!
// eslint-disable-next-line lodash/import-scope
import debounce from 'lodash/debounce';

/**
 * Internal dependencies
 */
import SearchResults from './search-results';
import SearchFilter from './search-filter';
import { search } from '../components/api';
import { setSearchQuery } from '../lib/query-string';

class SearchWidget extends Component {
	constructor() {
		super( ...arguments );
		this.requestId = 0;
		this.state = {
			query: this.props.initialValue,
			results: [],
			aggs: this.buildAggs(),
		};
		this.injectFilters();
		this.getResults = debounce( this.getResults, 500 );
		this.getResults( this.props.initialValue );
	}
	componentDidMount() {
		if ( this.props.grabFocus ) {
			this.input.focus();
		}
	}

	bindInput = input => ( this.input = input );
	onChangeQuery = event => {
		const query = event.target.value;
		this.setState( { query } );
		setSearchQuery( query );
		this.getResults( query );
	};

	getResults = query => {
		if ( query ) {
			this.requestId++;
			const requestId = this.requestId;

			search( this.props.siteId, query, this.state.aggs )
				.then( response => response.json() )
				.then( json => {
					if ( this.requestId === requestId ) {
						this.setState( { results: json } );
					}
				} );
		} else {
			this.setState( { results: [] } );
		}
	};

	injectFilters = () => {
		if ( this.props.filterConfig ) {
			let widgets = this.props.filterConfig.widgets;
			let filters = this.props.filterConfig.filters;
			Object.keys( widgets ).forEach( function( index ) {
				document.getElementById( widgets[ index ] + '-wrapper' ).innerHTML = '';
			} );
			Object.keys( filters ).forEach( function( filterName ) {
				var filter = filters[ filterName ];
				var filterDOM = render( <SearchFilter filterName={ filterName } title={ filter.name } /> );
				document.getElementById( filter.widget_id + '-wrapper' ).appendChild( filterDOM );
			} );
		}
	};

	buildAggs = () => {
		var aggs = {};
		if ( this.props.filterConfig ) {
			let filters = this.props.filterConfig.filters;
			Object.keys( filters ).forEach( function( filterName ) {
				var filter = filters[ filterName ];
				switch ( filter.type ) {
					case 'date_histogram':
						var field = filter.field == 'post_date_gmt' ? 'date_gmt' : 'date';
						aggs[ filterName ] = {
							date_histogram: {
								field: field,
								interval: filter.interval,
							},
						};
						break;
					case 'taxonomy':
						var field = 'taxonomy.' + filter.taxonomy;
						switch ( filter.taxonomy ) {
							case 'post_tag':
								field = 'tag';
								break;
							case 'category':
								field = 'category';
								break;
						}
						field = field + '.slug';
						aggs[ filterName ] = {
							terms: {
								field: field,
								size: filter.count,
							},
						};
						break;
					case 'post_type':
						aggs[ filterName ] = {
							terms: {
								field: 'post_type',
								size: filter.count,
							},
						};
						break;
				}
			} );
		}
		return aggs;
	};

	render() {
		const { query, results } = this.state;
		return (
			<div>
				<p>
					<input
						onInput={ this.onChangeQuery }
						ref={ this.bindInput }
						type="search"
						value={ query }
					/>
				</p>
				<SearchResults query={ query } { ...results } />
			</div>
		);
	}
}

export default SearchWidget;
