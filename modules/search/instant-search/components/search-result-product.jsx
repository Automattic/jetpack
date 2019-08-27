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

class SearchResultProduct extends Component {
	render() {
		const { result_type, fields, highlight } = this.props.result;
		const IconSize = 18;
		if ( result_type !== 'post' ) {
			return null;
		}
		return (
			<div className="jetpack-instant-search__result-product">
				<h3>
					<a
						href={ `//${ fields[ 'permalink.url.raw' ] }` }
						target="_blank"
						rel="noopener noreferrer"
						className="jetpack-instant-search__result-product-title"
						//eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ { __html: highlight.title } }
					/>
				</h3>
				{ fields.img.url.raw && (
					<img
						className="jetpack-instant-search__result-product-img"
						src={ fields.img.url.raw }
						alt={ strip( highlight.title ) }
					/>
				) }
				<div
					className="jetpack-instant-search__result-product-content"
					//eslint-disable-next-line react/no-danger
					dangerouslySetInnerHTML={ {
						__html: highlight.content.join( ' ... ' ),
					} }
				/>
				<div>
					<span className="jetpack-instant-search__result-product-rating-ave">
						{ strip( fields.meta._wc_average_rating.value.raw ).split( ' ' )[ 0 ] }
					</span>
					<span className="jetpack-instant-search__result-product-rating-cnt">
						{ strip( fields.meta._wc_rating_count.value.raw ).split( ' ' )[ 0 ] }
					</span>
				</div>
				<div>
					<span className="jetpack-instant-search__result-product-price">
						{ strip( fields.wc.price ).split( ' ' )[ 0 ] }
					</span>
				</div>
				{ highlight.comments && (
					<div className="jetpack-instant-search__result-product-comment">
						<Gridicon icon="comment" size={ IconSize } />
						<span
							className="jetpack-instant-search__result-product-comment-span"
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

export default SearchResultProduct;
