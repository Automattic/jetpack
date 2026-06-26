<?php
/**
 * Widget type availability: a filterable view over the registry.
 *
 * The registry (widget-types.php) holds every widget from the build manifest,
 * unfiltered. This adds the policy layer: the
 * `jetpack_premium_analytics_widget_types` filter, resolved by
 * get_available_widget_types(). The REST list and the page import map both read
 * through it, so dropping a type there hides it from the client entirely.
 *
 * Ships one policy: the developer-only React Query Devtools widget is gated to
 * non-production. Hook the filter to scope types by capability, flag, site, etc.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Filter over the available widget types map (`$name => Widget_Type`).
 */
const WIDGET_TYPES_FILTER = 'jetpack_premium_analytics_widget_types';

/**
 * Returns the widget types available for the current request.
 *
 * Every registered widget type, run through WIDGET_TYPES_FILTER. Use this, not
 * get_registered_widget_types(), anywhere widget types reach the client, so the
 * same policy covers the REST list and the import map.
 *
 * @return Widget_Type[] Map of `$name => Widget_Type`.
 */
function get_available_widget_types() {
	/**
	 * Filters the widget types available to the dashboard this request.
	 *
	 * Removing an entry drops it from the `/jetpack/v4/widget-modules` REST list
	 * and the page import map, so it cannot be rendered or added.
	 *
	 * @param Widget_Type[] $widget_types Map of `$name => Widget_Type`.
	 */
	return apply_filters( WIDGET_TYPES_FILTER, get_registered_widget_types() );
}

/**
 * Hides developer-only widget types in production.
 *
 * Keyed off wp_get_environment_type(), which defaults to `production`: a site
 * opts in by declaring `WP_ENVIRONMENT_TYPE` as `local`, `development`, or
 * `staging`.
 *
 * @param Widget_Type[] $widget_types Map of `$name => Widget_Type`.
 * @return Widget_Type[] The map minus developer-only types in production.
 */
function filter_widget_types_by_environment( $widget_types ) {
	if ( 'production' !== wp_get_environment_type() ) {
		return $widget_types;
	}

	// Types that must never reach a production dashboard.
	$non_production_only = array( 'jpa/react-query-dev-tool' );

	foreach ( $non_production_only as $widget_type_name ) {
		unset( $widget_types[ $widget_type_name ] );
	}

	return $widget_types;
}

add_filter( WIDGET_TYPES_FILTER, __NAMESPACE__ . '\\filter_widget_types_by_environment' );
