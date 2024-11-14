<?php
/**
 * Backup_Importer file.
 *
 * @package wpcomsh
 */

namespace Imports;

use WP_Error;

/**
 * Abstract class representing a backup importer.
 *
 * This class provides a common interface for all backup importers.
 */
abstract class Backup_Importer {
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
	 * The table prefix to use when generating database temporary tables.
	 *
	 * @var string
	 */
	protected $tmp_prefix;

	/**
	 * The temporary database name.
	 *
	 * @var string
	 */
	protected $tmp_database;

	/**
	 * Constructor.
	 *
	 * @param string $zip_or_tar_file_path The path to the ZIP or TAR file to be imported.
	 * @param string $destination_path The path where the backup will be imported.
	 * @param string $tmp_prefix       The table prefix to use when importing the database.
	 */
	public function __construct( string $zip_or_tar_file_path, string $destination_path, string $tmp_prefix ) {
		$this->zip_or_tar_file_path = $zip_or_tar_file_path;
		$this->destination_path     = trailingslashit( $destination_path );
		$this->tmp_prefix           = $tmp_prefix;
	}

	/**
	 * Preprocess the backup before importing.
	 *
	 * This method should be implemented by subclasses to perform any necessary preprocessing.
	 *
	 * @return bool|WP_Error True on success, or a WP_Error on failure.
	 */
	abstract public function preprocess();

	/**
	 * Process the files in the backup.
	 *
	 * This method should be implemented by subclasses to process the files in the backup.
	 *
	 * @return bool|WP_Error True on success, or a WP_Error on failure.
	 */
	abstract public function process_files();

	/**
	 * Recreate the database from the backup.
	 *
	 * This method should be implemented by subclasses to recreate the database from the backup.
	 *
	 * @return bool|WP_Error True on success, or a WP_Error on failure.
	 */
	abstract public function recreate_database();

	/**
	 * Postprocess the database after importing.
	 *
	 * This method should be implemented by subclasses to perform any necessary postprocessing.
	 *
	 * @return bool|WP_Error True on success, or a WP_Error on failure.
	 */
	abstract public function postprocess_database();

	/**
	 * Clean up after the import.
	 *
	 * This method should be implemented by subclasses to clean up any temporary files or data.
	 *
	 * @return bool|WP_Error True on success, or a WP_Error on failure.
	 */
	abstract public function clean_up();

	/**
	 * Verify the integrity of the site after importing.
	 *
	 * This method should be implemented by subclasses to verify the integrity of the site after importing.
	 *
	 * @return bool|WP_Error True on success, or a WP_Error on failure.
	 */
	abstract public function verify_site_integrity();
}
