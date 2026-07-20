/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import { DASHBOARD_REST_NAMESPACE } from '../hooks/constants';

/**
 * A dashboard section definition, as served by
 * `GET /dashboards/{name}/sections` (see `getDashboardSectionsPath`).
 *
 * The server-side section registry is the single source of truth for which
 * sections exist, in what order, and with which labels — the WooCommerce
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
	 * preference key, so it stays short and stable.
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
};

/**
 * Dashboard section identifier as used by the frontend: the URL-facing `slug`
 * of a `DashboardSection`. Server-driven, so no longer a static union.
 */
export type DashboardSectionId = string;

/**
 * Build the REST path serving a dashboard's section definitions.
 *
 * @param dashboardName - Dashboard registration name.
 * @return The `GET /sections` REST path.
 */
export function getDashboardSectionsPath( dashboardName: string ): string {
	return `/${ DASHBOARD_REST_NAMESPACE }/dashboards/${ dashboardName }/sections`;
}

/**
 * Narrow an arbitrary value to a dashboard section definition.
 *
 * @param value - Candidate section.
 * @return Whether the value carries the server section shape.
 */
function isDashboardSection( value: unknown ): value is DashboardSection {
	if ( ! value || typeof value !== 'object' ) {
		return false;
	}

	const { id, slug, label, order } = value as Record< string, unknown >;

	return (
		typeof id === 'string' &&
		typeof slug === 'string' &&
		slug !== '' &&
		typeof label === 'string' &&
		typeof order === 'number'
	);
}

/**
 * Narrow a `GET /sections` response to a list of section definitions.
 *
 * The payload crosses a serialization boundary (REST response or script-data
 * preload), so entries that don't carry the section shape are dropped rather
 * than propagated into the tab bar.
 *
 * @param value - Candidate response body.
 * @return The section definitions, in server order.
 */
export function normalizeDashboardSections( value: unknown ): DashboardSection[] {
	return Array.isArray( value ) ? value.filter( isDashboardSection ) : [];
}

/**
 * Read the server-printed `GET /sections` preload for a dashboard.
 *
 * The dashboard page render injects the response into JetpackScriptData keyed
 * by REST path, so the section list is available synchronously on first paint
 * — before any request resolves — and `?section=` resolution sees the full
 * slug set.
 *
 * @param dashboardName - Dashboard registration name.
 * @return The preloaded sections, or an empty list when no preload is present.
 */
export function getPreloadedDashboardSections( dashboardName: string ): DashboardSection[] {
	const preload = getScriptData()?.premium_analytics?.dashboard_sections_preload;

	return normalizeDashboardSections( preload?.[ getDashboardSectionsPath( dashboardName ) ]?.body );
}

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
