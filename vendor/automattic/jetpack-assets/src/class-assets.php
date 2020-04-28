<?php
/**
 * Jetpack Assets package.
 *
 * @package  automattic/jetpack-assets
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Constants as Jetpack_Constants;

/**
 * Class Assets
 */
class Assets {
	/**
	 * Constructor.
	 *
	 * Static-only class, so nothing here.
	 */
	private function __construct() {}

	/**
	 * Given a minified path, and a non-minified path, will return
	 * a minified or non-minified file URL based on whether SCRIPT_DEBUG is set and truthy.
	 *
	 * Both `$min_base` and `$non_min_base` are expected to be relative to the
	 * root Jetpack directory.
	 *
	 * @since 5.6.0
	 *
	 * @param string $min_path minified path.
	 * @param string $non_min_path non-minified path.
	 * @return string The URL to the file
	 */
	public static function get_file_url_for_environment( $min_path, $non_min_path ) {
		$path = ( Jetpack_Constants::is_defined( 'SCRIPT_DEBUG' ) && Jetpack_Constants::get_constant( 'SCRIPT_DEBUG' ) )
			? $non_min_path
			: $min_path;

		$url = plugins_url( $path, Jetpack_Constants::get_constant( 'JETPACK__PLUGIN_FILE' ) );

		/**
		 * Filters the URL for a file passed through the get_file_url_for_environment function.
		 *
		 * @since 8.1.0
		 *
		 * @package assets
		 *
		 * @param string $url The URL to the file.
		 * @param string $min_path The minified path.
		 * @param string $non_min_path The non-minified path.
		 */
		return apply_filters( 'jetpack_get_file_for_environment', $url, $min_path, $non_min_path );
	}
}
