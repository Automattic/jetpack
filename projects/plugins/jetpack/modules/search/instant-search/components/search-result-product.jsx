/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Gridicon from './gridicon';
import PhotonImage from './photon-image';
import ProductRatings from './product-ratings';
import ProductPrice from './product-price';

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

		// TODO: Remove this check once checking result.highlight is more reliable.
		const hasQuery = this.props.searchQuery !== '';
		const titleHasMark = title.includes( '<mark>' );
		const hasMatch =
			hasQuery &&
			! titleHasMark &&
			Array.isArray( highlight.content ) &&
			highlight.content[ 0 ]?.length > 0;

		return (
			<li className="jetpack-instant-search__search-result jetpack-instant-search__search-result-product">
				<a
					className="jetpack-instant-search__search-result-product-img-link"
					href={ `//${ fields[ 'permalink.url.raw' ] }` }
					onClick={ this.props.onClick }
				>
					<div className="jetpack-instant-search__search-result-product-img-container">
						{ firstImage ? (
							<PhotonImage
								alt={ title }
								className="jetpack-instant-search__search-result-product-img"
								isPhotonEnabled={ this.props.isPhotonEnabled }
								src={ `//${ firstImage }` }
							/>
						) : (
							<div className="jetpack-instant-search__search-result-product-img">
								<Gridicon
									icon="block"
									style={ {} } // Mandatory. Overrides manual setting of height/width in Gridicon.
								/>
								<Gridicon
									icon="image"
									style={ {} } // Mandatory. Overrides manual setting of height/width in Gridicon.
									title={ __( 'Does not have an image', 'jetpack' ) }
								/>
							</div>
						) }
					</div>
				</a>
				<h3 className="jetpack-instant-search__search-result-title jetpack-instant-search__search-result-product-title">
					<a
						className="jetpack-instant-search__search-result-title-link"
						href={ `//${ fields[ 'permalink.url.raw' ] }` }
						onClick={ this.props.onClick }
						//eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ { __html: title } }
					/>
				</h3>

				<ProductPrice
					price={ fields[ 'wc.price' ] }
					salePrice={ fields[ 'wc.sale_price' ] }
					formattedPrice={ fields[ 'wc.formatted_price' ] }
					formattedRegularPrice={ fields[ 'wc.formatted_regular_price' ] }
					formattedSalePrice={ fields[ 'wc.formatted_sale_price' ] }
				/>

				{ !! fields[ 'meta._wc_average_rating.double' ] && (
					<ProductRatings
						count={ fields[ 'meta._wc_review_count.long' ] }
						rating={ fields[ 'meta._wc_average_rating.double' ] }
						permalink={ `//${ fields[ 'permalink.url.raw' ] }` }
					/>
				) }
				{ hasMatch && (
					<div className="jetpack-instant-search__search-result-product-match">
						<mark>
							<Gridicon icon="search" style={ {} } title={ false } />
							<span>
								{ sprintf(
									/* Translators: the placeholder can be "content" or "comments". */
									__( 'Matches %s', 'jetpack' ),
									'comment' in highlight ? __( 'comments', 'jetpack' ) : __( 'content', 'jetpack' )
								) }
							</span>
						</mark>
					</div>
				) }
			</li>
		);
	}
}

export default SearchResultProduct;
