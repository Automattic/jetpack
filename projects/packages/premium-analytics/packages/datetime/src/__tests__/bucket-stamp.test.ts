/**
 * Internal dependencies
 */
import { resolveBucketStamp, toBucketStamp } from '../bucket-stamp';

describe( 'toBucketStamp', () => {
	it( 'keeps a wall time as written', () => {
		expect( toBucketStamp( '2026-06-15 00:00:00', 'Asia/Taipei' ) ).toBe( '2026-06-15T00:00:00' );
		expect( toBucketStamp( '2026-06-15T13:45:07', 'Asia/Taipei' ) ).toBe( '2026-06-15T13:45:07' );
	} );

	it( 'reads a bare date as the start of its day', () => {
		expect( toBucketStamp( '2026-06-15', 'Asia/Taipei' ) ).toBe( '2026-06-15T00:00:00' );
	} );

	it( "drops the offset Woo stamps, which is the site's own", () => {
		expect( toBucketStamp( '2026-06-15T00:00:00+08:00', 'Asia/Taipei' ) ).toBe(
			'2026-06-15T00:00:00'
		);
	} );

	it( "resolves an offset that is not the site's own into the site wall time", () => {
		expect( toBucketStamp( '2026-06-15T00:00:00Z', 'Asia/Taipei' ) ).toBe( '2026-06-15T08:00:00' );
	} );

	// A zone, not a fixed offset: the same report can span both sides of a transition.
	it( 'reads each stamp at the offset in effect on its own day', () => {
		expect( toBucketStamp( '2026-06-15T04:00:00Z', 'America/New_York' ) ).toBe(
			'2026-06-15T00:00:00'
		);
		expect( toBucketStamp( '2026-12-15T05:00:00Z', 'America/New_York' ) ).toBe(
			'2026-12-15T00:00:00'
		);
	} );

	it( 'passes through a value it does not recognize as a timestamp', () => {
		expect( toBucketStamp( '', 'Asia/Taipei' ) ).toBe( '' );
		expect( toBucketStamp( 'not a date', 'Asia/Taipei' ) ).toBe( 'not a date' );
		expect( toBucketStamp( '2026-02-31 00:00:00', 'Asia/Taipei' ) ).toBe( '2026-02-31 00:00:00' );
	} );

	// `toLocalTZ` would read a missing bound as the current instant.
	it( 'empties a bound that is not a string rather than stamping it with today', () => {
		expect( toBucketStamp( undefined, 'Asia/Taipei' ) ).toBe( '' );
	} );

	// A zone that does not resolve leaves every bound of every report as written,
	// so pin the shape rather than leaving that exit undocumented.
	it( 'leaves the bound alone when the zone does not resolve', () => {
		expect( toBucketStamp( '2026-06-15T00:00:00+08:00', 'Not/AZone' ) ).toBe(
			'2026-06-15T00:00:00+08:00'
		);
		expect( toBucketStamp( '2026-06-15T00:00:00+08:00', '' ) ).toBe( '2026-06-15T00:00:00+08:00' );
	} );
} );

describe( 'resolveBucketStamp', () => {
	it( 'anchors a bucket stamp in the report timezone', () => {
		expect( resolveBucketStamp( '2026-06-15 00:00:00', 'Asia/Tokyo' )?.toISOString() ).toBe(
			'2026-06-14T15:00:00.000Z'
		);
	} );

	it( 'follows the report out of that zone', () => {
		expect(
			resolveBucketStamp( '2026-06-15 00:00:00', 'America/Los_Angeles' )?.toISOString()
		).toBe( '2026-06-15T07:00:00.000Z' );
	} );

	it.each( [ '2026-06-15T00:00:00+00:00', '2026-06-15T00:00:00Z', '2026-06-15T00:00:00-07:00' ] )(
		'ignores the nominal offset on %s',
		stamp => {
			expect( resolveBucketStamp( stamp, 'Asia/Tokyo' )?.toISOString() ).toBe(
				'2026-06-14T15:00:00.000Z'
			);
		}
	);

	it( 'reads a bare date as the start of that day', () => {
		expect( resolveBucketStamp( '2026-06-15', 'Asia/Tokyo' )?.toISOString() ).toBe(
			'2026-06-14T15:00:00.000Z'
		);
	} );

	it.each( [ undefined, '', 'not a date', '2026-02-30' ] )( 'returns undefined for %p', value => {
		expect( resolveBucketStamp( value, 'Asia/Tokyo' ) ).toBeUndefined();
	} );

	// The pair is the contract: what the constructor writes, the reader has to
	// land on the instant the raw bound named.
	it( 'round-trips a stamped bound to the instant it named', () => {
		const raw = '2026-06-15T00:00:00+08:00';

		expect(
			resolveBucketStamp( toBucketStamp( raw, 'Asia/Taipei' ), 'Asia/Taipei' )?.getTime()
		).toBe( new Date( raw ).getTime() );
	} );

	// A zone, not a fixed offset: the same report can span both sides of a transition.
	it( 'anchors each stamp at the offset in effect on its own day', () => {
		expect( resolveBucketStamp( '2026-06-15T00:00:00', 'America/New_York' )?.toISOString() ).toBe(
			'2026-06-15T04:00:00.000Z'
		);
		expect( resolveBucketStamp( '2026-12-15T00:00:00', 'America/New_York' )?.toISOString() ).toBe(
			'2026-12-15T05:00:00.000Z'
		);
	} );
} );
