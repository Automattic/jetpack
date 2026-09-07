/**
 * External dependencies
 */
import { PRESET_ALL_TIME, toYearPresetId } from '@jetpack-premium-analytics/datetime';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import {
	DATE_FILTER_RANGE,
	DATE_FILTER_YEAR,
	type DashboardSection,
	type DateFilterSurface,
} from '../config';
import { useSectionDateFilter } from './use-section-date-filter';
import type { ReportDateFilters } from '@jetpack-premium-analytics/routing';

/**
 * Build a section registered with a given date filter.
 *
 * @param dateFilter - The section's `date_filter` value.
 * @return A dashboard section.
 */
function section( dateFilter?: DateFilterSurface | string ): DashboardSection {
	const slug = dateFilter ?? 'unset';

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
	it( 'returns the surface the active section was registered with', () => {
		const { filters } = dateFilters( PRESET_ALL_TIME );

		expect(
			renderHook( () => useSectionDateFilter( section( 'year' ), filters ) ).result.current
		).toBe( DATE_FILTER_YEAR );
		expect(
			renderHook( () => useSectionDateFilter( section( 'range' ), filters ) ).result.current
		).toBe( DATE_FILTER_RANGE );
	} );

	// `year` is the only opt-in surface, so anything else lands on the range UI:
	// a section served without the field, or with one added after this build.
	it( 'falls back to the range surface for a missing or unknown filter', () => {
		const { filters } = dateFilters( PRESET_ALL_TIME );

		expect( renderHook( () => useSectionDateFilter( section(), filters ) ).result.current ).toBe(
			DATE_FILTER_RANGE
		);
		expect(
			renderHook( () => useSectionDateFilter( section( 'something-newer' ), filters ) ).result
				.current
		).toBe( DATE_FILTER_RANGE );
	} );

	it( 'leaves a preset the active surface can show alone', () => {
		const year = dateFilters( toYearPresetId( 2024 ) );
		renderHook( () => useSectionDateFilter( section( 'year' ), year.filters ) );
		expect( year.replaceRange ).not.toHaveBeenCalled();

		const range = dateFilters( 'last-7-days' );
		renderHook( () => useSectionDateFilter( section( 'range' ), range.filters ) );
		expect( range.replaceRange ).not.toHaveBeenCalled();
	} );

	it( 'moves a rolling window onto the year surface as all time', () => {
		const { filters, replaceRange } = dateFilters( 'last-30-days' );

		renderHook( () => useSectionDateFilter( section( 'year' ), filters ) );

		expect( replaceRange ).toHaveBeenCalledTimes( 1 );
		const [ range, presetId ] = replaceRange.mock.calls[ 0 ];
		expect( presetId ).toBe( PRESET_ALL_TIME );
		expect( range.from.getTime() ).toBeLessThan( range.to.getTime() );
	} );

	it( 'moves a year preset onto the date-range surface as the default preset', () => {
		const { filters, replaceRange } = dateFilters( toYearPresetId( 2024 ) );

		renderHook( () => useSectionDateFilter( section( 'range' ), filters ) );

		expect( replaceRange ).toHaveBeenCalledTimes( 1 );
		expect( replaceRange.mock.calls[ 0 ][ 1 ] ).toBe( 'last-30-days' );
	} );

	it( 'waits for the sections to resolve before reconciling', () => {
		const { filters, replaceRange } = dateFilters( toYearPresetId( 2024 ) );

		// Until the section is known there is no surface to reconcile against,
		// and guessing would undo a `?section=` deep link's own preset.
		renderHook( () => useSectionDateFilter( undefined, filters ) );

		expect( replaceRange ).not.toHaveBeenCalled();
	} );

	// A year preset carried in from Insights cannot be shown by the range
	// picker, so switching sections must reconcile it — and then settle.
	it( 'reconciles a year preset carried across a section switch, then settles', () => {
		const { filters, replaceRange } = statefulDateFilters( toYearPresetId( 2024 ) );

		const { rerender } = renderHook(
			( { dateFilter }: { dateFilter: string } ) =>
				useSectionDateFilter( section( dateFilter ), filters() ),
			{ initialProps: { dateFilter: DATE_FILTER_YEAR } }
		);

		expect( replaceRange ).not.toHaveBeenCalled();

		rerender( { dateFilter: DATE_FILTER_RANGE } );

		expect( replaceRange ).toHaveBeenCalledTimes( 1 );
		expect( replaceRange.mock.calls[ 0 ][ 1 ] ).toBe( 'last-30-days' );

		// The preset the reconciliation staged is one this surface can show, so
		// a further render must not stage another.
		rerender( { dateFilter: DATE_FILTER_RANGE } );

		expect( replaceRange ).toHaveBeenCalledTimes( 1 );
	} );
} );
