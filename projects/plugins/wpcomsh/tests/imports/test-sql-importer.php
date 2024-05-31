<?php
/**
 * SQL Importer Test file.
 *
 * @package wpcomsh
 */

use Imports\SQL_Importer;

/**
 * Class SQLImporterTest.
 */
class SQLImporterTest extends WP_UnitTestCase {

	/**
	 * Temporary SQL file.
	 *
	 * @var resource
	 */
	private $tmp_sql_file;

	/**
	 * Temporary SQL file.
	 *
	 * @var string
	 */
	private $tmp_sql_path;

	/**
	 * Clear values for each test
	 *
	 * @return void
	 */
	public function tearDown(): void {
		if ( $this->tmp_sql_path !== null && file_exists( $this->tmp_sql_path ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
			fclose( $this->tmp_sql_file );
		}

		parent::tearDown();
	}

	/**
	 * Open an empty path.
	 */
	public function test_error_open_an_empty_sql_file() {
		$result = SQL_Importer::import( sys_get_temp_dir() );

		$this->assertWPError( $result );
		$this->assertEquals( 'sql-file-not-exists', $result->get_error_code() );
	}

	/**
	 * Import an invalid SQL file.
	 */
	public function test_open_an_invalid_sql_file() {
		$this->generate_tmp_sql( 'not-valid' );
		$result = SQL_Importer::import( $this->tmp_sql_path );

		$this->assertWPError( $result );
		$this->assertEquals( 'sql-import-failed', $result->get_error_code() );
	}

	/**
	 * Import an empty SQL file.
	 */
	public function test_open_an_empty_sql_file() {
		$this->generate_tmp_sql();
		$result = SQL_Importer::import( $this->tmp_sql_path );

		$this->assertTrue( $result );
	}

	/**
	 * Generates a temporary SQL.
	 *
	 * @param mixed $data Data to write in the database.
	 */
	private function generate_tmp_sql( $data = null ) {
		$this->tmp_sql_file = tmpfile();
		$meta_data          = stream_get_meta_data( $this->tmp_sql_file );
		$this->tmp_sql_path = $meta_data['uri'];

		if ( $data !== null ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite
			fwrite( $this->tmp_sql_file, $data );
		}
	}
}
