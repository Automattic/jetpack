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
import SearchFiltersWidget from './search-filters-widget';
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
		this.initFilters();
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

	initFilters = () => {
		if ( this.props.filterConfig ) {
			this.props.filterConfig.widgets.forEach( function( widget ) {
				document.getElementById( widget.widget_id ).innerHTML = '';
			} );
		}
	};

	render() {
		const { query, results } = this.state;

		if ( this.props.filterConfig ) {
			let widgets = this.props.filterConfig.widgets;
			let self = this;

			widgets.forEach( function( widget ) {
				render(
					<SearchFiltersWidget widgetConfig={ widget } results={ self.state.results } />,
					document.getElementById( widget.widget_id )
				);
			} );
		}

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
