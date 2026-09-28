<?php
/**
 * Dashboard Layout: the default-layout primitives shared by the section API and its registrants.
 *
 * A section declares its default layout when it registers, and
 * Dashboard_Section::get_default_layout() runs it through DASHBOARD_DEFAULT_LAYOUT_FILTER: the
 * package drops the widget types the site cannot serve there, and a plugin may add its own
 * instances to any section.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

// Availability policy for default layout instances: defaults are read outside
// the widget registry bootstrap, so the policy must be loaded here explicitly.
require_once __DIR__ . '/widget-type-support.php';

/**
 * Identifier of the Premium Analytics dashboard, formatted as `<plugin>_<page>`
 * to match the underscore form produced by the wp-build pipeline. Used as the
 * `{name}` segment of the sections REST route.
 */
const DASHBOARD_NAME = 'jetpack-premium-analytics_dashboard';

/**
 * Filter through which a section's default layout is resolved. Documented where it
 * runs, in Dashboard_Section::get_default_layout().
 */
const DASHBOARD_DEFAULT_LAYOUT_FILTER = 'jetpack_premium_analytics_dashboard_default_layout';

/**
 * Builds a widget instance for a section's default layout.
 *
 * @param string $uuid       Widget instance UUID.
 * @param string $type       Widget type.
 * @param int    $order      Widget placement order.
 * @param int    $width      Widget placement width.
 * @param int    $height     Widget placement height.
 * @param array  $attributes Optional widget attributes.
 * @return array Widget instance.
 */
function get_dashboard_default_widget_instance(
	$uuid,
	$type,
	$order,
	$width = 1,
	$height = 1,
	$attributes = array()
) {
	$widget = array(
		'uuid' => $uuid,
		'type' => $type,
	);

	if ( ! empty( $attributes ) ) {
		$widget['attributes'] = $attributes;
	}

	$widget['placement'] = array(
		'width'  => $width,
		'height' => $height,
		'order'  => $order,
	);

	return $widget;
}

/**
 * Drops the widget instances the site cannot serve from a section's default layout.
 *
 * A persisted layout keeps such an instance as a removable ghost widget; a default must not
 * seed one. Hooked late, after the callbacks that add instances, so it covers those too.
 *
 * @param array $layout Default widget instances.
 * @return array The layout minus the unsupported instances.
 */
function remove_unsupported_default_layout_items( $layout ) {
	$layout = remove_unsupported_widget_items(
		is_array( $layout ) ? $layout : array(),
		'type',
		get_widget_support_context()
	);

	return remove_unregistered_default_layout_items( $layout );
}
add_filter( DASHBOARD_DEFAULT_LAYOUT_FILTER, __NAMESPACE__ . '\\remove_unsupported_default_layout_items', 100 );

/**
 * Drops the widget instances whose type the widget type registry does not know.
 *
 * Only once the registry can answer: after `init`, with the widget type API loaded and at least
 * one type registered. Before that, or on a checkout without a build, the default stays as
 * declared rather than emptying itself.
 *
 * @since $$next-version$$
 *
 * @param array $layout Default widget instances.
 * @return array The layout minus the instances of unregistered types.
 */
function remove_unregistered_default_layout_items( $layout ) {
	if ( ! did_action( 'init' ) || ! function_exists( __NAMESPACE__ . '\\ensure_widget_registry_ready' ) ) {
		return $layout;
	}

	ensure_widget_registry_ready();
	$registered = Widget_Type_Registry::get_instance()->get_all_registered();
	if ( empty( $registered ) ) {
		return $layout;
	}

	return array_values(
		array_filter(
			$layout,
			static function ( $item ) use ( $registered ) {
				return ! is_array( $item ) || isset( $registered[ $item['type'] ?? '' ] );
			}
		)
	);
}

/**
 * No-op kept for older copies of the package: they guard their include of this file on this
 * symbol and call it from boot_routes(), so a newer copy loading first must still define it.
 *
 * @since 0.8.0 Registers nothing; the route it registered is gone.
 *
 * @return void
 */
function register_dashboard_default_layout_route() {}
