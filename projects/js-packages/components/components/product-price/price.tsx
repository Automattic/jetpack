import { getCurrencyObject } from '@automattic/format-currency';
import clsx from 'clsx';
import Text from '../text';
import styles from './style.module.scss';
import type { PriceProps } from './types';
import type React from 'react';

/**
 * React component to render a Price composition.
 *
 * @param {PriceProps} props  - Component props.
 * @returns {React.ReactNode} -Price react component.
 */
export const Price: React.FC< PriceProps > = ( { value, currency, isOff, hidePriceFraction } ) => {
	const classNames = clsx( styles.price, 'product-price_price', {
		[ styles[ 'is-not-off-price' ] ]: ! isOff,
	} );

	const { symbol, integer, fraction } = getCurrencyObject( value, currency );
	const showPriceFraction = ! hidePriceFraction || ! fraction.endsWith( '00' );

	return (
		<Text className={ classNames } variant="headline-medium" component="p">
			<Text className={ styles.symbol } component="sup" variant="title-medium">
				{ symbol }
			</Text>
			{ integer }
			{ showPriceFraction && (
				<Text component="sup" variant="body-small" data-testid="PriceFraction">
					<strong>{ fraction }</strong>
				</Text>
			) }
		</Text>
	);
};
