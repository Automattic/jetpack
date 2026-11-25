import { toCoupon } from '../../../data/coupons';
import { discountLabel } from '../coupons';

describe( 'discountLabel', () => {
	it.each( [
		[
			{ discount_type: 'percentage', discount_percentage: '20', duration: null },
			'20% off forever',
		],
		[
			{ discount_type: 'percentage', discount_percentage: 15, duration: '1 months' },
			'15% off for 1 month',
		],
		[
			{
				discount_type: 'amount',
				discount_value: '5',
				discount_currency: 'EUR',
				duration: '3 months',
			},
			'€5.00 off for 3 months',
		],
		[
			{ discount_type: 'amount', discount_value: 5, duration: '12 months' },
			'$5.00 off for 1 year',
		],
	] )( 'labels %p as %p', ( coupon, label ) => {
		expect( discountLabel( toCoupon( coupon ) ) ).toBe( label );
	} );
} );
