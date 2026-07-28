/**
 * Internal dependencies
 */
import { getDefaultIntervalForPeriod, resolveIntervalForRange } from '../interval';
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
