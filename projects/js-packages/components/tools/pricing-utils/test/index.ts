import { isFirstMonthTrial } from '..';
import { IntroOffer } from './../types';

const trialIntroOffer: IntroOffer = {
	product_id: 0,
	product_slug: 'test_product',
	currency_code: 'USD',
	formatted_price: '$10',
	original_price: 10,
	raw_price: 1,
	discount_percentage: 90,
	ineligible_reason: null,
	interval_unit: 'month',
	interval_count: 1,
};

describe( 'isFirstMonthTrial', () => {
	it( 'returns true if interval_unit is "month" and interval_count is 1', () => {
		expect( isFirstMonthTrial( trialIntroOffer ) ).toBe( true );
	} );

	it( 'returns false if interval_unit is not "month"', () => {
		const introOffer: IntroOffer = {
			...trialIntroOffer,
			interval_unit: 'year',
		};

		expect( isFirstMonthTrial( introOffer ) ).toBe( false );
	} );

	it( "returns false if interval_unit not 'month' but interval_count isn't 1", () => {
		const introOffer: IntroOffer = {
			...trialIntroOffer,
			interval_count: 3,
		};

		expect( isFirstMonthTrial( introOffer ) ).toBe( false );
	} );
} );
