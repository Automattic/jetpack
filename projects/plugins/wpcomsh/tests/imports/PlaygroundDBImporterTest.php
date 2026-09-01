<?php
/**
 * Playground Database Importer Test file.
 *
 * @package wpcomsh
 */

use Imports\Playground_DB_Importer;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class PlaygroundDBImporterTest.
 */
class PlaygroundDBImporterTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Path to test fixtures directory.
	 *
	 * @var string
	 */
	private static $fixtures_path = __DIR__ . '/fixtures';

	/**
	 * Temporary file path.
	 *
	 * @var string
	 */
	private $tmp_db_path = '';

	/**
	 * Playground DB Importer instance.
	 *
	 * @var Playground_DB_Importer
	 */
	private $db_importer;

	/**
	 * Sets up the test environment before each test.
	 */
	protected function setUp(): void {
		$this->db_importer = new Playground_DB_Importer();
	}

	/**
	 * Clear values for each test
	 *
	 * @return void
	 */
	public function tearDown(): void {
		if ( file_exists( $this->tmp_db_path ) ) {
			// Delete the database.
			wp_delete_file( $this->tmp_db_path );

			$this->tmp_db_path = '';
		}

		parent::tearDown();
	}

	/**
	 * Test loading valid fixture database files.
	 *
	 * @dataProvider provide_valid_fixture_files
	 * @param string $fixture_path Path to the fixture file.
	 */
	#[DataProvider( 'provide_valid_fixture_files' )]
	public function test_generate_sql_with_valid_fixture_database( $fixture_path ) {
		$this->assertFileExists( $fixture_path );

		$result = $this->db_importer->generate_sql( $fixture_path );

		$this->assertNotWPError( $result );
		$this->assertIsString( $result );

		$this->assertStringContainsString( 'SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";', $result );
		$this->assertStringContainsString( '  `ID` bigint(20) unsigned NOT NULL AUTO_INCREMENT,', $result );
		$this->assertStringContainsString( '  `meta_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,', $result );
		$this->assertStringContainsString( '  PRIMARY KEY (`object_id`,`term_taxonomy_id`),', $result );
		$this->assertStringContainsString( '  UNIQUE KEY `term_id_taxonomy` (`term_id`, `taxonomy`),', $result );
		$this->assertStringContainsString( '  UNIQUE KEY `option_name` (`option_name`),', $result );
	}

	/**
	 * Test loading valid fixture database files.
	 *
	 * @dataProvider provide_valid_fixture_files
	 * @param string $fixture_path Path to the fixture file.
	 */
	#[DataProvider( 'provide_valid_fixture_files' )]
	public function test_generate_sql_with_valid_fixture_database_and_tmp_tables( $fixture_path ) {
		global $wpdb;

		$this->assertFileExists( $fixture_path );

		$options = array( 'tmp_tables' => true );
		$result  = $this->db_importer->generate_sql( $fixture_path, $options );

		$this->assertNotWPError( $result );
		$this->assertIsString( $result );

		$this->assertStringNotContainsString( 'START TRANSACTION;', $result );
		$this->assertStringContainsString( "CREATE TABLE `tmp_{$wpdb->prefix}posts`", $result, $result );

		$options['tmp_prefix'] = 'test_';
		$result                = $this->db_importer->generate_sql( $fixture_path, $options );

		$this->assertNotWPError( $result );
		$this->assertIsString( $result );
		$this->assertStringNotContainsString( 'START TRANSACTION;', $result );
		$this->assertStringContainsString( "CREATE TABLE `test_{$wpdb->prefix}posts`", $result );
	}

	/**
	 * Generate a sql dump with custom output prefix.
	 *
	 * @dataProvider provide_valid_fixture_files
	 */
	#[DataProvider( 'provide_valid_fixture_files' )]
	public function test_generate_sql_with_valid_fixture_database_and_custom_output_prefix( $fixture_path ) {
		$options = array( 'output_prefix' => 'testprefix_' );
		$result  = $this->db_importer->generate_sql( $fixture_path, $options );

		$this->assertNotWPError( $result );
		$this->assertIsString( $result );
		$this->assertStringContainsString( 'CREATE TABLE `testprefix_posts`', $result );

		$options['output_prefix'] = null; // Not output prefix.
		$result                   = $this->db_importer->generate_sql( $fixture_path, $options );

		$this->assertNotWPError( $result );
		$this->assertIsString( $result );
		$this->assertStringContainsString( 'CREATE TABLE `posts`', $result );
	}

	public function test_hot_fix_missing_indexes() {
		$map = $this->db_importer->hot_fix_missing_indexes( 'wp_options', array() );
		$this->assertEquals( array(), $map );

		$table_name = 'wp_woocommerce_tax_rate_locations';
		$index      = array(
			'name'    => 'location_type_code',
			'columns' => 'test',
		);

		$map = $this->db_importer->hot_fix_missing_indexes(
			$table_name,
			array( $index )
		);

		$this->assertEquals(
			array(
				array(
					'name'    => 'location_type_code',
					'columns' => '(`location_type`(10),`location_code`(20))',
				),
			),
			$map
		);
	}

	public function test_is_valid_table() {
		$this->assertFalse( $this->db_importer->is_valid_table( '_wp_sqlite_mysql_information_schema_columns' ) );
		$this->assertFalse( $this->db_importer->is_valid_table( '_wp_sqlite_global_variables' ) );
		$this->assertFalse( $this->db_importer->is_valid_table( 'sqlite_sequence' ) );
		$this->assertTrue( $this->db_importer->is_valid_table( 'wp_options' ) );
	}

	public function test_get_needs_191_limit_test_cases() {
		$this->assertTrue(
			$this->db_importer->needs_191_limit(
				array(
					'type'        => 'text',
					'sqlite_type' => 'text',
				)
			)
		);
		$this->assertTrue(
			$this->db_importer->needs_191_limit(
				array(
					'type'        => 'varchar(255)',
					'sqlite_type' => 'text',
				)
			)
		);
		$this->assertFalse(
			$this->db_importer->needs_191_limit(
				array(
					'type'        => 'int',
					'sqlite_type' => 'text',
				)
			)
		);
		$this->assertFalse(
			$this->db_importer->needs_191_limit(
				array(
					'type'        => 'int',
					'sqlite_type' => 'unknown',
				)
			)
		);
	}

	public function test_get_tmp_file_name() {
		$this->assertIsString( $this->db_importer->get_tmp_file_name() );
	}

	public function test_sqlite_type_to_format() {
		$this->assertEquals( '%d', $this->db_importer->sqlite_type_to_format( 'integer' ) );
		$this->assertEquals( '%f', $this->db_importer->sqlite_type_to_format( 'real' ) );
		$this->assertEquals( '%s', $this->db_importer->sqlite_type_to_format( 'null' ) );
	}

	/**
	 * Test loading invalid fixture database files.
	 *
	 * @dataProvider provide_invalid_fixture_files
	 * @param string $fixture_path Path to the fixture file.
	 */
	#[DataProvider( 'provide_invalid_fixture_files' )]
	public function test_load_invalid_fixture_database( $fixture_path ) {
		$this->assertFileExists( $fixture_path );

		$result = $this->db_importer->generate_sql( $fixture_path );

		$this->assertWPError( $result );
	}

	/**
	 * Open an empty path.
	 */
	public function test_error_open_an_empty_file_path() {
		$result = $this->db_importer->generate_sql( '' );

		$this->assertWPError( $result );
		$this->assertEquals( 'database-file-not-exists', $result->get_error_code() );
	}

	/**
	 * Open a not valid SQLite file.
	 */
	public function test_error_open_a_not_valid_file() {
		$tmp_file = $this->generate_tmp_file( 0 );
		$result   = $this->db_importer->generate_sql( $tmp_file['path'] );

		$this->assertWPError( $result );
		$this->assertEquals( 'not-valid-sqlite-file', $result->get_error_code() );

		fclose( $tmp_file['resource'] );
	}

	/**
	 * Data provider for valid fixture files.
	 *
	 * @return array Array of valid fixture file paths for parameterized tests.
	 */
	public static function provide_valid_fixture_files() {
		$fixtures = glob( trailingslashit( self::$fixtures_path ) . 'valid/*.sqlite' );
		$data     = array();

		foreach ( $fixtures as $fixture ) {
			$data[ 'valid/' . basename( $fixture ) ] = array( $fixture );
		}

		return $data;
	}

	/**
	 * Data provider for invalid fixture files.
	 *
	 * @return array Array of invalid fixture file paths for parameterized tests.
	 */
	public static function provide_invalid_fixture_files() {
		$fixtures = glob( trailingslashit( self::$fixtures_path ) . 'invalid/*.sqlite' );
		$data     = array();

		foreach ( $fixtures as $fixture ) {
			$data[ 'invalid/' . basename( $fixture ) ] = array( $fixture );
		}

		return $data;
	}

	/**
	 * Get all fixture files matching a pattern.
	 *
	 * @param string $pattern Glob pattern (e.g., '*.sqlite').
	 * @param string $subfolder Optional subfolder (e.g., 'valid', 'invalid').
	 * @return array Array of fixture file paths.
	 */
	private function get_fixtures( $pattern = '*.sqlite', $subfolder = '' ) {
		$path = trailingslashit( self::$fixtures_path );
		if ( ! empty( $subfolder ) ) {
			$path = trailingslashit( $path . $subfolder );
		}
		return glob( $path . $pattern );
	}

	/**
	 * Generates a temporary file.
	 *
	 * @param mixed $data Data to write in the database.
	 */
	private function generate_tmp_file( $data = null ) {
		$tmp_file    = tmpfile();
		$meta_data   = stream_get_meta_data( $tmp_file );
		$tmp_db_path = $meta_data['uri'];

		if ( $data !== null ) {
			fwrite( $tmp_file, $data );
		}

		return array(
			'resource' => $tmp_file,
			'path'     => $tmp_db_path,
		);
	}
}
