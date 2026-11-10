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
	ReportScopeProvider,
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

const LOCKED_INTERVALS = [ 'week', 'month', 'year' ] as const;

function scopeWithLocks( { children }: { children: ReactNode } ) {
	return (
		<ReportScopeProvider dateLimits={ { lockedPresetIds: [], lockedIntervals: LOCKED_INTERVALS } }>
			{ children }
		</ReportScopeProvider>
	);
}

function renderDateFilters(
	search: Record< string, unknown > = {},
	wrapper?: typeof scopeWithLocks
) {
	mockSearch = search;
	return renderHook( () => useReportDateFilters( '/' ), { wrapper } );
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
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-07-30T12:00:00.000Z' ) );
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

	it( 'reads a preset as the window it names today, whatever dates the URL kept', () => {
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T12:00:00.000Z' ) );
		const { result } = renderDateFilters( {
			from: '2026-08-07T00:00:00.000+00:00',
			to: '2026-08-13T23:59:59.999+00:00',
			preset: 'last-7-days',
		} );

		const thisWeek = {
			from: Date.parse( '2026-08-14T00:00:00.000Z' ),
			to: Date.parse( '2026-08-20T23:59:59.999Z' ),
		};
		expect( result.current.appliedRange.from?.getTime() ).toBe( thisWeek.from );
		expect( result.current.appliedRange.to?.getTime() ).toBe( thisWeek.to );
		expect( result.current.range.from?.getTime() ).toBe( thisWeek.from );
		expect( result.current.range.to?.getTime() ).toBe( thisWeek.to );
	} );

	it.each( [
		[ 'a year preset', 'year-2026', '2026-01-01T00:00:00.000Z' ],
		[ 'all time, keeping the start the surface wrote', 'all-time', '2020-05-01T00:00:00.000Z' ],
	] )( 'reads %s through the end of today', ( _name, preset, from ) => {
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T12:00:00.000Z' ) );
		const { result } = renderDateFilters( {
			from: '2020-05-01T00:00:00.000+00:00',
			to: '2026-08-13T23:59:59.999+00:00',
			preset,
		} );

		expect( result.current.appliedRange.from?.getTime() ).toBe( Date.parse( from ) );
		expect( result.current.appliedRange.to?.getTime() ).toBe(
			Date.parse( '2026-08-20T23:59:59.999Z' )
		);
	} );

	it( 'reads a hand-picked range as the dates the URL carries', () => {
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T12:00:00.000Z' ) );
		const { result } = renderDateFilters( {
			from: '2026-08-07T00:00:00.000+00:00',
			to: '2026-08-13T23:59:59.999+00:00',
			preset: 'custom',
		} );

		const picked = {
			from: Date.parse( '2026-08-07T00:00:00.000Z' ),
			to: Date.parse( '2026-08-13T23:59:59.999Z' ),
		};
		expect( result.current.appliedRange.from?.getTime() ).toBe( picked.from );
		expect( result.current.appliedRange.to?.getTime() ).toBe( picked.to );
		expect( result.current.range.from?.getTime() ).toBe( picked.from );
		expect( result.current.range.to?.getTime() ).toBe( picked.to );
	} );

	it( 'measures a comparison preset from the window the primary names today', () => {
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T12:00:00.000Z' ) );
		const { result } = renderDateFilters( {
			from: '2026-08-07T00:00:00.000+00:00',
			to: '2026-08-13T23:59:59.999+00:00',
			preset: 'last-7-days',
			comp: '1',
			compare_preset: 'previous-period',
			compare_from: '2026-07-31T00:00:00.000+00:00',
			compare_to: '2026-08-06T23:59:59.999+00:00',
		} );

		expect( result.current.appliedComparisonPresetId ).toBe( 'previous-period' );
		expect( result.current.appliedComparisonRange?.from?.getTime() ).toBe(
			Date.parse( '2026-08-07T00:00:00.000Z' )
		);
		expect( result.current.appliedComparisonRange?.to?.getTime() ).toBe(
			Date.parse( '2026-08-13T23:59:59.999Z' )
		);
	} );

	it( 'names the comparison the window names today, not one the URL kept that it no longer offers', () => {
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-03-20T12:00:00.000Z' ) );
		const { result } = renderDateFilters( {
			from: '2026-03-01T00:00:00.000+00:00',
			to: '2026-03-07T23:59:59.999+00:00',
			preset: 'month-to-date',
			comp: '1',
			compare_preset: 'previous-week',
			compare_from: '2026-02-22T00:00:00.000+00:00',
			compare_to: '2026-02-28T23:59:59.999+00:00',
		} );

		expect( result.current.comparisonPresetId ).toBe( 'previous-period' );
		expect( result.current.appliedComparisonPresetId ).toBe( 'previous-period' );
		expect( result.current.appliedComparisonRange?.to?.getTime() ).toBe(
			Date.parse( '2026-02-28T23:59:59.999Z' )
		);
	} );

	it( 'shows a staged comparison edit before it is applied', () => {
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-03-20T12:00:00.000Z' ) );
		const { result } = renderDateFilters( {
			from: '2026-03-01T00:00:00.000+00:00',
			to: '2026-03-20T23:59:59.999+00:00',
			preset: 'month-to-date',
			interval: 'day',
		} );

		act( () => {
			result.current.onChange(
				{
					from: new TZDate( '2026-03-14T00:00:00.000Z', 'UTC' ),
					to: new TZDate( '2026-03-20T23:59:59.999Z', 'UTC' ),
				},
				'last-7-days'
			);
		} );
		act( () => {
			result.current.onComparisonChange(
				{
					from: new TZDate( '2026-03-07T00:00:00.000Z', 'UTC' ),
					to: new TZDate( '2026-03-13T23:59:59.999Z', 'UTC' ),
				},
				'previous-week'
			);
		} );

		expect( result.current.comparisonPresetId ).toBe( 'previous-week' );
		expect( result.current.appliedComparisonPresetId ).toBeUndefined();
	} );

	it.each( [
		[
			'a hand-picked window’s comparison',
			{ preset: 'custom', compare_preset: 'previous-period' },
			'previous-period',
		],
		[ 'comparison dates with no preset behind them', { preset: 'last-7-days' }, undefined ],
	] )( 'reads %s as the URL carries them', ( _name, extra, comparePreset ) => {
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T12:00:00.000Z' ) );
		const { result } = renderDateFilters( {
			from: '2026-08-07T00:00:00.000+00:00',
			to: '2026-08-13T23:59:59.999+00:00',
			comp: '1',
			compare_from: '2026-07-31T00:00:00.000+00:00',
			compare_to: '2026-08-06T23:59:59.999+00:00',
			...extra,
		} );

		expect( result.current.appliedComparisonPresetId ).toBe( comparePreset );
		expect( result.current.appliedComparisonRange?.from?.getTime() ).toBe(
			Date.parse( '2026-07-31T00:00:00.000Z' )
		);
		expect( result.current.appliedComparisonRange?.to?.getTime() ).toBe(
			Date.parse( '2026-08-06T23:59:59.999Z' )
		);
	} );

	it( 'drops an unparseable URL date instead of an invalid picker Date', () => {
		const { result } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000+99:00',
			to: '2026-07-30T23:59:59.999+00:00',
		} );

		expect( result.current.range.from ).toBeUndefined();
		expect( result.current.range.to?.getTime() ).toBe( Date.parse( '2026-07-30T23:59:59.999Z' ) );
	} );

	// An unencoded `+` in a pasted link reaches the router as a space.
	it( 'reads a URL date whose offset lost its plus to the querystring', () => {
		const { result } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000 02:00',
			to: '2026-07-30T23:59:59.999 02:00',
		} );

		expect( result.current.range.from?.getTime() ).toBe( Date.parse( '2026-06-30T22:00:00.000Z' ) );
		expect( result.current.range.to?.getTime() ).toBe( Date.parse( '2026-07-30T21:59:59.999Z' ) );
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
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-07-30T12:00:00.000Z' ) );
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

	it( 'lists and checks the buckets of the window a preset names today, not of the dates the URL kept', () => {
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T12:00:00.000Z' ) );
		// Bookmarked three days into the year with the day bucket those dates allowed, so the route
		// guard lets the URL through; the widgets draw the grown window by weeks.
		const { result } = renderDateFilters( {
			from: '2026-01-01T00:00:00.000+00:00',
			to: '2026-01-03T23:59:59.999+00:00',
			preset: 'year-to-date',
			interval: 'day',
		} );

		expect( result.current.intervalOptions ).toEqual( [ 'week', 'month' ] );
		expect( result.current.interval ).toBe( 'week' );
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

	/*
	 * The step commits the exact stepped window: rounding its `to` up to the
	 * end of the day would stretch a rolling window on every step. The step
	 * rides in the URL with it, so the next step moves the same way.
	 */
	it( 'steps the applied window by the preset and commits it as custom, with the step', () => {
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-07-10T14:30:00.000Z' ) );
		const { result, rerender } = renderDateFilters( {
			from: '2026-07-09T15:00:00.000+00:00',
			to: '2026-07-10T14:59:59.999+00:00',
			preset: 'last-24-hours',
			interval: 'hour',
		} );

		let stepped;
		act( () => {
			stepped = result.current.stepping.onStep( 'previous' );
		} );
		rerender();

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		expect( mockSearch ).toMatchObject( {
			from: '2026-07-08T15:00:00.000+00:00',
			to: '2026-07-09T14:59:59.999+00:00',
			preset: 'custom',
			step: 'last-24-hours',
			interval: 'hour',
		} );
		expect( result.current.appliedPresetId ).toBe( 'custom' );
		// What was committed, for the caller to track as applied.
		expect( stepped ).toEqual( {
			range: result.current.appliedRange,
			presetId: 'custom',
			interval: 'hour',
			step: 'last-24-hours',
		} );
	} );

	// Jun 1–30 is a whole month, which measured afresh would step as one. The
	// step is URL state, so a reload or a comparison commit in between keeps it.
	it.each( [ [ 'in place' ], [ 'after a reload' ], [ 'after turning Compare on' ] ] )(
		'undoes a step with the opposite one whatever shape it landed on, %s',
		between => {
			jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T12:00:00.000Z' ) );
			const july = { from: '2026-07-01T00:00:00.000+00:00', to: '2026-07-30T23:59:59.999+00:00' };
			let { result, rerender } = renderDateFilters( { ...july, preset: 'custom' } );

			act( () => result.current.stepping.onStep( 'previous' ) );
			rerender();
			expect( mockSearch ).toMatchObject( {
				from: '2026-06-01T00:00:00.000+00:00',
				to: '2026-06-30T23:59:59.999+00:00',
				step: 'P30D',
			} );

			if ( between === 'after a reload' ) {
				( { result, rerender } = renderDateFilters( mockSearch ) );
			}
			if ( between === 'after turning Compare on' ) {
				act( () =>
					result.current.onComparisonChange(
						{
							from: new TZDate( '2026-05-02T00:00:00.000+00:00', 'UTC' ),
							to: new TZDate( '2026-05-31T23:59:59.999+00:00', 'UTC' ),
						},
						'previous-period'
					)
				);
				rerender();
			}
			act( () => result.current.stepping.onStep( 'next' ) );
			rerender();
			expect( mockSearch ).toMatchObject( july );
			expect( mockSearch.comp ).toBe( between === 'after turning Compare on' ? '1' : undefined );
		}
	);

	it.each( [
		[
			'a new pick',
			( filters: ReturnType< typeof useReportDateFilters > ) => {
				filters.onChange(
					{
						from: new TZDate( '2026-06-10T00:00:00.000+00:00', 'UTC' ),
						to: new TZDate( '2026-06-20T00:00:00.000+00:00', 'UTC' ),
					},
					'custom'
				);
				filters.onApply();
			},
		],
		[
			'a reconciled range',
			( filters: ReturnType< typeof useReportDateFilters > ) => {
				filters.replaceRange(
					{
						from: new TZDate( '2026-06-10T00:00:00.000+00:00', 'UTC' ),
						to: new TZDate( '2026-06-20T23:59:59.999+00:00', 'UTC' ),
					},
					'custom'
				);
			},
		],
	] )( 'forgets the step on %s', ( _name, change ) => {
		const { result, rerender } = renderDateFilters( {
			from: '2026-06-01T00:00:00.000+00:00',
			to: '2026-06-30T23:59:59.999+00:00',
			preset: 'custom',
			step: 'P30D',
		} );

		act( () => change( result.current ) );
		rerender();

		expect( mockSearch ).toMatchObject( { from: '2026-06-10T00:00:00.000+00:00' } );
		expect( mockSearch ).not.toHaveProperty( 'step' );
	} );

	it( 'reads as the preset again when a step lands back on its window', () => {
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T12:00:00.000Z' ) );
		const { result, rerender } = renderDateFilters( {
			from: '2026-08-14T00:00:00.000+00:00',
			to: '2026-08-20T23:59:59.999+00:00',
			preset: 'last-7-days',
		} );

		act( () => result.current.stepping.onStep( 'previous' ) );
		rerender();
		expect( mockSearch ).toMatchObject( {
			from: '2026-08-07T00:00:00.000+00:00',
			preset: 'custom',
			step: 'last-7-days',
		} );

		let stepped;
		act( () => {
			stepped = result.current.stepping.onStep( 'next' );
		} );
		rerender();

		// Back on the preset the URL needs no step: the preset says how it moves.
		expect( mockSearch ).toMatchObject( { preset: 'last-7-days' } );
		expect( mockSearch ).not.toHaveProperty( 'step' );
		expect( stepped ).toMatchObject( { presetId: 'last-7-days' } );
	} );

	it( 'ignores a step without a measurable window', () => {
		const { result } = renderDateFilters();

		expect( result.current.stepping.canStepBackward ).toBe( false );
		expect( result.current.stepping.canStepForward ).toBe( false );

		let stepped;
		act( () => {
			stepped = result.current.stepping.onStep( 'previous' );
		} );

		expect( stepped ).toBeUndefined();
		expect( mockNavigate ).not.toHaveBeenCalled();
	} );

	// Turning the page keeps the reader's bucket; only a new pick resets it.
	it( 'keeps the interval across a step that lands back on a preset, and reports it', () => {
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T12:00:00.000Z' ) );
		const { result, rerender } = renderDateFilters( {
			from: '2026-07-22T00:00:00.000+00:00',
			to: '2026-08-20T23:59:59.999+00:00',
			preset: 'last-30-days',
			interval: 'week',
		} );

		act( () => result.current.stepping.onStep( 'previous' ) );
		rerender();
		let stepped;
		act( () => {
			stepped = result.current.stepping.onStep( 'next' );
		} );
		rerender();

		expect( mockSearch ).toMatchObject( { preset: 'last-30-days', interval: 'week' } );
		expect( stepped ).toMatchObject( { presetId: 'last-30-days', interval: 'week' } );
	} );

	// The route redirects a window before the plan's earliest date to the
	// fallback preset with a notice, so the step refuses it first. The dashboard
	// renders above its scope and hands the limits in; report pages read them.
	it.each( [
		[
			'passed in',
			{
				dateLimits: {
					lockedPresetIds: [],
					lockedIntervals: [],
					earliestDate: new Date( '2026-08-07T00:00:00.000Z' ),
				},
			},
			undefined,
		],
		[
			'declared by the report scope',
			undefined,
			( { children }: { children: ReactNode } ) => (
				<ReportScopeProvider
					dateLimits={ {
						lockedPresetIds: [],
						lockedIntervals: [],
						earliestDate: new Date( '2026-08-07T00:00:00.000Z' ),
					} }
				>
					{ children }
				</ReportScopeProvider>
			),
		],
	] )( 'refuses a step before the earliest date, with limits %s', ( _name, options, wrapper ) => {
		mockSearch = {
			from: '2026-08-07T00:00:00.000+00:00',
			to: '2026-08-13T23:59:59.999+00:00',
			preset: 'custom',
		};
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T12:00:00.000Z' ) );
		const { result } = renderHook( () => useReportDateFilters( '/', options ), { wrapper } );

		expect( result.current.stepping.canStepBackward ).toBe( false );
		expect( result.current.stepping.canStepForward ).toBe( true );

		let stepped;
		act( () => {
			stepped = result.current.stepping.onStep( 'previous' );
		} );

		expect( stepped ).toBeUndefined();
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

	it( 'steps a to-date preset by whole months and compares it with the months before', () => {
		// `last-12-months` as read on 20 August 2026. Stepped by its day count
		// the window would start on 12 September and its comparison on the 24th.
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T12:00:00.000Z' ) );
		const { result, rerender } = renderDateFilters( {
			from: '2025-09-01T00:00:00.000+00:00',
			to: '2026-08-20T23:59:59.999+00:00',
			preset: 'last-12-months',
			interval: 'month',
			comp: '1',
			compare_preset: 'previous-period',
		} );

		act( () => result.current.stepping.onStep( 'previous' ) );
		rerender();

		expect( mockSearch ).toMatchObject( {
			from: '2024-09-01T00:00:00.000+00:00',
			to: '2025-08-31T23:59:59.999+00:00',
			preset: 'custom',
			step: 'last-12-months',
			interval: 'month',
			compare_from: '2023-09-01T00:00:00.000+00:00',
			compare_to: '2024-08-31T23:59:59.999+00:00',
		} );
	} );

	it( 'steps the month to date back to the whole month before, comparison included', () => {
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-10-29T12:00:00.000Z' ) );
		const { result, rerender } = renderDateFilters( {
			from: '2026-10-01T00:00:00.000+00:00',
			to: '2026-10-29T23:59:59.999+00:00',
			preset: 'month-to-date',
			interval: 'day',
			comp: '1',
			compare_preset: 'previous-period',
		} );

		act( () => result.current.stepping.onStep( 'previous' ) );
		rerender();

		expect( mockSearch ).toMatchObject( {
			from: '2026-09-01T00:00:00.000+00:00',
			to: '2026-09-30T23:59:59.999+00:00',
			preset: 'custom',
			step: 'month-to-date',
			compare_from: '2026-08-01T00:00:00.000+00:00',
			compare_to: '2026-08-31T23:59:59.999+00:00',
		} );
	} );

	it( 'lands back on the to-date window when a step forward closes the running month', () => {
		// The window a step back out of `last-12-months` leaves. Stepping
		// forward again closes August, eleven days past the day it is read on:
		// days the report has no data for, so the landing is cut at today and
		// reads as the preset the reader set out from.
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T12:00:00.000Z' ) );

		const { result, rerender } = renderDateFilters( {
			from: '2024-09-01T00:00:00.000+00:00',
			to: '2025-08-31T23:59:59.999+00:00',
			preset: 'custom',
			step: 'last-12-months',
			interval: 'month',
		} );

		act( () => result.current.stepping.onStep( 'next' ) );
		rerender();

		expect( mockSearch ).toMatchObject( {
			from: '2025-09-01T00:00:00.000+00:00',
			to: '2026-08-20T23:59:59.999+00:00',
			preset: 'last-12-months',
		} );
	} );

	it( 'offers the next window once the clock has moved on, without a new range', () => {
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T23:30:00.000Z' ) );
		mockSearch = {
			from: '2026-08-20T00:00:00.000+00:00',
			to: '2026-08-20T23:59:59.999+00:00',
			preset: 'custom',
		};
		const { result, rerender } = renderHook( () => useReportDateFilters( '/' ) );

		expect( result.current.stepping.canStepForward ).toBe( false );

		jest.setSystemTime( Date.parse( '2026-08-21T01:00:00.000Z' ) );
		rerender();

		expect( result.current.stepping.canStepForward ).toBe( true );
	} );

	it( "moves a preset's window, applied and edited, to the new day after the site's midnight", () => {
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T23:59:30.000Z' ) );
		const { result } = renderDateFilters( {
			from: '2026-08-14T00:00:00.000+00:00',
			to: '2026-08-20T23:59:59.999+00:00',
			preset: 'last-7-days',
		} );
		expect( result.current.appliedRange.to?.getTime() ).toBe(
			Date.parse( '2026-08-20T23:59:59.999Z' )
		);

		act( () => {
			jest.advanceTimersByTime( 60 * 1000 );
		} );

		const newWeek = {
			from: Date.parse( '2026-08-15T00:00:00.000Z' ),
			to: Date.parse( '2026-08-21T23:59:59.999Z' ),
		};
		expect( result.current.appliedRange.from?.getTime() ).toBe( newWeek.from );
		expect( result.current.appliedRange.to?.getTime() ).toBe( newWeek.to );
		expect( result.current.range.from?.getTime() ).toBe( newWeek.from );
		expect( result.current.range.to?.getTime() ).toBe( newWeek.to );
	} );

	it( 'binds to the route it is given', () => {
		renderDateFilters();

		expect( mockUseSearch ).toHaveBeenLastCalledWith( { from: '/' } );
	} );

	it.each( [
		[
			'passed in with the date limits',
			{ dateLimits: { lockedPresetIds: [], lockedIntervals: LOCKED_INTERVALS } },
			undefined,
		],
		[ 'declared by the report scope', undefined, scopeWithLocks ],
	] )(
		'offers and stages only the buckets the plan leaves open, listing the rest locked, with locks %s',
		( _name, options, wrapper ) => {
			mockSearch = { preset: 'last-30-days' };
			const { result } = renderHook( () => useReportDateFilters( '/', options ), { wrapper } );

			expect( result.current.intervalOptions ).toEqual( [ 'day' ] );
			expect( result.current.lockedIntervalOptions ).toEqual( [ 'week' ] );

			act( () => {
				result.current.onChange(
					{ from: new TZDate( 2026, 0, 1, 'UTC' ), to: new TZDate( 2026, 5, 30, 'UTC' ) },
					'custom'
				);
			} );
			act( () => result.current.onApply() );

			expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
			expect( mockSearch ).toMatchObject( { interval: 'day' } );
		}
	);
} );
