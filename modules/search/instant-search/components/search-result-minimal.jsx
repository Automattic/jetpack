/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import strip from 'strip';

/**
 * Internal dependencies
 */
import Gridicon from './gridicon';

class SearchResultMinimal extends Component {
	render() {
		const { result_type, fields, highlight } = this.props.result;
		const IconSize = 18;
		if ( result_type !== 'post' ) {
			return null;
		}
		const url = new URL( 'http://' + fields[ 'permalink.url.raw' ] );
		const path = url.pathname;
		const no_content = ! highlight.content || highlight.content[ 0 ] === '';

		let tags = fields[ 'tag.name.default' ];
		if ( ! tags ) {
			tags = [];
		}
		if ( ! Array.isArray( tags ) ) {
			tags = [ tags ];
		}

		let cats = fields[ 'category.name.default' ];
		if ( ! cats ) {
			cats = [];
		}
		if ( ! Array.isArray( cats ) ) {
			cats = [ cats ];
		}

		return (
			<div className="jetpack-instant-search__result-minimal">
				<h3>
					<a
						href={ `//${ fields[ 'permalink.url.raw' ] }` }
						target="_blank"
						rel="noopener noreferrer"
						className="jetpack-instant-search__result-minimal-title"
						//eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ { __html: highlight.title } }
					/>
				</h3>
				<span className="jetpack-instant-search__result-minimal-date">
					{ strip( fields.date ).split( ' ' )[ 0 ] }
				</span>

				{ no_content && (
					<div className="jetpack-instant-search__result-minimal-content">
						<div className="jetpack-instant-search__result-minimal-path">{ path }</div>
						<div className="jetpack-instant-search__result-minimal-tag">
							{ tags.map( tag => (
								<span>
									<Gridicon icon="tag" size={ IconSize } />
									{ tag }
								</span>
							) ) }
						</div>
						<div className="jetpack-instant-search__result-minimal-cat">
							{ cats.map( cat => (
								<span>
									<Gridicon icon="folder" size={ IconSize } />
									{ cat }
								</span>
							) ) }
						</div>
					</div>
				) }
				{ ! no_content && (
					<div
						className="jetpack-instant-search__result-minimal-content"
						//eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ {
							__html: highlight.content.join( ' ... ' ),
						} }
					/>
				) }

				{ highlight.comments && (
					<div className="jetpack-instant-search__result-minimal-comment">
						<Gridicon icon="comment" size={ IconSize } />
						<span
							className="jetpack-instant-search__result-minimal-comment-span"
							//eslint-disable-next-line react/no-danger
							dangerouslySetInnerHTML={ {
								__html: highlight.comments.join( ' ... ' ),
							} }
						/>
					</div>
				) }
			</div>
		);
	}
}

export default SearchResultMinimal;
