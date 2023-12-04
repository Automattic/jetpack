<?php
/**
 * BackupImportManagerTest file.
 *
 * @package wpcomsh
 */

// Include base classes.
require_once __DIR__ . '/../../imports/utils/class-fs-operations.php';

use Imports\Utils\FS_Operations;
use Imports\Backup_Import_Manager;

/**
 * Class BackupImportManagerTest
 */
class BackupImportManagerTest extends WP_UnitTestCase {

	/**
	 * Open an empty path.
	 */
	public function test_error_open_an_empty_file_path() {
		$importer = new Backup_Import_Manager( '', sys_get_temp_dir() );
		$result   = $importer->import();

		$this->assertWPError( $importer->import() );
		$this->assertEquals( 'file_not_exists', $result->get_error_code() );
	}

	/**
	 * Open a not existing path.
	 */
	public function test_error_open_a_not_existing_path() {
		$importer = new Backup_Import_Manager( uniqid() . '.tmp', sys_get_temp_dir() );
		$result   = $importer->import();

		$this->assertWPError( $importer->import() );
		$this->assertEquals( 'file_not_exists', $result->get_error_code() );
	}

	/**
	 * Open a file with no valid extension.
	 */
	public function test_error_open_a_file_with_no_valid_extension() {
		$tmp_file  = tmpfile();
		$meta_data = stream_get_meta_data( $tmp_file );
		$tmp_path  = $meta_data['uri'];
		$importer  = new Backup_Import_Manager( $tmp_path, sys_get_temp_dir() );
		$result    = $importer->import();

		$this->assertWPError( $importer->import() );
		$this->assertEquals( 'file_type_not_supported', $result->get_error_code() );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
		fclose( $tmp_file );
	}
}
