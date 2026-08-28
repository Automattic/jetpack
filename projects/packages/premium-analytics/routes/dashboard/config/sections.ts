/**
 * Internal dependencies
 */
import type { DateFilterOptions, DateFilterSurface } from './date-filter';
/**
 * External dependencies
 */
import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * A dashboard section, served by `GET /dashboards/{name}/sections` and read
 * through the `dashboardSection` core-data entity. The server-side registry is
 * the source of truth for which sections exist, their order, and their copy.
 */
export type DashboardSection = {
	/**
	 * Canonical namespaced identifier, e.g. `analytics/traffic`.
	 */
	id: string;

	/**
	 * URL-facing slug (the segment after the namespace), e.g. `traffic`.
	 * Persisted in the `?section=` search param and as the section-layout
	 * preference key.
	 */
	slug: string;

	/**
	 * Translated display label. Names the section's tab.
	 */
	label: string;

	/**
	 * Translated section heading, deliberately not the tab label. Read it through
	 * `resolveSectionHeading`. Optional for the same reason as `date_filter` below.
	 */
	title?: string | null;

	/**
	 * Translated section description, rendered as the page subtitle while this
	 * section is active. Missing or `null` renders no subtitle — there is no
	 * default copy behind it.
	 */
	description?: string | null;

	/**
	 * Sort order (ascending).
	 */
	order: number;

	/**
	 * Which date filter this section's header offers, registered per section on
	 * the server. Optional because a Simple site's public-api route may serve a
	 * payload built before this field existed; a missing value means the range surface.
	 */
	date_filter?: DateFilterSurface;

	/**
	 * Which optional controls this section's date filter offers. Optional for
	 * the same reason as `date_filter` above; absent means every control.
	 */
	date_filter_options?: DateFilterOptions;

	/**
	 * Whether the section's data only reaches WordPress.com through the analytics
	 * full sync, so it shows sync progress until that sync has finished once.
	 * Optional for the same reason as `date_filter` above; absent means no wait.
	 */
	requires_sync?: boolean;

	/**
	 * Bundled default widget layout, consumed by the reset action.
	 */
	default_layout: DashboardWidget[];
};

/**
 * Dashboard section identifier: the URL-facing `slug` of a `DashboardSection`.
 * Server-driven, so an open string.
 */
export type DashboardSectionId = string;

/**
 * The heading a section shows above its widgets. Sections that register no
 * heading of their own — Store today — head the section with their tab label.
 *
 * @param section - The section to head.
 * @return The heading text.
 */
export function resolveSectionHeading( section: DashboardSection ): string {
	// `||` rather than `??`: an empty string is a registrant meaning "none", and
	// heading the section with it would render an `<h2>` with no accessible name.
	return section.title || section.label;
}

/**
 * Whether a section's data is still waiting on the analytics full sync, so its
 * widgets show incomplete numbers.
 *
 * @param section        - The section to render.
 * @param isSyncFinished - Whether the analytics initial full sync has finished.
 * @return Whether the section is still waiting on the sync.
 */
export function isSectionAwaitingSync(
	section: DashboardSection,
	isSyncFinished: boolean
): boolean {
	return !! section.requires_sync && ! isSyncFinished;
}

/**
 * Narrow a candidate slug to an available section, falling back to the first
 * section by order. A miss is a stale slug or a section unavailable now
 * (`?section=store` with WooCommerce off).
 *
 * @param value    - The candidate section slug (e.g. from the URL).
 * @param sections - The available sections, in order.
 * @return The resolved section slug, or an empty string when no sections exist.
 */
export function resolveSectionId(
	value: string | undefined,
	sections: DashboardSection[]
): DashboardSectionId {
	if ( value && sections.some( section => section.slug === value ) ) {
		return value;
	}

	return sections[ 0 ]?.slug ?? '';
}
