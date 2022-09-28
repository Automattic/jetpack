<?php
/**
 * Integration Tests for Table Checksum functionality.
 *
 * @package automattic/jetpack-sync
 */

use Automattic\Jetpack\Sync\Replicastore\Table_Checksum;
use Automattic\Jetpack\Sync\Settings;

/**
 * Testing Table Checksum.
 *
 * @group jetpack-sync
 */
class WP_Test_Jetpack_Sync_Checksum extends WP_UnitTestCase {

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
	public function table_provider() {
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
	public function table_modules_provider() {
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
	 *
	 * @dataProvider table_provider
	 *
	 * @param string  $table    Table name.
	 * @param boolean $is_valid Is it a valid table name.
	 */
	public function test_checksum_validate_table_name( $table, $is_valid ) {
		if ( ! $is_valid ) {
			// Exception expected if not a valid table name.
			$this->expectException( Exception::class );
		} else {
			// Valid Tables do not need any assertion. so need to do an assert to appeas older versions.
			$this->assertTrue( true );
		}

		new Table_Checksum( $table );
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
	public function test_checksum_with_disabled_sync_modules( $table, $enabled_modules, $is_valid ) {
		if ( ! $is_valid ) {
			// Exception expected if corresponding Sync module is not enabled.
			$this->expectException( Exception::class );
		} else {
			// Valid Tables do not need any assertion.
			$this->assertTrue( true );
		}

		// Hack to force Sync modules to be re-initialized.
		$reflection = new ReflectionClass( 'Automattic\Jetpack\Sync\Modules' );

		$prop = $reflection->getProperty( 'initialized_modules' );
		$prop->setAccessible( true );
		$prop->setValue( null );

		$this->sync_enabled_modules = $enabled_modules;
		add_filter( 'jetpack_sync_modules', array( $this, 'sync_modules_filter' ), 100 );
		new Table_Checksum( $table );
		remove_filter( 'jetpack_sync_modules', array( $this, 'sync_modules_filter' ) );

		// Clean-up.
		$prop->setValue( null );
	}

	/**
	 * Array of Table Configurations with different field names.
	 *
	 * @return int[][]
	 */
	public function field_validation_provider() {
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
	 * @param string  $field                Field under test.
	 */
	public function test_checksum_validate_fields( $table_configurations, $is_valid, $field ) {

		$this->allowed_tables = $table_configurations;
		add_filter( 'jetpack_sync_checksum_allowed_tables', array( $this, 'set_allowed_tables' ) );

		$user_id = self::factory()->user->create();

		// create a post.
		$post_id    = self::factory()->post->create( array( 'post_author' => $user_id ) );
		$this->post = get_post( $post_id );

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
	 * @return int[][]
	 */
	public function field_table_validation_provider() {
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
	 * @param string  $field                Field under test.
	 */
	public function test_checksum_validate_fields_against_table( $table_configurations, $is_valid, $field ) {
		global $wpdb;

		$this->allowed_tables = $table_configurations;
		add_filter( 'jetpack_sync_checksum_allowed_tables', array( $this, 'set_allowed_tables' ) );

		$user_id = self::factory()->user->create();

		// create a post, needed to allow for field checks.
		$post_id    = self::factory()->post->create( array( 'post_author' => $user_id ) );
		$this->post = get_post( $post_id );

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
	public function get_field_ranges_posts_provider() {
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
	public function test_get_range_edges_posts( $num_posts, $disallow_index, $expected_count ) {

		// Generate Test Content.
		$user_id            = self::factory()->user->create();
		$min_range_expected = null;
		$max_range_expected = null;

		for ( $i = 1; $i <= $num_posts; $i ++ ) {
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
	public function get_field_ranges_posts_args_provider() {
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
	public function test_get_range_edges_posts_args( $num_posts, $expected_item_count, $range_from_offset, $range_to_offset, $limit ) {

		// Generate Test Content.
		$user_id            = self::factory()->user->create();
		$min_range_expected = null;
		$max_range_expected = null;

		for ( $i = 1; $i <= $num_posts; $i ++ ) {
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

		for ( $i = 1; $i <= 10; $i ++ ) {
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
	 * Filter Sync modules.
	 *
	 * @return array
	 */
	public function sync_modules_filter() {
		return $this->sync_enabled_modules;
	}

}
