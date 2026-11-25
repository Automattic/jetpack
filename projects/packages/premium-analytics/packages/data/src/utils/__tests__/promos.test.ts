/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import { getPromosForPlacement, isPromoDismissed, pickPromo, type Promo } from '../promos';

jest.mock(
	'@automattic/jetpack-script-data',
	() => jest.requireActual( '../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);

const DAY = 86400000;
const now = Date.parse( '2026-06-01T00:00:00Z' );
const iso = ( time: number ) => new Date( time ).toISOString();
const daysAgo = ( days: number ) => now - days * DAY;

const makePromo = ( overrides: Partial< Promo > = {} ): Promo => ( {
	slug: 'acme/offer',
	placement: 'settings',
	order: 10,
	title: 'Offer',
	description: 'An offer.',
	cta_label: 'Get it',
	cta_url: 'https://example.com',
	dismissible: true,
	snooze_days: 90,
	render_module: null,
	...overrides,
} );

const mockPromos = ( promos: Promo[] ) =>
	( getScriptData as jest.Mock ).mockReturnValue( { premium_analytics: { promos } } );

describe( 'getPromosForPlacement', () => {
	it.each( [
		[ 'no script data', undefined ],
		[ 'no premium_analytics block', {} ],
		[ 'an older server without promos', { premium_analytics: {} } ],
	] )( 'returns an empty list with %s', ( _case, data ) => {
		( getScriptData as jest.Mock ).mockReturnValue( data );

		expect( getPromosForPlacement( 'settings' ) ).toEqual( [] );
	} );

	it( 'returns only the promos for the placement, in server order', () => {
		const first = makePromo( { slug: 'a/one' } );
		const menu = makePromo( { slug: 'a/menu', placement: 'options-menu' } );
		const second = makePromo( { slug: 'a/two' } );
		mockPromos( [ first, menu, second ] );

		expect( getPromosForPlacement( 'settings' ) ).toEqual( [ first, second ] );
	} );
} );

describe( 'isPromoDismissed', () => {
	it.each( [
		[ 'no record', undefined, false ],
		[ 'closed once, within the snooze', { count: 1, at: iso( daysAgo( 89 ) ) }, true ],
		[ 'closed once, after the snooze', { count: 1, at: iso( daysAgo( 90 ) ) }, false ],
		[ 'closed twice, within the snooze', { count: 2, at: iso( daysAgo( 1 ) ) }, true ],
		[ 'closed twice, long ago', { count: 2, at: iso( daysAgo( 400 ) ) }, true ],
		[ 'an unparseable timestamp', { count: 1, at: 'not a date' }, true ],
		[
			'closed once for good, after a snooze the registrant has since raised',
			{ count: 1, at: iso( daysAgo( 400 ) ), final: true },
			true,
		],
	] )( '%s', ( _case, dismissal, expected ) => {
		expect( isPromoDismissed( dismissal, 90, now ) ).toBe( expected );
	} );

	it( 'treats a snoozeDays of 0 as a single close being final', () => {
		expect( isPromoDismissed( { count: 1, at: iso( now ) }, 0, now ) ).toBe( true );
		expect( isPromoDismissed( { count: 1, at: iso( daysAgo( 400 ) ) }, 0, now ) ).toBe( true );
	} );
} );

describe( 'pickPromo', () => {
	const first = makePromo( { slug: 'a/first' } );
	const second = makePromo( { slug: 'a/second' } );

	it( 'picks the first promo when nothing is dismissed', () => {
		expect( pickPromo( [ first, second ], {}, now ) ).toBe( first );
	} );

	it( 'picks the next promo when the first is closed for good', () => {
		const dismissed = { [ first.slug ]: { count: 2, at: iso( now ) } };

		expect( pickPromo( [ first, second ], dismissed, now ) ).toBe( second );
	} );

	it( 'picks a promo again once its snooze has run out', () => {
		const dismissed = { [ first.slug ]: { count: 1, at: iso( daysAgo( 90 ) ) } };

		expect( pickPromo( [ first, second ], dismissed, now ) ).toBe( first );
	} );

	it( 'picks nothing when every promo is closed for good', () => {
		const dismissed = { [ first.slug ]: { count: 2, at: iso( now ) } };

		expect( pickPromo( [ first ], dismissed, now ) ).toBeNull();
	} );

	it( 'uses each promo own snooze window', () => {
		const shortSnooze = makePromo( { slug: 'a/short', snooze_days: 7 } );
		const dismissed = { [ shortSnooze.slug ]: { count: 1, at: iso( daysAgo( 8 ) ) } };

		expect( pickPromo( [ shortSnooze ], dismissed, now ) ).toBe( shortSnooze );
	} );
} );
