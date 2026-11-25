import { annualPriceFor, initialForm, minimumPrice, toPayload, validate } from '../plan-form';
import type { PlanForm } from '../plan-form';

const CURRENCIES = { defaultCurrency: 'EUR', minimumAmounts: { EUR: 0.5, USD: 0.5 } };

const form = ( overrides: Partial< PlanForm > = {} ): PlanForm => ( {
	...initialForm( null, CURRENCIES ),
	...overrides,
} );

describe( 'minimumPrice', () => {
	it.each( [
		[ 'the account’s own currency', 'EUR', 0.5 ],
		[ 'another currency, doubled', 'USD', 1 ],
		[ 'a currency Stripe doesn’t list', 'JPY', 0 ],
	] )( 'takes %s', ( _name, currency, minimum ) => {
		expect( minimumPrice( CURRENCIES, currency ) ).toBe( minimum );
	} );
} );

describe( 'annualPriceFor', () => {
	it.each( [
		[ 1.1, 'USD', 13.2 ],
		[ 0.6, 'EUR', 7.2 ],
		[ 150, 'JPY', 1800 ],
	] )( 'charges twelve months of %p %s as %p', ( price, currency, annual ) => {
		expect( annualPriceFor( price, currency ) ).toBe( annual );
	} );
} );

describe( 'initialForm', () => {
	it.each( [
		[ 'the account’s currency when Stripe supports it', CURRENCIES, 'EUR' ],
		[ 'USD otherwise', { defaultCurrency: 'XYZ', minimumAmounts: { USD: 0.5 } }, 'USD' ],
	] )( 'starts a new plan in %s, at its minimum', ( _name, currencies, currency ) => {
		const initial = initialForm( null, currencies );

		expect( initial.currency ).toBe( currency );
		expect( initial.price ).toBe( minimumPrice( currencies, currency ) );
	} );
} );

describe( 'validate', () => {
	it.each( [
		[ 'a valid plan', form( { price: 5 } ), [] ],
		[ 'an empty name', form( { price: 5, title: ' ' } ), [ 'title' ] ],
		[ 'a price below the minimum', form( { price: 0.4 } ), [ 'price' ] ],
		[
			'a tier whose annual price isn’t above its monthly one',
			form( { isTier: true, price: 5, annualPrice: 5 } ),
			[ 'annualPrice' ],
		],
		[
			'a tier description over the limit',
			form( { isTier: true, price: 5, annualPrice: 50, description: 'x'.repeat( 501 ) } ),
			[ 'description' ],
		],
	] )( 'flags %s', ( _name, values, errors ) => {
		expect( validate( values, CURRENCIES ) ).toEqual( errors );
	} );
} );

describe( 'toPayload', () => {
	it( 'saves a tier as a monthly newsletter product, whatever interval the form last had', () => {
		expect(
			toPayload( form( { isTier: true, interval: 'one-time', addToNewsletter: false } ) )
		).toMatchObject( {
			type: 'tier',
			interval: '1 month',
			subscribe_as_site_subscriber: true,
		} );
	} );
} );
