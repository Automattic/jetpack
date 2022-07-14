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
	leyend = __( '/month, paid yearly', 'jetpack' ),
	isNotConvenientPrice = false,
} ) => {
	if ( ! ( price || offPrice ) || ! currency ) {
		return null;
	}

	showNotOffPrice = showNotOffPrice && Boolean( offPrice );

	return (
		<>
			<div className={ styles.container }>
				{ showNotOffPrice && <Price value={ price } currency={ currency } isOff={ false } /> }
				<Price value={ offPrice || price } currency={ currency } isOff={ ! isNotConvenientPrice } />
			</div>
			{ leyend && <Text className={ styles.leyend }>{ leyend }</Text> }
		</>
	);
};

export default ProductPrice;
export * from './price';
