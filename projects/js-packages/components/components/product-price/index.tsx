import { __ } from '@wordpress/i18n';
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
	hidePromoLabel = true,
	leyend = __( '/month, paid yearly', 'jetpack' ),
	isNotConvenientPrice = false,
	hidePriceFraction = false,
} ) => {
	const discount =
		price !== undefined && offPrice !== undefined
			? Math.floor( ( ( price - offPrice ) / price ) * 100 )
			: 0;

	const showPromoLabel = ! hidePromoLabel && discount && discount > 0;

	const promoElt = showPromoLabel ? discount + __( '% off', 'jetpack' ) : null;

	if ( ( price == null && offPrice == null ) || ! currency ) {
		return null;
	}

	showNotOffPrice = showNotOffPrice && offPrice != null;

	return (
		<>
			<div className={ styles.container }>
				<div className={ styles[ 'price-container' ] }>
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
				{ promoElt && <Text className={ styles[ 'promo-label' ] }>{ promoElt }</Text> }
			</div>
			{ <Text className={ styles.leyend }>{ leyend }</Text> }
		</>
	);
};

export default ProductPrice;
export * from './price';
