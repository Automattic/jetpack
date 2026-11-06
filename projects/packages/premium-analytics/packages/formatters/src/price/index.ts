/**
 * External dependencies
 */
import { formatCurrency } from '@automattic/number-formatters';

/**
 * Formats a yearly price, in the currency's smallest unit, as a monthly price.
 *
 * @param yearlyPrice  - The yearly price.
 * @param currencyCode - The price's currency.
 * @return The monthly price, such as `$4` or `$4.50`.
 */
export function formatMonthlyPrice( yearlyPrice: number, currencyCode: string ): string {
	return formatCurrency( yearlyPrice / 12, currencyCode, {
		isSmallestUnit: true,
		stripZeros: true,
	} );
}
