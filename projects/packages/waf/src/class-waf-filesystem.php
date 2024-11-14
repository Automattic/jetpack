<?php
/**
 * Filesystem class for the WAF.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

/**
 * Filesystem class for the WAF
 */
class Waf_Filesystem {
	/**
	 * Initializes the WP filesystem and WAF directory structure.
	 *
	 * @global \WP_Filesystem_Base $wp_filesystem Base WordPress filesystem.
	 *
	 * @throws File_System_Exception If filesystem is unavailable.
	 *
	 * @return \WP_Filesystem The WP filesystem object.
	 */
	public static function initialize_filesystem() {
		global $wp_filesystem;

		if ( ! function_exists( '\\WP_Filesystem' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		if ( ! \WP_Filesystem() ) {
			throw new File_System_Exception( 'No filesystem available.' );
		}

		// Ensure the WAF directory exists.
		$Constants = new Waf_Constants();
		$waf_dir   = $Constants->get( $Constants::DIRECTORY_PATH_CONSTANT );
		if ( ! $wp_filesystem->is_dir( $waf_dir ) ) {
			if ( ! $wp_filesystem->mkdir( $waf_dir ) ) {
				throw new File_System_Exception( 'Failed creating WAF file directory: ' . $waf_dir );
			}
		}

		return $wp_filesystem;
	}

	/**
	 * Get WAF File Path
	 *
	 * @param string $file The file path starting in the WAF directory.
	 * @return string The full file path to the provided file in the WAF directory.
	 */
	public function get_path( $file ) {
		$Constants = new Waf_Constants();

		// Ensure the file path starts with a slash.
		if ( '/' !== substr( $file, 0, 1 ) ) {
			$file = "/$file";
		}

		return $Constants->get( $Constants::DIRECTORY_PATH_CONSTANT ) . $file;
	}
}
