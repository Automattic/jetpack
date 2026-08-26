/**
 * Mocks: stub the data barrel so this unit test doesn't pull in its React Query
 * and api-fetch surface. The date helpers delegate to the real datetime package,
 * so the anchoring under test is the production one.
 */
jest.mock( '@jetpack-premium-analytics/data', () => {
	const { toLocalTZ, dateToISOStringWithTZ, reportingTimeZone } = jest.requireActual(
		'@jetpack-premium-analytics/datetime'
	);
	return {
		localTZDate: ( value?: number | string | Date, timezone?: string ) =>
			toLocalTZ( value, timezone ?? reportingTimeZone() ),
		dateToISOStringWithLocalTZ: ( date: Date, timezone?: string ) =>
			dateToISOStringWithTZ( date, timezone ?? reportingTimeZone() ),
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
	it( 'returns undefined when comparison is disabled', () => {
		const range = { from: '2026-06-01T00:00:00.000Z', to: '2026-06-07T23:59:59.999Z' };

		expect(
			deriveComparisonRange( { ...range, compare_preset: 'previous-period' } )
		).toBeUndefined();
	} );

	// Comparison on with no usable preset still means "comparing": the previous
	// period stands in, rather than stranding stale compare dates.
	it( 'falls back to the previous period when the preset is missing', () => {
		expect(
			deriveComparisonRange( {
				from: '2026-06-01T00:00:00.000Z',
				to: '2026-06-07T23:59:59.999Z',
				comp: '1',
			} )
		).toEqual( {
			compare_from: '2026-05-25T00:00:00.000+00:00',
			compare_to: '2026-05-31T23:59:59.999+00:00',
			compare_preset: 'previous-period',
		} );
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
			compare_preset: 'previous-period',
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
			compare_preset: 'previous-period',
		} );
	} );

	// A hand-typed deep link carries no offset; reading it as UTC would land a
	// site west of Greenwich on the wrong calendar day and derive the wrong window.
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
			compare_preset: 'previous-period',
		} );
	} );

	// The restored previous-week preset (dropped in WOOA7S-1814, back for
	// WOOA7S-2028) also revives links saved while it was gone.
	it( 'derives the week shift for a previous-week link', () => {
		expect(
			deriveComparisonRange( {
				from: '2026-07-09T14:30:00.000Z',
				to: '2026-07-10T14:30:00.000Z',
				comp: '1',
				compare_preset: 'previous-week',
			} )
		).toEqual( {
			compare_from: '2026-07-02T14:30:00.000+00:00',
			compare_to: '2026-07-03T14:30:00.000+00:00',
			compare_preset: 'previous-week',
		} );
	} );

	// The range decides what the menu offers, so a preset it no longer offers
	// (a month shift on a 30-day range) remaps to the previous period.
	it( 'remaps a preset the range no longer offers to the previous period', () => {
		expect(
			deriveComparisonRange( {
				from: '2026-08-01T00:00:00.000Z',
				to: '2026-08-30T23:59:59.999Z',
				comp: '1',
				compare_preset: 'previous-month',
			} )
		).toEqual( {
			compare_from: '2026-07-02T00:00:00.000+00:00',
			compare_to: '2026-07-31T23:59:59.999+00:00',
			compare_preset: 'previous-period',
		} );
	} );

	it( 'derives the previous period of a to-date preset from its completed window', () => {
		// `last-12-months` as read on 20 August 2026.
		const range = {
			from: '2025-09-01T00:00:00.000Z',
			to: '2026-08-20T23:59:59.999Z',
			comp: '1' as const,
			compare_preset: 'previous-period' as const,
		};

		expect( deriveComparisonRange( { ...range, preset: 'last-12-months' } ) ).toEqual( {
			compare_from: '2024-09-01T00:00:00.000+00:00',
			compare_to: '2025-08-31T23:59:59.999+00:00',
		} );

		// The same dates picked by hand are a day count.
		expect( deriveComparisonRange( { ...range, preset: 'custom' } ) ).toEqual( {
			compare_from: '2024-09-12T00:00:00.000+00:00',
			compare_to: '2025-08-31T23:59:59.999+00:00',
		} );
	} );
} );
