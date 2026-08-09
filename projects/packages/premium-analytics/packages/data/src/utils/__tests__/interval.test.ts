/**
 * Internal dependencies
 */
import {
	getAllowedIntervalsForPreset,
	getDefaultIntervalForPeriod,
	resolveIntervalForRange,
} from '../interval';
import { needsReportDateParamsSeed } from '../search';

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

	/*
	 * Reported by @louwie17 on #51112: switching from a preset bucketed by days
	 * to a day-long one kept `day`, drawing the whole window as a single bar.
	 * The fix is that a day-long window no longer allows `day` at all.
	 */
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
	 * Under a week, hours stay on offer alongside days: a four-day window has
	 * shape within each day that daily bars cannot show, and 96 points is still
	 * a readable series.
	 */
	it( 'offers hours as well as days under a week', () => {
		const from = '2026-06-01T00:00:00.000Z';
		const to = '2026-06-04T23:59:59.999Z';

		expect( getAllowedIntervalsForPreset( 'custom', from, to ) ).toEqual( [ 'hour', 'day' ] );
		expect( resolveIntervalForRange( 'custom', from, to, 'hour' ) ).toBe( 'hour' );
		expect( resolveIntervalForRange( 'custom', from, to, 'day' ) ).toBe( 'day' );
	} );

	// A week is where they stop: seven days of hourly bars is a wall.
	it( 'drops hours from a week upward', () => {
		expect(
			getAllowedIntervalsForPreset(
				'custom',
				'2026-06-01T00:00:00.000Z',
				'2026-06-07T23:59:59.999Z'
			)
		).toEqual( [ 'day' ] );
	} );

	it( 'defaults when no current interval is provided', () => {
		expect( getDefaultIntervalForPeriod( 'last-30-days', 'a', 'b' ) ).toBe( 'day' );
		expect( resolveIntervalForRange( 'last-30-days', 'a', 'b' ) ).toBe( 'day' );
	} );

	it( 'uses range length for custom and year-surface presets', () => {
		expect(
			resolveIntervalForRange( 'custom', '2026-06-01T00:00:00.000Z', '2026-06-07T23:59:59.999Z' )
		).toBe( 'day' );
		expect(
			resolveIntervalForRange(
				'all-time',
				'2020-01-01T00:00:00.000Z',
				'2026-06-30T23:59:59.999Z',
				'year'
			)
		).toBe( 'year' );
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

	it( 'seeds when the interval is unrecognized', () => {
		expect(
			needsReportDateParamsSeed( {
				from: '2026-06-01',
				to: '2026-06-30',
				preset: 'last-30-days',
				interval: 'not-an-interval',
			} )
		).toBe( true );
	} );

	it( 'treats an unrecognized preset as range-based', () => {
		expect(
			needsReportDateParamsSeed( {
				from: '2026-06-01T00:00:00.000Z',
				to: '2026-06-07T23:59:59.999Z',
				// @ts-expect-error – testing with invalid preset on purpose
				preset: 'not-a-preset',
				interval: 'day',
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
