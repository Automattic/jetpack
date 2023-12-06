<?php
/**
 * Playground_Importer file.
 *
 * @package wpcomsh
 */

namespace Imports;

use Imports\Utils\FileRestorer;
use Imports\Utils\Logger\FileLogger;

require_once __DIR__ . '/../class-backup-importer.php';
require_once __DIR__ . '/class-playground-db-importer.php';
require_once __DIR__ . '/class-sql-importer.php';
require_once __DIR__ . '/../utils/class-filerestorer.php';
require_once __DIR__ . '/../utils/logger/class-filelogger.php';

/**
 * Playground backup importer.
 *
 * This class provides a common interface for all backup importers.
 */
class Playground_Importer extends \Imports\Backup_Importer {
	const SQLITE_DB_PATH = 'wp-content/database/.ht.sqlite';

	/**
	 * Preprocess the backup before importing.
	 *
	 * @return bool|WP_Error True on success, or a WP_Error on failure.
	 */
	public function preprocess() {
		$options  = array(
			'output_mode' => SQL_Generator::OUTPUT_TYPE_FILE,
			'output_file' => $this->destination_path . 'database.sql',
			'tmp_tables'  => true,
		);
		$db_path  = $this->destination_path . self::SQLITE_DB_PATH;
		$importer = Playground_DB_Importer::get_instance();
		$results  = $importer->generate_sql( $db_path, $options );

		return is_wp_error( $results ) ? $results : true;
	}

	/**
	 * Process the files in the backup.
	 *
	 * @return bool|WP_Error True on success, or a WP_Error on failure.
	 */
	public function process_files() {
		$final_path    = '/srv/htdocs/';
		$logger        = new FileLogger( '/tmp/restore_log/file_restoration_log.txt' );
		$file_restorer = new FileRestorer( $this->destination_path, $final_path, $logger );
		$queue_result  = $file_restorer->enqueue_files();

		if ( is_wp_error( $queue_result ) ) {
			return $queue_result;
		}

		$restore_result = $file_restorer->restore_files();

		if ( is_wp_error( $restore_result ) ) {
			return $restore_result;
		}

		return true;
	}

	/**
	 * Recreate the database from the backup.
	 *
	 * @return bool|WP_Error True on success, or a WP_Error on failure.
	 */
	public function recreate_database() {
		return SQL_Importer::import( $this->destination_path . 'database.sql' );
	}

	/**
	 * Postprocess the database after importing.
	 *
	 * @return bool|WP_Error True on success, or a WP_Error on failure.
	 */
	public function postprocess_database() {
		return true;
	}

	/**
	 * Clean up after the import.
	 *
	 * @return bool|WP_Error True on success, or a WP_Error on failure.
	 */
	public function clean_up() {
		return true;
	}

	/**
	 * Return whether the specified folder is a valid Playground backup.
	 *
	 * @param string $destination_path The path where the backup will be imported.
	 *
	 * @return bool True if the specified folder is a valid backup, false otherwise.
	 */
	public static function is_valid( $destination_path ): bool {
		return file_exists( trailingslashit( $destination_path ) . self::SQLITE_DB_PATH );
	}
}
