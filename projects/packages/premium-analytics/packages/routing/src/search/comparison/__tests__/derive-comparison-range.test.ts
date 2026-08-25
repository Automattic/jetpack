/**
 * Mocks: stub the data barrel so this unit test doesn't pull in its React Query
 * and api-fetch surface. The date helpers delegate to the real datetime package,
 * so the anchoring under test is the production one.
 */
jest.mock( '@jetpack-premium-analytics/data', () => {
	const { toLocalTZ, dateToISOStringWithTZ, siteTimeZone } = jest.requireActual(
		'@jetpack-premium-analytics/datetime'
	);
	return {
		localTZDate: ( value?: number | string | Date, timezone?: string ) =>
			toLocalTZ( value, timezone ?? siteTimeZone() ),
		dateToISOStringWithLocalTZ: ( date: Date, timezone?: string ) =>
			dateToISOStringWithTZ( date, timezone ?? siteTimeZone() ),
	};
} );
/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { deriveComparisonRange } from '../derive-comparison-range';
import type { ComparisonPresetId } from '@jetpack-premium-analytics/datetime';

const DEFAULTS = getSettings();

const siteOn = ( string: string, offset: number ) =>
	setSettings( {
		...DEFAULTS,
		timezone: { string, offset, offsetFormatted: String( offset ), abbr: '' },
	} );

describe( 'deriveComparisonRange', () => {
	// Day-bound math has to be deterministic regardless of the machine timezone
	// running the tests, so pin the site rather than leaning on the defaults.
	beforeEach( () => siteOn( 'UTC', 0 ) );
	it( 'returns undefined when comparison is disabled or the preset is missing', () => {
		const range = { from: '2026-06-01T00:00:00.000Z', to: '2026-06-07T23:59:59.999Z' };

		expect(
			deriveComparisonRange( { ...range, compare_preset: 'previous-period' } )
		).toBeUndefined();
		expect( deriveComparisonRange( { ...range, comp: '1' } ) ).toBeUndefined();
	} );

	it( 'derives a day-aligned previous period for day-aligned ranges', () => {
		expect(
			deriveComparisonRange( {
				from: '2026-06-01T00:00:00.000Z',
				to: '2026-06-07T23:59:59.999Z',
				comp: '1',
				compare_preset: 'previous-period',
			} )
		).toEqual( {
			compare_from: '2026-05-25T00:00:00.000+00:00',
			compare_to: '2026-05-31T23:59:59.999+00:00',
		} );
	} );

	it( 'mirrors the exact window for rolling ranges like last-24-hours', () => {
		expect(
			deriveComparisonRange( {
				from: '2026-07-09T14:30:00.000Z',
				to: '2026-07-10T14:29:59.999Z',
				comp: '1',
				compare_preset: 'previous-period',
			} )
		).toEqual( {
			compare_from: '2026-07-08T14:30:00.000+00:00',
			compare_to: '2026-07-09T14:29:59.999+00:00',
		} );
	} );

	// A hand-typed deep link carries no offset. Reading it as a UTC instant would
	// put a site west of Greenwich on the previous calendar day and, because the
	// range would no longer sit on day boundaries, derive a rolling window
	// instead of the previous period the picker shows.
	it( 'anchors an offset-less range to the site zone', () => {
		siteOn( 'America/New_York', -4 );

		expect(
			deriveComparisonRange( {
				from: '2026-06-29',
				to: '2026-06-30T23:59:59.999',
				comp: '1',
				compare_preset: 'previous-period',
			} )
		).toEqual( {
			compare_from: '2026-06-27T00:00:00.000-04:00',
			compare_to: '2026-06-28T23:59:59.999-04:00',
		} );
	} );

	// A link saved while the preset existed drops its comparison rather than
	// deriving a range the picker can no longer show. Typed as a string
	// because that is what the URL carries, whatever the current set is.
	it( 'returns undefined for a preset outside the current set', () => {
		const presetFromOldUrl: string = 'previous-week';

		expect(
			deriveComparisonRange( {
				from: '2026-07-09T14:30:00.000Z',
				to: '2026-07-10T14:30:00.000Z',
				comp: '1',
				compare_preset: presetFromOldUrl as ComparisonPresetId,
			} )
		).toBeUndefined();
	} );
} );
