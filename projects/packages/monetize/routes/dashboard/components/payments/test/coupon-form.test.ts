import { getSettings, setSettings } from '@wordpress/date';
import { toCoupon } from '../../../data/coupons';
import { initialForm, toPayload, validate } from '../coupon-form';
import type { CouponForm, CouponFormContext } from '../coupon-form';

const CURRENCIES = { defaultCurrency: 'EUR', minimumAmounts: { EUR: 0.5, USD: 0.5 } };

const form = ( overrides: Partial< CouponForm > = {} ): CouponForm => ( {
	...initialForm( null, CURRENCIES ),
	code: 'SPRING',
	discount: '20',
	startDate: '2026-01-01',
	...overrides,
} );

describe( 'validate', () => {
	beforeAll( () => jest.useFakeTimers( { now: new Date( '2026-06-15T00:00:00Z' ) } ) );
	afterAll( () => jest.useRealTimers() );

	const NEW: CouponFormContext = { isEditing: false, takenCodes: [], planIds: [ 1, 2 ] };
	const EDITING: CouponFormContext = { ...NEW, isEditing: true };

	it.each( [
		[ 'a valid coupon', form(), NEW, [] ],
		[ 'a code with a space', form( { code: 'SPR ING' } ), NEW, [ 'code' ] ],
		[ 'a two-character code', form( { code: 'SP' } ), NEW, [ 'code' ] ],
		[
			'a code another coupon uses, in any case',
			form( { code: 'spring' } ),
			{ ...NEW, takenCodes: [ 'SPRING' ] },
			[ 'codeTaken' ],
		],
		[ 'a fractional discount', form( { discount: '12.5' } ), NEW, [ 'discount' ] ],
		[ 'a percentage over 100', form( { discount: '101' } ), NEW, [ 'discount' ] ],
		[ 'a large amount', form( { discountType: 'amount', discount: '500' } ), NEW, [] ],
		[ 'a blank discount', form( { discount: '' } ), NEW, [ 'discount' ] ],
		[ 'an end before the start', form( { endDate: '2025-12-31' } ), EDITING, [ 'endDate' ] ],
		[ 'a new coupon ending in the past', form( { endDate: '2026-06-14' } ), NEW, [ 'endDate' ] ],
		[ 'an edited coupon that has expired', form( { endDate: '2026-06-14' } ), EDITING, [] ],
		[ 'a usage limit of 0', form( { limitPerUser: '0' } ), NEW, [ 'limitPerUser' ] ],
		[
			'emails with a pattern and a typo',
			form( { emails: '*@university.edu, ann@uni*, ann@' } ),
			NEW,
			[ 'emails' ],
		],
		[
			'a long run of wildcards',
			form( { emails: `a@${ '*'.repeat( 40 ) }!` } ),
			NEW,
			[ 'emails' ],
		],
		[ 'a plan the site no longer has', form( { planIds: [ 1, 9 ] } ), EDITING, [ 'plans' ] ],
		[
			'plans before the site’s have loaded',
			form( { planIds: [ 9 ] } ),
			{ ...EDITING, planIds: null },
			[],
		],
	] )( 'flags %s', ( _name, coupon, context, errors ) => {
		expect( validate( coupon, context ) ).toEqual( errors );
	} );

	it.each( [
		[ 'behind', -12, [] ],
		[ 'ahead of', 12, [ 'endDate' ] ],
	] )( 'takes today from a site %s UTC, not the browser', ( _name, offset, errors ) => {
		const settings = getSettings();
		setSettings( { ...settings, timezone: { ...settings.timezone, offset, string: '' } } );
		try {
			expect( validate( form( { endDate: '2026-06-14' } ), NEW ) ).toEqual( errors );
		} finally {
			setSettings( settings );
		}
	} );
} );

describe( 'toPayload', () => {
	it.each( [
		[
			'a percentage, without a currency or limit',
			form(),
			{ discount_percentage: 20, plan_ids_allow_list: [], email_allow_list: [] },
		],
		[
			'an amount in its currency, with a limit and emails',
			form( {
				discountType: 'amount',
				discount: '5',
				currency: 'USD',
				limitPerUser: '2',
				emails: ' ann@example.com, , *@example.org ',
			} ),
			{
				discount_value: 5,
				discount_currency: 'USD',
				limit_per_user: 2,
				email_allow_list: [ 'ann@example.com', '*@example.org' ],
			},
		],
	] )( 'sends %s', ( _name, coupon, expected ) => {
		const payload = toPayload( coupon );

		expect( payload ).toMatchObject( expected );
		expect( Object.keys( payload ) ).not.toContain(
			coupon.discountType === 'percentage' ? 'discount_value' : 'discount_percentage'
		);
		expect( 'limit_per_user' in payload ).toBe( Boolean( coupon.limitPerUser ) );
	} );

	it( 'sends back an edited coupon as it was loaded', () => {
		const fields = {
			coupon_code: 'SPRING',
			discount_type: 'amount',
			discount_value: 5,
			discount_currency: 'EUR',
			start_date: '2026-01-01',
			end_date: '2026-12-31',
			duration: '3 months',
			limit_per_user: 2,
			can_be_combined: false,
			first_time_purchase_only: true,
			plan_ids_allow_list: [ 1, 2 ],
			email_allow_list: [ '*@example.org' ],
		};

		expect( toPayload( initialForm( toCoupon( { id: 7, ...fields } ), CURRENCIES ) ) ).toEqual(
			fields
		);
	} );
} );
