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
	resolveIntervalForRange: jest.fn(),
} ) );
/**
 * Internal dependencies
 */
import { getDefaultQueryParams } from '../../defaults';
import { resolveIntervalForRange } from '../interval';
import { computeDateRangeFromPreset } from '../preset-date-range';
import { normalizeReportParams } from '../search';
import type { ReportParams } from '../search';

const mockGetDefaults = getDefaultQueryParams as jest.MockedFunction<
	typeof getDefaultQueryParams
>;
const mockComputeRange = computeDateRangeFromPreset as jest.MockedFunction<
	typeof computeDateRangeFromPreset
>;
const mockResolveInterval = resolveIntervalForRange as jest.MockedFunction<
	typeof resolveIntervalForRange
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
	mockResolveInterval.mockReturnValue( 'day' );
} );

describe( 'normalizeReportParams', () => {
	it( 'applies defaults with preset and comparison on fresh load', () => {
		const result = normalizeReportParams();

		expect( result.preset ).toBe( 'last-30-days' );
		expect( mockComputeRange ).toHaveBeenCalledWith( 'last-30-days' );

		expect( result.from ).toBe( FRESH_FROM );
		expect( result.to ).toBe( FRESH_TO );

		// `search` is undefined → `!search?.from` → the default-comparison branch.
		expect( result.comp ).toBe( '1' );
		expect( result.compare_from ).toBe( DEFAULTS_WITH_COMPARISON.compare_from );
		expect( result.compare_to ).toBe( DEFAULTS_WITH_COMPARISON.compare_to );
	} );

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
		expect( mockResolveInterval ).toHaveBeenCalledWith(
			'last-30-days',
			FRESH_FROM,
			FRESH_TO,
			'day'
		);
		expect( result.interval ).toBe( 'day' );

		// `search.from` is present, so the default-comparison branch is skipped.
		expect( result.comp ).toBeUndefined();
	} );

	it( 'passes the candidate interval through resolveIntervalForRange', () => {
		mockResolveInterval.mockReturnValue( 'week' );

		const result = normalizeReportParams( {
			from: FRESH_FROM,
			to: FRESH_TO,
			preset: 'last-30-days',
			interval: 'week',
		} );

		expect( mockResolveInterval ).toHaveBeenCalledWith(
			'last-30-days',
			FRESH_FROM,
			FRESH_TO,
			'week'
		);
		expect( result.interval ).toBe( 'week' );
	} );

	it( 'recalculates dates when preset range is stale', () => {
		const result = normalizeReportParams( {
			from: STALE_FROM,
			to: STALE_TO,
			preset: 'last-30-days',
			interval: 'day',
		} );

		expect( result.from ).toBe( FRESH_FROM );
		expect( result.to ).toBe( FRESH_TO );
		expect( result.preset ).toBe( 'last-30-days' );
		expect( mockComputeRange ).toHaveBeenCalledWith( 'last-30-days' );
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

		// `search.from` is present, so the default comparison is not applied.
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

		expect( result.preset ).toBeUndefined();
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
		mockComputeRange.mockReturnValueOnce( {
			from: '2026-01-01T00:00:00.000-05:00',
			to: FRESH_TO,
		} );

		const result = normalizeReportParams( {
			from: '2026-01-01T00:00:00.000-05:00',
			to: STALE_TO,
			preset: 'year-2026',
			interval: 'month',
		} );

		expect( result.preset ).toBe( 'year-2026' );
		expect( mockComputeRange ).toHaveBeenCalledWith( 'year-2026' );
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
		expect( mockComputeRange ).toHaveBeenCalledWith( 'all-time' );
		expect( result.from ).toBe( '2023-01-01T00:00:00.000-05:00' );
		expect( result.to ).toBe( FRESH_TO );
	} );

	it( 'rebuilds a year preset that arrives without its range', () => {
		mockComputeRange.mockReturnValueOnce( {
			from: '2025-01-01T00:00:00.000-05:00',
			to: '2025-12-31T23:59:59.999-05:00',
		} );

		const result = normalizeReportParams( { preset: 'year-2025' } );

		expect( result.preset ).toBe( 'year-2025' );
		expect( result.from ).toBe( '2025-01-01T00:00:00.000-05:00' );
		expect( result.to ).toBe( '2025-12-31T23:59:59.999-05:00' );
	} );

	it( 'drops an all-time preset that arrives without its site-specific range', () => {
		const result = normalizeReportParams( { preset: 'all-time' } );

		expect( result.preset ).toBe( 'last-30-days' );
		expect( result.from ).toBe( FRESH_FROM );
		expect( mockComputeRange ).toHaveBeenCalledWith( 'last-30-days' );
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
