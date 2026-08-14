<?php
/**
 * Dashboard identifier grammar shared across Premium Analytics dashboard APIs.
 *
 * These accessors are the single source of truth for the dashboard and section
 * identifier grammar, shared between the REST route definitions and the
 * registry validation so the two can never drift apart.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Dashboard identifier pattern used by REST routes and dashboard registries.
 *
 * Allows the `<plugin>_<page>` form produced by the wp-build pipeline, while
 * also accepting simple dashboard names for consumers that do not use a page
 * suffix.
 *
 * @return string Unanchored regular expression fragment.
 */
function get_dashboard_name_pattern() {
	return '[a-z][a-z0-9-]*(?:_[a-z0-9-]+)*';
}

/**
 * Dashboard section identifier pattern.
 *
 * Mirrors WordPress block and Premium Analytics widget type names: a namespace
 * prefix followed by a section slug.
 *
 * @return string Unanchored regular expression fragment.
 */
function get_dashboard_section_id_pattern() {
	return '[a-z0-9-]+\/[a-z0-9-]+';
}
