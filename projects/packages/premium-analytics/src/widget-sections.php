<?php
/**
 * Widget section scoping policy (consumer layer).
 *
 * Which dashboard sections a widget type may be added from, which the widget
 * gallery reads off the `/widget-modules` record. Placement is a host concern,
 * so it lives here rather than on the widget manifest: `Widget_Type` carries
 * identity and authoring metadata only, and the build pipeline that produces
 * the manifest has no notion of a dashboard section.
 *
 * Scoping is deliberately not a hard hide (widget-availability.php): a type
 * scoped away from a section stays registered, so an instance a reader already
 * placed there keeps rendering.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/dashboard-layout.php';

/**
 * Widget types that belong to only some of the dashboard's sections, keyed by
 * type name and holding section *slugs* (`traffic`), not the namespaced ids
 * (`analytics/traffic`) the same sections also carry. The client compares
 * against the active section's slug.
 *
 * A type absent from this map may be added from any section.
 *
 * The four below draw a sparkline over the section's selected period, which
 * customer interviews found readers could not interpret (WOOPRD-3672). They
 * keep the Traffic tab, whose date range is the subject of the page. Insights
 * is a weaker home for them even today, and becomes an untenable one once
 * WOOPRD-3699 takes that tab's date control away: the period the numbers cover
 * would then go unstated.
 */
const WIDGET_TYPE_SECTIONS = array(
	'jpa/total-views'    => array( DASHBOARD_TRAFFIC_SECTION_ID ),
	'jpa/total-visitors' => array( DASHBOARD_TRAFFIC_SECTION_ID ),
	'jpa/popular-days'   => array( DASHBOARD_TRAFFIC_SECTION_ID ),
	'jpa/popular-hours'  => array( DASHBOARD_TRAFFIC_SECTION_ID ),
);

/**
 * The sections a widget type may be added from.
 *
 * @param string $widget_type_name Widget type name, e.g. `jpa/total-views`.
 * @return string[]|null Section slugs — `traffic`, not `analytics/traffic` — or
 *                       null when the type is not scoped.
 */
function get_widget_type_sections( $widget_type_name ) {
	return WIDGET_TYPE_SECTIONS[ $widget_type_name ] ?? null;
}
