<?php
/**
 * Playground Database Importer Test file.
 *
 * @package wpcomsh
 */

use Imports\Playground_DB_Importer;
use Imports\SQL_Generator;

/**
 * Class PlaygroundDBImporterTest.
 */
class PlaygroundDBImporterTest extends WP_UnitTestCase {

	/**
	 * Temporary file path.
	 *
	 * @var string
	 */
	private $tmp_db_path;

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
	 * Open an empty path.
	 */
	public function test_error_open_an_empty_file_path() {
		$result = $this->db_importer->generate_sql( '' );

		$this->assertWPError( $result );
		$this->assertEquals( 'database-file-not-exists', $result->get_error_code() );
	}

	/**
	 * Open an empty file.
	 */
	public function test_error_open_an_empty_file() {
		$tmp_file = $this->generate_tmp_file();
		$result   = $this->db_importer->generate_sql( $tmp_file['path'] );

		$this->assertWPError( $result );
		$this->assertEquals( 'database-file-empty', $result->get_error_code() );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
		fclose( $tmp_file['resource'] );
	}

	/**
	 * Open a not valid SQLite file.
	 */
	public function test_error_open_a_not_valid_file() {
		$tmp_file = $this->generate_tmp_file( 0 );
		$result   = $this->db_importer->generate_sql( $tmp_file['path'] );

		$this->assertWPError( $result );
		$this->assertEquals( 'not-valid-sqlite-file', $result->get_error_code() );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
		fclose( $tmp_file['resource'] );
	}

	/**
	 * Open an empty SQLite database.
	 */
	public function test_error_open_an_empty_database() {
		$this->generate_sqlite_database();
		$result = $this->db_importer->generate_sql( $this->tmp_db_path );

		$this->assertWPError( $result );
		$this->assertEquals( 'database-file-empty', $result->get_error_code() );
	}

	/**
	 * Open an empty SQLite database.
	 */
	public function test_error_open_a_database_without_master_table() {
		$this->generate_sqlite_database(
			array(
				'queries' => $this->get_base_queries( 'test_table', false ),
			)
		);

		$result = $this->db_importer->generate_sql( $this->tmp_db_path );

		$this->assertWPError( $result );
		$this->assertEquals( 'not-valid-sqlite-file', $result->get_error_code() );
	}

	/**
	 * Open a SQLite database with an empty cache table.
	 */
	public function test_error_open_a_database_with_empty_cache_table() {
		$this->generate_sqlite_database(
			array(
				'cache_table' => true,
				'queries'     => $this->get_base_queries( 'test_table', false ),
			)
		);

		$result = $this->db_importer->generate_sql( $this->tmp_db_path );

		$this->assertWPError( $result );
		$this->assertEquals( 'missing-column', $result->get_error_code() );
	}

	/**
	 * Open a SQLite without tables.
	 */
	public function test_open_a_database_without_tables() {
		$this->generate_sqlite_database(
			array(
				'cache_table' => true,
				'queries'     => $this->get_base_queries(),
			)
		);

		$options = array(
			'exclude_tables' => array( 'test_table' ),
		);
		$result  = $this->db_importer->generate_sql( $this->tmp_db_path, $options );

		$this->assertIsString( $result );
		$this->assertStringContainsString( 'START TRANSACTION;', $result );
		$this->assertStringNotContainsString( 'CREATE TABLE `test_table`', $result );

		$options = array(
			'all_tables' => false,
		);
		$result  = $this->db_importer->generate_sql( $this->tmp_db_path, $options );

		$this->assertWPError( $result );
		$this->assertEquals( 'missing-tables', $result->get_error_code() );
	}

	/**
	 * Open a SQLite database with a valid cache table.
	 */
	public function test_open_a_database_with_a_valid_cache_table() {
		global $wpdb;

		$this->generate_sqlite_database(
			array(
				'cache_table' => true,
				'queries'     => $this->get_base_queries(),
			)
		);

		$result = $this->db_importer->generate_sql( $this->tmp_db_path );

		$this->assertIsString( $result );
		$this->assertStringContainsString( 'START TRANSACTION;', $result );
		$this->assertStringContainsString( "CREATE TABLE `{$wpdb->prefix}test_table`", $result );
	}

	/**
	 * Generate a sql dump with temporary tables.
	 */
	public function test_generate_sql_with_tmp_tables() {
		global $wpdb;

		$this->generate_sqlite_database(
			array(
				'cache_table' => true,
				'queries'     => $this->get_base_queries(),
			)
		);

		$options = array(
			'tmp_tables' => true,
		);
		$result  = $this->db_importer->generate_sql( $this->tmp_db_path, $options );

		$this->assertIsString( $result );
		$this->assertStringNotContainsString( 'START TRANSACTION;', $result );
		$this->assertStringContainsString( "CREATE TABLE `tmp_{$wpdb->prefix}test_table`", $result );

		$options['tmp_prefix'] = 'test_';
		$result                = $this->db_importer->generate_sql( $this->tmp_db_path, $options );

		$this->assertIsString( $result );
		$this->assertStringNotContainsString( 'START TRANSACTION;', $result );
		$this->assertStringContainsString( "CREATE TABLE `test_{$wpdb->prefix}test_table`", $result );
	}

	/**
	 * Generate a sql dump with custom output prefix.
	 */
	public function test_generate_sql_with_custom_output_prefix() {
		$this->generate_sqlite_database(
			array(
				'cache_table' => true,
				'queries'     => $this->get_base_queries(),
			)
		);

		$options = array(
			'output_prefix' => 'testprefix_',
		);
		$result  = $this->db_importer->generate_sql( $this->tmp_db_path, $options );

		$this->assertIsString( $result );
		$this->assertStringContainsString( 'CREATE TABLE `testprefix_test_table`', $result );

		$options = array(
			'output_prefix' => null, // Not output prefix.
		);
		$result  = $this->db_importer->generate_sql( $this->tmp_db_path, $options );

		$this->assertIsString( $result );
		$this->assertStringContainsString( 'CREATE TABLE `test_table`', $result );
	}

	/**
	 * Generate a sql dump with custom input prefix.
	 */
	public function test_generate_sql_with_custom_input_prefix() {
		global $wpdb;

		$this->generate_sqlite_database(
			array(
				'cache_table' => true,
				'queries'     => $this->get_base_queries( 'wptest_test_table' ),
			)
		);

		$options = array(
			'prefix' => 'wptest_',
		);
		$result  = $this->db_importer->generate_sql( $this->tmp_db_path, $options );

		$this->assertIsString( $result );
		$this->assertStringContainsString( "CREATE TABLE `{$wpdb->prefix}test_table`", $result );

		$options['output_prefix'] = null; // Not output prefix.
		$result                   = $this->db_importer->generate_sql( $this->tmp_db_path, $options );

		$this->assertIsString( $result );
		$this->assertStringContainsString( 'CREATE TABLE `test_table`', $result );
	}

	/**
	 * Generate a sql dump with temporary tables.
	 */
	public function test_generate_sql_with_collation() {
		$this->generate_sqlite_database(
			array(
				'cache_table' => true,
				'queries'     => $this->get_base_queries(),
			)
		);

		$result = $this->db_importer->generate_sql( $this->tmp_db_path );

		$this->assertIsString( $result );
		$this->assertStringNotContainsString( SQL_Generator::DEFAULT_COLLATION, $result );

		$options = array(
			'collation' => SQL_Generator::DEFAULT_COLLATION,
		);
		$result  = $this->db_importer->generate_sql( $this->tmp_db_path, $options );

		$this->assertIsString( $result );
		$this->assertStringContainsString( SQL_Generator::DEFAULT_COLLATION, $result );
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
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite
			fwrite( $tmp_file, $data );
		}

		return array(
			'resource' => $tmp_file,
			'path'     => $tmp_db_path,
		);
	}

	/**
	 * Generates a SQLite database.
	 *
	 * @param array $options Options to generate the database.
	 */
	private function generate_sqlite_database( $options = array() ) {
		$defaults = array(
			'cache_table' => false,
			'queries'     => array(),
		);

		$options = wp_parse_args( $options, $defaults );

		// Use a temporary file name.
		$tmp_db_path = trailingslashit( sys_get_temp_dir() ) . 'wpcomsh-sqlite-test-' . uniqid() . '.sqlite';

		try {
			$tmp_db = new SQLite3( $tmp_db_path );
			$tmp_db->enableExceptions( false );

			if ( $options['cache_table'] ) {
				// Create the cache table.
				$query = 'CREATE TABLE _mysql_data_types_cache (
					`table` TEXT NOT NULL,
					`column_or_index` TEXT NOT NULL,
					`mysql_type` TEXT NOT NULL,
					PRIMARY KEY(`table`, `column_or_index`)
				);';

				$tmp_db->exec( $query );
			}

			foreach ( $options['queries'] as $query ) {
				// Run a query.
				$tmp_db->exec( $query );
			}

			$tmp_db->close();

			$this->tmp_db_path = $tmp_db_path;
		} catch ( Exception $e ) {
			$this->tmp_db_path = '';
		}
	}

	/**
	 * Get the base queries to generate a SQLite database.
	 *
	 * @param string $table_name     Table name.
	 * @param bool   $generate_cache Generate the cache table.
	 */
	private function get_base_queries( $table_name = 'test_table', $generate_cache = true ) {
		$queries = array(
			"CREATE TABLE \"{$table_name}\" (\"id\" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL)",
		);

		if ( $generate_cache ) {
			$queries[] = "INSERT INTO _mysql_data_types_cache VALUES (\"{$table_name}\", \"id\", \"bigint(20) unsigned\")";
		}

		return $queries;
	}
}
