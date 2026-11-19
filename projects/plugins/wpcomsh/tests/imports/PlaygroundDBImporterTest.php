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
	 * A single-column primary key that isn't AUTO_INCREMENT in the site's schema, like Novamira's
	 * `id varchar(64)`, must not get AUTO_INCREMENT: MySQL rejects it on a non-integer column.
	 */
	public function test_generate_sql_keeps_auto_increment_only_where_the_schema_has_it() {
		$db_path = wp_tempnam( 'text-primary-key.sqlite' );
		copy( self::$fixtures_path . '/valid/plain.sqlite', $db_path );

		// The table and schema rows the SQLite driver writes for Novamira's dbDelta() call.
		$db = new SQLite3( $db_path );
		$db->exec(
			'CREATE TABLE `wp_novamira_chat_sessions` (
				`id` TEXT COLLATE NOCASE NOT NULL,
				`user_id` INTEGER NOT NULL,
				`data` TEXT COLLATE NOCASE NOT NULL,
				PRIMARY KEY (`id`)
			) STRICT;'
		);
		$db->exec( "INSERT INTO `wp_novamira_chat_sessions` VALUES ('a1b2c3', 1, '{}')" );
		$columns = array(
			array( 'id', 1, 'varchar', 'varchar(64)', 'PRI' ),
			array( 'user_id', 2, 'bigint', 'bigint unsigned', '' ),
			array( 'data', 3, 'longtext', 'longtext', '' ),
		);
		foreach ( $columns as $column ) {
			$db->exec(
				sprintf(
					"INSERT INTO `_wp_sqlite_mysql_information_schema_columns` (TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION, IS_NULLABLE, DATA_TYPE, COLUMN_TYPE, COLUMN_KEY, EXTRA, PRIVILEGES) VALUES ('sqlite_database', 'wp_novamira_chat_sessions', '%s', %d, 'NO', '%s', '%s', '%s', '', 'select,insert,update,references')",
					...$column
				)
			);
		}
		$db->close();

		$result = $this->db_importer->generate_sql( $db_path );
		unlink( $db_path );

		$this->assertNotWPError( $result );
		$this->assertStringContainsString( '  `id` varchar(64) NOT NULL,', $result );
		$this->assertStringNotContainsString( 'varchar(64) NOT NULL AUTO_INCREMENT', $result );
		// WordPress's own AUTO_INCREMENT keys are kept.
		$this->assertStringContainsString( '  `ID` bigint(20) unsigned NOT NULL AUTO_INCREMENT,', $result );
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
	 * Indices come from the MySQL definitions the SQLite driver keeps: real names, even with `__`
	 * (Solid Security), and prefix lengths on text columns (TranslatePress), which SQLite's own indices lose.
	 */
	public function test_generate_sql_uses_the_mysql_index_definitions() {
		$db_path = wp_tempnam( 'plugin-tables.sqlite' );
		copy( self::$fixtures_path . '/valid/plain.sqlite', $db_path );

		$db = new SQLite3( $db_path );
		$db->exec( file_get_contents( self::$fixtures_path . '/plugin-tables.sql' ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$db->close();

		$result = $this->db_importer->generate_sql( $db_path );
		unlink( $db_path );

		$this->assertNotWPError( $result );
		$this->assertStringContainsString( '  KEY `gettext_index_original` (`original`(100)),', $result );
		$this->assertStringContainsString( '  KEY `gettext_lookup_original_domain_context` (`original`(100), `domain`(100), `context`(100))', $result );
		$this->assertStringContainsString( '  UNIQUE KEY `gettext_lookup_hash_unique` (`lookup_hash`)', $result );
		$this->assertStringContainsString( '  UNIQUE KEY `event_slug__time__consolidated` (`event_slug`, `event_time`, `event_consolidated`)', $result );
		$this->assertStringNotContainsString( 'KEY ``', $result );
	}

	/**
	 * Databases without the MySQL index definitions fall back to SQLite's own indices.
	 */
	public function test_generate_sql_falls_back_to_the_sqlite_indexes() {
		$db_path = wp_tempnam( 'no-index-definitions.sqlite' );
		copy( self::$fixtures_path . '/valid/plain.sqlite', $db_path );

		$db = new SQLite3( $db_path );
		$db->exec( 'DROP TABLE `' . Playground_DB_Importer::SQLITE_INDEXES_TABLE . '`' );
		$db->close();

		$result = $this->db_importer->generate_sql( $db_path );
		unlink( $db_path );

		$this->assertNotWPError( $result );
		$this->assertStringContainsString( '  KEY `slug` (`slug`)', $result );
		$this->assertStringContainsString( '  UNIQUE KEY `term_id_taxonomy` (`term_id`, `taxonomy`)', $result );
		$this->assertStringContainsString( '  UNIQUE KEY `option_name` (`option_name`)', $result );
	}

	/**
	 * Copy the fixture database's WordPress tables, with their MySQL definitions, to another prefix.
	 *
	 * @param string $prefix      The new table prefix.
	 * @param bool   $keep_tables Whether to keep the `wp_` tables, like a site pulled into a Studio install.
	 *
	 * @return string The database path.
	 */
	private function get_database_with_table_prefix( string $prefix, bool $keep_tables ): string {
		$db_path = wp_tempnam( 'table-prefix.sqlite' );
		copy( self::$fixtures_path . '/valid/plain.sqlite', $db_path );

		$db     = new SQLite3( $db_path );
		$schema = array(
			'_wp_sqlite_mysql_information_schema_tables',
			'_wp_sqlite_mysql_information_schema_columns',
			'_wp_sqlite_mysql_information_schema_statistics',
		);
		$tables = $db->query( "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name LIKE 'wp\_%' ESCAPE '\'" );
		$copies = array();

		while ( $table = $tables->fetchArray( SQLITE3_ASSOC ) ) { // phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
			$copies[] = $table;
		}

		foreach ( $copies as $table ) {
			$name     = $table['name'];
			$new_name = $prefix . substr( $name, 3 );

			$db->exec( preg_replace( '/^CREATE TABLE [`"]?' . $name . '[`"]?/', 'CREATE TABLE "' . $new_name . '"', $table['sql'] ) );
			$db->exec( "INSERT INTO \"$new_name\" SELECT * FROM \"$name\"" );

			foreach ( $schema as $schema_table ) {
				$columns = array();
				$info    = $db->query( "PRAGMA table_info(\"$schema_table\")" );

				while ( $column = $info->fetchArray( SQLITE3_ASSOC ) ) { // phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
					if ( 'rowid' !== $column['name'] ) {
						$columns[] = '"' . $column['name'] . '"';
					}
				}

				$list   = implode( ', ', $columns );
				$select = str_replace( '"TABLE_NAME"', "'$new_name'", $list );
				$db->exec( "INSERT INTO \"$schema_table\" ($list) SELECT $select FROM \"$schema_table\" WHERE TABLE_NAME = '$name'" );

				if ( ! $keep_tables ) {
					$db->exec( "DELETE FROM \"$schema_table\" WHERE TABLE_NAME = '$name'" );
				}
			}

			if ( ! $keep_tables ) {
				$db->exec( "DROP TABLE \"$name\"" );
			}
		}

		$db->exec( "UPDATE \"{$prefix}options\" SET option_value = 'Pulled site' WHERE option_name = 'blogname'" );
		$db->close();

		return $db_path;
	}

	/**
	 * A database whose tables use another prefix, like a Studio site pulled from a `wpx_` site, is
	 * restored under the output prefix. Before, its options table became `wpx_options`, so the restore
	 * found no site URL.
	 */
	public function test_generate_sql_detects_the_table_prefix() {
		global $wpdb;

		$db_path = $this->get_database_with_table_prefix( 'wpx_', false );
		$result  = $this->db_importer->generate_sql( $db_path );
		unlink( $db_path );

		$this->assertNotWPError( $result );
		$this->assertStringContainsString( "CREATE TABLE `{$wpdb->prefix}options`", $result );
		$this->assertStringContainsString( "CREATE TABLE `{$wpdb->prefix}posts`", $result );
		$this->assertStringContainsString( "'blogname','Pulled site'", $result );
		$this->assertStringContainsString( '  UNIQUE KEY `option_name` (`option_name`)', $result );
		$this->assertStringNotContainsString( 'wpx_', $result );
	}

	/**
	 * With tables under two prefixes, the requested one (the backup's `$table_prefix`) is restored.
	 */
	public function test_generate_sql_uses_the_requested_table_prefix() {
		global $wpdb;

		$db_path   = $this->get_database_with_table_prefix( 'wpx_', true );
		$requested = $this->db_importer->generate_sql( $db_path, array( 'prefix' => 'wpx_' ) );
		$default   = $this->db_importer->generate_sql( $db_path );
		$missing   = $this->db_importer->generate_sql( $db_path, array( 'prefix' => 'nope_' ) );
		unlink( $db_path );

		$this->assertNotWPError( $requested );
		$this->assertStringContainsString( "CREATE TABLE `{$wpdb->prefix}options`", $requested );
		$this->assertStringContainsString( "'blogname','Pulled site'", $requested );

		// Without a requested prefix, or with one that has no options table, `wp_` wins as before.
		foreach ( array( $default, $missing ) as $result ) {
			$this->assertNotWPError( $result );
			$this->assertStringContainsString( "CREATE TABLE `{$wpdb->prefix}wpx_options`", $result );
			$this->assertStringNotContainsString( "'blogname','Pulled site'", substr( $result, 0, strpos( $result, "CREATE TABLE `{$wpdb->prefix}wpx_options`" ) ) );
		}
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
