/**
 * Mocks – must appear before the import of the module under test.
 */
jest.mock( '../../defaults', () => ( {
	getDefaultQueryParams: jest.fn(),
} ) );

jest.mock( '../preset-date-range', () => ( {
	computeDateRangeFromPreset: jest.fn(),
} ) );

jest.mock( '../interval', () => ( {
	getDefaultIntervalForPeriod: jest.fn(),
} ) );
/**
 * Internal dependencies
 */
import { getDefaultQueryParams } from '../../defaults';
import { getDefaultIntervalForPeriod } from '../interval';
import { computeDateRangeFromPreset } from '../preset-date-range';
import { normalizeReportParams } from '../search';
import type { ReportParams } from '../search';

const mockGetDefaults = getDefaultQueryParams as jest.MockedFunction<
	typeof getDefaultQueryParams
>;
const mockComputeRange = computeDateRangeFromPreset as jest.MockedFunction<
	typeof computeDateRangeFromPreset
>;
const mockGetInterval = getDefaultIntervalForPeriod as jest.MockedFunction<
	typeof getDefaultIntervalForPeriod
>;

/*
 * Deterministic date strings.
 * FRESH = what computeDateRangeFromPreset returns "today".
 * STALE = what the URL had from a previous day.
 */
const FRESH_FROM = '2026-01-20T00:00:00.000-05:00';
const FRESH_TO = '2026-02-18T23:59:59.999-05:00';
const STALE_FROM = '2026-01-19T00:00:00.000-05:00';
const STALE_TO = '2026-02-17T23:59:59.999-05:00';

const DEFAULTS_WITH_COMPARISON: ReportParams = {
	from: FRESH_FROM,
	to: FRESH_TO,
	preset: 'last-30-days',
	interval: 'day',
	compare_from: '2025-12-21T00:00:00.000-05:00',
	compare_to: '2026-01-19T23:59:59.999-05:00',
	compare_preset: 'previous-period',
	comp: '1',
};

beforeEach( () => {
	jest.clearAllMocks();

	// Sensible defaults for every test – override per-scenario as needed.
	mockGetDefaults.mockReturnValue( { ...DEFAULTS_WITH_COMPARISON } );
	mockComputeRange.mockReturnValue( {
		from: FRESH_FROM,
		to: FRESH_TO,
	} );
	mockGetInterval.mockReturnValue( 'day' );
} );

describe( 'normalizeReportParams', () => {
	/*
	 * Scenario 1 – Fresh load (no params in URL)
	 * The user visits /dashboard with no query string.
	 * Expected: defaults kick in, preset "last-30-days" is used,
	 * and default comparison is applied.
	 */
	it( 'applies defaults with preset and comparison on fresh load', () => {
		const result = normalizeReportParams();

		// Preset should come from defaults.
		expect( result.preset ).toBe( 'last-30-days' );
		expect( mockComputeRange ).toHaveBeenCalledWith( 'last-30-days' );

		// Dates should come from computeDateRangeFromPreset.
		expect( result.from ).toBe( FRESH_FROM );
		expect( result.to ).toBe( FRESH_TO );

		// Default comparison should be applied (search is undefined
		// → !search?.from → true → default branch).
		expect( result.comp ).toBe( '1' );
		expect( result.compare_from ).toBe( DEFAULTS_WITH_COMPARISON.compare_from );
		expect( result.compare_to ).toBe( DEFAULTS_WITH_COMPARISON.compare_to );
	} );

	/*
	 * Scenario 2 – Same-day reload with preset
	 * The URL has preset=last-30-days and from/to that match today's
	 * computation. The dates are still fresh → no redirect needed.
	 */
	it( 'returns same dates when preset range is still fresh', () => {
		const result = normalizeReportParams( {
			from: FRESH_FROM,
			to: FRESH_TO,
			preset: 'last-30-days',
			interval: 'day',
		} );

		expect( result.from ).toBe( FRESH_FROM );
		expect( result.to ).toBe( FRESH_TO );
		expect( result.preset ).toBe( 'last-30-days' );

		// No comparison in search → no comparison in output
		// (search.from is present → !search.from is false
		// → default comparison branch is skipped).
		expect( result.comp ).toBeUndefined();
	} );

	/*
	 * Scenario 3 – Next-day reload with stale dates
	 * The URL has yesterday's dates but the same preset.
	 * computeDateRangeFromPreset returns fresh dates → redirect.
	 */
	it( 'recalculates dates when preset range is stale', () => {
		const result = normalizeReportParams( {
			from: STALE_FROM,
			to: STALE_TO,
			preset: 'last-30-days',
			interval: 'day',
		} );

		// Should use the fresh range from the preset, not stale URL dates.
		expect( result.from ).toBe( FRESH_FROM );
		expect( result.to ).toBe( FRESH_TO );
		expect( result.preset ).toBe( 'last-30-days' );
		expect( mockComputeRange ).toHaveBeenCalledWith( 'last-30-days' );
	} );

	/*
	 * Scenario 4 – Custom range (no preset)
	 * The user picked explicit from/to dates without a preset.
	 * The dates should be used as-is, no recalculation.
	 */
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
		// computeDateRangeFromPreset should NOT be called.
		expect( mockComputeRange ).not.toHaveBeenCalled();
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
		expect( mockComputeRange ).not.toHaveBeenCalled();
	} );

	/*
	 * Scenario 5 – Preset with stale comparison enabled
	 * The URL has a stale preset and comparison params.
	 * Primary range is recalculated; comparison is preserved from URL.
	 */
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

		// Primary recalculated from preset.
		expect( result.from ).toBe( FRESH_FROM );
		expect( result.to ).toBe( FRESH_TO );

		// Comparison passed through from search.
		expect( result.comp ).toBe( '1' );
		expect( result.compare_from ).toBe( compFrom );
		expect( result.compare_to ).toBe( compTo );
		expect( result.compare_preset ).toBe( 'previous-period' );
	} );

	/*
	 * Scenario 6 – Preset without comparison
	 * The URL has a stale preset but comparison is disabled.
	 * Primary is recalculated; comparison params are absent.
	 */
	it( 'recalculates primary with no comparison when comp is absent', () => {
		const result = normalizeReportParams( {
			from: STALE_FROM,
			to: STALE_TO,
			preset: 'last-30-days',
			interval: 'day',
		} );

		// Primary recalculated.
		expect( result.from ).toBe( FRESH_FROM );
		expect( result.to ).toBe( FRESH_TO );

		// No comparison in search, and search.from is present
		// → default comparison is NOT applied.
		expect( result.comp ).toBeUndefined();
		expect( result.compare_from ).toBeUndefined();
		expect( result.compare_to ).toBeUndefined();
	} );

	/*
	 * Edge case – Invalid preset in URL is ignored.
	 */
	it( 'ignores invalid preset and uses URL dates', () => {
		const customFrom = '2026-02-01T00:00:00.000-05:00';
		const customTo = '2026-02-15T23:59:59.999-05:00';

		const result = normalizeReportParams( {
			from: customFrom,
			to: customTo,
			// @ts-expect-error – testing with invalid preset on purpose
			preset: 'not-a-real-preset',
		} );

		expect( result.from ).toBe( customFrom );
		expect( result.to ).toBe( customTo );
		expect( result.preset ).toBeUndefined();
		expect( mockComputeRange ).not.toHaveBeenCalled();
	} );

	/*
	 * Edge case – computeDateRangeFromPreset returns undefined
	 * (e.g., an unimplemented preset). Falls back to search dates.
	 */
	it( 'falls back to URL dates when preset has no range implementation', () => {
		mockComputeRange.mockReturnValue( undefined );

		const result = normalizeReportParams( {
			from: STALE_FROM,
			to: STALE_TO,
			preset: 'last-30-days',
		} );

		// Preset should be cleared.
		expect( result.preset ).toBeUndefined();
		// Falls back to search dates.
		expect( result.from ).toBe( STALE_FROM );
		expect( result.to ).toBe( STALE_TO );
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

	it( 'omits post_id when search has none', () => {
		const result = normalizeReportParams( {
			from: FRESH_FROM,
			to: FRESH_TO,
		} );

		expect( result.post_id ).toBeUndefined();
	} );

	it.each( [ 'foo', '0', '-5', '12.5' ] )( 'drops an invalid post_id (%s)', invalid => {
		const result = normalizeReportParams( {
			from: FRESH_FROM,
			to: FRESH_TO,
			post_id: invalid,
		} );

		expect( result.post_id ).toBeUndefined();
	} );
} );
