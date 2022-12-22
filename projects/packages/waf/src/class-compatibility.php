<?php
/**
 * Class used to manage backwards-compatibility of the package.
 *
 * @since 0.8.0
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

/**
 * Defines methods for ensuring backwards compatibility.
 */
class Waf_Compatibility {

	/**
	 * Move the rules directory out of the plugin directory and into the WAF content directory.
	 *
	 * @since 0.8.0
	 *
	 * @throws \Exception If the rules directory cannot be moved.
	 * @return void
	 */
	public static function migrate_rules() {
		Waf_Constants::initialize_constants();
		Waf_Runner::initialize_filesystem();
		Waf_Runner::create_waf_directory();

		global $wp_filesystem;

		if ( $wp_filesystem->exists( __DIR__ . '/../rules' ) ) {
			// Copy the existing rule files into the WAF content directory.
			$dir_copied = $wp_filesystem->copy_dir( __DIR__ . '/../rules', Waf_Runner::get_waf_file_path( 'rules' ) );
			if ( is_wp_error( $dir_copied ) ) {
				throw new \Exception( 'Failed copying rules directory to: ' . Waf_Runner::get_waf_file_path( 'rules' ) );
			}

			// Delete the old rules directory.
			$wp_filesystem->delete( __DIR__ . '/../rules', true );
		}
	}

}
