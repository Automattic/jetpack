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

	/**
	 * @var string
	 */
	private $temp_directory;

	/**
	 * @var int
	 */
	private $expiry_time;

	/**
	 * @var int
	 */
	private $max_filesize;

	/**
	 * Keys specify the full path of install locations, and values point to the equivalent URL.
	 *
	 * @var array
	 */
	private $install_locations;

	const HELPER_HEADER = "<?php /* Jetpack Backup Helper Script */\n";

	const README_LINES = array(
		'These files have been put on your server by Jetpack to assist with backups and restores of your site content. They are cleaned up automatically when we no longer need them.',
		'If you no longer have Jetpack connected to your site, you can delete them manually.',
		'If you have questions or need assistance, please contact Jetpack Support at https://jetpack.com/support/',
		'If you like to build amazing things with WordPress, you should visit automattic.com/jobs and apply to join the fun – mention this file when you apply!;',
	);

	const INDEX_FILE = '<?php // Silence is golden';

	/**
	 * Create Helper Script Manager.
	 *
	 * @param string $temp_directory
	 * @param int $expiry_time
	 * @param int $max_filesize
	 * @param array $install_locations Associative array of possible places to install a jetpack-temp directory, along
	 *   with the URL to access each.
	 */
	public function __construct(
		$temp_directory = 'jetpack-temp',
		$expiry_time = 60 * 60 * 8,
		$max_filesize = 1024 * 1024,
		$install_locations = null
	) {
		if ( is_null( $install_locations ) ) {
			// Include WordPress root and wp-content.
			$install_locations = array(
				\ABSPATH        => \get_site_url(),
				\WP_CONTENT_DIR => \WP_CONTENT_URL,
			);

			// Include uploads folder.
			$upload_dir_info                                  = \wp_upload_dir();
			$install_locations[ $upload_dir_info['basedir'] ] = $upload_dir_info['baseurl'];
		}

		$this->temp_directory    = $temp_directory;
		$this->expiry_time       = $expiry_time;
		$this->max_filesize      = $max_filesize;
		$this->install_locations = $install_locations;
	}

	/**
	 * Installs a Helper Script, and returns its filesystem path and access url.
	 *
	 * @param string $script_body Helper Script file contents.
	 *
	 * @return array|WP_Error     Either an array containing the path and url of the helper script, or an error.
	 */
	public function install_helper_script( $script_body ) {
		// Check that the script body contains the correct header.
		if ( strncmp( $script_body, static::HELPER_HEADER, strlen( static::HELPER_HEADER ) ) !== 0 ) {
			return new \WP_Error( 'invalid_helper', 'Invalid Helper Script header' );
		}

		// Refuse to install a Helper Script that is too large.
		if ( strlen( $script_body ) > $this->max_filesize ) {
			return new \WP_Error( 'invalid_helper', 'Invalid Helper Script size' );
		}

		// Replace '[wp_path]' in the Helper Script with the WordPress installation location. Allows the Helper Script to find WordPress.
		$script_body = str_replace( '[wp_path]', addslashes( ABSPATH ), $script_body );

		$wp_filesystem = static::get_wp_filesystem();
		if ( ! $wp_filesystem ) {
			return new \WP_Error( 'install_failed', 'Failed to install Helper Script' );
		}

		// Create a jetpack-temp directory for the Helper Script.
		$temp_directory = $this->create_temp_directory();
		if ( \is_wp_error( $temp_directory ) ) {
			return $temp_directory;
		}

		// Generate a random filename, avoid clashes.
		$max_attempts = 5;
		for ( $attempt = 0; $attempt < $max_attempts; $attempt ++ ) {
			$file_key  = wp_generate_password( 10, false );
			$file_name = 'jp-helper-' . $file_key . '.php';
			$file_path = trailingslashit( $temp_directory['path'] ) . $file_name;

			if ( ! $wp_filesystem->exists( $file_path ) ) {
				// Attempt to write helper script.
				if ( ! static::put_contents( $file_path, $script_body ) ) {
					if ( $wp_filesystem->exists( $file_path ) ) {
						$wp_filesystem->delete( $file_path );
					}

					continue;
				}

				// Always schedule a cleanup run shortly after EXPIRY_TIME.
				\wp_schedule_single_event( time() + $this->expiry_time + 60, 'jetpack_backup_cleanup_helper_scripts' );

				// Success! Figure out the URL and return the path and URL.
				return array(
					'path' => $file_path,
					'url'  => trailingslashit( $temp_directory['url'] ) . $file_name,
				);
			}
		}

		return new \WP_Error( 'install_faied', 'Failed to install Helper Script' );
	}

	/**
	 * Given a path, verify it looks like a helper script and then delete it if so.
	 *
	 * @param string $path Path to Helper Script to delete.
	 *
	 * @return boolean     True if the file is deleted (or does not exist).
	 */
	public function delete_helper_script( $path ) {
		$wp_filesystem = static::get_wp_filesystem();
		if ( ! $wp_filesystem ) {
			return false;
		}

		if ( ! $wp_filesystem->exists( $path ) ) {
			return true;
		}

		// Check this file looks like a JPR helper script.
		if ( ! $this->verify_file_header( $path, static::HELPER_HEADER ) ) {
			return false;
		}

		return $wp_filesystem->delete( $path );
	}

	/**
	 * Search for Helper Scripts that are suspiciously old, and clean them out.
	 */
	public function cleanup_expired_helper_scripts() {
		$this->cleanup_helper_scripts( time() - $this->expiry_time );
	}

	/**
	 * Search for and delete all Helper Scripts. Used during uninstallation.
	 */
	public function delete_all_helper_scripts() {
		$this->cleanup_helper_scripts( null );
	}

	/**
	 * Search for and delete Helper Scripts. If an $expiry_time is specified, only delete Helper Scripts
	 * with an mtime older than $expiry_time. Otherwise, delete them all.
	 *
	 * @param int|null $expiry_time If specified, only delete scripts older than $expiry_time.
	 */
	public function cleanup_helper_scripts( $expiry_time = null ) {
		$wp_filesystem = static::get_wp_filesystem();
		if ( ! $wp_filesystem ) {
			return;
		}

		foreach ( $this->install_locations as $directory => $url ) {
			$temp_dir = trailingslashit( $directory ) . $this->temp_directory;

			if ( $wp_filesystem->is_dir( $temp_dir ) ) {
				// Find expired helper scripts and delete them.
				$helper_scripts = $wp_filesystem->dirlist( $temp_dir );
				if ( is_array( $helper_scripts ) ) {
					foreach ( $helper_scripts as $entry ) {
						if ( preg_match( '/^jp-helper-*\.php$/', $entry['name'] ) && ( null === $expiry_time || $entry['lastmodunix'] < $expiry_time ) ) {
							$this->delete_helper_script( trailingslashit( $temp_dir ) . $entry['name'] );
						}
					}
				}

				// Delete the directory if it's empty now.
				$this->delete_empty_helper_directory( $temp_dir );
			}
		}
	}

	/**
	 * Delete a helper script directory if it's empty
	 *
	 * @param string $dir Path to Helper Script directory.
	 *
	 * @return boolean    True if the directory is deleted
	 */
	private function delete_empty_helper_directory( $dir ) {
		$wp_filesystem = static::get_wp_filesystem();
		if ( ! $wp_filesystem ) {
			return false;
		}

		if ( ! $wp_filesystem->is_dir( $dir ) ) {
			return false;
		}

		// Tally the files in the target directory, and reject if there are too many.
		$dir_contents = $wp_filesystem->dirlist( $dir );
		if ( $dir_contents === false || count( $dir_contents ) > 2 ) {
			return false;
		}

		// Check that the only remaining files are a README and index.php generated by this system.
		$allowed_files = array(
			'README'    => static::README_LINES[0],
			'index.php' => static::INDEX_FILE,
		);

		foreach ( $dir_contents as $entry ) {
			$basename = $entry['name'];
			$path     = trailingslashit( $dir ) . $basename;
			if ( ! isset( $allowed_files[ $basename ] ) ) {
				return false;
			}

			// Verify the file starts with the expected contents.
			if ( ! $this->verify_file_header( $path, $allowed_files[ $basename ] ) ) {
				return false;
			}

			if ( ! $wp_filesystem->delete( $path ) ) {
				return false;
			}
		}

		// If the directory is now empty, delete it.
		$dir_contents = $wp_filesystem->dirlist( $dir );
		if ( $dir_contents === false || count( $dir_contents ) === 0 ) {
			return $wp_filesystem->rmdir( $dir );
		}

		return false;
	}

	/**
	 * Find an appropriate location for a jetpack-temp folder, and create one
	 *
	 * @return WP_Error|array Array containing the url and path of the temp directory if successful, WP_Error if not.
	 */
	private function create_temp_directory() {
		$wp_filesystem = static::get_wp_filesystem();
		if ( ! $wp_filesystem ) {
			return new \WP_Error( 'temp_directory', 'Failed to create jetpack-temp directory' );
		}

		foreach ( $this->install_locations as $directory => $url ) {
			// Check if the install location is writeable.
			if ( ! $wp_filesystem->is_writable( $directory ) ) {
				continue;
			}

			// Create if one doesn't already exist.
			$temp_dir = trailingslashit( $directory ) . $this->temp_directory;
			if ( ! $wp_filesystem->is_dir( $temp_dir ) ) {
				if ( ! $wp_filesystem->mkdir( $temp_dir ) ) {
					continue;
				}

				// Temp directory created. Drop a README and index.php file in there.
				static::write_supplementary_temp_files( $temp_dir );
			}

			return array(
				'path' => trailingslashit( $directory ) . $this->temp_directory,
				'url'  => trailingslashit( $url ) . $this->temp_directory,
			);
		}

		return new \WP_Error( 'temp_directory', 'Failed to create jetpack-temp directory' );
	}

	/**
	 * Write out an index.php file and a README file for a new jetpack-temp directory.
	 *
	 * @param string $dir Path to Helper Script directory.
	 */
	private static function write_supplementary_temp_files( $dir ) {
		$readme_path = trailingslashit( $dir ) . 'README';
		static::put_contents( $readme_path, implode( "\n\n", static::README_LINES ) );

		$index_path = trailingslashit( $dir ) . 'index.php';
		static::put_contents( $index_path, static::INDEX_FILE );
	}

	/**
	 * Write a file to the specified location with the specified contents.
	 *
	 * @param string $file_path Path to write to.
	 * @param string $contents File contents to write.
	 *
	 * @return boolean          True if successfully written.
	 */
	private static function put_contents( $file_path, $contents ) {
		$wp_filesystem = static::get_wp_filesystem();
		if ( ! $wp_filesystem ) {
			return false;
		}

		return $wp_filesystem->put_contents( $file_path, $contents );
	}

	/**
	 * Checks that a file exists, is readable, and has the expected header.
	 *
	 * @param string $file_path File to verify.
	 * @param string $expected_header Header that the file should have.
	 *
	 * @return boolean                True if the file exists, is readable, and the header matches.
	 */
	private function verify_file_header( $file_path, $expected_header ) {
		$wp_filesystem = static::get_wp_filesystem();
		if ( ! $wp_filesystem ) {
			return false;
		}

		// Verify the file exists and is readable.
		if ( ! $wp_filesystem->exists( $file_path ) || ! $wp_filesystem->is_readable( $file_path ) ) {
			return false;
		}

		// Verify that the file isn't too big or small.
		$file_size = $wp_filesystem->size( $file_path );
		if ( $file_size < strlen( $expected_header ) || $file_size > $this->max_filesize ) {
			return false;
		}

		// Read the file and verify its header.
		$contents = $wp_filesystem->get_contents( $file_path );

		return ( strncmp( $contents, $expected_header, strlen( $expected_header ) ) === 0 );
	}

	/**
	 * Get the WP_Filesystem.
	 *
	 * @return \WP_Filesystem|null
	 */
	private static function get_wp_filesystem() {
		global $wp_filesystem;

		if ( ! $wp_filesystem ) {
			if ( ! function_exists( '\\WP_Filesystem' ) ) {
				require_once ABSPATH . 'wp-admin/includes/file.php';
			}

			if ( ! \WP_Filesystem() ) {
				return null;
			}
		}

		return $wp_filesystem;
	}
}
