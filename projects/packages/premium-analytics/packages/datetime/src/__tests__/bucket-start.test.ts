/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { parseBucketStart } from '../bucket-start';

const DEFAULTS = getSettings();

const siteIn = ( timeZone: string, offset: number ) =>
	setSettings( {
		...DEFAULTS,
		l10n: {
			...DEFAULTS.l10n,
			locale: `bucket-start-${ timeZone.replace( /\W/g, '-' ) }-${ offset }`,
		},
		timezone: { offset, offsetFormatted: String( offset ), string: timeZone, abbr: '' },
	} );

describe( 'parseBucketStart', () => {
	beforeEach( () => siteIn( 'Asia/Tokyo', 9 ) );

	it( 'anchors a bucket stamp in the site timezone', () => {
		expect( parseBucketStart( '2026-06-15 00:00:00' )?.toISOString() ).toBe(
			'2026-06-14T15:00:00.000Z'
		);
	} );

	// The passthrough copies `date_start` from the API verbatim, and the offset it
	// carries is nominal: honouring it would move the bucket off its own midnight.
	it.each( [ '2026-06-15T00:00:00+00:00', '2026-06-15T00:00:00Z', '2026-06-15T00:00:00-07:00' ] )(
		'ignores the nominal offset on %s',
		stamp => {
			expect( parseBucketStart( stamp )?.toISOString() ).toBe( '2026-06-14T15:00:00.000Z' );
		}
	);

	it( 'reads a bare date as the start of that day', () => {
		expect( parseBucketStart( '2026-06-15' )?.toISOString() ).toBe( '2026-06-14T15:00:00.000Z' );
	} );

	it( 'follows the site out of its zone', () => {
		siteIn( 'America/Los_Angeles', -7 );

		expect( parseBucketStart( '2026-06-15 00:00:00' )?.toISOString() ).toBe(
			'2026-06-15T07:00:00.000Z'
		);
	} );

	it.each( [ [ undefined ], [ '' ], [ 'not a date' ], [ '2026-02-30' ], [ 42 ] ] )(
		'returns undefined for %p',
		value => {
			expect( parseBucketStart( value ) ).toBeUndefined();
		}
	);
} );
