/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SearchResultComments from './search-result-comments';
import PhotonImage from './photon-image';
import ProductRatings from './product-ratings';

/**
 * Style dependencies
 */
import './search-result-product.scss';

class SearchResultProduct extends Component {
	render() {
		const { result_type, fields, highlight } = this.props.result;
		if ( result_type !== 'post' ) {
			return null;
		}

		const firstImage = Array.isArray( fields[ 'image.url.raw' ] )
			? fields[ 'image.url.raw' ][ 0 ]
			: fields[ 'image.url.raw' ];

		const title =
			Array.isArray( highlight.title ) && highlight.title[ 0 ].length > 0
				? highlight.title[ 0 ]
				: __( 'No title', 'jetpack' );

		return (
			<li className="jetpack-instant-search__search-result-product">
				<a
					href={ `//${ fields[ 'permalink.url.raw' ] }` }
					onClick={ this.props.onClick }
					rel="noopener noreferrer"
					target="_blank"
				>
					{ firstImage ? (
						<PhotonImage
							alt=""
							className="jetpack-instant-search__search-result-product-img"
							isPrivateSite={ this.props.isPrivateSite }
							src={ `//${ firstImage }` }
						/>
					) : (
						<div className="jetpack-instant-search__search-result-product-img"></div>
					) }
				</a>
				<h3 className="jetpack-instant-search__result-product-title">
					<a
						href={ `//${ fields[ 'permalink.url.raw' ] }` }
						onClick={ this.props.onClick }
						rel="noopener noreferrer"
						target="_blank"
						//eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ { __html: title } }
					/>
				</h3>

				{ !! fields[ 'wc.price' ] && (
					<div className="jetpack-instant-search__search-result-product-price">
						{ fields[ 'wc.price' ].toFixed( 2 ) }
					</div>
				) }
				{ !! fields[ 'meta._wc_average_rating.double' ] && (
					<ProductRatings
						count={ fields[ 'meta._wc_review_count.long' ] }
						rating={ fields[ 'meta._wc_average_rating.double' ] }
					/>
				) }
				<div
					className="jetpack-instant-search__search-result-product-content"
					//eslint-disable-next-line react/no-danger
					dangerouslySetInnerHTML={ {
						__html: highlight.content.join( ' ... ' ),
					} }
				/>

				{ highlight.comments && <SearchResultComments comments={ highlight.comments } /> }
			</li>
		);
	}
}

export default SearchResultProduct;
