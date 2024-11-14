<?php
/**
 * Backup_Import_Manager file.
 *
 * @package wpcomsh
 */

namespace Imports;

// Include the file extractor.
require_once __DIR__ . '/utils/class-fileextractor.php';

use WP_Error;

/**
 * Class Backup_Import_Manager
 *
 * This class is responsible for managing the import of backups.
 */
class Backup_Import_Manager {
	/**
	 * The path to the ZIP or TAR file to be imported.
	 *
	 * @var string
	 */
	protected $zip_or_tar_file_path;
	/**
	 * The path where the backup will be imported.
	 *
	 * @var string
	 */
	protected $destination_path;
	/**
	 * An array of actions that the importer needs to perform.
	 *
	 * @var array
	 */
	protected $importer_actions = array(
		'preprocess',
		'process_files',
		'recreate_database',
		'postprocess_database',
		'verify_site_integrity',
		'clean_up',
	);
	/**
	 * An array of options.
	 *
	 * @var array
	 */
	protected $options = array();

	/**
	 * An array of valid option keys.
	 *
	 * @var array
	 */
	protected $valid_option_keys = array(
		'actions',
		'bump_stats',
		'dry_run',
		'skip_clean_up',
		'skip_unpack',
	);

	/**
	 * Importer type.
	 *
	 * @var string
	 */
	protected $importer_type = null;

	/**
	 * Constant representing the WordPress Playground importer type.
	 */
	const WORDPRESS_PLAYGROUND = 'wordpress_playground';
	/**
	 * Constant representing the Jetpack Backup importer type.
	 */
	const JETPACK_BACKUP = 'jetpack_backup';
	/**
	 * The prefix to use for temporary databases.
	 */
	const TEMPORARY_DB_PREFIX = 'tmp_';
	/**
	 * Constant representing the success status.
	 */
	const SUCCESS = 'success';
	/**
	 * Constant representing the failed status.
	 */
	const FAILED = 'failed';
	/**
	 * Constant representing the cancelled status.
	 */
	const CANCELLED = 'cancelled';

	/**
	 * Backup import status option name.
	 *
	 * @var string
	 */
	public static $backup_import_status_option = 'backup_import_status';

	/**
	 * Constructor for the Backup_Import_Manager class.
	 *
	 * This method initializes the $zip_or_tar_file_path and $destination_path properties.
	 *
	 * @param string $zip_or_tar_file_path The path to the ZIP or TAR file to be imported.
	 * @param string $destination_path The path where the backup will be imported.
	 * @param array  $options An array of options.
	 */
	public function __construct( $zip_or_tar_file_path, $destination_path, $options = array() ) {
		$this->zip_or_tar_file_path = $zip_or_tar_file_path;
		$this->destination_path     = trailingslashit( $destination_path );
		$this->options              = array_intersect_key( $options, array_flip( $this->valid_option_keys ) );
	}
	/**
	 * Import the backup.
	 *
	 * This method performs the following steps:
	 * 1. Extract the ZIP or TAR file to the destination path.
	 * 2. Determine the type of the importer based on the destination path.
	 * 3. Get an instance of the appropriate importer based on the type.
	 * 4. Call the importer's methods in the order specified in the $importer_actions array.
	 *
	 * @return bool|WP_Error True on success, or a WP_Error on failure.
	 */
	public function import() {
		$skip_clean_up = false;
		if ( isset( $this->options['skip_clean_up'] ) && is_bool( $this->options['skip_clean_up'] ) ) {
			$skip_clean_up = $this->options['skip_clean_up'];
		}

		$skip_unpack = false;
		if ( isset( $this->options['skip_unpack'] ) && is_bool( $this->options['skip_unpack'] ) ) {
			$skip_unpack = $this->options['skip_unpack'];
		}

		$bump_stats = true;
		if ( isset( $this->options['bump_stats'] ) && is_bool( $this->options['bump_stats'] ) ) {
			$bump_stats = $this->options['bump_stats'];
		}

		// check if there are import process that's already running
		$check_bail_result = $this->should_bail_out();

		if ( is_wp_error( $check_bail_result ) ) {

			// We don't update status to failed here, because we don't want to overwrite the status

			if ( $bump_stats ) {
				$this->bump_import_stats( $check_bail_result->get_error_code() );
			}

			return $check_bail_result;
		}

		// reset the import status before everything starts
		self::delete_backup_import_status();

		// unzip/untar the file
		if ( ! $skip_unpack ) {
			$this->update_status( array( 'status' => 'unpack_file' ) );
			$result = Utils\FileExtractor::extract( $this->zip_or_tar_file_path, $this->destination_path );

			if ( is_wp_error( $result ) ) {
				$this->update_status( array( 'status' => self::FAILED ) );

				if ( $bump_stats ) {
					$this->bump_import_stats( $result->get_error_code() );
				}

				return $result;
			}
		}

		// validate the type of the file
		$importer_type = self::determine_importer_type( $this->destination_path );
		if ( is_wp_error( $importer_type ) ) {
			$this->update_status( array( 'status' => self::FAILED ) );

			if ( $bump_stats ) {
				$this->bump_import_stats( $importer_type->get_error_code() );
			}

			return $importer_type;
		}

		// get the importer
		$importer = self::get_importer( $importer_type, $this->zip_or_tar_file_path, $this->destination_path );
		if ( is_wp_error( $importer ) ) {
			$this->update_status( array( 'status' => self::FAILED ) );

			if ( $bump_stats ) {
				$this->bump_import_stats( $importer->get_error_code() );
			}

			return $importer;
		} else {
			$this->importer_type = $importer_type;
		}

		$execute_actions = isset( $this->options['actions'] ) && count( $this->options['actions'] ) ? $this->options['actions'] : $this->importer_actions;
		$dry_run         = isset( $this->options['dry_run'] ) && $this->options['dry_run'];

		if ( $skip_clean_up ) {
			foreach ( $execute_actions as $key => $action ) {
				// Remove the cleanup action if the user has specified to skip cleanup.
				if ( $action === 'clean_up' ) {
					unset( $execute_actions[ $key ] );
				}
			}
		}

		foreach ( $execute_actions as $action ) {
			if ( ! method_exists( $importer, $action ) ) {
				continue;
			}

			// Before calling the importer's method, let's check if the status is cancelled.
			$cancel_result = $this->is_import_cancelled();

			if ( true === $cancel_result ) {
				// Clear the status.
				self::delete_backup_import_status();

				if ( $bump_stats ) {
					$this->bump_import_stats( 'backup_import_cancelled' );
				}

				return new WP_Error( 'backup_import_cancelled', __( 'The backup import has been cancelled.', 'wpcomsh' ) );
			}

			$this->update_status( array( 'status' => $action ) );

			if ( $dry_run ) {
				// Wait for 15-20 seconds in dry-run mode.
				sleep( \wp_rand( 15, 20 ) );
			} else {
				// Call the importer's method.
				$result = $importer->$action();

				if ( is_wp_error( $result ) ) {
					$this->update_status( array( 'status' => self::FAILED ) );

					if ( $bump_stats ) {
						$this->bump_import_stats( $result->get_error_code() );
					}

					return $result;
				}
			}
		}

		if ( $bump_stats ) {
			$this->bump_import_stats( 'success' );
		}

		return $this->update_status( array( 'status' => self::SUCCESS ) );
	}

	/**
	 * Updates the deployment status option.
	 *
	 * @param array $content The contents to be merged to the existing option.
	 *
	 * @return bool
	 */
	private function update_status( array $content ): bool {
		$existing = \get_option( self::$backup_import_status_option, array() );
		$new      = array_merge( $existing, $content );

		\update_option( self::$backup_import_status_option, $new );
		self::force_cache_unset();

		return true;
	}

	/**
	 * Bump the import stats.
	 *
	 * @param string $status The status of the import.
	 *
	 * @return bool|WP_Error True on success, or a WP_Error on failure.
	 */
	private function bump_import_stats( string $status ) {
		if ( isset( $this->options['dry_run'] ) && $this->options['dry_run'] ) {
			return true;
		}

		// Bumping at the same time the status and the type.
		$query_args = array(
			'x_backup-import'      => $status,
			'x_backup-import-type' => null === $this->importer_type ? 'unknown' : $this->importer_type,
			'v'                    => 'wpcom-no-pv',
		);

		$stats_track_url = 'http://pixel.wp.com/b.gif?' . http_build_query( $query_args );
		$result          = wp_remote_get( $stats_track_url );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return true;
	}

	/**
	 * Determine the type of the importer based on the file in destination path.
	 *
	 * @param string $destination_path The path where the backup will be imported.
	 *
	 * @return string|WP_Error The type of the importer or a WP_Error if the type could not be determined.
	 */
	public static function determine_importer_type( $destination_path ) {
		if ( file_exists( $destination_path . 'wp-content/database/.ht.sqlite' ) ) {
			return self::WORDPRESS_PLAYGROUND;
		}

		if ( file_exists( $destination_path . 'wp-config.php' ) ) {
			return self::JETPACK_BACKUP;
		}

		return new WP_Error( 'unknown_importer_type', __( 'Could not determine importer type.', 'wpcomsh' ) );
	}

	/**
	 * Get an instance of the appropriate importer based on the type.
	 *
	 * @param string $type The type of the importer.
	 * @param string $zip_or_tar_file_path The path to the ZIP or TAR file to be imported.
	 * @param string $destination_path The path where the backup will be imported.
	 *
	 * @return Backup_Importer|WP_Error An instance of the appropriate importer or a WP_Error if the type is unknown.
	 */
	public static function get_importer( string $type, string $zip_or_tar_file_path, string $destination_path ) {
		switch ( $type ) {
			case self::WORDPRESS_PLAYGROUND:
				require_once __DIR__ . '/playground/class-playground-importer.php';
				return new Playground_Importer( $zip_or_tar_file_path, $destination_path, self::TEMPORARY_DB_PREFIX );

			default:
				return new WP_Error( 'unknown_importer_type', __( 'Could not determine importer type.', 'wpcomsh' ) );
		}
	}

	/**
	 * Checks if an import process is already running.
	 *
	 * @return false|WP_Error Returns WP_Error if an import process is running, false otherwise.
	 */
	private function should_bail_out() {
		$additional_status_to_check = array( 'unpack_file' );
		$import_status              = self::get_backup_import_status();
		$import_in_progress         = false;

		if ( ! empty( $import_status ) ) {
			// check if the status is one of other status
			if ( in_array( $import_status['status'], $additional_status_to_check, true ) ) {
				$import_in_progress = true;
			}
			// check if the status is one of the actions
			if ( in_array( $import_status['status'], $this->importer_actions, true ) ) {
				$import_in_progress = true;
			}
		}

		if ( $import_in_progress ) {
			return new WP_Error( 'import_in_progress', __( 'An import is already running.', 'wpcomsh' ) );
		}
		return false;
	}

	/**
	 * Reset the import status.
	 *
	 * @return bool|WP_Error True on success, or a WP_Error on failure.
	 */
	public static function reset_import_status() {
		$backup_import_status = self::get_backup_import_status();

		if ( empty( $backup_import_status ) ) {
			return new WP_Error( 'no_backup_import_found', __( 'No backup import found.', 'wpcomsh' ) );
		}

		if ( $backup_import_status['status'] === self::SUCCESS || $backup_import_status['status'] === self::FAILED ) {
			// if it's a success or failed, we can delete the option directly
			self::delete_backup_import_status();
		} else {
			// Otherwise we set the status to cancelled and update the option
			update_option(
				self::$backup_import_status_option,
				array(
					'status' => self::CANCELLED,
				),
			);
			self::force_cache_unset();
		}

		return true;
	}

	/**
	 * Deletes the backup import status option.
	 *
	 * @return void
	 */
	public static function delete_backup_import_status() {
		delete_option( self::$backup_import_status_option );
		self::force_cache_unset();
	}

	/**
	 * Checks if the import process has been cancelled.
	 *
	 * @return mixed Returns WP_Error if the import has been cancelled, false otherwise.
	 */
	public function is_import_cancelled() {

		$backup_import_status = self::get_backup_import_status();

		if ( empty( $backup_import_status ) ) {
			// The import status doesn't exist, so we should stop here.
			return new WP_Error( 'no_backup_import_found', __( 'No backup import found.', 'wpcomsh' ) );
		}

		if ( isset( $backup_import_status['status'] ) && $backup_import_status['status'] === self::CANCELLED ) {
			// The import has been cancelled, so we should stop here.
			return true;
		}

		return false;
	}
	/**
	 * Get the backup import status.
	 *
	 * @return array|null Returns the backup import status or null if it doesn't exist.
	 */
	public static function get_backup_import_status() {
		$backup_import_status = get_option( self::$backup_import_status_option, null );
		if ( is_array( $backup_import_status ) ) {
			return $backup_import_status;
		}
		return null;
	}
	/**
	 * Force unset the cache for the backup import status option.
	 *
	 * @return void
	 */
	public static function force_cache_unset() {
		$alloptions = wp_load_alloptions();
		if ( isset( $alloptions[ self::$backup_import_status_option ] ) ) {
			unset( $alloptions[ self::$backup_import_status_option ] );
			wp_cache_set( 'alloptions', $alloptions, 'options' );
		} else {
			wp_cache_delete( self::$backup_import_status_option, 'options' );
		}
	}
}
