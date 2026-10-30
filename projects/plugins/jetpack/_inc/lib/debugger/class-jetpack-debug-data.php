<?php
/**
 * Jetpack Debug Data for the Site Health sections.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Debug_Data;
use Automattic\Jetpack\Current_Plan as Jetpack_Plan;

/**
 * Class Jetpack_Debug_Data
 *
 * Collect and return debug data for Jetpack.
 *
 * @since 7.3.0
 */
class Jetpack_Debug_Data {
	/**
	 * Determine the active plan and normalize it for the debugger results.
	 *
	 * @since 7.3.0
	 *
	 * @return string The plan slug.
	 */
	public static function what_jetpack_plan() {
		$plan = Jetpack_Plan::get();
		return ! empty( $plan['class'] ) ? $plan['class'] : 'undefined';
	}

	/**
	 * Convert seconds to human readable time.
	 *
	 * A dedication function instead of using Core functionality to allow for output in seconds.
	 *
	 * @since 7.3.0
	 *
	 * @param int $seconds Number of seconds to convert to human time.
	 *
	 * @return string Human readable time.
	 */
	public static function seconds_to_time( $seconds ) {
		$seconds = (int) $seconds;
		$units   = array(
			'week'   => WEEK_IN_SECONDS,
			'day'    => DAY_IN_SECONDS,
			'hour'   => HOUR_IN_SECONDS,
			'minute' => MINUTE_IN_SECONDS,
			'second' => 1,
		);
		// specifically handle zero.
		if ( 0 === $seconds ) {
			return '0 seconds';
		}
		$human_readable = '';
		foreach ( $units as $name => $divisor ) {
			$quot = (int) ( $seconds / $divisor );
			if ( $quot ) {
				$human_readable .= "$quot $name";
				$human_readable .= ( abs( $quot ) > 1 ? 's' : '' ) . ', ';
				$seconds        -= $quot * $divisor;
			}
		}
		return substr( $human_readable, 0, -2 );
	}

	/**
	 * Add the Jetpack plugin's own fields to the section the Connection package builds.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $fields Fields keyed by ID, each with a `label`, a `value` and a `private` flag.
	 *
	 * @return array The fields with the plugin's added.
	 */
	public static function add_plugin_fields( $fields ) {
		$fields['version_option'] = array(
			'label'   => 'Current Jetpack Version Option',
			'value'   => Jetpack_Options::get_option( 'version' ),
			'private' => false,
		);
		$fields['old_version']    = array(
			'label'   => 'Previous Jetpack Version',
			'value'   => Jetpack_Options::get_option( 'old_version' ),
			'private' => false,
		);
		$fields['version']        = array(
			'label'   => 'Jetpack Version',
			'value'   => JETPACK__VERSION,
			'private' => false,
		);
		$fields['jp_plugin_dir']  = array(
			'label'   => 'Jetpack Directory',
			'value'   => JETPACK__PLUGIN_DIR,
			'private' => false,
		);
		$fields['plan']           = array(
			'label'   => 'Plan Type',
			'value'   => self::what_jetpack_plan(),
			'private' => false,
		);

		return $fields;
	}

	/**
	 * Return debug data in the format expected by Core's Site Health Info tab.
	 *
	 * @since 7.3.0
	 * @deprecated $$next-version$$ The Connection package adds the section.
	 *
	 * @param array $debug The debug information already compiled by Core.
	 *
	 * @return array Debug information in the same format as the initial argument.
	 */
	public static function core_debug_data( $debug ) {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Connection\\Debug_Data::get_section' );

		if ( ! class_exists( Debug_Data::class ) ) {
			return $debug;
		}

		$debug['jetpack'] = Debug_Data::get_section();

		return $debug;
	}

	/**
	 * Compile and return array of debug information.
	 *
	 * @since 7.3.0
	 * @deprecated $$next-version$$ The Connection package compiles the fields.
	 *
	 * @return array Fields keyed by ID, each with a `label`, a `value` and a `private` flag.
	 */
	public static function debug_data() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Connection\\Debug_Data::get_fields' );

		return class_exists( Debug_Data::class ) ? Debug_Data::get_fields() : array();
	}
}
