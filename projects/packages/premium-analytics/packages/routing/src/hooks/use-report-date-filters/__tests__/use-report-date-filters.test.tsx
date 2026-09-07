/**
 * The router boundary: `useSearch` reads the in-memory search state and
 * `useNavigate` applies the committed patch to it, so commits round-trip the
 * way the real router makes them.
 */
const mockNavigate = jest.fn();
const mockUseSearch = jest.fn();
let mockSearch: Record< string, unknown > = {};

jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => mockNavigate,
	useSearch: ( options: unknown ) => {
		mockUseSearch( options );
		return mockSearch;
	},
} ) );

/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { useReportDateFilters } from '../use-report-date-filters';

// The hook reads the site zone from the WordPress date settings, so pin it to
// UTC and keep day-bound math independent of the machine timezone.
setSettings( {
	...getSettings(),
	timezone: { string: 'UTC', offset: 0, offsetFormatted: '0', abbr: 'UTC' },
} );

function renderDateFilters( search: Record< string, unknown > = {} ) {
	mockSearch = search;
	return renderHook( () => useReportDateFilters( '/' ) );
}

describe( 'useReportDateFilters', () => {
	beforeEach( () => {
		mockSearch = {};
		mockNavigate.mockReset();
		mockNavigate.mockImplementation(
			( {
				search,
			}: {
				search: ( prev: Record< string, unknown > ) => Record< string, unknown >;
			} ) => {
				// The URL drops `undefined` on the way out, so a patch that only
				// clears absent params must round-trip back unchanged — keeping the
				// keys would realign the draft where the router would not.
				mockSearch = Object.fromEntries(
					Object.entries( search( mockSearch ) ).filter( ( [ , value ] ) => value !== undefined )
				);
			}
		);
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'derives the applied state from the URL search params', () => {
		const { result } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000+00:00',
			to: '2026-07-30T23:59:59.999+00:00',
			preset: 'last-30-days',
			interval: 'week',
		} );

		expect( result.current.appliedPresetId ).toBe( 'last-30-days' );
		expect( result.current.appliedRange.from?.getTime() ).toBe(
			Date.parse( '2026-07-01T00:00:00.000Z' )
		);
		expect( result.current.appliedRange.to?.getTime() ).toBe(
			Date.parse( '2026-07-30T23:59:59.999Z' )
		);
		expect( result.current.appliedInterval ).toBe( 'week' );
		expect( result.current.intervalOptions ).toEqual( [ 'day', 'week' ] );
		expect( result.current.canApply ).toBe( false );
	} );

	it( 'drops an unparseable URL date instead of an invalid picker Date', () => {
		const { result } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000 02:00',
			to: '2026-07-30T23:59:59.999+00:00',
		} );

		expect( result.current.range.from ).toBeUndefined();
		expect( result.current.range.to?.getTime() ).toBe( Date.parse( '2026-07-30T23:59:59.999Z' ) );
	} );

	it( 'stages a primary edit and only commits it on Apply', () => {
		const { result, rerender } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000+00:00',
			to: '2026-07-30T23:59:59.999+00:00',
			preset: 'last-30-days',
			interval: 'day',
		} );

		act( () => {
			result.current.onChange(
				{
					from: new Date( '2026-07-24T00:00:00.000Z' ),
					to: new Date( '2026-07-30T23:59:59.999Z' ),
				},
				'last-7-days'
			);
		} );

		expect( mockNavigate ).not.toHaveBeenCalled();
		expect( result.current.presetId ).toBe( 'last-7-days' );
		expect( result.current.appliedPresetId ).toBe( 'last-30-days' );
		expect( result.current.canApply ).toBe( true );

		act( () => result.current.onApply() );
		rerender();

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		expect( mockSearch ).toMatchObject( {
			from: '2026-07-24T00:00:00.000+00:00',
			to: '2026-07-30T23:59:59.999+00:00',
			preset: 'last-7-days',
			interval: 'day',
		} );
		expect( result.current.appliedPresetId ).toBe( 'last-7-days' );
		expect( result.current.canApply ).toBe( false );
	} );

	it( 'reverts a staged edit on Cancel', () => {
		const { result } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000+00:00',
			to: '2026-07-30T23:59:59.999+00:00',
			preset: 'last-30-days',
		} );

		act( () => {
			result.current.onChange(
				{
					from: new Date( '2026-07-24T00:00:00.000Z' ),
					to: new Date( '2026-07-30T23:59:59.999Z' ),
				},
				'last-7-days'
			);
		} );
		act( () => result.current.onCancel() );

		expect( mockNavigate ).not.toHaveBeenCalled();
		expect( result.current.presetId ).toBe( 'last-30-days' );
		expect( result.current.canApply ).toBe( false );
	} );

	it( 'commits a comparison change on its own', () => {
		const { result, rerender } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000+00:00',
			to: '2026-07-30T23:59:59.999+00:00',
			preset: 'last-30-days',
			interval: 'day',
		} );

		act( () => {
			result.current.onComparisonChange(
				{
					from: new Date( '2026-06-01T00:00:00.000Z' ),
					to: new Date( '2026-06-30T23:59:59.999Z' ),
				},
				'previous-period'
			);
		} );
		rerender();

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		expect( mockSearch ).toMatchObject( {
			comp: '1',
			compare_preset: 'previous-period',
			compare_from: '2026-06-01T00:00:00.000+00:00',
			compare_to: '2026-06-30T23:59:59.999+00:00',
		} );
		expect( result.current.comparisonPresetId ).toBe( 'previous-period' );
		expect( result.current.appliedComparisonPresetId ).toBe( 'previous-period' );
		expect( result.current.appliedComparisonRange?.from?.toISOString() ).toBe(
			'2026-06-01T00:00:00.000Z'
		);
		expect( result.current.appliedComparisonRange?.to?.toISOString() ).toBe(
			'2026-06-30T23:59:59.999Z'
		);
	} );

	it( 'offers the comparison preset a deep link carries with its window', () => {
		const { result } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000+00:00',
			to: '2026-07-30T23:59:59.999+00:00',
			preset: 'last-30-days',
			comp: '1',
			compare_preset: 'previous-period',
			compare_from: '2026-06-01T00:00:00.000+00:00',
			compare_to: '2026-06-30T23:59:59.999+00:00',
		} );

		expect( result.current.comparisonPresetId ).toBe( 'previous-period' );
	} );

	// The widgets read the same condition, so a preset with no window behind it
	// would paint the control active over numbers nothing is compared to.
	it( 'offers no comparison preset where the window is missing', () => {
		const { result } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000+00:00',
			to: '2026-07-30T23:59:59.999+00:00',
			preset: 'last-30-days',
			compare_preset: 'previous-period',
		} );

		expect( result.current.comparisonPresetId ).toBeUndefined();
	} );

	it( 'carries no comparison window until one is applied', () => {
		const { result } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000+00:00',
			to: '2026-07-30T23:59:59.999+00:00',
			preset: 'last-30-days',
		} );

		expect( result.current.appliedComparisonRange ).toBeUndefined();
	} );

	// Re-picking "No comparison" with none applied clears params the URL does
	// not carry: the commit would write the same URL and leave Apply on for
	// good, since only a changed committed value empties the buffer.
	it( 'stages nothing when the comparison is cleared with none applied', () => {
		const { result, rerender } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000+00:00',
			to: '2026-07-30T23:59:59.999+00:00',
			preset: 'last-30-days',
			interval: 'day',
		} );

		act( () => result.current.onComparisonChange( undefined, undefined ) );
		rerender();

		expect( mockNavigate ).not.toHaveBeenCalled();
		expect( result.current.canApply ).toBe( false );
	} );

	// The same no-op reached the long way: a comparison picked and dropped again
	// inside one draft leaves the params back where the URL already has them.
	it( 'stops reading as dirty when a staged comparison is dropped again', () => {
		const { result, rerender } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000+00:00',
			to: '2026-07-30T23:59:59.999+00:00',
			preset: 'custom',
			interval: 'day',
		} );

		act( () =>
			result.current.onChange(
				{
					from: new Date( '2026-07-10T00:00:00.000Z' ),
					to: new Date( '2026-07-30T23:59:59.999Z' ),
				},
				'custom'
			)
		);
		act( () =>
			result.current.onComparisonChange(
				{
					from: new Date( '2026-06-01T00:00:00.000Z' ),
					to: new Date( '2026-06-30T23:59:59.999Z' ),
				},
				'previous-period'
			)
		);
		act( () => result.current.onComparisonChange( undefined, undefined ) );
		act( () =>
			result.current.onChange(
				{
					from: new Date( '2026-07-01T00:00:00.000Z' ),
					to: new Date( '2026-07-30T23:59:59.999Z' ),
				},
				'custom'
			)
		);
		rerender();

		expect( result.current.canApply ).toBe( false );
	} );

	it( 'commits an interval change on its own', () => {
		const { result, rerender } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000+00:00',
			to: '2026-07-30T23:59:59.999+00:00',
			preset: 'last-30-days',
			interval: 'day',
		} );

		act( () => result.current.onIntervalChange( 'week' ) );
		rerender();

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		expect( mockSearch ).toMatchObject( { interval: 'week' } );
		expect( result.current.appliedInterval ).toBe( 'week' );
	} );

	/*
	 * Listing the applied range's buckets while a shorter range is drafted lets
	 * the menu offer one the draft cannot hold; Apply then resolves the choice
	 * away and the tick springs back. Same rule as the widget-owned control.
	 */
	it( 'lists the buckets the drafted range allows, not the applied one', () => {
		const { result } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000+00:00',
			to: '2026-07-30T23:59:59.999+00:00',
			preset: 'last-30-days',
			interval: 'day',
		} );

		expect( result.current.intervalOptions ).toEqual( [ 'day', 'week' ] );

		act( () => {
			result.current.onChange(
				{
					from: new Date( '2026-07-28T00:00:00.000Z' ),
					to: new Date( '2026-07-30T23:59:59.999Z' ),
				},
				'custom'
			);
		} );

		expect( mockNavigate ).not.toHaveBeenCalled();
		expect( result.current.intervalOptions ).toEqual( [ 'day', 'hour' ] );
		expect( result.current.interval ).toBe( 'day' );

		// The applied window is still what the widgets drew, bucket included.
		expect( result.current.appliedInterval ).toBe( 'day' );
	} );

	it( 'holds a comparison change while a primary edit is staged', () => {
		const { result } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000+00:00',
			to: '2026-07-30T23:59:59.999+00:00',
			preset: 'last-30-days',
			interval: 'day',
		} );

		act( () => {
			result.current.onChange(
				{
					from: new Date( '2026-07-24T00:00:00.000Z' ),
					to: new Date( '2026-07-30T23:59:59.999Z' ),
				},
				'last-7-days'
			);
		} );
		act( () => {
			result.current.onComparisonChange(
				{
					from: new Date( '2026-06-01T00:00:00.000Z' ),
					to: new Date( '2026-06-30T23:59:59.999Z' ),
				},
				'previous-period'
			);
		} );

		expect( mockNavigate ).not.toHaveBeenCalled();
		expect( result.current.appliedComparisonRange ).toBeUndefined();

		act( () => result.current.onApply() );

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		expect( mockSearch ).toMatchObject( {
			preset: 'last-7-days',
			comp: '1',
			compare_preset: 'previous-period',
		} );
	} );

	/*
	 * The step commits the exact stepped window: rounding its `to` up to the
	 * end of the day would stretch a rolling window on every step.
	 */
	it( 'steps the applied window by its own length and commits it as custom', () => {
		const { result, rerender } = renderDateFilters( {
			from: '2026-07-09T14:30:00.000+00:00',
			to: '2026-07-10T14:30:00.000+00:00',
			preset: 'last-24-hours',
			interval: 'hour',
		} );

		act( () => result.current.onStep( 'previous' ) );
		rerender();

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		expect( mockSearch ).toMatchObject( {
			from: '2026-07-08T14:30:00.000+00:00',
			to: '2026-07-09T14:30:00.000+00:00',
			preset: 'custom',
			interval: 'hour',
		} );
		expect( result.current.appliedPresetId ).toBe( 'custom' );
	} );

	it( 'ignores a step without a measurable window', () => {
		const { result } = renderDateFilters();

		act( () => result.current.onStep( 'previous' ) );

		expect( mockNavigate ).not.toHaveBeenCalled();
	} );

	it( 'replaces the current entry when the page reconciles the range', () => {
		const { result, rerender } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000+00:00',
			to: '2026-07-30T23:59:59.999+00:00',
			preset: 'last-30-days',
			interval: 'day',
		} );

		act( () =>
			result.current.replaceRange(
				{
					from: new Date( '2026-07-24T00:00:00.000Z' ),
					to: new Date( '2026-07-30T23:59:59.999Z' ),
				},
				'last-7-days'
			)
		);
		rerender();

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		expect( mockNavigate.mock.calls[ 0 ][ 0 ].replace ).toBe( true );
		expect( result.current.appliedPresetId ).toBe( 'last-7-days' );
	} );

	it( 'binds to the route it is given', () => {
		renderDateFilters();

		expect( mockUseSearch ).toHaveBeenLastCalledWith( { from: '/' } );
	} );

	// A widget renders on any page that hosts it, so without a route the hook
	// reads whichever one is matched, as `WidgetRoot` resolves report params.
	it( 'binds to whichever route is matched when given none', () => {
		renderHook( () => useReportDateFilters() );

		expect( mockUseSearch ).toHaveBeenLastCalledWith( { strict: false } );
	} );

	/*
	 * Each case asserts the interval too, because that is the whole point of a
	 * drill-down: a bucket's own length never allows the interval that drew it,
	 * so applying the bucket as the window drops the reading one level finer.
	 */
	describe( 'drillDown', () => {
		beforeAll( () => {
			// Every bucket under test is closed, so only the clamp cases care.
			jest.useFakeTimers().setSystemTime( Date.parse( '2027-01-01T00:00:00.000Z' ) );
		} );

		afterAll( () => jest.useRealTimers() );

		it( 'opens a day bucket into hours', () => {
			const { result, rerender } = renderDateFilters( {
				from: '2026-07-01T00:00:00.000+00:00',
				to: '2026-07-30T23:59:59.999+00:00',
				preset: 'last-30-days',
				interval: 'day',
			} );

			act( () => result.current.drillDown( new Date( '2026-07-21T13:45:00.000Z' ) ) );
			rerender();

			expect( mockSearch ).toMatchObject( {
				from: '2026-07-21T00:00:00.000+00:00',
				to: '2026-07-21T23:59:59.999+00:00',
				preset: 'custom',
				interval: 'hour',
			} );
		} );

		it( 'opens a week bucket into days', () => {
			const { result, rerender } = renderDateFilters( {
				from: '2026-05-01T00:00:00.000+00:00',
				to: '2026-07-30T23:59:59.999+00:00',
				preset: 'custom',
				interval: 'week',
			} );

			act( () => result.current.drillDown( new Date( '2026-07-22T00:00:00.000Z' ) ) );
			rerender();

			expect( mockSearch ).toMatchObject( {
				from: '2026-07-20T00:00:00.000+00:00',
				to: '2026-07-26T23:59:59.999+00:00',
				interval: 'day',
			} );
		} );

		it( 'opens a month bucket into days', () => {
			const { result, rerender } = renderDateFilters( {
				from: '2025-08-01T00:00:00.000+00:00',
				to: '2026-07-31T23:59:59.999+00:00',
				preset: 'custom',
				interval: 'month',
			} );

			act( () => result.current.drillDown( new Date( '2026-02-14T00:00:00.000Z' ) ) );
			rerender();

			expect( mockSearch ).toMatchObject( {
				from: '2026-02-01T00:00:00.000+00:00',
				to: '2026-02-28T23:59:59.999+00:00',
				interval: 'day',
			} );
		} );

		it( 'opens a year bucket into months', () => {
			const { result, rerender } = renderDateFilters( {
				from: '2022-01-01T00:00:00.000+00:00',
				to: '2026-12-31T23:59:59.999+00:00',
				preset: 'custom',
				interval: 'year',
			} );

			act( () => result.current.drillDown( new Date( '2024-05-09T00:00:00.000Z' ) ) );
			rerender();

			expect( mockSearch ).toMatchObject( {
				from: '2024-01-01T00:00:00.000+00:00',
				to: '2024-12-31T23:59:59.999+00:00',
				interval: 'month',
			} );
		} );

		/*
		 * A chart that cannot draw the applied interval clamps it — the traffic
		 * chart draws a yearly page in months — and names the size it drew, so
		 * the click opens the bar it hit rather than the coarser bucket around it.
		 */
		it( 'opens the bucket in the interval the chart drew, not the applied one', () => {
			const { result, rerender } = renderDateFilters( {
				from: '2023-08-01T00:00:00.000+00:00',
				to: '2026-07-31T23:59:59.999+00:00',
				preset: 'custom',
				interval: 'year',
			} );

			act( () => result.current.drillDown( new Date( '2026-02-14T00:00:00.000Z' ), 'month' ) );
			rerender();

			expect( mockSearch ).toMatchObject( {
				from: '2026-02-01T00:00:00.000+00:00',
				to: '2026-02-28T23:59:59.999+00:00',
				interval: 'day',
			} );
		} );

		it( 'pushes a history entry, so Back is the way out of a drill-down', () => {
			const { result } = renderDateFilters( {
				from: '2026-07-01T00:00:00.000+00:00',
				to: '2026-07-30T23:59:59.999+00:00',
				preset: 'last-30-days',
				interval: 'day',
			} );

			act( () => result.current.drillDown( new Date( '2026-07-21T13:45:00.000Z' ) ) );

			expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
			expect( mockNavigate.mock.calls[ 0 ][ 0 ].replace ).toBeFalsy();
		} );

		it( 'ignores a click on an hourly bucket, the finest reading there is', () => {
			const { result } = renderDateFilters( {
				from: '2026-07-21T00:00:00.000+00:00',
				to: '2026-07-21T23:59:59.999+00:00',
				preset: 'custom',
				interval: 'hour',
			} );

			act( () => result.current.drillDown( new Date( '2026-07-21T13:00:00.000Z' ) ) );

			expect( mockNavigate ).not.toHaveBeenCalled();
		} );

		/*
		 * Clamping a bucket that shares no ground with the applied window would
		 * invert the range, so the click is refused rather than applied backwards.
		 */
		it( 'ignores a bucket lying outside the applied window', () => {
			const { result } = renderDateFilters( {
				from: '2026-07-01T00:00:00.000+00:00',
				to: '2026-07-30T23:59:59.999+00:00',
				preset: 'last-30-days',
				interval: 'day',
			} );

			act( () => result.current.drillDown( new Date( '2026-09-05T00:00:00.000Z' ) ) );

			expect( mockNavigate ).not.toHaveBeenCalled();
		} );

		it( 'keeps a partial edge bucket inside the applied window', () => {
			// The window opens mid-week, so the first bar covers Jul 22-26 only.
			const { result, rerender } = renderDateFilters( {
				from: '2026-07-22T00:00:00.000+00:00',
				to: '2026-10-20T23:59:59.999+00:00',
				preset: 'custom',
				interval: 'week',
			} );

			act( () => result.current.drillDown( new Date( '2026-07-23T00:00:00.000Z' ) ) );
			rerender();

			expect( mockSearch ).toMatchObject( {
				from: '2026-07-22T00:00:00.000+00:00',
				to: '2026-07-26T23:59:59.999+00:00',
			} );
		} );

		it( 'leaves the calendar on the drilled window when the picker closes after the drill', () => {
			const { result, rerender } = renderDateFilters( {
				from: '2026-07-01T00:00:00.000+00:00',
				to: '2026-07-30T23:59:59.999+00:00',
				preset: 'last-30-days',
				interval: 'day',
			} );

			const cancelBeforeDrill = result.current.onCancel;

			act( () => result.current.drillDown( new Date( '2026-07-21T13:45:00.000Z' ) ) );
			rerender();

			act( () => cancelBeforeDrill() );

			expect( result.current.range.from?.toISOString() ).toBe( '2026-07-21T00:00:00.000Z' );
			expect( result.current.range.to?.toISOString() ).toBe( '2026-07-21T23:59:59.999Z' );
			expect( result.current.presetId ).toBe( 'custom' );
		} );
	} );

	it( 'steps a to-date preset by whole months and compares it with the months before', () => {
		// `last-12-months` as read on 20 August 2026. Stepped by its day count
		// the window would start on 12 September and its comparison on the 24th.
		const { result, rerender } = renderDateFilters( {
			from: '2025-09-01T00:00:00.000+00:00',
			to: '2026-08-20T23:59:59.999+00:00',
			preset: 'last-12-months',
			interval: 'month',
			comp: '1',
			compare_preset: 'previous-period',
		} );

		act( () => result.current.onStep( 'previous' ) );
		rerender();

		expect( mockSearch ).toMatchObject( {
			from: '2024-09-01T00:00:00.000+00:00',
			to: '2025-08-31T23:59:59.999+00:00',
			preset: 'custom',
			interval: 'month',
			compare_from: '2023-09-01T00:00:00.000+00:00',
			compare_to: '2024-08-31T23:59:59.999+00:00',
		} );
	} );

	it( 'lands back on the to-date window when a step forward closes the running month', () => {
		// The window a step back out of `last-12-months` leaves. Stepping
		// forward again closes August, eleven days past the day it is read on:
		// days the report has no data for, and the forward arrow would then
		// disappear on a window nobody can leave.
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T12:00:00.000Z' ) );

		const { result, rerender } = renderDateFilters( {
			from: '2024-09-01T00:00:00.000+00:00',
			to: '2025-08-31T23:59:59.999+00:00',
			preset: 'custom',
			interval: 'month',
		} );

		act( () => result.current.onStep( 'next' ) );
		rerender();

		expect( mockSearch ).toMatchObject( {
			from: '2025-09-01T00:00:00.000+00:00',
			to: '2026-08-20T23:59:59.999+00:00',
			preset: 'custom',
		} );
	} );
} );
