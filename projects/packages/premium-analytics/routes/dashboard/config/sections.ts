/**
 * Internal dependencies
 */
import type { DateFilterSurface } from './date-filter';
/**
 * External dependencies
 */
import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * A dashboard section, served by `GET /dashboards/{name}/sections` and read
 * through the `dashboardSection` core-data entity. The server-side registry is
 * the source of truth for which sections exist, their order, and labels.
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
	 * Translated display label.
	 */
	label: string;

	/**
	 * Sort order (ascending).
	 */
	order: number;

	/**
	 * Which date filter this section's header offers. Server-registered per
	 * section, so a section reporting on whole history can ask for the year
	 * surface while the rest keep the rolling date-range picker.
	 *
	 * Optional because the field can genuinely be absent: WPCOM's public-api
	 * registers this route from its own checkout, so a Simple site can be served
	 * a sections payload built before the field existed. Read it through
	 * `resolveDateFilterSurface`, which treats a missing value as the
	 * date-range surface.
	 */
	date_filter?: DateFilterSurface;

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
