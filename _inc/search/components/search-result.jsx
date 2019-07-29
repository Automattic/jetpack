/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import strip from 'strip';

class SearchResult extends Component {
	getTitle() {
		return (
			this.props.result.fields.title || (
				<span
					// eslint-disable-next-line react/no-danger
					dangerouslySetInnerHTML={ {
						__html: strip( this.props.result.highlight.title[ 0 ] ),
					} }
				/>
			) ||
			'Unknown Title'
		);
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
