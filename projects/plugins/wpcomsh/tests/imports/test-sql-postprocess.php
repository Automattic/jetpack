<?php
/**
 * PlaygroundPostprocessTest file.
 *
 * @package wpcomsh
 */

// Include base classes.
require_once __DIR__ . '/../../imports/playground/class-sql-postprocessor.php';

use Imports\SQL_Postprocessor;

// In this file we are using raw SQL queries to check the values.
// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery
// phpcs:disable WordPress.DB.DirectDatabaseQuery.NoCaching
// phpcs:disable WordPress.DB.DirectDatabaseQuery.SchemaChange
// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared

/**
 * Class PlaygroundImporterTest
 */
class PlaygroundPostprocessTest extends WP_UnitTestCase {

	const TEMPORARY_PREFIX = 'playground_';

	const TABLES = array(
		'options',
		'posts',
		'postmeta',
		'term_relationships',
		'term_taxonomy',
		'terms',
	);

	/**
	 * The old prefix.
	 *
	 * @var string
	 */
	private string $old_prefix;

	/**
	 * Initialize a copy of options table.
	 */
	public static function setUpBeforeClass(): void {
		global $wpdb;

		$tmp_prefix = self::TEMPORARY_PREFIX;

		foreach ( self::TABLES as $table ) {
			$table = $wpdb->prefix . $table;
			$wpdb->query( "CREATE TABLE {$tmp_prefix}{$table} LIKE {$table}" );
			$wpdb->query( "INSERT INTO {$tmp_prefix}{$table} SELECT * FROM {$table}" );
		}
	}

	/**
	 * Drop the copy of options table.
	 */
	public static function tearDownAfterClass(): void {
		global $wpdb;
		$tmp_prefix = self::TEMPORARY_PREFIX;

		foreach ( self::TABLES as $table ) {
			$table = $tmp_prefix . $wpdb->prefix . $table;
			$wpdb->query( "DROP TABLE IF EXISTS {$table}" );
		}
	}

	/**
	 * Save old prefix.
	 */
	protected function setUp(): void {
		parent::setUp();

		global $wpdb;

		// Copy the old prefix.
		$this->old_prefix = $wpdb->prefix;
	}

	/**
	 * Restore old prefix, should not happens.
	 */
	protected function tearDown(): void {
		global $wpdb;

		// Restore the old prefix, should not happens.
		if ( $this->old_prefix !== $wpdb->prefix ) {
			$wpdb->set_prefix( $this->old_prefix );
		}

		parent::tearDown();
	}

	/**
	 * Open invalid URLs.
	 */
	public function test_error_open_invalid_urls(): void {
		$processor = new SQL_Postprocessor( 'test', 'test', 'test' );
		$result    = $processor->replace_urls();

		$this->assertWPError( $result );
		$this->assertEquals( 'invalid-home-url', $result->get_error_code() );

		$processor = new SQL_Postprocessor( 'https://example.com', 'test', 'test' );
		$result    = $processor->replace_urls();

		$this->assertWPError( $result );
		$this->assertEquals( 'invalid-site-url', $result->get_error_code() );
	}

	/**
	 * Open a database without the valid temporary tables.
	 */
	public function test_error_open_database_without_valid_tables(): void {
		$processor = new SQL_Postprocessor( 'test', 'test', 'not_valid_' );
		$result    = $processor->get_tables_replace_query();

		$this->assertWPError( $result );
		$this->assertEquals( 'missing-tables', $result->get_error_code() );
	}

	/**
	 * Test the search replace function, same prefix.
	 */
	public function test_error_get_table_query_same_prefix() {
		global $wpdb;

		$processor = new SQL_Postprocessor( 'test', 'test', $wpdb->prefix );
		$result    = $processor->get_tables_replace_query();

		$this->assertWPError( $result );
		$this->assertEquals( 'invalid-prefix', $result->get_error_code() );
	}

	/**
	 * Test the search replace function, missing tables.
	 */
	public function test_get_table_query() {
		global $wpdb;

		$processor = new SQL_Postprocessor( 'test', 'test', self::TEMPORARY_PREFIX );
		$result    = $processor->get_tables_replace_query();

		$this->assertIsArray( $result );
		$this->assertCount( 5, $result );
		$this->assertStringContainsString( self::TEMPORARY_PREFIX . $wpdb->prefix . 'options', $result[2] );
	}

	/**
	 * Test an app with no scoped posts.
	 */
	public function test_get_no_app_scope() {
		$processor = new SQL_Postprocessor( 'test', 'test', self::TEMPORARY_PREFIX );

		$this->assertNull( $processor->get_app_scope() );
	}

	/**
	 * Test an app with at least one scoped posts.
	 */
	public function test_get_app_scope() {
		global $wpdb;

		$processor       = new SQL_Postprocessor( 'test', 'test', self::TEMPORARY_PREFIX );
		$previous_prefix = $wpdb->prefix;

		$wpdb->set_prefix( self::TEMPORARY_PREFIX . $wpdb->prefix );

		wp_insert_post(
			array(
				'post_title'   => 'Test',
				'post_content' => 'Test',
				'post_status'  => 'publish',
				'post_type'    => 'post',
				'guid'         => SQL_Postprocessor::PLAYGROUND_SCOPED_URL . 'test-scope/test',
			)
		);

		$wpdb->set_prefix( $previous_prefix );

		$this->assertSame( 'test-scope', $processor->get_app_scope() );
	}

	/**
	 * Test various scoped URLs.
	 */
	public function test_get_url_scope() {
		$processor  = new SQL_Postprocessor( 'test', 'test', self::TEMPORARY_PREFIX );
		$scoped_url = SQL_Postprocessor::PLAYGROUND_SCOPED_URL;

		$this->assertNull( $processor->get_url_scope( '' ) );
		$this->assertNull( $processor->get_url_scope( $scoped_url ) );
		$this->assertNull( $processor->get_url_scope( $scoped_url . 'test' ) );
		$this->assertSame( 'test', $processor->get_url_scope( $scoped_url . 'test/' ) );
		$this->assertSame( 'test-1', $processor->get_url_scope( $scoped_url . 'test-1/test-2' ) );
		$this->assertNull( $processor->get_url_scope( $scoped_url . 'test/', 'https://example.com' ) );
		$this->assertNull( $processor->get_url_scope( $scoped_url . 'test-1/test-2', 'https://example.com' ) );
	}

	/**
	 * Open a database without the valid temporary tables.
	 */
	public function test_open_database_with_valid_tables(): void {
		global $wpdb;

		$old_prefix    = $wpdb->prefix;
		$previous_home = get_option( 'home' );
		$previous_site = get_option( 'siteurl' );
		$processor     = new SQL_Postprocessor( 'https://word.press', 'https://word.press', self::TEMPORARY_PREFIX, true );

		$result = $processor->postprocess();

		$this->assertWPError( $result );
		// Jetpack is not installed.
		$this->assertEquals( 'site-not-connected', $result->get_error_code() );

		// Prefix has been restored.
		$this->assertEquals( $old_prefix, $wpdb->prefix );

		// Previous values are not touched.
		$this->assertEquals( $previous_home, get_option( 'home' ) );
		$this->assertEquals( $previous_site, get_option( 'siteurl' ) );
	}
}
// phpcs:enable
