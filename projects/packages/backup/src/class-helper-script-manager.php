<?php
/**
 * The Jetpack Backup Helper Script Manager class.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup;

use Exception;

/**
 * Helper_Script_Manager manages installation, deletion and cleanup of Helper Scripts
 * to assist with backing up Jetpack Sites.
 *
 * Does *not* use WP_Filesystem, because the helper script is something that we'll call over HTTP, so we don't want it
 * to end up on an FTP server somewhere. Also, PHP provides us with better error reporting than WP_Filesystem.
 */
class Helper_Script_Manager {

	/**
	 * Name of a directory that will be created for storing the helper script.
	 */
	const TEMP_DIRECTORY = 'jetpack-temp';

	/**
	 * How long until the helper script will "expire" and refuse taking requests, in seconds.
	 */
	const EXPIRY_TIME = 60 * 60 * 8;

	/**
	 * Maximum size of the helper script, in bytes.
	 */
	const MAX_FILESIZE = 1024 * 1024;

	/**
	 * Associative array of possible places to install a jetpack-temp directory, along with the URL to access each.
	 *
	 * Keys specify the full path of install locations, and values point to the equivalent URL.
	 *
	 * If null, then install locations will be determined dynamically at the point of an install.
	 *
	 * @var array|null
	 */
	protected $custom_install_locations;

	/**
	 * Filenames to ignore in scandir()'s return value.
	 *
	 * @var string[]
	 */
	protected $scandir_ignored_names = array( '.', '..' );

	/**
	 * Header that the helper script is expected to start with.
	 */
	const HELPER_HEADER = "<?php /* Jetpack Backup Helper Script */\n";

	/**
	 * Lines that will be written to README in the helper directory.
	 */
	const README_LINES = array(
		'These files have been put on your server by Jetpack to assist with backups and restores of your site ' .
		'content. They are cleaned up automatically when we no longer need them.',
		'If you no longer have Jetpack connected to your site, you can delete them manually.',
		'If you have questions or need assistance, please contact Jetpack Support at https://jetpack.com/support/',
		'If you like to build amazing things with WordPress, you should visit automattic.com/jobs and apply to join ' .
		'the fun – mention this file when you apply!;',
	);

	/**
	 * Data that will be written to index.php in the helper directory.
	 */
	const INDEX_FILE = '<?php // Silence is golden';

	/**
	 * Create Helper Script Manager.
	 *
	 * @param array|null $custom_install_locations Associative array of possible places to install a jetpack-temp
	 *   directory, along with the URL to access each.
	 */
	public function __construct( $custom_install_locations = null ) {
		$this->custom_install_locations = $custom_install_locations;
	}

	/**
	 * Get either the default install locations, or the ones configured in the constructor.
	 *
	 * Has to be done late, i.e. can't be done in constructor, because in __construct() not all constants / functions
	 * might be available.
	 *
	 * @return array Keys specify the full path of install locations, and values point to the equivalent URL.
	 */
	public function install_locations() {
		if ( $this->custom_install_locations !== null ) {
			return $this->custom_install_locations;
		}

		$upload_dir_info = \wp_upload_dir();

		$abspath_dir    = realpath( \ABSPATH );
		$wp_content_dir = realpath( \WP_CONTENT_DIR );
		$wp_uploads_dir = realpath( $upload_dir_info['basedir'] );

		$abspath_url    = \get_site_url();
		$wp_content_url = \WP_CONTENT_URL;
		$wp_uploads_url = $upload_dir_info['baseurl'];

		// I think we mess up the order in which we load things somewhere in a test, so "wp-content" and
		// "wp-content/uploads/" URLs don't actually have the scheme+host part in them.
		if ( ! wp_http_validate_url( $wp_content_url ) ) {
			$wp_content_url = $abspath_url . $wp_content_url;
		}
		if ( ! wp_http_validate_url( $wp_uploads_url ) ) {
			$wp_uploads_url = $abspath_url . $wp_uploads_url;
		}

		return array(

			// WordPress root:
			$abspath_dir    => $abspath_url,

			// wp-content:
			$wp_content_dir => $wp_content_url,

			// wp-content/uploads:
			$wp_uploads_dir => $wp_uploads_url,

		);
	}

	/**
	 * Installs a Helper Script, and returns its filesystem path and access url.
	 *
	 * @param string $script_body Helper Script file contents.
	 *
	 * @return array|\WP_Error Either an array containing the filesystem path ("path"), the URL ("url") of the helper
	 *   script, and the WordPress root ("abspath"), or an instance of WP_Error.
	 */
	public function install_helper_script( $script_body ) {
		// Check that the script body contains the correct header.
		$actual_header = static::string_starts_with_substring( $script_body, static::HELPER_HEADER );
		if ( true !== $actual_header ) {
			return new \WP_Error(
				'bad_header',
				'Bad helper script header: 0x' . bin2hex( $actual_header ),
				array( 'status' => 400 )
			);
		}

		// Refuse to install a Helper Script that is too large.
		$helper_script_size = strlen( $script_body );
		if ( $helper_script_size > static::MAX_FILESIZE ) {
			return new \WP_Error(
				'too_big',
				"Helper script is bigger ($helper_script_size bytes) " .
				'than the max. size (' . static::MAX_FILESIZE . ' bytes)',
				array( 'status' => 413 )
			);
		}

		// Replace '[wp_path]' in the Helper Script with the WordPress installation location. Allows the Helper Script
		// to find WordPress.
		$wp_path_marker = '[wp_path]';
		$script_body    = str_replace(
			$wp_path_marker,
			addslashes( realpath( ABSPATH ) ),
			$script_body,
			$wp_path_marker_replacement_count
		);
		if ( 0 === $wp_path_marker_replacement_count ) {
			return new \WP_Error(
				'no_wp_path_marker',
				"Helper script does not have the '$wp_path_marker' marker",
				array( 'status' => 400 )
			);
		}

		$failure_paths_and_reasons = array();

		foreach ( $this->install_locations() as $directory => $url ) {
			try {
				$installed = $this->install_to_location_or_throw( $script_body, $directory, $url );

				// Always schedule a cleanup run shortly after EXPIRY_TIME.
				\wp_schedule_single_event(
					time() + static::EXPIRY_TIME + 60,
					'jetpack_backup_cleanup_helper_scripts'
				);

				return array(
					'path'    => $installed['path'],
					'url'     => $installed['url'],
					'abspath' => realpath( ABSPATH ),
				);

			} catch ( Exception $exception ) {
				$failure_paths_and_reasons[] = "directory '$directory' (URL '$url'): " . $exception->getMessage();
			}
		}

		return new \WP_Error(
			'all_locations_failed',
			'Unable to write the helper script to any install locations; ' .
			'tried: ' . implode( ';', $failure_paths_and_reasons ),
			array( 'status' => 500 )
		);
	}

	/**
	 * Install helper script to a directory, or throw an exception.
	 *
	 * @param string $script_body Helper script's body.
	 * @param string $directory Candidate directory to create "jetpack-temp" in and write the helper script.
	 * @param string $url Base URL that the files in a directory are expected to be available at.
	 *
	 * @return string[] Array with "path" (location to the installed helper script) and "url"
	 *   (URL of the installed helper script) keys.
	 * @throws Exception On I/O errors.
	 */
	protected function install_to_location_or_throw( $script_body, $directory, $url ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
		if ( ! is_writable( $directory ) ) {
			throw new Exception( "Directory '$directory' is not writable" );
		}

		$temp_dir = trailingslashit( $directory ) . static::TEMP_DIRECTORY;

		if ( ! is_dir( $temp_dir ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
			if ( ! mkdir( $temp_dir ) ) {
				throw new Exception( "Unable to create directory '$temp_dir'" );
			}
		}

		$readme_path = trailingslashit( $temp_dir ) . 'README';
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		if ( false === file_put_contents( $readme_path, implode( "\n\n", static::README_LINES ) ) ) {
			throw new Exception( "Unable to write README to '$readme_path'" );
		}

		$index_path = trailingslashit( $temp_dir ) . 'index.php';
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		if ( false === file_put_contents( $index_path, static::INDEX_FILE ) ) {
			throw new Exception( "Unable to write index.php to '$index_path'" );
		}

		$file_key  = wp_generate_password( 10, false );
		$file_name = 'jp-helper-' . $file_key . '.php';
		$file_path = trailingslashit( $temp_dir ) . $file_name;
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		if ( false === file_put_contents( $file_path, $script_body ) ) {
			throw new Exception( "Unable to write helper script to '$file_path'" );
		}

		return array(
			'path' => $file_path,
			'url'  => trailingslashit( $url ) . trailingslashit( static::TEMP_DIRECTORY ) . $file_name,
		);
	}

	/**
	 * Ensure that the helper script is gone (by deleting it, if needed).
	 *
	 * @param string $path Path to the helper script to delete.
	 *
	 * @return true|\WP_Error True if the file helper script is gone (either it got deleted, or it was never there), or
	 *   WP_Error instance on deletion failures.
	 */
	public function delete_helper_script( $path ) {
		try {
			$this->delete_helper_script_or_throw( $path );
		} catch ( Exception $exception ) {
			return new \WP_Error(
				'deletion_failure',
				"Unable to delete helper script at '$path': " . $exception->getMessage(),
				array( 'status' => 500 )
			);
		}

		return true;
	}

	/**
	 * Ensure that the helper script is gone (by deleting it, if needed), throw an exception on errors.
	 *
	 * @param string $path Path to the helper script to delete.
	 *
	 * @return void
	 * @throws Exception On deletion failures.
	 */
	protected function delete_helper_script_or_throw( $path ) {

		if ( ! file_exists( $path ) ) {
			return;
		}

		if ( ! is_readable( $path ) ) {
			throw new Exception( "File '$path' is not readable" );
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
		if ( ! is_writable( $path ) ) {
			throw new Exception( "File '$path' is not writable" );
		}

		$helper_script_size = filesize( $path );
		if ( false === $helper_script_size ) {
			throw new Exception( "Unable to determine file size for file '$path'" );
		}

		// Check this file looks like a JPR helper script.
		$helper_header_size = strlen( static::HELPER_HEADER );
		if ( $helper_script_size < $helper_header_size ) {
			throw new Exception(
				"Helper script is smaller ($helper_script_size bytes) " .
				"than the expected header ($helper_header_size bytes)"
			);
		}
		if ( $helper_script_size > static::MAX_FILESIZE ) {
			throw new Exception(
				"Helper script is bigger ($helper_script_size bytes) " .
				'than the max. size (' . static::MAX_FILESIZE . ' bytes)'
			);
		}

		$actual_header = static::verify_file_header( $path, static::HELPER_HEADER );
		if ( true !== $actual_header ) {
			throw new Exception( 'Bad helper script header: 0x' . bin2hex( $actual_header ) );
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		if ( ! unlink( $path ) ) {
			throw new Exception( 'Unable to delete helper script' );
		}

		$this->delete_helper_directory_if_empty( dirname( $path ) );
	}

	/**
	 * Search for Helper Scripts that are suspiciously old, and clean them out.
	 *
	 * @return true|\WP_Error True if all expired helper scripts got cleaned up successfully, or an instance of
	 *   WP_Error if one or more expired helper scripts didn't manage to get cleaned up.
	 */
	public function cleanup_expired_helper_scripts() {
		try {
			$this->cleanup_helper_scripts( time() - static::EXPIRY_TIME );
		} catch ( Exception $exception ) {
			return new \WP_Error(
				'cleanup_failed',
				'Unable to clean up expired helper scripts: ' . $exception->getMessage(),
				array( 'status' => 500 )
			);
		}

		return true;
	}

	/**
	 * Search for and delete all Helper Scripts. Used during uninstallation.
	 *
	 * @return true|\WP_Error True if all helper scripts got deleted successfully, or an instance of WP_Error if one or
	 *   more helper scripts didn't manage to get deleted.
	 */
	public function delete_all_helper_scripts() {
		try {
			$this->cleanup_helper_scripts();
		} catch ( Exception $exception ) {
			return new \WP_Error(
				'cleanup_failed',
				'Unable to clean up all helper scripts: ' . $exception->getMessage(),
				array( 'status' => 500 )
			);
		}

		return true;
	}

	/**
	 * Search for and delete Helper Scripts. If an $expiry_time is specified, only delete Helper Scripts
	 *   with a mtime older than $expiry_time. Otherwise, delete them all.
	 *
	 * @param int|null $expiry_time If specified, only delete scripts older than this UNIX timestamp.
	 *
	 * @return void
	 * @throws Exception If one or more helper scripts doesn't manage to get cleaned up.
	 */
	protected function cleanup_helper_scripts( $expiry_time = null ) {

		$error_messages = array();

		foreach ( $this->install_locations() as $directory => $url ) {
			$temp_dir = trailingslashit( trailingslashit( $directory ) . static::TEMP_DIRECTORY );

			if ( is_dir( $temp_dir ) ) {

				// Find expired helper scripts and delete them.
				$temp_dir_contents = scandir( $temp_dir );
				if ( false === $temp_dir_contents ) {
					throw new Exception( "Unable to list directory '$temp_dir_contents'" );
				}

				foreach ( $temp_dir_contents as $name ) {

					if ( in_array( $name, $this->scandir_ignored_names, true ) ) {
						continue;
					}

					$full_path = $temp_dir . $name;

					$last_modified = filemtime( $full_path );
					if ( false === $last_modified ) {
						throw new Exception( "Unable to get modification time for file '$full_path'" );
					}

					if ( preg_match( '/^jp-helper-.*\.php$/', $name ) ) {
						if ( null === $expiry_time || $last_modified < $expiry_time ) {
							try {
								$this->delete_helper_script_or_throw( $full_path );
							} catch ( Exception $exception ) {
								$error_messages[] = $exception->getMessage();
							}
						}
					}
				}

				// Delete the directory if it's empty now.
				$this->delete_helper_directory_if_empty( $temp_dir );
			}
		}

		if ( count( $error_messages ) > 0 ) {
			throw new Exception(
				'Unable to clean up one or more helper scripts: ' . implode( ';', $error_messages )
			);
		}
	}

	/**
	 * Delete a helper script directory if it's empty.
	 *
	 * @param string $dir Path to the helper script directory.
	 *
	 * @return bool True if the directory is missing, or was empty and got deleted; false if directory still contains
	 *   something and wasn't deleted.
	 * @throws Exception On I/O errors.
	 */
	protected function delete_helper_directory_if_empty( $dir ) {

		if ( ! is_dir( $dir ) ) {
			return true;
		}

		// Check that the only remaining files are a README and index.php generated by this system.
		$allowed_files_and_headers = array(
			'README'    => static::README_LINES[0],
			'index.php' => static::INDEX_FILE,
		);

		$dir_contents = scandir( $dir );
		if ( false === $dir_contents ) {
			throw new Exception( "Unable to list directory '$dir'" );
		}

		if ( count( $dir_contents ) > count( $allowed_files_and_headers ) + count( $this->scandir_ignored_names ) ) {
			return false;
		}

		foreach ( $dir_contents as $name ) {

			if ( in_array( $name, $this->scandir_ignored_names, true ) ) {
				continue;
			}

			$full_path = trailingslashit( $dir ) . $name;
			if ( ! isset( $allowed_files_and_headers[ $name ] ) ) {
				return false;
			}

			// Verify the file starts with the expected contents.
			$actual_header = static::verify_file_header( $full_path, $allowed_files_and_headers[ $name ] );
			if ( true !== $actual_header ) {
				throw new Exception( "Bad header for file '$full_path': 0x" . bin2hex( $actual_header ) );
			}

			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			if ( ! unlink( $full_path ) ) {
				throw new Exception( "Unable to delete file '$full_path'" );
			}
		}

		// If the directory is now empty, delete it.
		$dir_contents_after_cleanup = scandir( $dir );
		if ( false === $dir_contents_after_cleanup ) {
			throw new Exception( "Unable to list directory '$dir' after cleanup" );
		}

		if ( count( $dir_contents_after_cleanup ) <= count( $this->scandir_ignored_names ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
			if ( ! rmdir( $dir ) ) {
				throw new Exception( "Unable to remove directory '$dir'" );
			}
		}

		return true;
	}

	/**
	 * Test if string starts with a substring, and if it doesn't, return the actual prefix.
	 *
	 * @param string $string String to search in.
	 * @param string $expected_prefix Expected prefix.
	 *
	 * @return bool|string True if string starts with a substring, or the actual prefix that was found instead of the
	 *   expected prefix.
	 */
	protected static function string_starts_with_substring( $string, $expected_prefix ) {
		$actual_prefix = substr( $string, 0, strlen( $expected_prefix ) );
		if ( $actual_prefix !== $expected_prefix ) {
			return $actual_prefix;
		}

		return true;
	}

	/**
	 * Verify that a file exists, is readable, and has the expected header.
	 *
	 * @param string $path File to verify.
	 * @param string $expected_header Header that the file should have.
	 *
	 * @return bool|string True if header matches, or an actual header if it doesn't match.
	 * @throws Exception If the file doesn't exist, isn't readable, or is of the wrong size.
	 */
	protected static function verify_file_header( $path, $expected_header ) {
		if ( ! file_exists( $path ) ) {
			throw new Exception( "File '$path' does not exist" );
		}

		if ( ! is_readable( $path ) ) {
			throw new Exception( "File '$path' is not readable" );
		}

		$file_size = filesize( $path );
		if ( false === $file_size ) {
			throw new Exception( "Unable to determine size for file '$path'" );
		}

		// Check this file looks like a JPR helper script.
		$expected_header_size = strlen( $expected_header );
		if ( $file_size < $expected_header_size ) {
			throw new Exception(
				"File is smaller ($file_size bytes) " .
				"than the expected header ($expected_header_size bytes)"
			);
		}
		if ( $file_size > static::MAX_FILESIZE ) {
			throw new Exception(
				"File is bigger ($file_size bytes) " .
				'than the max. size (' . static::MAX_FILESIZE . ' bytes)'
			);
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$file_contents = file_get_contents( $path );
		return static::string_starts_with_substring( $file_contents, $expected_header );
	}
}
