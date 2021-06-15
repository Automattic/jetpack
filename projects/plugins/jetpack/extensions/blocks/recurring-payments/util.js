/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import formatCurrency from '@automattic/format-currency';

/**
 * Formats a price with the right format for a numeric input value.
 *
 * @param {number} price - Price to format.
 * @param {string} currency - Currency code.
 * @returns {string} - Formatted price.
 */
export const formatPriceForNumberInputValue = ( price, currency ) => {
	// By using `formatCurrency` we ensure the resulting price contains the relevant decimals for the given currency (i.e. 0.5 > 0.50).
	return formatCurrency( price, currency, {
		decimal: '.', // Values for numeric inputs need to use a dot notation for decimals.
		symbol: '', // Values for numeric inputs cannot contain any currency symbol, only numbers.
	} );
};

export const formatProductAmount = product => {
	const amount = formatCurrency( parseFloat( product.price ), product.currency );
	if ( product.interval === '1 month' ) {
		return sprintf(
			/* translators: placeholder is a price. */
			__( '%s / month', 'jetpack' ),
			amount
		);
	}
	if ( product.interval === '1 year' ) {
		return sprintf(
			/* translators: placeholder is a price. */
			__( '%s / year', 'jetpack' ),
			amount
		);
	}
	if ( product.interval === 'one-time' ) {
		return amount;
	}
	return sprintf(
		/* translators: %1$s is a price, %2$s is a period (1 year for example) */
		__( '%1$s / %2$s', 'jetpack' ),
		amount,
		product.interval
	);
};
