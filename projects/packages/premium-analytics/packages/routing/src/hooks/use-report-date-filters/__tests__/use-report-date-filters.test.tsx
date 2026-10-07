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
import { TZDate } from '@date-fns/tz';
import {
	PeriodChangeSignalProvider,
	useRaisePeriodChange,
	useSettlePeriodChange,
} from '@jetpack-premium-analytics/data';
import { act, renderHook } from '@testing-library/react';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { useReportDateFilters } from '../use-report-date-filters';
import type { ReactNode } from 'react';

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
					from: new TZDate( '2026-07-24T00:00:00.000Z', 'UTC' ),
					to: new TZDate( '2026-07-30T23:59:59.999Z', 'UTC' ),
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
					from: new TZDate( '2026-07-24T00:00:00.000Z', 'UTC' ),
					to: new TZDate( '2026-07-30T23:59:59.999Z', 'UTC' ),
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
					from: new TZDate( '2026-06-01T00:00:00.000Z', 'UTC' ),
					to: new TZDate( '2026-06-30T23:59:59.999Z', 'UTC' ),
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
					from: new TZDate( '2026-07-10T00:00:00.000Z', 'UTC' ),
					to: new TZDate( '2026-07-30T23:59:59.999Z', 'UTC' ),
				},
				'custom'
			)
		);
		act( () =>
			result.current.onComparisonChange(
				{
					from: new TZDate( '2026-06-01T00:00:00.000Z', 'UTC' ),
					to: new TZDate( '2026-06-30T23:59:59.999Z', 'UTC' ),
				},
				'previous-period'
			)
		);
		act( () => result.current.onComparisonChange( undefined, undefined ) );
		act( () =>
			result.current.onChange(
				{
					from: new TZDate( '2026-07-01T00:00:00.000Z', 'UTC' ),
					to: new TZDate( '2026-07-30T23:59:59.999Z', 'UTC' ),
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
	} );

	it( 'pushes no history entry for a re-pick of the shown interval', () => {
		const { result } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000+00:00',
			to: '2026-07-30T23:59:59.999+00:00',
			preset: 'last-30-days',
			interval: 'day',
		} );

		act( () => result.current.onIntervalChange( 'day' ) );

		expect( mockNavigate ).not.toHaveBeenCalled();
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
					from: new TZDate( '2026-07-28T00:00:00.000Z', 'UTC' ),
					to: new TZDate( '2026-07-30T23:59:59.999Z', 'UTC' ),
				},
				'custom'
			);
		} );

		expect( mockNavigate ).not.toHaveBeenCalled();
		expect( result.current.intervalOptions ).toEqual( [ 'day', 'hour' ] );
		expect( result.current.interval ).toBe( 'day' );
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
					from: new TZDate( '2026-07-24T00:00:00.000Z', 'UTC' ),
					to: new TZDate( '2026-07-30T23:59:59.999Z', 'UTC' ),
				},
				'last-7-days'
			);
		} );
		act( () => {
			result.current.onComparisonChange(
				{
					from: new TZDate( '2026-06-01T00:00:00.000Z', 'UTC' ),
					to: new TZDate( '2026-06-30T23:59:59.999Z', 'UTC' ),
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
					from: new TZDate( '2026-07-24T00:00:00.000Z', 'UTC' ),
					to: new TZDate( '2026-07-30T23:59:59.999Z', 'UTC' ),
				},
				'last-7-days'
			)
		);
		rerender();

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		expect( mockNavigate.mock.calls[ 0 ][ 0 ].replace ).toBe( true );
		expect( result.current.appliedPresetId ).toBe( 'last-7-days' );
	} );

	it( 'resets the interval to the new preset default when the user picks a different preset', () => {
		const { result, rerender } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000+00:00',
			to: '2026-07-30T23:59:59.999+00:00',
			preset: 'last-30-days',
			interval: 'week',
		} );

		act( () =>
			result.current.onChange(
				{
					from: new TZDate( '2026-06-01T00:00:00.000Z', 'UTC' ),
					to: new TZDate( '2026-06-30T23:59:59.999Z', 'UTC' ),
				},
				'last-month'
			)
		);
		act( () => result.current.onApply() );
		rerender();

		expect( mockSearch ).toMatchObject( { preset: 'last-month', interval: 'day' } );
	} );

	it( 'keeps the chosen interval when the user edits the range by hand', () => {
		const { result, rerender } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000+00:00',
			to: '2026-07-30T23:59:59.999+00:00',
			preset: 'last-30-days',
			interval: 'week',
		} );

		act( () =>
			result.current.onChange(
				{
					from: new TZDate( '2026-06-01T00:00:00.000Z', 'UTC' ),
					to: new TZDate( '2026-07-10T23:59:59.999Z', 'UTC' ),
				},
				'custom'
			)
		);
		act( () => result.current.onApply() );
		rerender();

		expect( mockSearch ).toMatchObject( { preset: 'custom', interval: 'week' } );
	} );

	it( 'keeps the chosen interval when a reconciliation swaps the preset', () => {
		const { result } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000+00:00',
			to: '2026-07-30T23:59:59.999+00:00',
			preset: 'last-30-days',
			interval: 'week',
		} );

		act( () =>
			result.current.replaceRange(
				{
					from: new TZDate( '2026-06-01T00:00:00.000Z', 'UTC' ),
					to: new TZDate( '2026-06-30T23:59:59.999Z', 'UTC' ),
				},
				'last-month'
			)
		);

		expect( mockSearch ).toMatchObject( { preset: 'last-month', interval: 'week' } );
	} );

	it( 'stores a computed range exactly as given when asked', () => {
		const { result } = renderDateFilters( { preset: 'last-30-days' } );
		const range = {
			from: new TZDate( '2026-09-01T00:00:00.000Z', 'UTC' ),
			to: new TZDate( '2026-09-14T15:30:00.000Z', 'UTC' ),
		};

		act( () => result.current.onChange( range, 'custom', { exactRange: true } ) );
		act( () => result.current.onApply() );

		expect( mockSearch.to ).toBe( '2026-09-14T15:30:00.000+00:00' );
	} );

	// A card raises the signal with the range it computed, so the range it then
	// commits must round-trip to the same instants for the two to match.
	it( 'lands a raised period change when a card commits its range exactly', () => {
		const wrapper = ( { children }: { children: ReactNode } ) => (
			<PeriodChangeSignalProvider>{ children }</PeriodChangeSignalProvider>
		);
		mockSearch = { preset: 'last-30-days' };
		const { result, rerender } = renderHook(
			() => {
				const filters = useReportDateFilters( '/' );
				return {
					filters,
					raise: useRaisePeriodChange(),
					control: useSettlePeriodChange( 'post:1', filters.appliedRange, true ),
				};
			},
			{ wrapper }
		);
		const currentMonth = {
			from: new TZDate( '2026-09-01T00:00:00.000Z', 'UTC' ),
			to: new TZDate( '2026-09-14T15:30:00.000Z', 'UTC' ),
		};

		act( () => {
			result.current.raise( 'post:1', currentMonth );
			result.current.filters.onChange( currentMonth, 'custom', { exactRange: true } );
			result.current.filters.onApply();
		} );
		rerender();

		expect( result.current.control ).toEqual( expect.any( Number ) );
	} );

	it( 'binds to the route it is given', () => {
		renderDateFilters();

		expect( mockUseSearch ).toHaveBeenLastCalledWith( { from: '/' } );
	} );
} );
