<?php
/**
 * Widget availability policy (consumer layer): drops developer-only, platform-unsupported,
 * and capability-gated candidates from a manifest at registry time, over the
 * neutral hooks in widget-types.php. A dropped candidate never registers, so every reader sees
 * the same set; a type registered one by one with register_widget_type() skips this policy.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/widget-types.php';
require_once __DIR__ . '/widget-type-support.php';

/**
 * Widget categories whose data counts as a Stats report: each reaches WPCOM through a proxy
 * prefix gated on `view_stats`.
 */
const STATS_REPORT_WIDGET_CATEGORIES = array( 'stats', 'traffic', 'subscribers' );

/**
 * Removes developer-only candidates in production.
 *
 * Split from the hook callback so both branches are testable without touching
 * the global environment.
 *
 * @param array  $widget_candidates Manifest candidates, each with a `name` and `category`.
 * @param string $environment       Site environment type.
 * @return array The candidates, minus developer-only types in production.
 */
function remove_dev_only_widget_types( $widget_candidates, $environment ) {
	if ( 'production' !== $environment ) {
		return $widget_candidates;
	}

	return array_values(
		array_filter(
			$widget_candidates,
			static function ( $widget ) {
				return 'developer' !== ( $widget['category'] ?? '' );
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

/**
 * Applies shared type-level availability at registry time.
 *
 * @param array $widget_candidates Manifest candidates.
 * @return array Filtered candidates.
 */
function filter_registrable_widget_types_by_availability( $widget_candidates ) {
	return remove_unsupported_widget_items(
		$widget_candidates,
		'name',
		get_widget_support_context()
	);
}

add_filter( REGISTRABLE_WIDGET_TYPES_FILTER, __NAMESPACE__ . '\\filter_registrable_widget_types_by_availability' );

// Subscriber widgets stay registered even when their section is hidden: their data
// doesn't depend on the local module, and unregistering would break instances placed elsewhere.

/**
 * Removes candidates the reader could not load data for anyway.
 *
 * Split from the hook callback so both branches are testable without a user.
 *
 * @since 0.1.0
 * @since 0.13.0 Gates the Stats categories alone: the WooCommerce Stats package gates its own.
 *
 * @param array $widget_candidates Manifest candidates, each with a `category`.
 * @param bool  $can_view_stats    Whether the reader may see the Stats reports.
 * @return array The candidates, minus the Stats categories when the reader can't see them.
 */
function remove_capability_gated_widget_types( $widget_candidates, $can_view_stats ) {
	if ( $can_view_stats ) {
		return $widget_candidates;
	}

	return array_values(
		array_filter(
			$widget_candidates,
			static function ( $widget ) {
				return ! in_array( $widget['category'] ?? '', STATS_REPORT_WIDGET_CATEGORIES, true );
			}
		)
	);
}

/**
 * Registry-time callback: hides widgets whose data the reader cannot fetch, since a shop manager
 * would only collect 403s from the Stats prefixes. The registry is request-scoped, so filtering
 * on the current user is safe here.
 *
 * @since 0.1.0
 *
 * @param array $widget_candidates Manifest candidates.
 * @return array The candidates, minus the Stats categories when the reader can't see them.
 */
function filter_registrable_widget_types_by_capability( $widget_candidates ) {
	return remove_capability_gated_widget_types( $widget_candidates, Capabilities::current_user_can_view_stats() );
}

add_filter( REGISTRABLE_WIDGET_TYPES_FILTER, __NAMESPACE__ . '\\filter_registrable_widget_types_by_capability' );
