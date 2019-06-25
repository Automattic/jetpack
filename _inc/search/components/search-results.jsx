/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';

/**
 * Internal dependencies
 */
import SearchResult from './search-result';

class SearchResults extends Component {
	render() {
		const { results = [], query } = this.props;
		return (
			<div>
				<p>You are searching for "{ query }".</p>
				{ results.map( result => (
					<SearchResult result={ result } />
				) ) }
			</div>
		);
	}
}

export default SearchResults;
