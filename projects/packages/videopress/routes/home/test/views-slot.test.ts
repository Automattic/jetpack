/**
 * Unit tests for the Home screen's "may this card show a views figure?" rule
 * (see routes/home/views-slot.ts).
 *
 * This is the highest-risk logic on the screen and the least verifiable by
 * hand: the stats proxy is unreachable in local development, so the browser
 * only ever exercises the `unknown` branch.
 */

import { resolveViewsSlot } from '../views-slot';

describe( 'resolveViewsSlot', () => {
	it( 'shows the figure when stats are available and the video has views', () => {
		expect( resolveViewsSlot( { statsAvailable: true, views: 12, rankingTruncated: false } ) ).toBe(
			'views'
		);
	} );

	it( 'never shows a figure when the stats request has no data behind it', () => {
		// The local-dev / proxy-outage case. Even a cached-looking number must
		// not be claimed here.
		expect(
			resolveViewsSlot( { statsAvailable: false, views: 12, rankingTruncated: false } )
		).toBe( 'unknown' );
	} );

	it( 'claims nothing at all — not even "no plays" — when stats are unavailable', () => {
		expect(
			resolveViewsSlot( { statsAvailable: false, views: undefined, rankingTruncated: false } )
		).toBe( 'unknown' );
	} );

	it( 'renders the action, not a zero, for a reported zero', () => {
		expect( resolveViewsSlot( { statsAvailable: true, views: 0, rankingTruncated: false } ) ).toBe(
			'no-plays'
		);
	} );

	it( 'treats a negative count as no plays rather than rendering it', () => {
		expect( resolveViewsSlot( { statsAvailable: true, views: -1, rankingTruncated: false } ) ).toBe(
			'no-plays'
		);
	} );

	it( 'reads absence from a short ranking as a genuine zero', () => {
		expect(
			resolveViewsSlot( { statsAvailable: true, views: undefined, rankingTruncated: false } )
		).toBe( 'no-plays' );
	} );

	it( 'refuses to conclude anything from absence when the ranking was truncated', () => {
		// The video could simply rank sixth. "No plays yet" would be a lie.
		expect(
			resolveViewsSlot( { statsAvailable: true, views: undefined, rankingTruncated: true } )
		).toBe( 'unknown' );
	} );

	it( 'never returns "views" for a non-positive count, whatever else is true', () => {
		for ( const rankingTruncated of [ true, false ] ) {
			for ( const views of [ 0, -5 ] ) {
				expect( resolveViewsSlot( { statsAvailable: true, views, rankingTruncated } ) ).not.toBe(
					'views'
				);
			}
		}
	} );
} );
