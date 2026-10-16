/**
 * External dependencies
 */
import { getStatsDatePolicy } from '@jetpack-premium-analytics/data';
import { useEffect } from 'react';
/**
 * Internal dependencies
 */
import { isPlanDateLimitedSection } from '../../../stats-date-window';
import {
	DATE_FILTER_RANGE,
	resolveSurfaceRange,
	toDateFilterSurface,
	type DashboardSection,
	type DateFilterSurface,
} from '../../config';
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
 * @param isCommitted - Whether the URL has committed the switch to that section.
 * @return The surface to render for the active section.
 */
export function useSectionDateFilter(
	section: DashboardSection | undefined,
	dateFilters: ReportDateFilters,
	isCommitted = true
): DateFilterSurface {
	// Null until the sections resolve. Reconciling before then would judge the
	// preset against the wrong surface and undo a `?section=` deep link's preset.
	const surface = section ? toDateFilterSurface( section.date_filter ) : null;

	const isPlanLimited = !! section && isPlanDateLimitedSection( section.slug );
	const { presetId, timeZone, replaceRange } = dateFilters;

	useEffect( () => {
		// In flight, the preset is still the last tab's, and the switch brings its own window.
		if ( ! surface || ! isCommitted ) {
			return;
		}

		// A locked preset written here would reach the route as the reader's own pick and earn a notice.
		const policy = isPlanLimited ? getStatsDatePolicy() : undefined;
		/*
		 * Checked against the staged preset, not the committed one, so the
		 * reconciliation settles on the first render after staging rather than
		 * repeating until the URL catches up.
		 */
		const next = resolveSurfaceRange( surface, presetId, policy, timeZone );
		if ( next ) {
			replaceRange( next.range, next.presetId );
		}
	}, [ surface, isCommitted, isPlanLimited, presetId, timeZone, replaceRange ] );

	return surface ?? DATE_FILTER_RANGE;
}
