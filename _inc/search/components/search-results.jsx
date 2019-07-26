/** @jsx h */

/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { h, Component } from 'preact';

/**
 * Internal dependencies
 */
import SearchResult from './search-result';

class SearchResults extends Component {
	render() {
		const { results = [], query } = this.props;
		return (
			<div className="jetpack-instant-search__search-results">
				<p>{ sprintf( __( 'You are searching for: "%s"' ), query ) }</p>
				{ results.map( result => (
					<SearchResult result={ result } />
				) ) }
			</div>
		);
	}
}

export default SearchResults;
