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
// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared

/**
 * Class PlaygroundImporterTest
 */
class PlaygroundPostprocessTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

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
	 * Themes imported under a new slug are renamed in the imported database.
	 */
	public function test_rename_themes() {
		global $wpdb;

		$tmp_options = self::TEMPORARY_PREFIX . $wpdb->prefix . 'options';
		$tmp_posts   = self::TEMPORARY_PREFIX . $wpdb->prefix . 'posts';
		$tmp_terms   = self::TEMPORARY_PREFIX . $wpdb->prefix . 'terms';
		$tmp_tt      = self::TEMPORARY_PREFIX . $wpdb->prefix . 'term_taxonomy';
		$block       = '<!-- wp:template-part {"slug":"header","theme":"twentytwentyfive"} /-->';

		$wpdb->query( "DELETE FROM {$tmp_options} WHERE option_name IN ('template', 'stylesheet') OR option_name LIKE 'theme\\_mods\\_%'" );
		$wpdb->insert(
			$tmp_options,
			array(
				'option_name'  => 'template',
				'option_value' => 'twentytwentyfive',
			)
		);
		$wpdb->insert(
			$tmp_options,
			array(
				'option_name'  => 'stylesheet',
				'option_value' => 'twentytwentyfive',
			)
		);
		$wpdb->insert(
			$tmp_options,
			array(
				'option_name'  => 'theme_mods_twentytwentyfive',
				'option_value' => 'a:1:{s:11:"custom_logo";i:5;}',
			)
		);
		$wpdb->insert(
			$tmp_terms,
			array(
				'name' => 'twentytwentyfive',
				'slug' => 'twentytwentyfive',
			)
		);
		$term_id = $wpdb->insert_id;
		$wpdb->insert(
			$tmp_tt,
			array(
				'term_id'     => $term_id,
				'taxonomy'    => 'wp_theme',
				'description' => '',
			)
		);
		$wpdb->insert(
			$tmp_posts,
			array(
				'post_type'             => 'wp_global_styles',
				'post_name'             => 'wp-global-styles-twentytwentyfive',
				'post_content'          => '{}',
				'post_excerpt'          => '',
				'to_ping'               => '',
				'pinged'                => '',
				'post_content_filtered' => '',
			)
		);
		$global_styles_id = $wpdb->insert_id;
		$wpdb->insert(
			$tmp_posts,
			array(
				'post_type'             => 'wp_template',
				'post_name'             => 'index',
				'post_content'          => $block,
				'post_excerpt'          => '',
				'to_ping'               => '',
				'pinged'                => '',
				'post_content_filtered' => '',
			)
		);
		$template_id = $wpdb->insert_id;

		$processor = new SQL_Postprocessor( 'test', 'test', self::TEMPORARY_PREFIX );
		$processor->set_theme_renames( array( 'twentytwentyfive' => 'twentytwentyfive-imported' ) );

		$this->assertTrue( $processor->rename_themes() );
		$this->assertSame( 'twentytwentyfive-imported', $wpdb->get_var( "SELECT option_value FROM {$tmp_options} WHERE option_name = 'template'" ) );
		$this->assertSame( 'twentytwentyfive-imported', $wpdb->get_var( "SELECT option_value FROM {$tmp_options} WHERE option_name = 'stylesheet'" ) );
		$this->assertSame( 'a:1:{s:11:"custom_logo";i:5;}', $wpdb->get_var( "SELECT option_value FROM {$tmp_options} WHERE option_name = 'theme_mods_twentytwentyfive-imported'" ) );
		$this->assertNull( $wpdb->get_var( "SELECT option_value FROM {$tmp_options} WHERE option_name = 'theme_mods_twentytwentyfive'" ) );
		$this->assertSame( 'twentytwentyfive-imported', $wpdb->get_var( $wpdb->prepare( "SELECT slug FROM {$tmp_terms} WHERE term_id = %d", $term_id ) ) );
		$this->assertSame( 'wp-global-styles-twentytwentyfive-imported', $wpdb->get_var( $wpdb->prepare( "SELECT post_name FROM {$tmp_posts} WHERE ID = %d", $global_styles_id ) ) );
		$this->assertSame(
			'<!-- wp:template-part {"slug":"header","theme":"twentytwentyfive-imported"} /-->',
			$wpdb->get_var( $wpdb->prepare( "SELECT post_content FROM {$tmp_posts} WHERE ID = %d", $template_id ) )
		);
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

	/**
	 * The restore keeps the site's Jetpack Sync HTTPS history, so Sync keeps reporting https:// URLs.
	 */
	public function test_save_whitelist_options_keeps_sync_https_history(): void {
		global $wpdb;

		$tmp_options = self::TEMPORARY_PREFIX . $wpdb->prefix . 'options';
		$urls        = array( 'home_url', 'site_url', 'main_network_site_url' );
		foreach ( $urls as $url ) {
			update_option( "jetpack_sync_https_history_{$url}", array( 'https' ) );
		}
		$wpdb->query( "DELETE FROM {$tmp_options} WHERE option_name LIKE 'jetpack_sync_https_history_%'" );

		$processor = new SQL_Postprocessor( 'https://word.press', 'https://word.press', self::TEMPORARY_PREFIX, true );
		$processor->save_whitelist_options();

		foreach ( $urls as $url ) {
			$saved = $wpdb->get_var( "SELECT option_value FROM {$tmp_options} WHERE option_name = 'jetpack_sync_https_history_{$url}'" );
			$this->assertSame( array( 'https' ), maybe_unserialize( $saved ) );
		}
	}
}
