/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import strip from 'strip';

class SearchResult extends Component {
	getTitle() {
		return strip( this.props.result.fields.title_html ) || 'Unknown Title';
	}

	render() {
		return (
			<div className="jetpack-instant-search__search-result">
				<a
					href={ `//${ this.props.result.fields[ 'permalink.url.raw' ] }` }
					target="_blank"
					rel="noopener noreferrer"
				>
					{ this.getTitle() } by { this.props.result.fields.author }
				</a>
			</div>
		);
	}
}

export default SearchResult;
