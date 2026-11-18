import { formatCurrency, formatNumber } from '@automattic/number-formatters';
import { __, _n, sprintf } from '@wordpress/i18n';
import type { Coupon } from '../../data/coupons';

/**
 * A coupon's discount and how long it lasts, e.g. `20% off for 3 months`.
 *
 * @param coupon - The coupon.
 * @return The label.
 */
export function discountLabel( coupon: Coupon ): string {
	const discount =
		coupon.discountType === 'percentage'
			? formatNumber( coupon.discount / 100, {
					numberFormatOptions: { style: 'percent', maximumFractionDigits: 2 },
				} )
			: formatCurrency( coupon.discount, coupon.currency );

	if ( coupon.months === null ) {
		/* translators: %s: a discount, e.g. 20% or $5.00. */
		return sprintf( __( '%s off forever', 'jetpack-monetize' ), discount );
	}

	if ( coupon.months % 12 === 0 ) {
		const years = coupon.months / 12;
		return sprintf(
			/* translators: %1$s: a discount, e.g. 20% or $5.00. %2$d: a number of years. */
			_n( '%1$s off for %2$d year', '%1$s off for %2$d years', years, 'jetpack-monetize' ),
			discount,
			years
		);
	}

	return sprintf(
		/* translators: %1$s: a discount, e.g. 20% or $5.00. %2$d: a number of months. */
		_n( '%1$s off for %2$d month', '%1$s off for %2$d months', coupon.months, 'jetpack-monetize' ),
		discount,
		coupon.months
	);
}
