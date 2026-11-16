<?php
/**
 * Integration Tests for Table Checksum functionality.
 *
 * @package automattic/jetpack-sync
 */

use Automattic\Jetpack\Sync\Replicastore\Table_Checksum;
use Automattic\Jetpack\Sync\Settings;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * Testing Table Checksum.
 *
 * @group jetpack-sync
 */
#[Group( 'jetpack-sync' )]
class Jetpack_Sync_Checksum_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		Table_Checksum::reset_range_edges_cache();
	}

	/**
	 * Allowed Tables for current test.
	 *
	 * @var array Table Configurations
	 */
	protected $allowed_tables = array();

	/**
	 * Array of classnames of Sync enabled modules.
	 *
	 * @var array
	 */
	protected $sync_enabled_modules;

	/**
	 * Array of Table Names and if valid.
	 *
	 * @return int[][]
	 */
	public static function table_provider() {
		return array(
			array( 'posts', true ),
			array( 'comments', true ),
			array( 'postmeta', true ),
			array( 'commentmeta', true ),
			array( 'terms', true ),
			array( 'termmeta', true ),
			array( 'term_relationships', true ),
			array( 'term_taxonomy', true ),
			array( 'not_a_table', false ),
			array( 'comment_meta', false ),
			array( 'post_meta', false ),
		);
	}

	/**
	 * Array of Table Names, enabled modules and if valid.
	 *
	 * @return array
	 */
	public static function table_modules_provider() {
		return array(
			array( 'posts', array( 'Automattic\\Jetpack\\Sync\\Modules\\Comments' ), false ),
			array( 'posts', array( 'Automattic\\Jetpack\\Sync\\Modules\\Posts' ), true ),
			array( 'postmeta', array( 'Automattic\\Jetpack\\Sync\\Modules\\Posts' ), true ),
			array( 'postmeta', array( 'Automattic\\Jetpack\\Sync\\Modules\\Comments' ), false ),
			array( 'comments', array( 'Automattic\\Jetpack\\Sync\\Modules\\Posts' ), false ),
			array( 'comments', array( 'Automattic\\Jetpack\\Sync\\Modules\\Comments' ), true ),
			array( 'commentmeta', array( 'Automattic\\Jetpack\\Sync\\Modules\\Posts' ), false ),
			array( 'commentmeta', array( 'Automattic\\Jetpack\\Sync\\Modules\\Comments' ), true ),
			array( 'terms', array( 'Automattic\\Jetpack\\Sync\\Modules\\Posts' ), false ),
			array( 'terms', array( 'Automattic\\Jetpack\\Sync\\Modules\\Terms' ), true ),
			array( 'termmeta', array( 'Automattic\\Jetpack\\Sync\\Modules\\Posts' ), false ),
			array( 'termmeta', array( 'Automattic\\Jetpack\\Sync\\Modules\\Terms' ), true ),
			array( 'term_relationships', array( 'Automattic\\Jetpack\\Sync\\Modules\\Posts' ), false ),
			array( 'term_relationships', array( 'Automattic\\Jetpack\\Sync\\Modules\\Terms' ), true ),
		);
	}

	/**
	 * Test table names are validated.
	 * Note that `test_checksum_with_disabled_sync_modules()` has the checks, but is skipped.
	 *
	 * @dataProvider table_provider
	 *
	 * @param string  $table    Table name.
	 * @param boolean $is_valid Is it a valid table name.
	 */
	#[DataProvider( 'table_provider' )]
	public function test_checksum_validate_table_name( $table, $is_valid ) {
		if ( ! $is_valid ) {
			// Exception expected if not a valid table name.
			$this->expectException( Exception::class );
		}

		$checksum = new Table_Checksum( $table );
		$this->assertInstanceOf( Table_Checksum::class, $checksum );
	}

	/**
	 * Validate a WP_Error checksum is returned for each table
	 * when the corresponding Sync modules are disabled.
	 *
	 * @dataProvider table_modules_provider
	 *
	 * @param string $table           Table name.
	 * @param array  $enabled_modules Array of classnames of Sync enabled modules.
	 * @param bool   $is_valid        Whether the checksum is valid. If not, an exception is expected.
	 */
	#[DataProvider( 'table_modules_provider' )]
	public function test_checksum_with_disabled_sync_modules( $table, $enabled_modules, $is_valid ) {
		$this->markTestSkipped( 'Test breaks state needed by other tests' );
		// @phan-suppress-next-line PhanPluginUnreachableCode
		if ( ! $is_valid ) {
			// Exception expected if corresponding Sync module is not enabled.
			$this->expectException( Exception::class );
		}

		// Hack to force Sync modules to be re-initialized.
		$reflection = new ReflectionClass( 'Automattic\Jetpack\Sync\Modules' );

		$prop = $reflection->getProperty( 'initialized_modules' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true );
		}
		$prop->setValue( null, null );

		$this->sync_enabled_modules = $enabled_modules;
		add_filter( 'jetpack_sync_modules', array( $this, 'sync_modules_filter' ), 100 );

		$checksum = new Table_Checksum( $table );
		$this->assertInstanceOf( Table_Checksum::class, $checksum );

		remove_filter( 'jetpack_sync_modules', array( $this, 'sync_modules_filter' ) );

		// Clean-up.
		$prop->setValue( null, null );
	}

	/**
	 * Array of Table Configurations with different field names.
	 *
	 * @return array{array,bool,?string}[]
	 */
	public static function field_validation_provider() {
		global $wpdb;

		return array(
			array(
				array(
					'posts' => array(
						'table'           => $wpdb->posts,
						'range_field'     => 'ID',
						'key_fields'      => array( 'ID' ),
						'checksum_fields' => array( 'post_modified_gmt' ),
						'filter_values'   => Settings::get_disallowed_post_types_structured(),
					),
				),
				true,
				null,
			),
			array(
				array(
					'posts' => array(
						'table'           => $wpdb->posts,
						'range_field'     => 'ID!',
						'key_fields'      => array( 'ID' ),
						'checksum_fields' => array( 'post_modified_gmt' ),
						'filter_values'   => Settings::get_disallowed_post_types_structured(),
					),
				),
				false,
				'ID!',
			),
			array(
				array(
					'posts' => array(
						'table'           => $wpdb->posts,
						'range_field'     => 'ID',
						'key_fields'      => array( 'ID' ),
						'checksum_fields' => array( 'post_modified_gmt*/' ),
						'filter_values'   => Settings::get_disallowed_post_types_structured(),
					),
				),
				false,
				'post_modified_gmt*/',
			),
			array(
				array(
					'posts' => array(
						'table'           => $wpdb->posts,
						'range_field'     => 'ID',
						'key_fields'      => array( 'ID/*' ),
						'checksum_fields' => array( 'post_modified_gmt' ),
						'filter_values'   => Settings::get_disallowed_post_types_structured(),
					),
				),
				false,
				'ID/*',
			),
		);
	}

	/**
	 * Returns the allowed_tables Table Configurations.
	 *
	 * @param  array $tables Table Configurations.
	 * @return array Table Configurations.
	 */
	public function set_allowed_tables( $tables ) {
		$tables = $this->allowed_tables;
		return $tables;
	}

	/**
	 * Verify invalid field names throw exceptions.
	 *
	 * @dataProvider field_validation_provider
	 *
	 * @param array   $table_configurations Table Configuration to overide defaults.
	 * @param boolean $is_valid             Is this a valid field name.
	 * @param ?string $field                Field under test.
	 */
	#[DataProvider( 'field_validation_provider' )]
	public function test_checksum_validate_fields( $table_configurations, $is_valid, $field ) {

		$this->allowed_tables = $table_configurations;
		add_filter( 'jetpack_sync_checksum_allowed_tables', array( $this, 'set_allowed_tables' ) );

		$user_id = self::factory()->user->create();

		// create a post.
		$post_id = self::factory()->post->create( array( 'post_author' => $user_id ) );
		get_post( $post_id );

		// Perform Checksum.
		$tc     = new Table_Checksum( 'posts' );
		$result = $tc->calculate_checksum();

		if ( ! $is_valid ) {
			$this->assertTrue( is_wp_error( $result ) );
			$expected_message = "Invalid field name: $field is not allowed";
			$this->assertSame( $expected_message, $result->get_error_message() );
		} else {
			$this->assertFalse( is_wp_error( $result ) );
		}
	}

	/**
	 * Array of Table Configurations with non-existent field names.
	 *
	 * @return array{array,bool,?string}[]
	 */
	public static function field_table_validation_provider() {
		global $wpdb;

		return array(
			array(
				array(
					'posts' => array(
						'table'           => $wpdb->posts,
						'range_field'     => 'ID',
						'key_fields'      => array( 'ID' ),
						'checksum_fields' => array( 'post_modified_gmt' ),
						'filter_sql'      => Settings::get_blacklisted_post_types_sql(),
					),
				),
				true,
				null,
			),
			array(
				array(
					'posts' => array(
						'table'           => $wpdb->posts,
						'range_field'     => 'ID_2',
						'key_fields'      => array( 'ID' ),
						'checksum_fields' => array( 'post_modified_gmt' ),
						'filter_sql'      => Settings::get_blacklisted_post_types_sql(),
					),
				),
				false,
				'ID_2',
			),
			array(
				array(
					'posts' => array(
						'table'           => $wpdb->posts,
						'range_field'     => 'ID',
						'key_fields'      => array( 'ID' ),
						'checksum_fields' => array( 'post_modified_gmt_2' ),
						'filter_sql'      => Settings::get_blacklisted_post_types_sql(),
					),
				),
				false,
				'post_modified_gmt_2',
			),
			array(
				array(
					'posts' => array(
						'table'           => $wpdb->posts,
						'range_field'     => 'ID',
						'key_fields'      => array( 'ID_2' ),
						'checksum_fields' => array( 'post_modified_gmt' ),
						'filter_sql'      => Settings::get_blacklisted_post_types_sql(),
					),
				),
				false,
				'ID_2',
			),
		);
	}

	/**
	 * Verify field names that are not in the table throw exceptions.
	 *
	 * @dataProvider field_table_validation_provider
	 *
	 * @param array   $table_configurations Table Configuration to overide defaults.
	 * @param boolean $is_valid             Is this a valid field name.
	 * @param ?string $field                Field under test.
	 */
	#[DataProvider( 'field_table_validation_provider' )]
	public function test_checksum_validate_fields_against_table( $table_configurations, $is_valid, $field ) {
		global $wpdb;

		$this->allowed_tables = $table_configurations;
		add_filter( 'jetpack_sync_checksum_allowed_tables', array( $this, 'set_allowed_tables' ) );

		$user_id = self::factory()->user->create();

		// create a post, needed to allow for field checks.
		$post_id = self::factory()->post->create( array( 'post_author' => $user_id ) );
		get_post( $post_id );

		// Calculate checksum.
		$tc     = new Table_Checksum( 'posts' );
		$result = $tc->calculate_checksum();

		if ( ! $is_valid ) {
			$this->assertTrue( is_wp_error( $result ) );
			$expected_message = "Invalid field name: field '{$field}' doesn't exist in table {$wpdb->posts}";
			$this->assertSame( $expected_message, $result->get_error_message() );
		} else {
			$this->assertFalse( is_wp_error( $result ) );
		}
	}

	/**
	 * Data Provider for get_field_ranges_posts tests.
	 *
	 * @return int[][]
	 */
	public static function get_field_ranges_posts_provider() {
		/*
		 * Data Format.
		 *
		 * param 1 -> # of posts to create.
		 * param 2 -> # at which to create disallowed post.
		 * param 3 -> expected item count.
		 *
		 */
		return array(
			array(
				0,
				-1,
				0,
			),
			array(
				1,
				1,
				0,
			),
			array(
				1,
				-1,
				1,
			),
			array(
				10,
				-1,
				10,
			),
			array(
				5,
				1,
				4,
			),
			array(
				20,
				10,
				19,
			),
			array(
				16,
				16,
				15,
			),
		);
	}

	/**
	 * Verify get_range_edges returns expected values for Posts.
	 *
	 * @dataProvider get_field_ranges_posts_provider
	 *
	 * @param int $num_posts      Number of Posts to Generate.
	 * @param int $disallow_index Index of generated post to be of disallowed post_type.
	 * @param int $expected_count expected number of posts to be returned.
	 */
	#[DataProvider( 'get_field_ranges_posts_provider' )]
	public function test_get_range_edges_posts( $num_posts, $disallow_index, $expected_count ) {

		// Generate Test Content.
		$user_id            = self::factory()->user->create();
		$min_range_expected = null;
		$max_range_expected = null;

		for ( $i = 1; $i <= $num_posts; $i++ ) {
			if ( $disallow_index === $i ) {
				// create a disallowed post_type post.
				$post_id = self::factory()->post->create(
					array(
						'post_author' => $user_id,
						'post_type'   => 'snitch',
					)
				);
			} else {
				// create an allowed post_type post.
				$post_id = self::factory()->post->create( array( 'post_author' => $user_id ) );
				if ( $min_range_expected === null ) {
					$min_range_expected = $post_id; // set initial post_id.
				}
				$max_range_expected = $post_id; // update last post_id.
			}
		}

		// Get Range Edges.
		$tc    = new Table_Checksum( 'posts' );
		$range = $tc->get_range_edges();

		$this->assertSame( $expected_count, (int) $range['item_count'] );

		// Verify min/max of range only when we have results.
		if ( 0 !== $expected_count ) {
			$this->assertSame( $min_range_expected, (int) $range['min_range'] );
			$this->assertSame( $max_range_expected, (int) $range['max_range'] );
		}
	}

	/**
	 * Data Provider for get_field_ranges_posts_args tests.
	 *
	 * @return int[][]
	 */
	public static function get_field_ranges_posts_args_provider() {
		/*
		 * Data Format.
		 *
		 * param 1 -> # of posts to create.
		 * param 2 -> expected item count to be returned.
		 * param 3 -> offset to be passed to range_from of get_field_ranges.
		 * param 4 -> offset to be passed to range_to of get_field_ranges.
		 * param 5 -> limit to be passed to get_field_ranges.
		 *
		 */
		return array(
			array( // limit less than # of posts.
				10,
				5,
				null,
				null,
				5,
			),
			array( // limit higher than # of posts.
				5,
				5,
				null,
				null,
				10,
			),
			array( // range_from lower than first post.
				5,
				5,
				-20,
				null,
				null,
			),
			array( // range_to higher than last post.
				10,
				10,
				null,
				20,
				null,
			),
			array( // range_from excludes first 5.
				10,
				5,
				5,
				null,
				null,
			),
			array( // range_to excluded last 5.
				10,
				5,
				null,
				-5,
				null,
			),
			array( // range excludes post at start and end.
				10,
				8,
				1,
				-1,
				null,
			),
			array( // range_from is after any posts.
				5,
				0,
				30,
				null,
				null,
			),
			array( // range_to is before any posts.
				5,
				0,
				null,
				-10,
				null,
			),
		);
	}

	/**
	 * Test that Range parameters modify returned results.
	 *
	 * @dataProvider get_field_ranges_posts_args_provider
	 *
	 * @param int      $num_posts           Number of Posts to Generate.
	 * @param int      $expected_item_count Expected item_count to return in range.
	 * @param int|null $range_from_offset   Offset to set on the range_from based on first post.
	 * @param int|null $range_to_offset     Offset to set on the range_to based on last post.
	 * @param int|null $limit               limit to be passed to get_range_edges.
	 */
	#[DataProvider( 'get_field_ranges_posts_args_provider' )]
	public function test_get_range_edges_posts_args( $num_posts, $expected_item_count, $range_from_offset, $range_to_offset, $limit ) {

		// Generate Test Content.
		$user_id            = self::factory()->user->create();
		$min_range_expected = null;
		$max_range_expected = null;

		for ( $i = 1; $i <= $num_posts; $i++ ) {
			$post_id = self::factory()->post->create( array( 'post_author' => $user_id ) );
			if ( $min_range_expected === null ) {
				$min_range_expected = $post_id; // set initial post_id.
			}
			$max_range_expected = $post_id; // update last post_id.
		}

		// Update offsets.
		$range_from = null;
		$range_to   = null;
		if ( $range_from_offset !== null ) {
			$range_from = $min_range_expected + $range_from_offset;
		}
		if ( $range_to_offset !== null ) {
			$range_to = $max_range_expected + $range_to_offset;
		}

		// Get Range Edges.
		$tc    = new Table_Checksum( 'posts' );
		$range = $tc->get_range_edges( $range_from, $range_to, $limit );

		$this->assertSame( $expected_item_count, (int) $range['item_count'] );
		if ( $range_from !== null && $expected_item_count > 0 ) {
			$this->assertGreaterThanOrEqual( $range_from, (int) $range['min_range'] );
		}
		if ( $range_to !== null && $expected_item_count > 0 ) {
			$this->assertLessThanOrEqual( $range_to, (int) $range['max_range'] );
		}
	}

	/**
	 * Test that Checksum generates consistently.
	 *
	 * Note that php's crc32 does not match MySQL's crc32 so this is a test of consistency.
	 */
	public function test_calculate_checksum() {

		// Generate Test Content.
		$user_id            = self::factory()->user->create();
		$min_range_expected = null;
		$max_range_expected = null;

		for ( $i = 1; $i <= 10; $i++ ) {
			// create an allowed post_type post.
			$post_id = self::factory()->post->create( array( 'post_author' => $user_id ) );
			if ( $min_range_expected === null ) {
				$min_range_expected = $post_id; // set initial post_id.
			}
			$max_range_expected = $post_id; // update last post_id.
		}

		// Calculate Checksum.
		$tc              = new Table_Checksum( 'posts' );
		$checksum_full   = $tc->calculate_checksum();
		$checksum_half_1 = $tc->calculate_checksum( $min_range_expected, $max_range_expected - 5 );
		$checksum_half_2 = $tc->calculate_checksum( $max_range_expected - 4, $max_range_expected );

		$this->assertSame( (int) $checksum_full, (int) ( $checksum_half_1 + $checksum_half_2 ) );
	}

	/**
	 * Test that get_range_edges for postmeta uses parent table count optimization.
	 */
	public function test_get_range_edges_postmeta_uses_parent_count() {
		global $wpdb;

		$user_id = self::factory()->user->create();

		// Create 5 posts, each with meta.
		for ( $i = 0; $i < 5; $i++ ) {
			$post_id = self::factory()->post->create( array( 'post_author' => $user_id ) );
			add_post_meta( $post_id, 'test_key', 'value' );
		}

		$tc    = new Table_Checksum( 'postmeta' );
		$range = $tc->get_range_edges();

		$this->assertGreaterThan( 0, (int) $range['item_count'] );

		// Ensure the optimized path is used: the query should not use COUNT(DISTINCT ...).
		$this->assertStringNotContainsString( 'COUNT(DISTINCT', $wpdb->last_query );
	}

	/**
	 * Test that get_range_edges for postmeta with limit uses original DISTINCT behavior.
	 */
	public function test_get_range_edges_postmeta_with_limit() {
		global $wpdb;

		$user_id = self::factory()->user->create();

		// Create 10 posts with meta.
		for ( $i = 0; $i < 10; $i++ ) {
			$post_id = self::factory()->post->create( array( 'post_author' => $user_id ) );
			add_post_meta( $post_id, 'test_key', 'value' );
		}

		$tc    = new Table_Checksum( 'postmeta' );
		$range = $tc->get_range_edges( null, null, 5 );

		// With limit=5, the DISTINCT subquery path should return at most 5 items.
		$this->assertLessThanOrEqual( 5, (int) $range['item_count'] );
		$this->assertGreaterThan( 0, (int) $range['item_count'] );

		// The limit path should use DISTINCT in the subquery, not the parent count.
		$this->assertStringContainsString( 'DISTINCT', $wpdb->last_query );
	}

	/**
	 * Test that get_range_edges for commentmeta uses parent table count optimization.
	 */
	public function test_get_range_edges_commentmeta_uses_parent_count() {
		global $wpdb;

		$user_id = self::factory()->user->create();
		$post_id = self::factory()->post->create( array( 'post_author' => $user_id ) );

		// Create 3 comments, each with meta. Non-whitelisted keys work because
		// get_range_edges() strips filter_values for meta tables (postmeta,
		// commentmeta, termmeta, woocommerce_order_itemmeta). Note: termmeta
		// also strips filters, even though it skips the parent-count optimization.
		for ( $i = 0; $i < 3; $i++ ) {
			$comment_id = self::factory()->comment->create(
				array(
					'comment_post_ID' => $post_id,
					'user_id'         => $user_id,
				)
			);
			add_comment_meta( $comment_id, 'test_meta_key', 'test_meta_value' );
		}

		$tc    = new Table_Checksum( 'commentmeta' );
		$range = $tc->get_range_edges();

		$this->assertGreaterThan( 0, (int) $range['item_count'] );

		// Ensure the optimized path is used: the query should not use COUNT(DISTINCT ...).
		$this->assertStringNotContainsString( 'COUNT(DISTINCT', $wpdb->last_query );
	}

	/**
	 * Test that get_range_edges strips filter_values for meta tables, but
	 * checksum calculation still respects them.
	 *
	 * Creates commentmeta with only non-whitelisted keys. Range edges should
	 * return valid results (filters stripped), but the checksum should be null
	 * because no rows match the filter during checksum calculation.
	 */
	public function test_get_range_edges_meta_tables_strip_filters() {
		$user_id = self::factory()->user->create();
		$post_id = self::factory()->post->create( array( 'post_author' => $user_id ) );

		// Create comments with only non-whitelisted meta keys.
		for ( $i = 0; $i < 3; $i++ ) {
			$comment_id = self::factory()->comment->create(
				array(
					'comment_post_ID' => $post_id,
					'user_id'         => $user_id,
				)
			);
			add_comment_meta( $comment_id, 'non_whitelisted_key', 'value' );
		}

		$tc    = new Table_Checksum( 'commentmeta' );
		$range = $tc->get_range_edges();

		// Even though the meta key is not whitelisted, range edges should still
		// return valid results because filter_values are stripped for meta tables.
		$this->assertNotNull( $range['min_range'] );
		$this->assertNotNull( $range['max_range'] );
		$this->assertGreaterThan( 0, (int) $range['item_count'] );

		// But the checksum should be null — no rows match the filter_values
		// whitelist during checksum calculation, proving filters are restored.
		$checksum = $tc->calculate_checksum();
		$this->assertNull( $checksum );
	}

	/**
	 * Test that termmeta uses COUNT(DISTINCT) instead of parent count from term_taxonomy.
	 *
	 * The term_taxonomy's row count is not a reliable proxy for the distinct term_id count
	 * in termmeta, so get_parent_table_count() should return false for term-related tables.
	 */
	public function test_get_range_edges_termmeta_skips_parent_count() {
		global $wpdb;

		// Create 2 terms with meta.
		for ( $i = 0; $i < 2; $i++ ) {
			$term = self::factory()->term->create_and_get( array( 'taxonomy' => 'category' ) );
			add_term_meta( $term->term_id, 'test_key', 'value' );
		}

		$tc    = new Table_Checksum( 'termmeta' );
		$range = $tc->get_range_edges();

		$this->assertGreaterThan( 0, (int) $range['item_count'] );

		// Termmeta should use COUNT(DISTINCT), not the parent count from term_taxonomy.
		$this->assertStringContainsString( 'COUNT( DISTINCT', $wpdb->last_query );
	}

	/**
	 * Test that parent count of zero falls back to COUNT(DISTINCT) instead of
	 * returning item_count=0, which would cause checksum_histogram() to
	 * early-return an empty histogram.
	 */
	public function test_get_range_edges_falls_back_when_parent_count_is_zero() {
		global $wpdb;

		$user_id = self::factory()->user->create();

		// Create posts with meta, then delete all posts to leave orphaned postmeta.
		$post_ids = array();
		for ( $i = 0; $i < 3; $i++ ) {
			$post_id    = self::factory()->post->create( array( 'post_author' => $user_id ) );
			$post_ids[] = $post_id;
			add_post_meta( $post_id, 'orphan_key', 'value' );
		}

		// Delete all posts via SQL to leave orphaned postmeta rows.
		$wpdb->query( "DELETE FROM {$wpdb->posts}" );

		Table_Checksum::reset_range_edges_cache();

		$tc    = new Table_Checksum( 'postmeta' );
		$range = $tc->get_range_edges();

		// With 0 posts, parent count is 0 so the optimization should be skipped.
		// The fallback COUNT(DISTINCT) should return the actual orphaned meta count.
		$this->assertGreaterThan( 0, (int) $range['item_count'] );
		$this->assertNotNull( $range['min_range'] );
		$this->assertNotNull( $range['max_range'] );

		// Verify the fallback path uses COUNT(DISTINCT), not the parent count.
		$this->assertStringContainsString( 'COUNT( DISTINCT', $wpdb->last_query );
	}

	/**
	 * Test that sub-range calls to get_range_edges() use COUNT(DISTINCT), not the
	 * parent table's total count.
	 *
	 * Using the total parent count for a sub-range would produce an oversized bucket,
	 * causing checksum_histogram() to compute checksums over the wrong range.
	 */
	public function test_get_range_edges_subrange_skips_parent_count() {
		global $wpdb;

		$user_id = self::factory()->user->create();

		// Create 10 posts, each with meta.
		$post_ids = array();
		for ( $i = 0; $i < 10; $i++ ) {
			$post_id    = self::factory()->post->create( array( 'post_author' => $user_id ) );
			$post_ids[] = $post_id;
			add_post_meta( $post_id, 'test_key', 'value' );
		}

		sort( $post_ids );

		// Pick a sub-range covering roughly the first half of posts.
		$range_from = $post_ids[0];
		$range_to   = $post_ids[4];

		$tc    = new Table_Checksum( 'postmeta' );
		$range = $tc->get_range_edges( $range_from, $range_to );

		// Capture before the verification query overwrites it.
		$range_edges_query = $wpdb->last_query;

		// item_count must reflect the actual distinct post_ids in this sub-range,
		// not the total posts count. The sub-range has at most 5 distinct post_ids.
		$actual_distinct = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(DISTINCT post_id) FROM {$wpdb->postmeta} WHERE post_id >= %d AND post_id <= %d",
				$range_from,
				$range_to
			)
		);

		$this->assertEquals( $actual_distinct, (int) $range['item_count'] );

		// Verify the sub-range path uses COUNT(DISTINCT), not the parent count.
		$this->assertStringContainsString( 'COUNT( DISTINCT', $range_edges_query );
	}

	/**
	 * Test that sub-range calls do not pollute the static cache used by
	 * get_parent_table_count(). A sub-range call on the parent table should
	 * not overwrite the full-table count in the cache.
	 */
	public function test_get_range_edges_subrange_does_not_pollute_cache() {
		global $wpdb;

		$user_id = self::factory()->user->create();

		// Create 10 posts, each with meta.
		$post_ids = array();
		for ( $i = 0; $i < 10; $i++ ) {
			$post_id    = self::factory()->post->create( array( 'post_author' => $user_id ) );
			$post_ids[] = $post_id;
			add_post_meta( $post_id, 'test_key', 'value' );
		}

		sort( $post_ids );

		// Call get_range_edges on posts with a sub-range — this should NOT cache.
		$posts_tc = new Table_Checksum( 'posts' );
		$posts_tc->get_range_edges( $post_ids[0], $post_ids[4] );

		// Now call get_range_edges on postmeta (full range). If the sub-range
		// result was cached, postmeta would reuse the scoped posts count instead
		// of querying the full posts count.
		$meta_tc    = new Table_Checksum( 'postmeta' );
		$meta_range = $meta_tc->get_range_edges();

		$full_posts_count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->posts}" );

		// item_count should equal the full posts count, not the sub-range count.
		$this->assertEquals( $full_posts_count, (int) $meta_range['item_count'] );
	}

	/**
	 * Test that get_parent_table_count() reuses the cached result from a prior
	 * full-range get_range_edges() call on the parent table, rather than
	 * re-querying the parent.
	 */
	public function test_get_range_edges_parent_count_reuses_cache() {
		global $wpdb;

		$user_id = self::factory()->user->create();

		// Create 5 posts, each with meta.
		for ( $i = 0; $i < 5; $i++ ) {
			$post_id = self::factory()->post->create( array( 'post_author' => $user_id ) );
			add_post_meta( $post_id, 'test_key', 'value' );
		}

		// Prime the cache by querying posts first (simulates checksum_all order).
		$posts_tc    = new Table_Checksum( 'posts' );
		$posts_range = $posts_tc->get_range_edges();

		// Now query postmeta — should reuse cached posts count.
		$meta_tc    = new Table_Checksum( 'postmeta' );
		$meta_range = $meta_tc->get_range_edges();

		// The postmeta query should be a MIN/MAX on postmeta only, not a posts query.
		$this->assertStringContainsString( $wpdb->postmeta, $wpdb->last_query );
		$this->assertStringNotContainsString( $wpdb->posts, $wpdb->last_query );

		// And item_count should match the posts count from the cached result.
		$this->assertEquals( (int) $posts_range['item_count'], (int) $meta_range['item_count'] );
	}

	/**
	 * Filter Sync modules.
	 *
	 * @return array
	 */
	public function sync_modules_filter() {
		return $this->sync_enabled_modules;
	}
}
