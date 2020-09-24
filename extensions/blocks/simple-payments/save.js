/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { formatPrice } from './utils';

export default function Save( { attributes } ) {
	const {
		content,
		currency,
		featuredMediaUrl,
		featuredMediaTitle,
		postLink,
		price,
		productId,
		title,
	} = attributes;
	if ( ! productId ) {
		return null;
	}

	return (
		<div className={ `jetpack-simple-payments-wrapper jetpack-simple-payments-${ productId }` }>
			<div className="jetpack-simple-payments-product">
				<div className="jetpack-simple-payments-product-image">
					<div className="jetpack-simple-payments-image">
						<figure>
							<img src={ featuredMediaUrl } alt={ featuredMediaTitle } />
						</figure>
					</div>
				</div>
				<div className="jetpack-simple-payments-details">
					<div className="jetpack-simple-payments-title">
						<p>{ title }</p>
					</div>
					<div className="jetpack-simple-payments-description">
						<p>{ content }</p>
					</div>
					<div className="jetpack-simple-payments-price">
						<p>{ formatPrice( price, currency ) }</p>
					</div>
					<a href={ postLink } target="_blank" rel="noopener noreferrer">
						{ __( 'Visit the site to purchase.', 'jetpack' ) }
					</a>
				</div>
			</div>
		</div>
	);
}
