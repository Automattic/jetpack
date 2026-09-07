<?php
/**
 * Widget type support shared by the registry and default layouts — hard availability only
 * (a feature the site has or doesn't, or a type held back from release); soft/request-dependent
 * state belongs in the runtime types filter. Persisted layouts keep missing types as removable
 * ghost widgets.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Status\Host;

// Guarded on a symbol the file declares, so a second copy of the package can't
// redeclare it. See the include block in Analytics::load_dashboard_components().
if ( ! function_exists( __NAMESPACE__ . '\\is_videopress_available' ) ) {
	require_once __DIR__ . '/videopress-availability.php';
}

/**
 * Widget types that only have data on a site running VideoPress.
 */
const VIDEOPRESS_WIDGET_TYPES = array(
	'jpa/videopress',
	'jpa/video-detail-views-performance',
	'jpa/video-detail-embeds',
);

/**
 * Widget types that surface plan usage and upgrade prompts.
 */
const PLAN_USAGE_WIDGET_TYPES = array(
	'jpa/plan-usage',
);

/**
 * Returns the current widget support context.
 *
 * @return array{is_wpcom_simple:bool,has_videopress:bool} Widget support context.
 */
function get_widget_support_context() {
	return array(
		'is_wpcom_simple' => ( new Host() )->is_wpcom_simple(),
		'has_videopress'  => is_videopress_available(),
	);
}

/**
 * Returns unsupported widget types for a context.
 *
 * @param array{is_wpcom_simple?:bool,has_videopress?:bool} $context Widget support context; a missing key reads as false.
 * @return string[] Unsupported widget type names.
 */
function get_unsupported_widget_types( $context ) {
	// Usage and upgrade UX stays out of Stats v2 on every site until the paid plan is
	// settled (STATS-459); it returns through the configurations drawer (WOOA7S-2037).
	$unsupported = PLAN_USAGE_WIDGET_TYPES;

	// File download tracking is served only on WPCOM Simple. Calypso applies
	// the same boundary, which excludes self-hosted Jetpack and Atomic sites.
	if ( empty( $context['is_wpcom_simple'] ) ) {
		$unsupported[] = 'jpa/file-downloads';

		// Share counts are recorded only when WPCOM processes the share click; elsewhere the
		// click never reaches the counter, so `shares_<service>` stays zero. Calypso excludes it too.
		$unsupported[] = 'jpa/shares';
	}

	// Play counts only exist for VideoPress-hosted videos; Calypso gates its Videos module
	// the same way (see videopress-availability.php).
	if ( empty( $context['has_videopress'] ) ) {
		$unsupported = array_merge( $unsupported, VIDEOPRESS_WIDGET_TYPES );
	}

	return $unsupported;
}

/**
 * Removes unsupported widget records.
 *
 * @param array                                             $items    Widget records.
 * @param string                                            $type_key Record key containing the widget type.
 * @param array{is_wpcom_simple?:bool,has_videopress?:bool} $context  Widget support context; a missing key reads as false.
 * @return array Filtered and re-indexed widget records.
 */
function remove_unsupported_widget_items( $items, $type_key, $context ) {
	$unsupported = get_unsupported_widget_types( $context );

	if ( empty( $unsupported ) ) {
		return $items;
	}

	return array_values(
		array_filter(
			$items,
			static function ( $item ) use ( $type_key, $unsupported ) {
				return ! is_array( $item )
					|| ! in_array( $item[ $type_key ] ?? '', $unsupported, true );
			}
		)
	);
}
