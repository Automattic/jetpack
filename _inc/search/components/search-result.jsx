/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';

class SearchResult extends Component {
	render() {
		const {
			result: { fields },
		} = this.props;
		return (
			<div className="jetpack-instant-search__search-result">
				<a
					href={ `//${ fields[ 'permalink.url.raw' ] }` }
					target="_blank"
					rel="noopener noreferrer"
				>
					{ fields.title || 'Unknown Title' } by { fields.author }
				</a>
			</div>
		);
	}
}

export default SearchResult;
