<?php
namespace Automattic\Jetpack;

use Automattic\Jetpack\Constants as Jetpack_Constants;

class Assets {
	// static-only class
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
	 * @param string $min_path
	 * @param string $non_min_path
	 * @return string The URL to the file
	 */
	public static function get_file_url_for_environment( $min_path, $non_min_path ) {
		$path = ( Jetpack_Constants::is_defined( 'SCRIPT_DEBUG' ) && Jetpack_Constants::get_constant( 'SCRIPT_DEBUG' ) )
			? $non_min_path
			: $min_path;
		return plugins_url( $path, Jetpack_Constants::get_constant( 'JETPACK__PLUGIN_FILE' ) );
	}
}
