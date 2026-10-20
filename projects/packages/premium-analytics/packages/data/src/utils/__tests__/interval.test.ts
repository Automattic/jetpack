/**
 * Internal dependencies
 */
import {
	getAllowedIntervalsForPreset,
	getDaysBetweenInclusive,
	getDefaultIntervalForPeriod,
	getLockedIntervalsForPreset,
	resolveIntervalForPresetChange,
	resolveIntervalForRange,
} from '../interval';
import { needsReportDateParamsSeed } from '../search';

describe( 'getDaysBetweenInclusive', () => {
	it( 'counts inclusive calendar days from bare dates', () => {
		expect( getDaysBetweenInclusive( '2026-06-01', '2026-06-07' ) ).toBe( 7 );
		expect( getDaysBetweenInclusive( '2026-06-01', '2026-06-01' ) ).toBe( 1 );
	} );

	it( 'reads the site-local calendar day at either offset extreme', () => {
		// -07:00 at 23:00 is already the next UTC day; +13:00 at 00:30 is still
		// the previous one. Counting off the UTC day would misplace a bucket either way.
		expect(
			getDaysBetweenInclusive( '2026-06-01T00:00:00.000-07:00', '2026-06-30T23:00:00.000-07:00' )
		).toBe( 30 );
		expect(
			getDaysBetweenInclusive( '2026-06-01T00:30:00.000+13:00', '2026-06-30T12:00:00.000+13:00' )
		).toBe( 30 );
	} );

	it( 'falls back to one day for an inverted or unparseable range', () => {
		expect( getDaysBetweenInclusive( '2026-06-07', '2026-06-01' ) ).toBe( 1 );
		expect( getDaysBetweenInclusive( 'nonsense', '2026-06-01' ) ).toBe( 1 );
	} );
} );

describe( 'resolveIntervalForRange', () => {
	it( 'keeps the current interval when it is still allowed', () => {
		expect( resolveIntervalForRange( 'last-30-days', '2026-06-01', '2026-06-30', 'week' ) ).toBe(
			'week'
		);
	} );

	it( 'falls back to the default when the current interval is not allowed', () => {
		expect( resolveIntervalForRange( 'last-7-days', '2026-06-01', '2026-06-07', 'week' ) ).toBe(
			'day'
		);
		expect( resolveIntervalForRange( 'last-24-hours', '2026-06-01', '2026-06-02', 'month' ) ).toBe(
			'hour'
		);
	} );

	// A day-long window allows no `day` bucket: it would draw as a single bar.
	it( 'coerces a day-scale interval onto a day-long window', () => {
		expect( resolveIntervalForRange( 'last-24-hours', '2026-06-01', '2026-06-02', 'day' ) ).toBe(
			'hour'
		);
		expect( resolveIntervalForRange( 'today', '2026-06-01', '2026-06-01', 'day' ) ).toBe( 'hour' );
		expect( resolveIntervalForRange( 'yesterday', '2026-05-31', '2026-05-31', 'day' ) ).toBe(
			'hour'
		);
	} );

	// A stepped window carries no preset, so the same rule has to hold on the
	// range path or stepping a 24-hour window would re-offer `day`.
	it( 'coerces on a day-long custom range too', () => {
		expect(
			resolveIntervalForRange(
				'custom',
				'2026-06-01T00:00:00.000Z',
				'2026-06-01T23:59:59.999Z',
				'day'
			)
		).toBe( 'hour' );
	} );

	/*
	 * Under a week the default is daily; hours stay on offer as the only
	 * reading that shows shape within a day.
	 */
	it( 'defaults to days under a week, with hours on offer', () => {
		const from = '2026-06-01T00:00:00.000Z';
		const to = '2026-06-04T23:59:59.999Z';

		expect( getAllowedIntervalsForPreset( 'custom', from, to ) ).toEqual( [ 'day', 'hour' ] );
		expect( resolveIntervalForRange( 'custom', from, to ) ).toBe( 'day' );
		expect( resolveIntervalForRange( 'custom', from, to, 'hour' ) ).toBe( 'hour' );
		expect( resolveIntervalForRange( 'custom', from, to, 'day' ) ).toBe( 'day' );
	} );

	// A deep link with an unencoded `+` reaches the router as a space. Two days
	// still offer hours, which an unreadable range would not, so the offset must be read.
	it( 'reads a range whose offsets lost their plus to the querystring', () => {
		const from = '2026-08-01T00:00:00.000 00:00';
		const to = '2026-08-02T23:59:59.999 00:00';

		expect( getAllowedIntervalsForPreset( undefined, from, to ) ).toEqual( [ 'day', 'hour' ] );
		expect( resolveIntervalForRange( undefined, from, to, 'hour' ) ).toBe( 'hour' );
	} );

	it( 'defaults an unreadable range to days rather than hours', () => {
		expect( getAllowedIntervalsForPreset( undefined, 'not a date', 'either' ) ).toEqual( [
			'day',
		] );
		expect( resolveIntervalForRange( undefined, 'not a date', 'either', 'hour' ) ).toBe( 'day' );
	} );

	it( 'drops hours from a week upward', () => {
		expect(
			getAllowedIntervalsForPreset(
				'custom',
				'2026-06-01T00:00:00.000Z',
				'2026-06-07T23:59:59.999Z'
			)
		).toEqual( [ 'day' ] );
	} );

	it( 'never offers quarters on the year-length ranges', () => {
		expect(
			getAllowedIntervalsForPreset(
				'last-12-months',
				'2025-07-01T00:00:00.000Z',
				'2026-06-30T23:59:59.999Z'
			)
		).toEqual( [ 'month', 'week' ] );
		expect( getAllowedIntervalsForPreset( 'last-365-days', 'a', 'b' ) ).toEqual( [
			'month',
			'week',
		] );
		expect( getAllowedIntervalsForPreset( 'last-year', 'a', 'b' ) ).toEqual( [ 'month', 'week' ] );
		expect(
			getAllowedIntervalsForPreset(
				'all-time',
				'2020-01-01T00:00:00.000Z',
				'2026-06-30T23:59:59.999Z'
			)
		).toEqual( [ 'month', 'year' ] );
	} );

	// The year surface carries a `year-YYYY` preset the switch does not know, so
	// its list comes from the range instead and needs its own guard.
	it( 'offers months and weeks on a year-length range with no matching preset', () => {
		expect(
			getAllowedIntervalsForPreset(
				'year-2025',
				'2025-01-01T00:00:00.000Z',
				'2025-12-31T23:59:59.999Z'
			)
		).toEqual( [ 'month', 'week' ] );
		expect(
			getAllowedIntervalsForPreset(
				'year-2024',
				'2024-01-01T00:00:00.000Z',
				'2024-12-31T23:59:59.999Z'
			)
		).toEqual( [ 'month', 'week' ] );
		expect(
			resolveIntervalForRange(
				'year-2025',
				'2025-01-01T00:00:00.000Z',
				'2025-12-31T23:59:59.999Z',
				'quarter'
			)
		).toBe( 'month' );
	} );

	it( 'flips the default from weeks to months where a range reaches a year', () => {
		const from = '2025-01-01T00:00:00.000Z';

		expect( getAllowedIntervalsForPreset( 'custom', from, '2025-12-30T23:59:59.999Z' ) ).toEqual( [
			'week',
			'month',
		] );
		expect( getAllowedIntervalsForPreset( 'custom', from, '2025-12-31T23:59:59.999Z' ) ).toEqual( [
			'month',
			'week',
		] );
	} );

	it( 'drops weeks once a range outgrows a year', () => {
		const from = '2025-01-01T00:00:00.000Z';
		const to = '2026-01-02T23:59:59.999Z';

		expect( getAllowedIntervalsForPreset( 'custom', from, to ) ).toEqual( [ 'month' ] );
		expect( resolveIntervalForRange( 'custom', from, to, 'week' ) ).toBe( 'month' );
	} );

	it( 'coerces a stored quarter onto the range default', () => {
		expect(
			resolveIntervalForRange( 'last-12-months', '2025-07-01', '2026-06-30', 'quarter' )
		).toBe( 'month' );
	} );

	it( 'defaults when no current interval is provided', () => {
		expect( getDefaultIntervalForPeriod( 'last-30-days', 'a', 'b' ) ).toBe( 'day' );
		expect( resolveIntervalForRange( 'last-30-days', 'a', 'b' ) ).toBe( 'day' );
	} );
} );

describe( 'needsReportDateParamsSeed', () => {
	it( 'seeds when from, to, or interval is missing', () => {
		expect( needsReportDateParamsSeed( {} ) ).toBe( true );
		expect(
			needsReportDateParamsSeed( {
				from: '2026-06-01',
				to: '2026-06-30',
			} )
		).toBe( true );
	} );

	it( 'accepts days on a long range only where the plan locks the longer buckets', () => {
		const search = { from: '2026-01-01', to: '2026-06-29', interval: 'day' };

		expect( needsReportDateParamsSeed( search ) ).toBe( true );
		expect( needsReportDateParamsSeed( search, [ 'week', 'month', 'year' ] ) ).toBe( false );
	} );

	it( 'seeds when a date lost the plus of its offset to the querystring', () => {
		expect(
			needsReportDateParamsSeed( {
				from: '2026-06-01T00:00:00.000 00:00',
				to: '2026-06-07T23:59:59.999+00:00',
				interval: 'day',
			} )
		).toBe( true );
		expect(
			needsReportDateParamsSeed( {
				from: '2026-06-01T00:00:00.000+00:00',
				to: '2026-06-07T23:59:59.999+00:00',
				interval: 'day',
			} )
		).toBe( false );
	} );

	it( 'seeds when the interval is not allowed for the preset', () => {
		expect(
			needsReportDateParamsSeed( {
				from: '2026-06-01',
				to: '2026-06-07',
				preset: 'last-7-days',
				interval: 'week',
			} )
		).toBe( true );
	} );

	it( 'does not seed when the interval is still allowed', () => {
		expect(
			needsReportDateParamsSeed( {
				from: '2026-06-01',
				to: '2026-06-30',
				preset: 'last-30-days',
				interval: 'week',
			} )
		).toBe( false );
	} );

	it( 'treats custom and year-surface presets as range-based', () => {
		// `normalizeReportParams` keeps only selectable presets, so these must
		// resolve from the range on both sides or the seed check would loop.
		expect(
			needsReportDateParamsSeed( {
				from: '2020-01-01T00:00:00.000Z',
				to: '2026-06-30T23:59:59.999Z',
				preset: 'all-time',
				interval: 'year',
			} )
		).toBe( false );
		expect(
			needsReportDateParamsSeed( {
				from: '2026-06-01T00:00:00.000Z',
				to: '2026-06-07T23:59:59.999Z',
				preset: 'custom',
				interval: 'month',
			} )
		).toBe( true );
	} );
} );

describe( 'resolveIntervalForPresetChange', () => {
	it( 'starts a different named preset from its own default', () => {
		expect(
			resolveIntervalForPresetChange(
				'year-to-date',
				'last-30-days',
				'2026-06-01',
				'2026-06-30',
				'week'
			)
		).toBe( 'day' );
	} );

	it( 'carries the interval when the preset is unchanged', () => {
		expect(
			resolveIntervalForPresetChange(
				'last-30-days',
				'last-30-days',
				'2026-06-01',
				'2026-06-30',
				'week'
			)
		).toBe( 'week' );
	} );

	it( 'carries the interval into a custom range or a range with no preset', () => {
		for ( const next of [ 'custom', undefined ] as const ) {
			expect(
				resolveIntervalForPresetChange( 'last-30-days', next, '2026-06-01', '2026-06-30', 'week' )
			).toBe( 'week' );
		}
	} );

	it( 'still coerces a carried interval the new range disallows', () => {
		expect(
			resolveIntervalForPresetChange( 'last-30-days', 'custom', '2026-06-01', '2026-06-07', 'week' )
		).toBe( 'day' );
	} );
} );

describe( 'getAllowedIntervalsForPreset with locked intervals', () => {
	const LOCKED = [ 'week', 'month', 'year' ] as const;

	it.each( [
		[ 'last-30-days', '2026-09-16', '2026-10-15', [ 'day' ] ],
		[ undefined, '2026-01-01', '2026-06-30', [ 'day' ] ],
		[ 'last-24-hours', '2026-10-14', '2026-10-15', [ 'hour' ] ],
	] )( 'offers %p from %s to %s as %p', ( preset, from, to, expected ) => {
		expect( getAllowedIntervalsForPreset( preset as never, from, to, LOCKED ) ).toEqual( expected );
	} );
} );

describe( 'getLockedIntervalsForPreset', () => {
	const LOCKED = [ 'week', 'month', 'year' ] as const;

	it.each( [
		[ 'last-7-days', '2026-10-09', '2026-10-15', LOCKED, [] ],
		[ 'last-30-days', '2026-09-16', '2026-10-15', LOCKED, [ 'week' ] ],
		[ undefined, '2026-01-01', '2026-06-30', LOCKED, [ 'week', 'month' ] ],
		[ undefined, '2023-01-01', '2026-06-30', LOCKED, [ 'month', 'year' ] ],
		[ 'last-30-days', '2026-09-16', '2026-10-15', [], [] ],
	] )( 'locks %p from %s to %s under %p as %p', ( preset, from, to, locked, expected ) => {
		expect( getLockedIntervalsForPreset( preset as never, from, to, locked ) ).toEqual( expected );
	} );
} );
