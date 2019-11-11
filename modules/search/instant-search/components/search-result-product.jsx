/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';

/**
 * Internal dependencies
 */
import SearchResultComments from './search-result-comments';
import PhotonImage from './photon-image';

class SearchResultProduct extends Component {
	render() {
		const { result_type, fields, highlight } = this.props.result;
		if ( result_type !== 'post' ) {
			return null;
		}

		const firstImage = Array.isArray( fields[ 'image.url.raw' ] )
			? fields[ 'image.url.raw' ][ 0 ]
			: fields[ 'image.url.raw' ];

		return (
			<li className="jetpack-instant-search__search-result-product">
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
				{ firstImage && (
					<PhotonImage
						className="jetpack-instant-search__search-result-product-img"
						src={ `//${ firstImage }` }
						alt=""
					/>
				) }
				<div
					className="jetpack-instant-search__search-result-product-content"
					//eslint-disable-next-line react/no-danger
					dangerouslySetInnerHTML={ {
						__html: highlight.content.join( ' ... ' ),
					} }
				/>
				{ fields[ 'wc.price' ] && (
					<div className="jetpack-instant-search__search-result-product-price">
						{ fields[ 'wc.price' ].toFixed( 2 ) }
					</div>
				) }

				{ highlight.comments && <SearchResultComments comments={ highlight.comments } /> }
			</li>
		);
	}
}

export default SearchResultProduct;
