/**
 * Pin the site timezone to UTC so day-bound math is deterministic regardless
 * of the machine timezone running the tests.
 */
jest.mock( '@jetpack-premium-analytics/data', () => {
	const { toLocalTZ } = jest.requireActual( '@jetpack-premium-analytics/datetime' );

	return {
		...jest.requireActual( '@jetpack-premium-analytics/data' ),
		dateToISOStringWithLocalTZ: ( date: Date ) => new Date( date.getTime() ).toISOString(),
		localTZDate: ( value?: number | string | Date, timeZone?: string ) =>
			toLocalTZ( value, timeZone ?? '+00:00' ),
	};
} );

/**
 * The router boundary: `useSearch` reads the in-memory search state and
 * `useNavigate` applies the committed patch to it, so commits round-trip the
 * way the real router makes them.
 */
const mockNavigate = jest.fn();
let mockSearch: Record< string, unknown > = {};

jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => mockNavigate,
	useSearch: () => mockSearch,
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

// The hook reads the site zone from the WordPress date settings, so pin those
// rather than leaving the pin to the mocked helpers alone.
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
				mockSearch = search( mockSearch );
			}
		);
	} );

	it( 'derives the applied state from the URL search params', () => {
		const { result } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000Z',
			to: '2026-07-30T23:59:59.999Z',
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
			to: '2026-07-30T23:59:59.999Z',
		} );

		expect( result.current.range.from ).toBeUndefined();
		expect( result.current.range.to?.getTime() ).toBe( Date.parse( '2026-07-30T23:59:59.999Z' ) );
	} );

	it( 'stages a primary edit and only commits it on Apply', () => {
		const { result, rerender } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000Z',
			to: '2026-07-30T23:59:59.999Z',
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
			from: '2026-07-24T00:00:00.000Z',
			to: '2026-07-30T23:59:59.999Z',
			preset: 'last-7-days',
			interval: 'day',
		} );
		expect( result.current.appliedPresetId ).toBe( 'last-7-days' );
		expect( result.current.canApply ).toBe( false );
	} );

	it( 'reverts a staged edit on Cancel', () => {
		const { result } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000Z',
			to: '2026-07-30T23:59:59.999Z',
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
			from: '2026-07-01T00:00:00.000Z',
			to: '2026-07-30T23:59:59.999Z',
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
			compare_from: '2026-06-01T00:00:00.000Z',
			compare_to: '2026-06-30T23:59:59.999Z',
		} );
		expect( result.current.appliedComparisonPresetId ).toBe( 'previous-period' );
		expect( result.current.appliedComparisonRange?.from?.toISOString() ).toBe(
			'2026-06-01T00:00:00.000Z'
		);
		expect( result.current.appliedComparisonRange?.to?.toISOString() ).toBe(
			'2026-06-30T23:59:59.999Z'
		);
	} );

	it( 'carries no comparison window until one is applied', () => {
		const { result } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000Z',
			to: '2026-07-30T23:59:59.999Z',
			preset: 'last-30-days',
		} );

		expect( result.current.appliedComparisonRange ).toBeUndefined();
	} );

	it( 'commits an interval change on its own', () => {
		const { result, rerender } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000Z',
			to: '2026-07-30T23:59:59.999Z',
			preset: 'last-30-days',
			interval: 'day',
		} );

		act( () => result.current.onIntervalChange( 'week' ) );
		rerender();

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		expect( mockSearch ).toMatchObject( { interval: 'week' } );
		expect( result.current.appliedInterval ).toBe( 'week' );
	} );

	it( 'holds a comparison change while a primary edit is staged', () => {
		const { result } = renderDateFilters( {
			from: '2026-07-01T00:00:00.000Z',
			to: '2026-07-30T23:59:59.999Z',
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
			from: '2026-07-09T14:30:00.000Z',
			to: '2026-07-10T14:30:00.000Z',
			preset: 'last-24-hours',
			interval: 'hour',
		} );

		act( () => result.current.onStep( 'previous' ) );
		rerender();

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		expect( mockSearch ).toMatchObject( {
			from: '2026-07-08T14:30:00.000Z',
			to: '2026-07-09T14:30:00.000Z',
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
			from: '2026-07-01T00:00:00.000Z',
			to: '2026-07-30T23:59:59.999Z',
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
} );
