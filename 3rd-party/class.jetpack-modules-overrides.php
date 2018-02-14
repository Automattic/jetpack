<?php

/**
 * Provides methods for dealing with module overrides.
 *
 * @since 5.9.0
 */
class Jetpack_Modules_Overrides {
	/**
	 * Returns true if there is a filter on the jetpack_active_modules option.
	 *
	 * @return bool Whether there is a filter on the jetpack_active_modules option.
	 */
	public static function do_overrides_exist() {
		return (bool) has_filter( 'option_jetpack_active_modules' );
	}

	/**
	 * Returns an array of module overrides where the key is the module slug and the value
	 * is true if the module is forced on and false if the module is forced off.
	 *
	 * @return array The array of module overrides.
	 */
	public static function get_overrides() {
		if ( ! self::do_overrides_exist() ) {
			return array();
		}

		$available_modules = Jetpack::get_available_modules();

		/**
		 * First, let's get all modules that have been forced on.
		 */

		/** This filter is documented in wp-includes/option.php */
		$filtered = apply_filters( 'option_jetpack_active_modules', array() );

		$forced_on = array_diff( $filtered, array() );

		/**
		 * Second, let's get all modules forced off.
		 */

		/** This filter is documented in wp-includes/option.php */
		$filtered = apply_filters( 'option_jetpack_active_modules', $available_modules );

		$forced_off = array_diff( $available_modules, $filtered );

		/**
		 * Last, build the return value.
		 */
		$return_value = array();
		foreach ( $forced_on as $on ) {
			$return_value[ $on ] = true;
		}

		foreach ( $forced_off as $off ) {
			$return_value[ $off ] = false;
		}

		return $return_value;
	}
}
