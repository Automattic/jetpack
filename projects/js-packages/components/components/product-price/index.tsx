/*
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
/*
 * Internal dependencies
 */
import Text from '../text';
import { Price } from './price';
import styles from './style.module.scss';
import type { ProductPriceProps } from './types';
import type React from 'react';

/**
 * React component to render the price.
 *
 * @param {ProductPriceProps} props - Component props.
 * @returns {React.ReactNode} Price react component.
 */
const ProductPrice: React.FC< ProductPriceProps > = ( {
	price,
	offPrice,
	currency = '',
	showNotOffPrice = true,
	hideDiscountLabel = true,
	promoLabel = '',
	legend = __( '/month, paid yearly', 'jetpack' ),
	isNotConvenientPrice = false,
	hidePriceFraction = false,
	children,
} ) => {
	if ( ( price == null && offPrice == null ) || ! currency ) {
		return null;
	}

	showNotOffPrice = showNotOffPrice && offPrice != null;

	const discount =
		price !== undefined && offPrice !== undefined
			? Math.floor( ( ( price - offPrice ) / price ) * 100 )
			: 0;

	const showDiscountLabel = ! hideDiscountLabel && discount && discount > 0;

	const discountElt = showDiscountLabel ? discount + __( '% off', 'jetpack' ) : null;

	return (
		<>
			<div className={ styles.container }>
				<div className={ classnames( styles[ 'price-container' ], 'product-price_container' ) }>
					<Price
						value={ offPrice ?? price }
						currency={ currency }
						isOff={ ! isNotConvenientPrice }
						hidePriceFraction={ hidePriceFraction }
					/>
					{ showNotOffPrice && (
						<Price
							value={ price }
							currency={ currency }
							isOff={ false }
							hidePriceFraction={ hidePriceFraction }
						/>
					) }
				</div>
			</div>
			<div className={ styles.footer }>
				{ children ? (
					children
				) : (
					<Text className={ classnames( styles.legend, 'product-price_leyend' ) }>{ legend }</Text>
				) }
				{ promoLabel && (
					<Text className={ classnames( styles[ 'promo-label' ], 'product-price_promo_label' ) }>
						{ promoLabel }
					</Text>
				) }
				{ discountElt && (
					<Text className={ classnames( styles[ 'promo-label' ], 'product-price_promo_label' ) }>
						{ discountElt }
					</Text>
				) }
			</div>
		</>
	);
};

export default ProductPrice;
export * from './price';
