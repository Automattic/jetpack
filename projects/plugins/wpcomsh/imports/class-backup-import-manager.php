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
	protected $valid_option_keys = array( 'skip_unpack', 'actions', 'test' );
	/**
	 * Constant representing the WordPress Playground importer type.
	 */
	const WORDPRESS_PLAYGROUND = 'wordpress_playground';
	/**
	 * Constant representing the Jetpack Backup importer type.
	 */
	const JETPACK_BACKUP = 'jetpack_backup';

	/**
	 * Backup import status option name.
	 *
	 * @var string
	 */
	private static $backup_import_status_option = 'backup_import_status';

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
		$skip_unpack = false;
		if ( isset( $this->options['skip_unpack'] ) && is_bool( $this->options['skip_unpack'] ) ) {
			$skip_unpack = $this->options['skip_unpack'];
		}
		// unzip/untar the file
		if ( ! $skip_unpack ) {
			$result = Utils\FileExtractor::extract( $this->zip_or_tar_file_path, $this->destination_path );
			if ( is_wp_error( $result ) ) {
				$this->update_status( array( 'status' => 'failed' ) );
				return $result;
			}
		}

		// validate the type of the file
		$importer_type = self::determine_importer_type( $this->destination_path );
		if ( is_wp_error( $importer_type ) ) {
			$this->update_status( array( 'status' => 'failed' ) );
			return $importer_type;
		}

		// get the importer
		$importer = self::get_importer( $importer_type, $this->destination_path );
		if ( is_wp_error( $importer ) ) {
			$this->update_status( array( 'status' => 'failed' ) );
			return $importer;
		}

		$execute_actions = isset( $this->options['actions'] ) && count( $this->options['actions'] ) ? $this->options['actions'] : $this->importer_actions;
		$is_test         = isset( $this->options['test'] ) && $this->options['test'];

		foreach ( $execute_actions as $action ) {
			if ( ! method_exists( $importer, $action ) ) {
				continue;
			}

			$this->update_status( array( 'status' => $action ) );

			// Call the importer's method.
			$result = $importer->$action();

			if ( $is_test ) {
				// Wait for 15-20 seconds in test mode.
				sleep( \wp_rand( 15, 20 ) );
			}

			if ( is_wp_error( $result ) ) {
				$this->update_status( array( 'status' => 'failed' ) );
				return $result;
			}
		}

		/*
		$remove_tmp_file_result = $this->remove_tmp_files();
		if ( is_wp_error( $remove_tmp_file_result ) ) {
			$this->update_status( array( 'status' => 'failed' ) );
			return $remove_tmp_file_result;
		}
		*/
		return $this->update_status( array( 'status' => 'success' ) );
	}

	/**
	 * Updates the deployment status option.
	 *
	 * @param array $content The contents to be merged to the existing option.
	 *
	 * @return bool
	 */
	private function update_status( $content ): bool {
		$existing = \get_option( self::$backup_import_status_option, array() );
		$new      = array_merge( $existing, $content );

		\update_option( self::$backup_import_status_option, $new );

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
	 * @param string $destination_path The path where the backup will be imported.
	 *
	 * @return Importer|WP_Error An instance of the appropriate importer or a WP_Error if the type is unknown.
	 */
	public static function get_importer( string $type, string $destination_path ) {
		switch ( $type ) {
			case self::WORDPRESS_PLAYGROUND:
				require_once __DIR__ . '/playground/class-playground-importer.php';
				return new Playground_Importer( $destination_path );

			// case self::JETPACK_BACKUP:
			// require_once __DIR__ . '/jetpack-backup/class-jetpack-backup-importer.php';
			// return new Jetpack_Backup_Importer( $destination_path );

			default:
				return new WP_Error( 'unknown_importer_type', __( 'Could not determine importer type.', 'wpcomsh' ) );
		}
	}
}
