/**
 * External dependencies
 */
import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * A dashboard section definition, served by `GET /dashboards/{name}/sections`
 * and read through the `dashboardSection` core-data entity.
 *
 * The server-side section registry is the single source of truth for which
 * sections exist, in what order, and with which labels. The WooCommerce
 * section, for example, is only present when WooCommerce is active.
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
	 * Bundled default widget layout, consumed by the reset action.
	 */
	default_layout: DashboardWidget[];
};

/**
 * Dashboard section identifier as used by the frontend: the URL-facing `slug`
 * of a `DashboardSection`. Server-driven, so no longer a static union.
 */
export type DashboardSectionId = string;

/**
 * Narrow an arbitrary string to an available section slug, falling back to the
 * first section by order.
 *
 * A miss covers both stale slugs (an old bookmark) and currently unavailable
 * sections (`?section=store` with WooCommerce off).
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
