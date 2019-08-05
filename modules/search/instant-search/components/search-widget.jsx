/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import Portal from 'preact-portal';
// NOTE: We only import the debounce package here for to reduced bundle size.
//       Do not import the entire lodash library!
// eslint-disable-next-line lodash/import-scope
import debounce from 'lodash/debounce';

/**
 * Internal dependencies
 */
import SearchResults from './search-results';
import { search } from './api';
import { setSearchQuery } from '../lib/query-string';

class SearchApp extends Component {
	constructor() {
		super( ...arguments );
		this.requestId = 0;
		this.state = {
			query: this.props.initialValue,
			results: [],
		};
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

			search( this.props.siteId, query )
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
				<Portal into="main">
					<SearchResults query={ query } { ...results } />
				</Portal>
			</div>
		);
	}
}

export default SearchApp;
