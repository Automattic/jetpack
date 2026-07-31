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
function section( dateFilter: DateFilterSurface ): DashboardSection {
	return {
		id: `analytics/${ dateFilter }`,
		slug: dateFilter,
		label: dateFilter,
		order: 10,
		date_filter: dateFilter,
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
} );
