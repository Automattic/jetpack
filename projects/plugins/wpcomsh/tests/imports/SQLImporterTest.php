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
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

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
		$this->assertStringContainsString( 'ERROR 1064', $result->get_error_message() );
		$this->assertStringNotContainsString( 'Using a password', $result->get_error_message() );
	}

	/**
	 * A failing statement far larger than what is read back still reports mysql's error.
	 */
	public function test_large_failing_statement_reports_the_mysql_error() {
		$this->generate_tmp_sql( "INSERT INTO `missing_table_for_test` VALUES ('" . str_repeat( 'x', 2 * 1024 * 1024 ) . "');\n" );
		$result = SQL_Importer::import( $this->tmp_sql_path );

		$this->assertWPError( $result );
		$this->assertEquals( 'sql-import-failed', $result->get_error_code() );
		$this->assertStringContainsString( 'ERROR 1146', $result->get_error_message() );
		$this->assertLessThan( 1024, strlen( $result->get_error_message() ) );
	}

	/**
	 * When mysql echoes the failing statement before its error, as on Atomic, the error is kept.
	 */
	public function test_error_details_prefer_the_error_line() {
		$output = array(
			'--------------',
			'INSERT INTO `tmp_wp_wc_customer_lookup` VALUES ' . str_repeat( "('1','','',''), ", 200 ),
			'--------------',
			'',
			"ERROR 1366 (HY000) at line 905: Incorrect integer value: '' for column 'user_id' at row 1",
		);

		$method = new ReflectionMethod( SQL_Importer::class, 'get_error_details' );

		$this->assertSame( "ERROR 1366 (HY000) at line 905: Incorrect integer value: '' for column 'user_id' at row 1", $method->invoke( null, $output ) );
	}

	/**
	 * The exit status is mysql's, read from the marker, and a missing marker is never success.
	 */
	public function test_pop_exit_status() {
		$method = new ReflectionMethod( SQL_Importer::class, 'pop_exit_status' );

		$output = array( 'ERROR 1064', 'wpcomsh-mysql-exit:1' );
		$this->assertSame( 1, $method->invokeArgs( null, array( &$output, 0 ) ) );
		$this->assertSame( array( 'ERROR 1064' ), $output );

		$output = array( 'wpcomsh-mysql-exit:0' );
		$this->assertSame( 0, $method->invokeArgs( null, array( &$output, 0 ) ) );

		$output = array();
		$this->assertSame( 1, $method->invokeArgs( null, array( &$output, 0 ) ) );
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
			fwrite( $this->tmp_sql_file, $data );
		}
	}
}
