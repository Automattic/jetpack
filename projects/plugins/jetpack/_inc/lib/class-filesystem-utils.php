<?php
/**
 * Filesystem Utilities for Jetpack.
 *
 * Common filesystem operations used across Jetpack components.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack;

/**
 * Class Filesystem_Utils
 *
 * Utility methods for common filesystem operations used across Jetpack components.
 *
 * @since $$next-version$$
 */
class Filesystem_Utils {

	/**
	 * Creates files to protect directory listing and prevent direct access.
	 * Adds index.html and .htaccess files to the specified directory.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $directory The directory to protect.
	 * @return bool True if files were created successfully, false otherwise.
	 */
	public static function create_protection_files( $directory ) {
		global $wp_filesystem;

		// Initialize WordPress filesystem
		if ( ! function_exists( 'WP_Filesystem' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		$initialized = \WP_Filesystem();
		if ( ! $initialized || ! $wp_filesystem || ! is_object( $wp_filesystem ) ) {
			return false;
		}

		// Create an empty index.html file
		$index_file = trailingslashit( $directory ) . 'index.html';
		if ( ! $wp_filesystem->put_contents( $index_file, '', FS_CHMOD_FILE ) ) {
			return false;
		}

		// Create .htaccess to deny direct access, using Apache version detection
		$htaccess_content = '# Prevent directory listing
Options -Indexes

# Apache 2.4+
<IfModule authz_core_module>
    <FilesMatch "\.(php|htaccess)$">
        Require all denied
    </FilesMatch>
    
    <Files index.html>
        Require all granted
    </Files>
</IfModule>

# Apache 2.2
<IfModule !authz_core_module>
    <FilesMatch "\.(php|htaccess)$">
        Deny from all
    </FilesMatch>
    
    <Files index.html>
        Allow from all
    </Files>
</IfModule>';

		$htaccess_file = trailingslashit( $directory ) . '.htaccess';
		return $wp_filesystem->put_contents( $htaccess_file, $htaccess_content, FS_CHMOD_FILE );
	}
}
