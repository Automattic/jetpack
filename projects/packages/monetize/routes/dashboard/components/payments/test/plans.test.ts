import { groupPlans, hasMonthlyTier, planPriceLabel } from '../plans';
import type { MembershipProduct } from '../../../data/memberships';

const product = ( overrides: Partial< MembershipProduct > ): MembershipProduct => ( {
	id: 1,
	title: 'Plan',
	description: '',
	descriptionHtml: '',
	price: 5,
	currency: 'USD',
	interval: '1 month',
	type: 'tier',
	tier: null,
	isReadOnly: false,
	welcomeEmailContent: '',
	buyerCanChangeAmount: false,
	multiplePerUser: false,
	subscribeAsSiteSubscriber: false,
	...overrides,
} );

describe( 'groupPlans', () => {
	it( 'folds a tier’s annual product into its monthly one, keeping an annual product whose monthly one is gone', () => {
		const monthly = product( { id: 1 } );
		const annual = product( { id: 2, interval: '1 year', price: 50, tier: 1 } );
		const orphan = product( { id: 3, interval: '1 year', tier: 99 } );

		expect( groupPlans( [ monthly, annual, orphan ] ) ).toEqual( [
			{ product: monthly, annual },
			{ product: orphan, annual: undefined },
		] );
	} );
} );

describe( 'planPriceLabel', () => {
	it.each( [
		[ '1 month', undefined, '$5.00/month' ],
		[ 'one-time', undefined, '$5.00' ],
		[ '1 month', product( { id: 2, interval: '1 year', price: 50 } ), '$5.00/month ($50.00/year)' ],
	] )( 'labels a %s plan', ( interval, annual, label ) => {
		expect( planPriceLabel( { product: product( { interval } ), annual } ) ).toBe( label );
	} );
} );

describe( 'hasMonthlyTier', () => {
	it.each( [
		[ 'a monthly tier', product( {} ), true ],
		[ 'only an annual tier whose monthly one is gone', product( { tier: 99 } ), false ],
		[ 'only a donation', product( { type: 'donation' } ), false ],
	] )( 'counts %s: %p', ( _name, only, expected ) => {
		expect( hasMonthlyTier( [ { product: only } ] ) ).toBe( expected );
	} );
} );
