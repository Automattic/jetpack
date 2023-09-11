import { getCurrencyObject } from '@automattic/format-currency';
import { Text } from '@automattic/jetpack-components';
import React from 'react';

/**
 * React component to render a Price composition.
 *
 * @param {object} props - Component props.
 * @param {number} props.amount - Amount.
 * @param {string} props.currency - Currency code (e.g. 'USD').
 * @param {boolean} props.hidePriceFraction - Whether or not to hide the fraction.
 * @param {string} props.tag - Topmost element tag.
 * @returns {React.ReactNode} - Price react component.
 */
const Price = ( { amount, currency, hidePriceFraction, tag = 'span' } ) => {
	const { symbol, integer, fraction } = getCurrencyObject( amount, currency );
	const showPriceFraction = ! hidePriceFraction || ! fraction.endsWith( '00' );

	return (
		<Text component={ tag }>
			{ symbol }
			{ integer }
			{ showPriceFraction && fraction }
		</Text>
	);
};

export default Price;
