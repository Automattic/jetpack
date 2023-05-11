<?php
namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;

/**
 * The Minify_Excludes_State_Entry class represents a single state entry for Jetpack Boost Data Sync.
 *
 * This class implements the Entry_Can_Get and Entry_Can_Set interfaces, allowing it to retrieve and set
 * the current state of the Minify Excludes option.
 *
 * @package Automattic\Jetpack_Boost\Data_Sync
 */
class Minify_Excludes_State_Entry implements Entry_Can_Get, Entry_Can_Set {

	/**
	 * The option key used to store the Minify Excludes option.
	 *
	 * @var string
	 */
	private $option_key;

	/**
	 * Constructs a new instance of the Minify_Excludes_State_Entry class.
	 *
	 * @param string $option_key The option key used to store the Minify Excludes option.
	 */
	public function __construct( $option_key ) {
		$this->option_key = 'jetpack_boost_ds_' . $option_key;
	}

	/**
	 * Retrieves the value of the specified option.
	 *
	 * If the option does not exist, it returns the provided fallback value
	 * or null if no fallback value is provided.
	 *
	 * @param mixed $fallback_value Optional. The value to return if the option does not exist.
	 *                              Default is false.
	 * @return mixed The value of the option, or the fallback value if the option does not exist.
	 */
	public function get( $fallback_value = false ) {
		if ( $fallback_value !== false ) {
			return get_option( $this->option_key, $fallback_value );
		}

		return get_option( $this->option_key );
	}

	/**
	 * Sets the value of the Minify Excludes option.
	 *
	 * @param mixed $value The new value of the Minify Excludes option.
	 */
	public function set( $value ) {
		$value = $this->sanitize_value( $value );

		update_option( $this->option_key, $value );
	}

	/**
	 * Sanitizes the given value, ensuring that it is a comma-separated list of unique, trimmed strings.
	 *
	 * @param mixed $value The value to sanitize.
	 *
	 * @return string The sanitized value, as a comma-separated list of unique, trimmed strings.
	 */
	private function sanitize_value( $value ) {
		if ( is_array( $value ) ) {
			$value = array_values( array_unique( array_filter( array_map( 'trim', $value ) ) ) );
		} else {
			$value = array();
		}

		return $value;
	}
}
