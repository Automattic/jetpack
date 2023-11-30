<?php
/**
 * Backup_Importer file.
 *
 * @package wpcomsh
 */

/**
 * Abstract class representing a backup importer.
 *
 * This class provides a common interface for all backup importers.
 */
abstract class Backup_Importer {
	/**
	 * The path where the backup will be imported.
	 *
	 * @var string
	 */
	protected $destination_path;

	/**
	 * Constructor.
	 *
	 * @param string $destination_path The path where the backup will be imported.
	 */
	public function __construct( $destination_path ) {
		$this->destination_path = $destination_path;
	}

	/**
	 * Preprocess the backup before importing.
	 *
	 * This method should be implemented by subclasses to perform any necessary preprocessing.
	 */
	abstract public function preprocess();

	/**
	 * Process the files in the backup.
	 *
	 * This method should be implemented by subclasses to process the files in the backup.
	 */
	abstract public function process_files();

	/**
	 * Recreate the database from the backup.
	 *
	 * This method should be implemented by subclasses to recreate the database from the backup.
	 */
	abstract public function recreate_database();

	/**
	 * Postprocess the database after importing.
	 *
	 * This method should be implemented by subclasses to perform any necessary postprocessing.
	 */
	abstract public function postprocess_database();

	/**
	 * Clean up after the import.
	 *
	 * This method should be implemented by subclasses to clean up any temporary files or data.
	 */
	abstract public function clean_up();
}
