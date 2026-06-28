<?php
/**
 * Dashboard widget availability helpers.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Filter name for widget availability requirements.
 *
 * @var string
 */
const WIDGET_REQUIREMENTS_FILTER = 'jetpack_premium_analytics_widget_requirements';

/**
 * Action name for registering widget types supplied outside Premium Analytics.
 *
 * @var string
 */
const REGISTER_WIDGET_TYPES_ACTION = 'jetpack_premium_analytics_register_widget_types';

/**
 * Returns Premium Analytics' built-in widget availability requirements.
 *
 * @return array Widget requirements keyed by widget type name.
 */
function get_default_widget_type_requirements() {
	return array(
		'jpa/bookings-by-device' => array(
			array(
				'plugin_file'      => 'woocommerce-bookings/woocommerce-bookings.php',
				'active_class'     => 'WC_Bookings',
				'active_constant'  => 'WC_BOOKINGS_VERSION',
				'version_constant' => 'WC_BOOKINGS_VERSION',
			),
		),
	);
}

/**
 * Returns availability requirements for a widget type.
 *
 * Extensions can pass requirements directly to register_widget_type(), or use
 * the filter to add or adjust requirements for bundled or extension-owned widgets.
 *
 * @param string $widget_name Widget type name.
 * @param array  $args        Widget registration arguments.
 * @return array List of requirement arrays.
 */
function get_widget_type_requirements( $widget_name, $args = array() ) {
	$default_requirements = get_default_widget_type_requirements();
	$requirements         = $default_requirements[ $widget_name ] ?? array();

	if ( isset( $args['requirements'] ) ) {
		$requirements = $args['requirements'];
	}

	/**
	 * Filters the availability requirements for a widget type.
	 *
	 * @param array  $requirements Widget availability requirements.
	 * @param string $widget_name  Widget type name.
	 * @param array  $args         Widget registration arguments.
	 */
	$requirements = apply_filters( WIDGET_REQUIREMENTS_FILTER, $requirements, $widget_name, $args );

	return normalize_widget_type_requirements( $requirements );
}

/**
 * Returns whether a widget type is available in the current site environment.
 *
 * @param string $widget_name Widget type name.
 * @param array  $args        Widget registration arguments.
 * @return bool True when all requirements are met.
 */
function is_widget_type_available( $widget_name, $args = array() ) {
	foreach ( get_widget_type_requirements( $widget_name, $args ) as $requirement ) {
		if ( ! is_widget_type_requirement_met( $requirement ) ) {
			return false;
		}
	}

	return true;
}

/**
 * Normalizes widget requirements into a list of requirement arrays.
 *
 * @param mixed $requirements Widget requirements.
 * @return array List of requirement arrays.
 */
function normalize_widget_type_requirements( $requirements ) {
	if ( empty( $requirements ) || ! is_array( $requirements ) ) {
		return array();
	}

	if ( isset( $requirements['plugin_file'] ) || isset( $requirements['active_class'] ) || isset( $requirements['active_function'] ) || isset( $requirements['active_constant'] ) || isset( $requirements['version_constant'] ) ) {
		return array( $requirements );
	}

	return array_values( array_filter( $requirements, 'is_array' ) );
}

/**
 * Returns whether a single widget availability requirement is met.
 *
 * Supported requirement keys:
 * - plugin_file: relative plugin file path, e.g. plugin/plugin.php.
 * - active_class: class that proves the integration is active.
 * - active_function: function that proves the integration is active.
 * - active_constant: constant that proves the integration is active.
 * - version_constant: constant containing the integration version.
 * - min_version: minimum version required when version_constant is supplied.
 *
 * @param array $requirement Widget availability requirement.
 * @return bool True when the requirement is met.
 */
function is_widget_type_requirement_met( $requirement ) {
	if ( ! is_array( $requirement ) ) {
		return false;
	}

	if ( ! empty( $requirement['plugin_file'] ) && ! is_widget_requirement_plugin_file_available( $requirement['plugin_file'] ) ) {
		return false;
	}

	if ( has_widget_requirement_active_signal( $requirement ) && ! is_widget_requirement_active_signal_met( $requirement ) ) {
		return false;
	}

	if ( empty( $requirement['active_class'] ) && empty( $requirement['active_function'] ) && empty( $requirement['active_constant'] ) && ! empty( $requirement['plugin_file'] ) && ! is_widget_requirement_plugin_active( $requirement['plugin_file'] ) ) {
		return false;
	}

	if ( ! empty( $requirement['min_version'] ) ) {
		if ( empty( $requirement['version_constant'] ) || ! defined( $requirement['version_constant'] ) ) {
			return false;
		}

		return version_compare( (string) constant( $requirement['version_constant'] ), (string) $requirement['min_version'], '>=' );
	}

	return true;
}

/**
 * Returns whether a plugin file exists.
 *
 * @param string $plugin_file Relative plugin file path.
 * @return bool True when the plugin file is installed.
 */
function is_widget_requirement_plugin_file_available( $plugin_file ) {
	if ( ! defined( 'WP_PLUGIN_DIR' ) || ! is_string( $plugin_file ) ) {
		return false;
	}

	$plugin_file = ltrim( $plugin_file, '/' );

	return file_exists( trailingslashit( WP_PLUGIN_DIR ) . $plugin_file );
}

/**
 * Returns whether a requirement declares at least one runtime active signal.
 *
 * @param array $requirement Widget availability requirement.
 * @return bool True when the requirement has an active signal.
 */
function has_widget_requirement_active_signal( $requirement ) {
	return ! empty( $requirement['active_class'] ) || ! empty( $requirement['active_function'] ) || ! empty( $requirement['active_constant'] );
}

/**
 * Returns whether any declared runtime active signal is present.
 *
 * @param array $requirement Widget availability requirement.
 * @return bool True when any runtime active signal is present.
 */
function is_widget_requirement_active_signal_met( $requirement ) {
	if ( ! empty( $requirement['active_class'] ) && class_exists( $requirement['active_class'] ) ) {
		return true;
	}

	if ( ! empty( $requirement['active_function'] ) && function_exists( $requirement['active_function'] ) ) {
		return true;
	}

	if ( ! empty( $requirement['active_constant'] ) && defined( $requirement['active_constant'] ) ) {
		return true;
	}

	return false;
}

/**
 * Returns whether a plugin file is active according to WordPress.
 *
 * @param string $plugin_file Relative plugin file path.
 * @return bool True when WordPress reports the plugin as active.
 */
function is_widget_requirement_plugin_active( $plugin_file ) {
	if ( ! defined( 'ABSPATH' ) ) {
		return false;
	}

	if ( ! function_exists( 'is_plugin_active' ) || ! function_exists( 'is_plugin_active_for_network' ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
	}

	$plugin_file = ltrim( $plugin_file, '/' );

	return is_plugin_active( $plugin_file ) || is_plugin_active_for_network( $plugin_file );
}
