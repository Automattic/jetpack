/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
import { getSettings, setSettings } from '@wordpress/date';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { DASHBOARD_PREFERENCES_SCOPE } from '../../defaults/remembered-preset';
import * as presetDateRange from '../preset-date-range';
import { normalizeReportParams } from '../search';

// "Today" is 2026-02-18 in the site zone, so last-30-days resolves to FRESH.
const NOW = new Date( '2026-02-18T17:00:00.000Z' );
const FRESH_FROM = '2026-01-20T00:00:00.000-05:00';
const FRESH_TO = '2026-02-18T23:59:59.999-05:00';
const STALE_FROM = '2026-01-19T00:00:00.000-05:00';
const STALE_TO = '2026-02-17T23:59:59.999-05:00';
const DEFAULT_FROM = '2026-02-12T00:00:00.000-05:00';

describe( 'normalizeReportParams', () => {
	const originalSettings = getSettings();

	beforeAll( () => {
		setSettings( {
			...originalSettings,
			timezone: { string: 'America/New_York', offset: -5, offsetFormatted: '-5', abbr: 'EST' },
		} );
	} );

	beforeEach( () => {
		jest.useFakeTimers().setSystemTime( NOW );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	afterAll( () => {
		setSettings( originalSettings );
	} );

	it( 'applies default preset without comparison on fresh load', () => {
		const result = normalizeReportParams();

		expect( result.preset ).toBe( 'last-7-days' );
		expect( result.from ).toBe( DEFAULT_FROM );
		expect( result.to ).toBe( FRESH_TO );

		expect( result.comp ).toBeUndefined();
		expect( result.compare_from ).toBeUndefined();
		expect( result.compare_to ).toBeUndefined();
		expect( result.compare_preset ).toBeUndefined();
	} );

	it( 'applies the preset the reader last applied on fresh load', () => {
		const preferences = dispatch( preferencesStore );
		preferences.set( DASHBOARD_PREFERENCES_SCOPE, 'datePreset', 'last-30-days' );

		try {
			expect( normalizeReportParams() ).toMatchObject( {
				preset: 'last-30-days',
				from: FRESH_FROM,
				to: FRESH_TO,
			} );
		} finally {
			preferences.set( DASHBOARD_PREFERENCES_SCOPE, 'datePreset', undefined );
		}
	} );

	it( 'passes the candidate interval through resolveIntervalForRange', () => {
		const result = normalizeReportParams( {
			from: FRESH_FROM,
			to: FRESH_TO,
			preset: 'last-30-days',
			interval: 'week',
		} );

		expect( result.interval ).toBe( 'week' );
	} );

	it( 'uses explicit dates as-is when no preset is set', () => {
		const customFrom = '2026-01-01T00:00:00.000-05:00';
		const customTo = '2026-01-31T23:59:59.999-05:00';

		const result = normalizeReportParams( {
			from: customFrom,
			to: customTo,
		} );

		expect( result.from ).toBe( customFrom );
		expect( result.to ).toBe( customTo );
		expect( result.preset ).toBeUndefined();
	} );

	it( 'uses explicit dates as-is when preset is custom', () => {
		const customFrom = '2026-01-01T00:00:00.000-05:00';
		const customTo = '2026-01-31T23:59:59.999-05:00';

		const result = normalizeReportParams( {
			from: customFrom,
			to: customTo,
			preset: 'custom',
		} );

		expect( result.from ).toBe( customFrom );
		expect( result.to ).toBe( customTo );
		expect( result.preset ).toBeUndefined();
	} );

	it( 'recalculates primary but preserves comparison from URL', () => {
		const compFrom = '2025-12-20T00:00:00.000-05:00';
		const compTo = '2026-01-18T23:59:59.999-05:00';

		const result = normalizeReportParams( {
			from: STALE_FROM,
			to: STALE_TO,
			preset: 'last-30-days',
			interval: 'day',
			comp: '1',
			compare_from: compFrom,
			compare_to: compTo,
			compare_preset: 'previous-period',
		} );

		expect( result.from ).toBe( FRESH_FROM );
		expect( result.to ).toBe( FRESH_TO );

		expect( result.comp ).toBe( '1' );
		expect( result.compare_from ).toBe( compFrom );
		expect( result.compare_to ).toBe( compTo );
		expect( result.compare_preset ).toBe( 'previous-period' );
	} );

	// The router JSON-parses search values, so an unquoted URL (hand-edited or
	// from an older link builder) can deliver comp as the number 1, which must
	// still enable comparison, normalized back to '1'.
	it( 'accepts a numeric comp flag from an unquoted URL', () => {
		const compFrom = '2025-12-20T00:00:00.000-05:00';
		const compTo = '2026-01-18T23:59:59.999-05:00';

		const result = normalizeReportParams( {
			from: STALE_FROM,
			to: STALE_TO,
			preset: 'last-30-days',
			interval: 'day',
			comp: 1 as unknown as '1',
			compare_from: compFrom,
			compare_to: compTo,
			compare_preset: 'previous-period',
		} );

		expect( result.comp ).toBe( '1' );
		expect( result.compare_from ).toBe( compFrom );
		expect( result.compare_to ).toBe( compTo );
	} );

	it( 'recalculates primary with no comparison when comp is absent', () => {
		const result = normalizeReportParams( {
			from: STALE_FROM,
			to: STALE_TO,
			preset: 'last-30-days',
			interval: 'day',
		} );

		expect( result.from ).toBe( FRESH_FROM );
		expect( result.to ).toBe( FRESH_TO );

		// No comparison in the URL, so none is applied.
		expect( result.comp ).toBeUndefined();
		expect( result.compare_from ).toBeUndefined();
		expect( result.compare_to ).toBeUndefined();
	} );

	// No selectable preset lacks a range today, so this guard is reached only by a stub.
	it( 'falls back to URL dates when preset has no range implementation', () => {
		const { computeDateRangeFromPreset } = presetDateRange;
		const computeRange = jest
			.spyOn( presetDateRange, 'computeDateRangeFromPreset' )
			.mockImplementation( preset =>
				preset === 'last-30-days' ? undefined : computeDateRangeFromPreset( preset )
			);

		try {
			const result = normalizeReportParams( {
				from: STALE_FROM,
				to: STALE_TO,
				preset: 'last-30-days',
			} );

			expect( result.preset ).toBeUndefined();
			expect( result.from ).toBe( STALE_FROM );
			expect( result.to ).toBe( STALE_TO );
		} finally {
			computeRange.mockRestore();
		}
	} );

	/*
	 * Edge case – date_type is preserved from search.
	 */
	it( 'preserves date_type from search', () => {
		const result = normalizeReportParams( {
			from: FRESH_FROM,
			to: FRESH_TO,
			date_type: 'paid',
		} );

		expect( result.date_type ).toBe( 'paid' );
	} );

	/*
	 * Edge case – chart period is preserved from search.
	 */
	it( 'preserves period from search', () => {
		const result = normalizeReportParams( {
			from: FRESH_FROM,
			to: FRESH_TO,
			period: 'week',
		} );

		expect( result.period ).toBe( 'week' );
	} );

	/*
	 * Edge case – date_type defaults to "created".
	 */
	it( 'defaults date_type to created', () => {
		const result = normalizeReportParams( {
			from: FRESH_FROM,
			to: FRESH_TO,
		} );

		expect( result.date_type ).toBe( 'created' );
	} );

	/*
	 * Single-resource scope – post_id survives normalization so detail-page
	 * widgets stay bound to their post/page.
	 */
	it( 'coerces a valid post_id to a positive integer', () => {
		const result = normalizeReportParams( {
			from: FRESH_FROM,
			to: FRESH_TO,
			post_id: '2428',
		} );

		expect( result.post_id ).toBe( 2428 );
	} );

	/*
	 * Scenario – a section on the year surface (all time / a single calendar
	 * year). Its selection has to survive normalization: as dates alone, an
	 * all-time range covering one year is indistinguishable from that year.
	 */
	it( 'recomputes a year preset so the current year stays fresh', () => {
		const result = normalizeReportParams( {
			from: '2026-01-01T00:00:00.000-05:00',
			to: STALE_TO,
			preset: 'year-2026',
			interval: 'month',
		} );

		expect( result.preset ).toBe( 'year-2026' );
		expect( result.from ).toBe( '2026-01-01T00:00:00.000-05:00' );
		expect( result.to ).toBe( FRESH_TO );
	} );

	it( 'keeps the all-time start and refreshes its end', () => {
		const result = normalizeReportParams( {
			from: '2023-01-01T00:00:00.000-05:00',
			to: STALE_TO,
			preset: 'all-time',
		} );

		expect( result.preset ).toBe( 'all-time' );
		expect( result.from ).toBe( '2023-01-01T00:00:00.000-05:00' );
		expect( result.to ).toBe( FRESH_TO );
	} );

	it( 'rebuilds a year preset that arrives without its range', () => {
		const result = normalizeReportParams( { preset: 'year-2025' } );

		expect( result.preset ).toBe( 'year-2025' );
		expect( result.from ).toBe( '2025-01-01T00:00:00.000-05:00' );
		expect( result.to ).toBe( '2025-12-31T23:59:59.999-05:00' );
	} );

	it( 'drops an all-time preset that arrives without its site-specific range', () => {
		const result = normalizeReportParams( { preset: 'all-time' } );

		expect( result.preset ).toBe( 'last-7-days' );
		expect( result.from ).toBe( DEFAULT_FROM );
		expect( result.to ).toBe( FRESH_TO );
	} );

	it( 'omits post_id when search has none', () => {
		const result = normalizeReportParams( {
			from: FRESH_FROM,
			to: FRESH_TO,
		} );

		expect( result.post_id ).toBeUndefined();
	} );

	it( 'drops an invalid post_id (0)', () => {
		const result = normalizeReportParams( {
			from: FRESH_FROM,
			to: FRESH_TO,
			post_id: '0',
		} );

		expect( result.post_id ).toBeUndefined();
	} );

	it( 'carries a valid author_id through as a number', () => {
		const result = normalizeReportParams( {
			from: FRESH_FROM,
			to: FRESH_TO,
			author_id: '7',
		} );

		expect( result.author_id ).toBe( 7 );
	} );

	it.each( [ undefined, 'foo' ] )( 'omits an absent or invalid author_id (%s)', invalid => {
		const result = normalizeReportParams( {
			from: FRESH_FROM,
			to: FRESH_TO,
			author_id: invalid,
		} );

		expect( result.author_id ).toBeUndefined();
	} );
} );
