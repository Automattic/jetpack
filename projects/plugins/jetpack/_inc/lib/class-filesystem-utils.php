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

	/**
	 * Creates a directory and adds protection files if needed.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $dir_path The directory path to create.
	 * @param bool   $protect  Whether to add protection files. Default true.
	 * @return bool True if directory was created successfully, false otherwise.
	 */
	public static function create_protected_directory( $dir_path, $protect = true ) {
		if ( ! file_exists( $dir_path ) ) {
			$created = wp_mkdir_p( $dir_path );
			if ( ! $created ) {
				return false;
			}

			if ( $protect ) {
				return self::create_protection_files( $dir_path );
			}
		}
		return true;
	}

	/**
	 * Gets the list of allowed mime types for file uploads.
	 * This provides a common method across Jetpack components to get safe mime types.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $default_mime_types Array of mime types to start with.
	 * @return array Array of allowed mime types.
	 */
	public static function get_allowed_mime_types( $default_mime_types = array() ) {
		if ( empty( $default_mime_types ) ) {
			$default_mime_types = array(
				// Image formats.
				'jpg|jpeg|jpe' => 'image/jpeg',
				'gif'          => 'image/gif',
				'png'          => 'image/png',
				'bmp'          => 'image/bmp',
				'tiff|tif'     => 'image/tiff',
				'webp'         => 'image/webp',
				'avif'         => 'image/avif',
				'ico'          => 'image/x-icon',
				'heic'         => 'image/heic',
				'heif'         => 'image/heif',
				'heics'        => 'image/heic-sequence',
				'heifs'        => 'image/heif-sequence',
			);
		}

		/**
		 * Filter the allowed mime types for file uploads.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $default_mime_types Array of mime types.
		 */
		return apply_filters( 'jetpack_allowed_mime_types', $default_mime_types );
	}

	/**
	 * Checks if the file type is allowed.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $file_name The name of the file to check.
	 * @param array  $allowed_mime_types Optional. Array of allowed mime types.
	 * @return true|\WP_Error True if the file type is allowed, WP_Error object otherwise.
	 */
	public static function check_file_type( $file_name, $allowed_mime_types = array() ) {
		if ( empty( $allowed_mime_types ) ) {
			$allowed_mime_types = self::get_allowed_mime_types();
		}

		$file_type = \wp_check_filetype( $file_name, $allowed_mime_types );

		if ( ! $file_type['type'] ) {
			return new \WP_Error(
				'invalid_file_type',
				\__( 'Invalid file type. Please check the list of allowed file types.', 'jetpack' )
			);
		}

		if ( ! in_array( $file_type['type'], $allowed_mime_types, true ) ) {
			return new \WP_Error(
				'invalid_file_type',
				\__( 'File type not allowed for security reasons.', 'jetpack' )
			);
		}

		return true;
	}

	/**
	 * Generates a secure filename for uploads.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $original_filename The original filename.
	 * @param bool   $include_original  Whether to include part of the original filename. Default true.
	 * @return string A secure random filename.
	 */
	public static function generate_secure_filename( $original_filename, $include_original = true ) {
		$file_parts = pathinfo( $original_filename );
		$extension  = isset( $file_parts['extension'] ) ? strtolower( $file_parts['extension'] ) : '';

		// Create a unique name
		$unique = wp_generate_password( 8, false, false );
		$hash   = substr( wp_hash( $file_parts['filename'] . uniqid() . $unique ), 0, 8 );

		// Include part of the original name if requested
		if ( $include_original && isset( $file_parts['filename'] ) ) {
			$base = sanitize_file_name( substr( $file_parts['filename'], 0, 20 ) );
			$base = empty( $base ) ? 'file' : $base;
			$name = sprintf( '%s-%s-%s', $base, time(), $hash );
		} else {
			$name = sprintf( '%s-%s', time(), $hash );
		}

		return $extension ? "{$name}.{$extension}" : $name;
	}
}
