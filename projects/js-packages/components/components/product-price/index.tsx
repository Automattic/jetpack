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
	showOffPercentage = false,
	leyend = __( '/month, paid yearly', 'jetpack' ),
	isNotConvenientPrice = false,
	hidePriceFraction = false,
} ) => {
	if ( ( price == null && offPrice == null ) || ! currency ) {
		return null;
	}

	showNotOffPrice = showNotOffPrice && offPrice != null;

	const offPercentage = 100 - Math.round( ( offPrice / price ) * 100 );

	return (
		<>
			<div className={ styles.container }>
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
				{ offPrice && showOffPercentage && (
					<Text className={ styles[ 'off-percentage' ] }>{ offPercentage }% off</Text>
				) }
			</div>
			{ leyend && <Text className={ styles.leyend }>{ leyend }</Text> }
		</>
	);
};

export default ProductPrice;
export * from './price';
