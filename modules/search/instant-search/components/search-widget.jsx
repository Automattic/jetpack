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
import { search, buildAggs } from '../components/api';
import { setSearchQuery } from '../lib/query-string';

class SearchWidget extends Component {
	constructor() {
		super( ...arguments );
		this.requestId = 0;
		this.state = {
			query: this.props.initialValue,
			results: [],
			aggs: buildAggs( this.props.filterConfig ),
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
			let self = this;
			Object.keys( widgets ).forEach( function( index ) {
				document.getElementById( widgets[ index ] + '-wrapper' ).innerHTML = '';
			} );
			Object.keys( filters ).forEach( function( filterName ) {
				var filter = filters[ filterName ];
				var filterDOM = render(
					<SearchFilter
						filterName={ filterName }
						title={ filter.name }
						type={ filter.type }
						results={ self.state.results }
					/>
				);
				document.getElementById( filter.widget_id + '-wrapper' ).appendChild( filterDOM );
			} );
		}
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
