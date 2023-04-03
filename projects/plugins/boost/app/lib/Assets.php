<?php
/**
 * Asset Manager for Jetpack Boost.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Class Assets
 */
class Assets {

	/**
	 * Given a minified path, and a non-minified path, will return
	 * a minified or non-minified file URL based on whether SCRIPT_DEBUG is set and truthy.
	 *
	 * Both `$min_base` and `$non_min_base` are expected to be relative to the
	 * root Jetpack directory.
	 *
	 * @param string $min_path     minified path.
	 * @param string $non_min_path non-minified path.
	 *
	 * @return string The URL to the file
	 * @since   1.0.0
	 */
	public static function get_file_url_for_environment( $min_path, $non_min_path ) {
		$internal_path = apply_filters( 'jetpack_boost_asset_internal_path', 'app/assets/dist/' );
		$url           = plugins_url( $internal_path . trim( $non_min_path, '/' ), JETPACK_BOOST_PATH );

		/**
		 * Filters the URL for a file passed through the get_file_url_for_environment function.
		 *
		 * @param string $url          The URL to the file.
		 * @param string $min_path     The minified path.
		 * @param string $non_min_path The non-minified path.
		 *
		 * @since   1.0.0
		 */
		return apply_filters( 'jetpack_boost_asset_url', $url, $min_path, $non_min_path );
	}
}
