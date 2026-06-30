<?php
/**
 * Widget availability policy (consumer layer).
 *
 * Premium Analytics' policy over the neutral filters in widget-types.php:
 * availability is the consumer's job, core only offers the hooks.
 *
 * Ships one policy: the developer-only React Query Devtools widget is never
 * registered in production. Hooking the registry-time filter (a hard hide)
 * keeps every registry consumer correct without a filtered accessor.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Removes developer-only candidates in production.
 *
 * Split from the hook callback so both branches are testable without touching
 * the global environment.
 *
 * @param array  $widget_candidates Manifest candidates, each with a `name`.
 * @param string $environment       Site environment type.
 * @return array The candidates, minus developer-only types in production.
 */
function remove_dev_only_widget_types( $widget_candidates, $environment ) {
	if ( 'production' !== $environment ) {
		return $widget_candidates;
	}

	// Types that must never reach a production dashboard. Matched by name, not
	// by `category: developer`: wp-build does not copy `category` into the PHP
	// manifest yet, so it is not queryable here. Switch to a category check
	// once the manifest carries it.
	$dev_only = array( 'jpa/react-query-dev-tool' );

	return array_values(
		array_filter(
			$widget_candidates,
			static function ( $widget ) use ( $dev_only ) {
				return ! in_array( $widget['name'] ?? '', $dev_only, true );
			}
		)
	);
}

/**
 * Registry-time callback: hides developer-only types in production.
 *
 * Defaults to `production`; a site opts in via `WP_ENVIRONMENT_TYPE`
 * (`local`, `development`, `staging`).
 *
 * @param array $widget_candidates Manifest candidates.
 * @return array The candidates, minus developer-only types in production.
 */
function filter_registrable_widget_types_by_environment( $widget_candidates ) {
	return remove_dev_only_widget_types( $widget_candidates, wp_get_environment_type() );
}

add_filter( REGISTRABLE_WIDGET_TYPES_FILTER, __NAMESPACE__ . '\\filter_registrable_widget_types_by_environment' );
