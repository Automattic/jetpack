/** @jsx h */

/**
 * External dependencies
 */
import { sprintf, _n } from '@wordpress/i18n';
import { h, Component } from 'preact';
import strip from 'strip';

class SearchResult extends Component {
	render() {
		return (
			<div className="jetpack-instant-search__result">
				<a
					href={ `//${ this.props.result.fields[ 'permalink.url.raw' ] }` }
					target="_blank"
					rel="noopener noreferrer"
					className="jetpack-instant-search__result-title"
				>
					{ strip( this.props.result.fields.title_html ) || 'Unknown Title' }
				</a>{' '}
				<div className="jetpack-instant-search__result-author-and-date">
					{ strip( this.props.result.fields.author ) }{' '}
					<span className="jetpack-instant-search__result-date">
						{ strip( this.props.result.fields.date ).split( ' ' )[ 0 ] }
					</span>
				</div>
				<div className="jetpack-instant-search__result-excerpt">
					{ strip( this.props.result.fields.excerpt_html ) }
				</div>
				<div>
					{ sprintf(
						_n( '%d comment', '%d comments', this.props.result.fields.comment_count, 'jetpack' ),
						this.props.result.fields.comment_count
					) }
				</div>
			</div>
		);
	}
}

export default SearchResult;
