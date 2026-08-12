/**
 * Internal dependencies
 */
import {
	getDaysBetweenInclusive,
	getDefaultIntervalForPeriod,
	resolveIntervalForRange,
} from '../interval';
import { needsReportDateParamsSeed } from '../search';

describe( 'getDaysBetweenInclusive', () => {
	it( 'counts inclusive calendar days from bare dates', () => {
		expect( getDaysBetweenInclusive( '2026-06-01', '2026-06-07' ) ).toBe( 7 );
		expect( getDaysBetweenInclusive( '2026-06-01', '2026-06-01' ) ).toBe( 1 );
	} );

	it( 'counts an offset-bearing range exactly as its bare equivalent', () => {
		// Request params are no longer trimmed to a bare day before reaching
		// here. Left unextracted, the ISO datetime concatenates into an invalid
		// date, the NaN guard returns 1, and every range silently collapses to a
		// single day.
		expect(
			getDaysBetweenInclusive( '2026-06-01T00:00:00.000-07:00', '2026-06-07T23:59:59.999-07:00' )
		).toBe( 7 );
	} );

	it( 'reads the site-local calendar day at either offset extreme', () => {
		// 23:00 on 2026-06-30 at -07:00 is already 2026-07-01 in UTC, and 00:30
		// on 2026-06-01 at +13:00 is still 2026-05-31 there. Counting off the UTC
		// day would add a bucket at one end and drop one at the other.
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
