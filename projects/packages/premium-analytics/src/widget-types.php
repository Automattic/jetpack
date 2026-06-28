<?php
/**
 * Widget Types: hydrates the registry from the build manifest.
 *
 * The wp-build-generated `build/widgets.php` exposes the discovered widgets via
 * `jpa_get_registered_widget_modules()`. This file copies that manifest into
 * the in-memory Widget_Type_Registry at `init`, giving the rest of the plugin a
 * single, queryable source of widget types instead of re-parsing the manifest.
 *
 * This logic lives behind an experimental flag in Gutenberg; Premium Analytics
 * ships its own PA-namespaced copy so it does not depend on that flag.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/class-widget-type.php';
require_once __DIR__ . '/class-widget-type-registry.php';
require_once __DIR__ . '/widget-availability.php';

/**
 * Registers a widget type if it is available in the current site environment.
 *
 * @param string $name Widget type name including namespace.
 * @param array  $args Widget type arguments.
 * @return Widget_Type|false The registered widget type on success, or false on failure/unavailable requirements.
 */
function register_widget_type( $name, $args = array() ) {
	if ( ! is_widget_type_available( $name, $args ) ) {
		return false;
	}

	unset( $args['requirements'] );

	return Widget_Type_Registry::get_instance()->register( $name, $args );
}

/**
 * Hydrates the widget type registry from the build manifest.
 *
 * Iterates the widgets discovered by the build pipeline (via
 * `jpa_get_registered_widget_modules()`) and registers each one in the
 * registry. The manifest is the single source of bundled widget authorship in
 * this codebase; this loop is a deterministic copy of it into the in-memory
 * registry, guarded by the widget availability checks.
 *
 * @return void
 */
function register_widget_types() {
	$registry = Widget_Type_Registry::get_instance();

	if ( function_exists( 'jpa_get_registered_widget_modules' ) ) {
		$jetpack_widget_modules = jpa_get_registered_widget_modules();

		foreach ( $jetpack_widget_modules as $widget ) {
			if ( empty( $widget['name'] ) || $registry->is_registered( $widget['name'] ) ) {
				continue;
			}

			register_widget_type(
				$widget['name'],
				array(
					'render_module' => $widget['render_module'] ?? null,
					'widget_module' => $widget['widget_module'] ?? null,
					'presentation'  => $widget['presentation'] ?? null,
				)
			);
		}
	}

	do_action( REGISTER_WIDGET_TYPES_ACTION );
}

if ( did_action( 'init' ) ) {
	register_widget_types();
} else {
	add_action( 'init', __NAMESPACE__ . '\\register_widget_types' );
}

/**
 * Returns all widget types registered in the registry.
 *
 * Convenience accessor around `Widget_Type_Registry::get_all_registered()` for
 * callers that prefer a function-based API.
 *
 * @return Widget_Type[] Associative array of `$name => $widget_type` pairs.
 */
function get_registered_widget_types() {
	return Widget_Type_Registry::get_instance()->get_all_registered();
}
