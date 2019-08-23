/** @jsx h */

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { h, Component } from 'preact';
import strip from 'strip';

class SearchResultMinimal extends Component {
	render() {
		return (
			<div className="jetpack-instant-search__result-minimal">
				<h3>
					<a
						href={ `//${ this.props.result.fields[ 'permalink.url.raw' ] }` }
						target="_blank"
						rel="noopener noreferrer"
						className="jetpack-instant-search__result-minimal-title"
						dangerouslySetInnerHTML={ { __html: this.props.result.highlight.title } }
					/>
				</h3>
				<span className="jetpack-instant-search__result-minimal-date">
					{ strip( this.props.result.fields.date ).split( ' ' )[ 0 ] }
				</span>
				<div
					className="jetpack-instant-search__result-minimal-excerpt"
					dangerouslySetInnerHTML={ {
						__html: this.props.result.highlight.content.join( ' ... ' ),
					} }
				/>
				{ this.props.result.highlight.comments && (
					<div className="jetpack-instant-search__result-minimal-comment">
						<span className="jetpack-instant-search__result-minimal-comment-h">
							{ __( 'Comment:' ) }
						</span>
						<span
							className="jetpack-instant-search__result-minimal-comment-span"
							dangerouslySetInnerHTML={ {
								__html: this.props.result.highlight.comments.join( ' ... ' ),
							} }
						/>
					</div>
				) }
			</div>
		);
	}
}

export default SearchResultMinimal;
