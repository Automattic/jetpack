/**
 * External dependencies
 */
import { computePrimaryRange } from '@jetpack-premium-analytics/datetime';
import { useEffect } from 'react';
/**
 * Internal dependencies
 */
import {
	DATE_FILTER_RANGE,
	DATE_FILTER_YEAR,
	resolvePresetForSurface,
	type DashboardSection,
	type DateFilterSurface,
} from '../config';
import type { ReportDateFilters } from '@jetpack-premium-analytics/routing';

/**
 * Resolve which date filter the active section's header shows, and keep the
 * preset in the URL on that filter's surface.
 *
 * The date state is one set of search params shared by every section, so
 * switching between a section that offers the rolling date range and one that
 * offers all time / single years can leave a preset the visible filter cannot
 * represent. When that happens the surface takes over with its own default
 * (see `resolvePresetForSurface`) and the range is recomputed to match, so the
 * control, the URL, and the widgets never disagree.
 *
 * @param section     - The active section, or undefined until the sections resolve.
 * @param dateFilters - The route's date-filter controller.
 * @return The surface to render for the active section.
 */
export function useSectionDateFilter(
	section: DashboardSection | undefined,
	dateFilters: ReportDateFilters
): DateFilterSurface {
	// Null until the sections resolve. Reconciling before then would judge the
	// preset against the wrong surface and undo a `?section=` deep link's preset.
	// `year` is the only opt-in, so anything else lands on the range UI.
	let surface: DateFilterSurface | null = null;
	if ( section ) {
		surface = section.date_filter === DATE_FILTER_YEAR ? DATE_FILTER_YEAR : DATE_FILTER_RANGE;
	}

	const { presetId, timeZone, replaceRange } = dateFilters;

	useEffect( () => {
		if ( ! surface ) {
			return;
		}

		const nextPresetId = resolvePresetForSurface( surface, presetId );
		if ( ! nextPresetId ) {
			return;
		}

		/*
		 * Checked against the staged preset, not the committed one, so the
		 * reconciliation settles on the first render after staging rather than
		 * repeating until the URL catches up.
		 */
		const range = computePrimaryRange( nextPresetId, timeZone );
		if ( range ) {
			replaceRange( range, nextPresetId );
		}
	}, [ surface, presetId, timeZone, replaceRange ] );

	return surface ?? DATE_FILTER_RANGE;
}
