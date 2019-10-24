<?php
/**
 * The Jetpack Backup Helper Script Manager class.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup;

/**
 * Helper_Script_Manager manages installation, deletion and cleanup of Helper Scripts
 * to assist with backing up Jetpack Sites.
 */
class Helper_Script_Manager {

	const RELATIVE_INSTALL_LOCATIONS = array( '', 'wp-content', 'wp-content/uploads' );
	const TEMP_DIRECTORY             = 'jetpack-temp';
	const HELPER_HEADER              = "<?php /* JPR Helper Script */\n";
	const EXPIRY_TIME                = 8 * 3600; // 8 hours

	const README_LINES = array(
		'These files have been put on your server by Jetpack to assist with backups and restores of your site content. They are cleaned up automatically when we no longer need them.',
		'If you no longer have Jetpack connected to your site, you can delete them manually.',
		'If you have questions or need assistance, please contact Jetpack Support at https://jetpack.com/support/',
		'If you like to build amazing things with WordPress, you should visit automattic.com/jobs and apply to join the fun – mention this file when you apply!;',
	);

	const INDEX_FILE = '<?php // Silence is golden';

	/**
	 * Installs a Helper Script, and returns its filesystem path and access url.
	 *
	 * @access public
	 * @static
	 *
	 * @param string $script_body Helper Script file contents.
	 * @return array|WP_Error     Either an array containing the path and url of the helper script, or an error.
	 */
	public static function install_helper_script( $script_body ) {
		// Check that the script body contains the correct header.
		if ( strncmp( $script_body, self::HELPER_HEADER, strlen( self::HELPER_HEADER ) ) !== 0 ) {
			return new \WP_Error( 'invalid_helper', 'Invalid Helper Script header' );
		}

		// Create a jetpack-temp directory for the Helper Script.
		$relative_temp_dir = self::create_temp_directory();
		if ( is_wp_error( $relative_temp_dir ) ) {
			return $relative_temp_dir;
		}

		// Generate a random filename, avoid clashes.
		$max_attempts = 5;
		for ( $attempt = 0; $attempt < $max_attempts; $attempt++ ) {
			$file_key           = wp_generate_password( 10, false );
			$relative_file_path = trailingslashit( $relative_temp_dir ) . 'jp-helper-' . $file_key . '.php';
			$absolute_file_path = trailingslashit( ABSPATH ) . $relative_file_path;

			if ( ! file_exists( $absolute_file_path ) ) {
				// Attempt to write helper script.
				$bytes_written = file_put_contents( $absolute_file_path, $script_body );
				if ( strlen( $script_body ) !== $bytes_written ) {
					if ( file_exists( $absolute_file_path ) ) {
						unlink( $absolute_file_path );
					}

					continue;
				}

				// Always schedule a cleanup run shortly after EXPIRY_TIME.
				wp_schedule_single_event( time() + self::EXPIRY_TIME + 60, 'jetpack_backup_cleanup_helper_scripts' );

				// Success! Figure out the URL and return the path and URL.
				return array(
					'path' => $absolute_file_path,
					'url'  => trailingslashit( get_site_url() ) . $relative_file_path,
				);
			}
		}

		return new \WP_Error( 'install_faied', 'Failed to install Helper Script' );
	}

	/**
	 * Given a path, verify it looks like a helper script and then delete it if so.
	 *
	 * @access public
	 * @static
	 *
	 * @param string $path Path to Helper Script to delete.
	 * @return boolean     True if the file is deleted (or does not exist).
	 */
	public static function delete_helper_script( $path ) {
		if ( ! file_exists( $path ) ) {
			return true;
		}

		// Check this file looks like a JPR helper script.
		$header = file_get_contents( $path, false, null, 0, strlen( self::HELPER_HEADER ) );
		if ( self::HELPER_HEADER !== $header ) {
			return false;
		}

		return unlink( $path );
	}

	/**
	 * Search for Helper Scripts that are suspiciously old, and clean them out.
	 *
	 * @access public
	 * @static
	 */
	public static function cleanup_expired_helper_scripts() {
		foreach ( self::RELATIVE_INSTALL_LOCATIONS as $relative_dir ) {
			$absolute_dir = trailingslashit( ABSPATH ) . $relative_dir;
			$temp_dir     = trailingslashit( $absolute_dir ) . self::TEMP_DIRECTORY;

			if ( is_dir( $temp_dir ) ) {
				// Find expired helper scripts and delete them.
				$helper_scripts = glob( trailingslashit( $temp_dir ) . 'jp-helper-*.php' );
				if ( is_array( $helper_scripts ) ) {
					$expiry_threshold = time() - self::EXPIRY_TIME;

					foreach ( $helper_scripts as $filename ) {
						if ( filemtime( $filename ) < $expiry_threshold ) {
							self::delete_helper_script( $filename );
						}
					}
				}

				// Delete the directory if it's empty now.
				self::delete_empty_helper_directory( $temp_dir );
			}
		}
	}

	/**
	 * Delete a helper script directory if it's empty
	 *
	 * @access public
	 * @static
	 *
	 * @param string $dir Path to Helper Script directory.
	 * @return boolean    True if the directory is deleted
	 */
	private static function delete_empty_helper_directory( $dir ) {
		if ( ! is_dir( $dir ) ) {
			return false;
		}

		// Tally the files in the target directory, and reject if there are too many.
		$glob_path    = trailingslashit( $dir ) . '*';
		$dir_contents = glob( $glob_path );
		if ( count( $dir_contents ) > 2 ) {
			return false;
		}

		// Check that the only remaining files are a README and index.php generated by this system.
		$allowed_files = array(
			'README'    => self::README_LINES[0],
			'index.php' => self::INDEX_FILE,
		);

		foreach ( $dir_contents as $path ) {
			$basename = basename( $path );
			if ( ! isset( $allowed_files[ $basename ] ) ) {
				return false;
			}

			// Verify the file starts with the expected contents.
			$expected_header = $allowed_files[ $basename ];
			$file_header     = file_get_contents( $path, false, null, 0, strlen( $expected_header ) );
			if ( $file_header !== $expected_header ) {
				return false;
			}

			if ( ! unlink( $path ) ) {
				return false;
			}
		}

		// If the directory is now empty, delete it.
		if ( count( glob( $glob_path ) ) === 0 ) {
			return rmdir( $dir );
		}

		return false;
	}

	/**
	 * Find an appropriate location for a jetpack-temp folder, and create one
	 *
	 * @access public
	 * @static
	 *
	 * @return WP_Error|string Relative path to temp directory if successful, WP_Error if not.
	 */
	private static function create_temp_directory() {
		foreach ( self::RELATIVE_INSTALL_LOCATIONS as $relative_dir ) {
			// Check if the install location is writeable.
			$absolute_dir = trailingslashit( ABSPATH ) . $relative_dir;
			if ( ! is_writeable( $absolute_dir ) ) {
				continue;
			}

			// Create if one doesn't already exist.
			$temp_dir = trailingslashit( $absolute_dir ) . self::TEMP_DIRECTORY;
			if ( ! is_dir( $temp_dir ) ) {
				if ( ! mkdir( $temp_dir ) ) {
					continue;
				}

				// Temp directory created. Drop a README and index.php file in there.
				self::write_supplementary_temp_files( $temp_dir );
			}

			return trailingslashit( $relative_dir ) . self::TEMP_DIRECTORY;
		}

		return new \WP_Error( 'temp_directory', 'Failed to create jetpack-temp directory' );
	}

	/**
	 * Write out an index.php file and a README file for a new jetpack-temp directory.
	 *
	 * @access public
	 * @static
	 *
	 * @param string $dir Path to Helper Script directory.
	 */
	private static function write_supplementary_temp_files( $dir ) {
		$readme_path = trailingslashit( $dir ) . 'README';
		file_put_contents( $readme_path, implode( "\n\n", self::README_LINES ) );

		$index_path = trailingslashit( $dir ) . 'index.php';
		file_put_contents( $index_path, self::INDEX_FILE );
	}

}
