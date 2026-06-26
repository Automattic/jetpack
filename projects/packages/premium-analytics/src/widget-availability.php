<?php
/**
 * Widget Types availability: the filterable view over the registry.
 *
 * The widget-types.php module hydrates every widget discovered by the build
 * pipeline into the registry verbatim. This file adds the policy layer on top:
 * a single filter, `jetpack_premium_analytics_widget_types`, through which a
 * request can hide widget types before they reach the client (the REST list and
 * the page import map). Consumers call get_available_widget_types() rather than
 * reading the registry directly, so one policy applies everywhere a widget type
 * is exposed.
 *
 * The bundled policy gates the developer-only React Query Devtools widget to
 * non-production environments. Other code can hook the same filter to scope
 * widget types by capability, feature flag, site, etc.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Filter through which the per-request set of available widget types is
 * resolved. Callbacks receive and return a `$name => Widget_Type` map.
 */
const WIDGET_TYPES_FILTER = 'jetpack_premium_analytics_widget_types';

/**
 * Returns the widget types available for the current request.
 *
 * Starts from every registered widget type and runs the map through
 * WIDGET_TYPES_FILTER, the single extension point for hiding widget types per
 * request. Callers that expose widget types to the client should use this
 * instead of get_registered_widget_types() so the same policy is applied to the
 * REST list and the import map alike.
 *
 * @return Widget_Type[] Associative array of `$name => $widget_type` pairs.
 */
function get_available_widget_types() {
	/**
	 * Filters the widget types available to the dashboard for this request.
	 *
	 * Removing an entry hides that widget type from the client entirely: it
	 * drops out of the `/jetpack/v4/widget-modules` REST list and out of the
	 * page import map, so it cannot be rendered or added to a dashboard.
	 *
	 * @param Widget_Type[] $widget_types Map of `$name => Widget_Type`.
	 */
	return apply_filters( WIDGET_TYPES_FILTER, get_registered_widget_types() );
}

/**
 * Hides developer-only widget types when running in production.
 *
 * Keyed off the WordPress core environment type, so a site opts in to these
 * widgets by declaring a non-production environment (e.g. `WP_ENVIRONMENT_TYPE`
 * set to `local`, `development`, or `staging`).
 *
 * @param Widget_Type[] $widget_types Map of `$name => Widget_Type`.
 * @return Widget_Type[] The map without production-restricted widget types.
 */
function filter_widget_types_by_environment( $widget_types ) {
	if ( 'production' !== wp_get_environment_type() ) {
		return $widget_types;
	}

	// Widget types that must never reach a production dashboard.
	$non_production_only = array( 'jpa/react-query-dev-tool' );

	foreach ( $non_production_only as $widget_type_name ) {
		unset( $widget_types[ $widget_type_name ] );
	}

	return $widget_types;
}

add_filter( WIDGET_TYPES_FILTER, __NAMESPACE__ . '\\filter_widget_types_by_environment' );
