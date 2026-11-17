/**
 * External dependencies
 */
import { DASHBOARD_PREFERENCES_SCOPE } from '@jetpack-premium-analytics/data';
import { PRESET_ALL_TIME, toYearPresetId } from '@jetpack-premium-analytics/datetime';
import { renderHook } from '@testing-library/react';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { planGatesScriptData } from '../../../../tests/js/plan-gates-test-utils';
import {
	DATE_FILTER_RANGE,
	DATE_FILTER_YEAR,
	type DashboardSection,
	type DateFilterSurface,
} from '../../config';
import { useSectionDateFilter } from './use-section-date-filter';
import type { ReportDateFilters } from '@jetpack-premium-analytics/routing';

const originalScriptData = window.JetpackScriptData;

/**
 * Build a section registered with a given date filter.
 *
 * @param dateFilter - The section's `date_filter` value.
 * @param slug       - The section's slug.
 * @return A dashboard section.
 */
function section(
	dateFilter?: DateFilterSurface | string,
	slug = dateFilter ?? 'unset'
): DashboardSection {
	return {
		id: `analytics/${ slug }`,
		slug,
		label: slug,
		order: 10,
		date_filter: dateFilter as DateFilterSurface | undefined,
		default_layout: [],
	};
}

/**
 * Build a date-filter controller whose `replaceRange` records its calls.
 *
 * @param presetId - The preset currently in the URL.
 * @return The controller and the recorded calls.
 */
function dateFilters( presetId?: ReportDateFilters[ 'presetId' ] ) {
	const replaceRange = jest.fn();

	return {
		replaceRange,
		filters: {
			presetId,
			timeZone: 'UTC',
			replaceRange,
		} as unknown as ReportDateFilters,
	};
}

/**
 * Build a date-filter controller whose `replaceRange` actually moves the preset,
 * so a reconciliation can be seen settling rather than only being staged once.
 *
 * @param presetId - The preset the URL starts on.
 * @return The recorded calls, and an accessor rebuilding the controller.
 */
function statefulDateFilters( presetId?: ReportDateFilters[ 'presetId' ] ) {
	let current = presetId;
	const replaceRange = jest.fn( ( _range, nextPresetId ) => {
		current = nextPresetId;
	} );

	return {
		replaceRange,
		filters: () =>
			( {
				presetId: current,
				timeZone: 'UTC',
				replaceRange,
			} ) as unknown as ReportDateFilters,
	};
}

describe( 'useSectionDateFilter', () => {
	afterEach( () => {
		window.JetpackScriptData = originalScriptData;
		dispatch( preferencesStore ).set( DASHBOARD_PREFERENCES_SCOPE, 'datePreset', undefined );
	} );

	it( 'returns the surface the active section was registered with', () => {
		const { filters } = dateFilters( PRESET_ALL_TIME );

		expect(
			renderHook( () => useSectionDateFilter( section( 'year' ), filters, true ) ).result.current
		).toBe( DATE_FILTER_YEAR );
		expect(
			renderHook( () => useSectionDateFilter( section( 'range' ), filters, true ) ).result.current
		).toBe( DATE_FILTER_RANGE );
	} );

	// `year` is the only opt-in surface, so anything else lands on the range UI:
	// a section served without the field, or with one added after this build.
	it( 'falls back to the range surface for a missing or unknown filter', () => {
		const { filters } = dateFilters( PRESET_ALL_TIME );

		expect(
			renderHook( () => useSectionDateFilter( section(), filters, true ) ).result.current
		).toBe( DATE_FILTER_RANGE );
		expect(
			renderHook( () => useSectionDateFilter( section( 'something-newer' ), filters, true ) ).result
				.current
		).toBe( DATE_FILTER_RANGE );
	} );

	it( 'leaves a preset the active surface can show alone', () => {
		const year = dateFilters( toYearPresetId( 2024 ) );
		renderHook( () => useSectionDateFilter( section( 'year' ), year.filters, true ) );
		expect( year.replaceRange ).not.toHaveBeenCalled();

		const range = dateFilters( 'last-7-days' );
		renderHook( () => useSectionDateFilter( section( 'range' ), range.filters, true ) );
		expect( range.replaceRange ).not.toHaveBeenCalled();
	} );

	it( 'moves a rolling window onto the year surface as all time', () => {
		const { filters, replaceRange } = dateFilters( 'last-30-days' );

		renderHook( () => useSectionDateFilter( section( 'year' ), filters, true ) );

		expect( replaceRange ).toHaveBeenCalledTimes( 1 );
		const [ range, presetId ] = replaceRange.mock.calls[ 0 ];
		expect( presetId ).toBe( PRESET_ALL_TIME );
		expect( range.from.getTime() ).toBeLessThan( range.to.getTime() );
	} );

	it( 'moves a year preset onto the date-range surface as the default preset', () => {
		const { filters, replaceRange } = dateFilters( toYearPresetId( 2024 ) );

		renderHook( () => useSectionDateFilter( section( 'range' ), filters, true ) );

		expect( replaceRange ).toHaveBeenCalledTimes( 1 );
		expect( replaceRange.mock.calls[ 0 ][ 1 ] ).toBe( 'last-7-days' );
	} );

	it( 'moves a year preset on a plan-limited tab onto the plan fallback, not a locked default', () => {
		window.JetpackScriptData = planGatesScriptData( [
			'recent-7-days',
		] ) as unknown as typeof window.JetpackScriptData;
		dispatch( preferencesStore ).set( DASHBOARD_PREFERENCES_SCOPE, 'datePreset', 'last-30-days' );
		const { filters, replaceRange } = dateFilters( toYearPresetId( 2024 ) );

		renderHook( () => useSectionDateFilter( section( 'range', 'traffic' ), filters, true ) );

		expect( replaceRange.mock.calls[ 0 ][ 1 ] ).toBe( 'last-7-days' );
	} );

	it( 'waits for a section switch to commit before reconciling', () => {
		const { filters, replaceRange } = dateFilters( toYearPresetId( 2024 ) );
		const { rerender } = renderHook(
			( { isCommitted }: { isCommitted: boolean } ) =>
				useSectionDateFilter( section( 'range' ), filters, isCommitted ),
			{ initialProps: { isCommitted: false } }
		);

		expect( replaceRange ).not.toHaveBeenCalled();

		rerender( { isCommitted: true } );

		expect( replaceRange ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'waits for the sections to resolve before reconciling', () => {
		const { filters, replaceRange } = dateFilters( toYearPresetId( 2024 ) );

		// Until the section is known there is no surface to reconcile against,
		// and guessing would undo a `?section=` deep link's own preset.
		renderHook( () => useSectionDateFilter( undefined, filters, true ) );

		expect( replaceRange ).not.toHaveBeenCalled();
	} );

	// A year preset carried in from Insights cannot be shown by the range
	// picker, so switching sections must reconcile it — and then settle.
	it( 'reconciles a year preset carried across a section switch, then settles', () => {
		const { filters, replaceRange } = statefulDateFilters( toYearPresetId( 2024 ) );

		const { rerender } = renderHook(
			( { dateFilter }: { dateFilter: string } ) =>
				useSectionDateFilter( section( dateFilter ), filters(), true ),
			{ initialProps: { dateFilter: DATE_FILTER_YEAR } }
		);

		expect( replaceRange ).not.toHaveBeenCalled();

		rerender( { dateFilter: DATE_FILTER_RANGE } );

		expect( replaceRange ).toHaveBeenCalledTimes( 1 );
		expect( replaceRange.mock.calls[ 0 ][ 1 ] ).toBe( 'last-7-days' );

		// The preset the reconciliation staged is one this surface can show, so
		// a further render must not stage another.
		rerender( { dateFilter: DATE_FILTER_RANGE } );

		expect( replaceRange ).toHaveBeenCalledTimes( 1 );
	} );
} );
