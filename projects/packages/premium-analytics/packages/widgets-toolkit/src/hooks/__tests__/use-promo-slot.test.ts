import { getScriptData } from '@automattic/jetpack-script-data';
import { DASHBOARD_PREFERENCES_SCOPE, type Promo } from '@jetpack-premium-analytics/data';
import { act, renderHook } from '@testing-library/react';
import { dispatch, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { resetPromoDismissalForTesting, usePromoDismissal, usePromoSlot } from '../use-promo-slot';

jest.mock(
	'@automattic/jetpack-script-data',
	() => jest.requireActual( '../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);

const KEY = 'dismissedPromos';
const DAY = 86400000;
const daysAgo = ( days: number ) => new Date( Date.now() - days * DAY ).toISOString();

const makePromo = ( overrides: Partial< Promo > = {} ): Promo => ( {
	slug: 'acme/offer',
	placement: 'settings',
	order: 10,
	title: 'Offer',
	description: 'An offer.',
	cta_label: 'Get it',
	cta_url: 'https://example.com',
	cta_variant: 'primary',
	dismissible: true,
	snooze_days: 90,
	...overrides,
} );

const first = makePromo( { slug: 'acme/first' } );
const second = makePromo( { slug: 'acme/second' } );

const registerPromos = ( promos: Promo[] ) =>
	( getScriptData as jest.Mock ).mockReturnValue( { premium_analytics: { promos } } );

const seed = ( value: unknown ) =>
	dispatch( preferencesStore ).set( DASHBOARD_PREFERENCES_SCOPE, KEY, value as never );

const stored = () =>
	( select( preferencesStore ) as unknown as { get: ( s: string, k: string ) => unknown } ).get(
		DASHBOARD_PREFERENCES_SCOPE,
		KEY
	);

describe( 'usePromoDismissal', () => {
	beforeEach( () => {
		resetPromoDismissalForTesting();
		seed( {} );
		registerPromos( [ first, second ] );
	} );

	it( 'writes count 1 on the first close and keeps the other slugs', () => {
		const other = { count: 1, at: daysAgo( 1 ) };
		seed( { 'acme/other': other } );
		const { result } = renderHook( () => usePromoDismissal( first ) );

		act( () => result.current.dismiss() );

		expect( stored() ).toEqual( {
			'acme/other': other,
			'acme/first': { count: 1, at: expect.any( String ), final: false },
		} );
	} );

	it( 'writes count 2 on the second close', () => {
		seed( { 'acme/first': { count: 1, at: daysAgo( 100 ) } } );
		const { result } = renderHook( () => usePromoDismissal( first ) );

		act( () => result.current.dismiss() );

		expect( stored() ).toEqual( {
			'acme/first': { count: 2, at: expect.any( String ), final: true },
		} );
	} );

	it( 'records a close as final when the promo does not snooze', () => {
		const { result } = renderHook( () => usePromoDismissal( { ...first, snooze_days: 0 } ) );

		act( () => result.current.dismiss() );

		expect( stored() ).toEqual( {
			'acme/first': { count: 1, at: expect.any( String ), final: true },
		} );
	} );

	it( 'stays dismissed for the rest of the page load after the first close', () => {
		const { result, unmount } = renderHook( () => usePromoDismissal( first ) );
		act( () => result.current.dismiss() );
		unmount();
		seed( undefined );

		const { result: remounted } = renderHook( () => usePromoDismissal( first ) );

		expect( remounted.current.isDismissed ).toBe( true );
	} );
} );

describe( 'usePromoSlot', () => {
	beforeEach( () => {
		resetPromoDismissalForTesting();
		seed( {} );
		registerPromos( [ first, second ] );
	} );

	it( 'offers the first promo the placement has that is not dismissed', () => {
		const { result } = renderHook( () => usePromoSlot( 'settings' ) );

		expect( result.current ).toBe( first );
	} );

	it( 'offers nothing from a placement whose promo was closed this load', () => {
		const { result } = renderHook( () => ( {
			promo: usePromoSlot( 'settings' ),
			dismissal: usePromoDismissal( first ),
		} ) );

		act( () => result.current.dismissal.dismiss() );

		expect( result.current.promo ).toBeNull();
	} );

	it( 'leaves other placements alone when one is closed', () => {
		const menu = makePromo( { slug: 'acme/menu', placement: 'options-menu' } );
		registerPromos( [ first, menu ] );
		const { result } = renderHook( () => ( {
			promo: usePromoSlot( 'options-menu' ),
			dismissal: usePromoDismissal( first ),
		} ) );

		act( () => result.current.dismissal.dismiss() );

		expect( result.current.promo ).toBe( menu );
	} );

	it( 'offers the next promo from that placement on the following load', () => {
		seed( { 'acme/first': { count: 1, at: new Date().toISOString() } } );
		resetPromoDismissalForTesting();

		const { result } = renderHook( () => usePromoSlot( 'settings' ) );

		expect( result.current ).toBe( second );
	} );
} );
