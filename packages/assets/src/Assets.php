<?php
namespace Automattic\Jetpack;

use Automattic\Jetpack\Constants as Jetpack_Constants;

class Assets {

	private static $instance = null;
	private function __construct() {}

	/**
	 * Injectable singleton
	 *
	 * @return Assets
	 */
	public static function instance( $new_instance = null ) {
		if ( ! is_null( $new_instance ) ) {
			self::$instance = $new_instance;
		} elseif ( is_null( self::$instance ) ) {
			self::$instance = new Assets();
		}

		return self::$instance;
	}

	/**
	 * This enables our class to delegate statically called methods to the
	 * injectable instance
	 */
	public static function __callStatic( $name, $arguments ) {
		call_user_func_array( array( self::instance(), "real_${name}" ), $arguments );
	}

	/**
	 * This enables our class to delegate statically called methods to the
	 * injectable instance
	 */
	public function __call( $name, $arguments ) {
		call_user_func_array( array( $this, "real_${name}" ), $arguments );
	}

	/**
	 * Given a minified path, and a non-minified path, will return
	 * a minified or non-minified file URL based on whether SCRIPT_DEBUG is set and truthy.
	 *
	 * Both `$min_base` and `$non_min_base` are expected to be relative to the
	 * root Jetpack directory.
	 *
	 * @since 5.6.0
	 *
	 * @param string $min_path
	 * @param string $non_min_path
	 * @return string The URL to the file
	 */
	public function real_get_file_url_for_environment( $min_path, $non_min_path ) {
		$path = ( Jetpack_Constants::is_defined( 'SCRIPT_DEBUG' ) && Jetpack_Constants::get_constant( 'SCRIPT_DEBUG' ) )
			? $non_min_path
			: $min_path;
		return plugins_url( $path, JETPACK__PLUGIN_FILE );
	}
}
