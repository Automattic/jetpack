/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
// NOTE: We only import the debounce package here for to reduced bundle size.
//       Do not import the entire lodash library!
// eslint-disable-next-line lodash/import-scope
import debounce from 'lodash/debounce';

/**
 * Internal dependencies
 */
import SearchResults from './search-results';
import { search } from '../components/api';

class SearchWidget extends Component {
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
		this.getResults( query );
	};

	getResults = query => {
		if ( query ) {
			this.requestId++;
			const requestId = this.requestId;

			search( query )
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
				<SearchResults query={ query } { ...results } />
			</div>
		);
	}
}

export default SearchWidget;
