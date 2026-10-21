/**
 * External dependencies
 */
import { getSectionDatePolicy } from '@jetpack-premium-analytics/data';
import { useEffect } from 'react';
/**
 * Internal dependencies
 */
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
 * (see `resolveSurfaceRange`) and the range is recomputed to match, so the
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
	isCommitted: boolean
): DateFilterSurface {
	// Null until the sections resolve. Reconciling before then would judge the
	// preset against the wrong surface and undo a `?section=` deep link's preset.
	const surface = section ? toDateFilterSurface( section.date_filter ) : null;

	const slug = section?.slug;
	const { presetId, timeZone, replaceRange } = dateFilters;

	useEffect( () => {
		// In flight, the preset is still the last tab's, and the switch brings its own window.
		if ( ! surface || ! isCommitted ) {
			return;
		}

		// A locked preset written here would reach the route as the reader's own pick and earn a notice.
		// `presetId` is the staged preset, so this settles before the URL catches up.
		const next = resolveSurfaceRange( surface, presetId, getSectionDatePolicy( slug ), timeZone );
		if ( next ) {
			replaceRange( next.range, next.presetId );
		}
	}, [ surface, isCommitted, slug, presetId, timeZone, replaceRange ] );

	return surface ?? DATE_FILTER_RANGE;
}
