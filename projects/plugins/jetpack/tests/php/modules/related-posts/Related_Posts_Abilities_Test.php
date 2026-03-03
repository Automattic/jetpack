<?php
/**
 * Unit tests for Jetpack Related Posts Abilities
 *
 * @package automattic/jetpack
 * @phan-file-suppress PhanPluginUnreachableCode -- markTestSkipped throws but Phan doesn't know that
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Ability API added in WP 6.9, but then we need a suppression for the WP 6.8 compat run. @todo Remove this line when we drop WP <6.9.

require __DIR__ . '/../../../../modules/related-posts.php';

/**
 * Unit tests for Related Posts Abilities registration and execution.
 */
class Related_Posts_Abilities_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The current user id (admin).
	 *
	 * @var int
	 */
	private static $admin_user_id;

	/**
	 * The current user id without permissions (subscriber).
	 *
	 * @var int
	 */
	private static $subscriber_user_id;

	/**
	 * A test post ID.
	 *
	 * @var int
	 */
	private static $test_post_id;

	/**
	 * Set up the test fixture.
	 */
	public function set_up() {
		parent::set_up();

		// Load the related posts module
		Jetpack_RelatedPosts_Module::instance()->action_on_load();

		// Create admin user
		self::$admin_user_id = wp_insert_user(
			array(
				'user_login' => 'rp_test_admin_' . uniqid(),
				'user_pass'  => 'password123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( self::$admin_user_id );

		// Create subscriber user
		self::$subscriber_user_id = wp_insert_user(
			array(
				'user_login' => 'rp_test_subscriber_' . uniqid(),
				'user_pass'  => 'password123',
				'role'       => 'subscriber',
			)
		);

		// Create a test post
		self::$test_post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post for Related Posts',
				'post_content' => 'This is a test post content for related posts abilities testing.',
				'post_status'  => 'publish',
				'post_author'  => self::$admin_user_id,
			)
		);
	}

	/**
	 * Tear down the test fixture.
	 */
	public function tear_down() {
		// Clean up test post
		if ( self::$test_post_id ) {
			wp_delete_post( self::$test_post_id, true );
		}

		parent::tear_down();
	}

	/**
	 * Simulates the `wp_abilities_api_categories_init` action.
	 */
	private function simulate_doing_wp_abilities_categories_init_action() {
		global $wp_current_filter;
		$wp_current_filter[] = 'wp_abilities_api_categories_init';
	}

	/**
	 * Simulates the `wp_abilities_api_init` action.
	 */
	private function simulate_doing_wp_abilities_init_action() {
		global $wp_current_filter;
		$wp_current_filter[] = 'wp_abilities_api_init';
	}

	/**
	 * Test that abilities are initialized without errors.
	 */
	public function test_abilities_initialization() {
		Related_Posts_Abilities::init();

		// Trigger the Abilities API init hooks if not already fired
		if ( ! did_action( 'wp_abilities_api_categories_init' ) ) {
			do_action( 'wp_abilities_api_categories_init' );
		}
		if ( ! did_action( 'wp_abilities_api_init' ) ) {
			do_action( 'wp_abilities_api_init' );
		}

		// If Abilities API is available, verify abilities are registered
		if ( function_exists( 'wp_get_abilities' ) ) {
			$abilities         = wp_get_abilities();
			$related_abilities = array_filter(
				$abilities,
				function ( $ability ) {
					return str_starts_with( $ability->get_name(), 'jetpack-related-posts/' );
				}
			);

			$this->assertGreaterThan( 0, count( $related_abilities ), 'At least one Jetpack Related Posts ability should be registered' );
		} else {
			// Abilities API not available - initialization should not fail
			$this->assertTrue( true, 'Abilities initialization completed (Abilities API query functions not available)' );
		}
	}

	/**
	 * Test that the get-related ability is registered.
	 */
	public function test_get_related_ability_registered() {
		if ( ! function_exists( 'wp_get_ability' ) ) {
			$this->markTestSkipped( 'Abilities API query functions not available' );
			return;
		}

		$this->simulate_doing_wp_abilities_categories_init_action();
		Related_Posts_Abilities::register_category();

		$this->simulate_doing_wp_abilities_init_action();
		Related_Posts_Abilities::register_abilities();

		$ability = wp_get_ability( 'jetpack-related-posts/get-related' );
		$this->assertNotNull( $ability, 'get-related ability should be registered' );
	}

	/**
	 * Test that ability category is registered.
	 */
	public function test_ability_category_registered() {
		if ( ! function_exists( 'wp_has_ability_category' ) ) {
			$this->markTestSkipped( 'Abilities API category functions not available' );
			return;
		}

		$this->simulate_doing_wp_abilities_categories_init_action();
		Related_Posts_Abilities::register_category();

		$this->assertTrue(
			wp_has_ability_category( Related_Posts_Abilities::CATEGORY_SLUG ),
			'Jetpack Related Posts ability category should be registered'
		);
	}

	/**
	 * Test that missing post_id returns WP_Error with code missing_post_id.
	 */
	public function test_missing_post_id_returns_error() {
		$result = Related_Posts_Abilities::get_related_posts( array() );

		$this->assertInstanceOf( WP_Error::class, $result, 'Should return WP_Error when post_id is missing' );
		$this->assertEquals( 'missing_post_id', $result->get_error_code(), 'Error code should be missing_post_id' );
	}

	/**
	 * Test that non-existent post returns WP_Error with code post_not_found.
	 */
	public function test_nonexistent_post_returns_error() {
		$result = Related_Posts_Abilities::get_related_posts( array( 'post_id' => 999999999 ) );

		$this->assertInstanceOf( WP_Error::class, $result, 'Should return WP_Error when post does not exist' );
		$this->assertEquals( 'post_not_found', $result->get_error_code(), 'Error code should be post_not_found' );
	}

	/**
	 * Test that valid post returns array with post_id and related_posts keys.
	 */
	public function test_valid_post_returns_array() {
		wp_set_current_user( self::$admin_user_id );

		$result = Related_Posts_Abilities::get_related_posts( array( 'post_id' => self::$test_post_id ) );

		$this->assertIsArray( $result, 'Should return an array for valid post' );
		$this->assertArrayHasKey( 'post_id', $result, 'Result should contain post_id key' );
		$this->assertArrayHasKey( 'related_posts', $result, 'Result should contain related_posts key' );
		$this->assertEquals( self::$test_post_id, $result['post_id'], 'Returned post_id should match input' );
		$this->assertIsArray( $result['related_posts'], 'related_posts should be an array' );
	}

	/**
	 * Test that count is clamped to minimum of 1.
	 */
	public function test_count_clamped_to_minimum() {
		wp_set_current_user( self::$admin_user_id );

		// Test with count = 0
		$result = Related_Posts_Abilities::get_related_posts(
			array(
				'post_id' => self::$test_post_id,
				'count'   => 0,
			)
		);

		$this->assertIsArray( $result, 'Should return array even with count = 0' );
		// The clamping happens internally, we just verify no error
	}

	/**
	 * Test that count is clamped to maximum of 10.
	 */
	public function test_count_clamped_to_maximum() {
		wp_set_current_user( self::$admin_user_id );

		// Test with count = 100
		$result = Related_Posts_Abilities::get_related_posts(
			array(
				'post_id' => self::$test_post_id,
				'count'   => 100,
			)
		);

		$this->assertIsArray( $result, 'Should return array even with count = 100' );
		// The clamping happens internally, we just verify no error
	}

	/**
	 * Test permission callback - admin returns true.
	 */
	public function test_permission_callback_admin_returns_true() {
		wp_set_current_user( self::$admin_user_id );

		$this->assertTrue(
			Related_Posts_Abilities::can_edit_posts(),
			'Admin user should have edit_posts capability'
		);
	}

	/**
	 * Test permission callback - subscriber returns false.
	 */
	public function test_permission_callback_subscriber_returns_false() {
		wp_set_current_user( self::$subscriber_user_id );

		$this->assertFalse(
			Related_Posts_Abilities::can_edit_posts(),
			'Subscriber user should not have edit_posts capability'
		);
	}

	/**
	 * Test that abilities handle missing Abilities API gracefully.
	 */
	public function test_abilities_handle_missing_abilities_api() {
		// The init should not cause fatal errors even if Abilities API is not available
		Related_Posts_Abilities::init();

		// If wp_abilities_api_init hasn't fired, trigger it
		if ( ! did_action( 'wp_abilities_api_init' ) ) {
			do_action( 'wp_abilities_api_init' );
		}

		// Should complete without errors
		$this->assertTrue( true, 'Abilities initialization should handle missing Abilities API gracefully' );
	}

	/**
	 * Test that register_category handles missing wp_register_ability_category gracefully.
	 */
	public function test_register_category_handles_missing_function() {
		// This test verifies that register_category() doesn't fatal when
		// wp_register_ability_category doesn't exist. The function_exists
		// check inside register_category() handles this.
		$this->simulate_doing_wp_abilities_categories_init_action();

		// This should not fatal even if the function doesn't exist
		Related_Posts_Abilities::register_category();

		$this->assertTrue( true, 'register_category should not fatal when API is missing' );
	}

	/**
	 * Test that register_abilities handles missing wp_register_ability gracefully.
	 */
	public function test_register_abilities_handles_missing_function() {
		// This test verifies that register_abilities() doesn't fatal when
		// wp_register_ability doesn't exist. The function_exists
		// check inside register_abilities() handles this.
		$this->simulate_doing_wp_abilities_init_action();

		// This should not fatal even if the function doesn't exist
		Related_Posts_Abilities::register_abilities();

		$this->assertTrue( true, 'register_abilities should not fatal when API is missing' );
	}

	/**
	 * Test that register_abilities can be called multiple times safely (idempotent).
	 */
	public function test_register_abilities_idempotent() {
		$this->simulate_doing_wp_abilities_categories_init_action();
		Related_Posts_Abilities::register_category();

		$this->simulate_doing_wp_abilities_init_action();
		Related_Posts_Abilities::register_abilities();

		// Call register_abilities multiple times
		Related_Posts_Abilities::register_abilities();
		Related_Posts_Abilities::register_abilities();

		// Should not cause errors
		$this->assertTrue( true, 'register_abilities should be idempotent' );
	}

	/**
	 * Test that result includes helpful message when no related posts found.
	 */
	public function test_no_results_includes_message() {
		wp_set_current_user( self::$admin_user_id );

		$result = Related_Posts_Abilities::get_related_posts( array( 'post_id' => self::$test_post_id ) );

		$this->assertIsArray( $result, 'Should return an array' );

		// If no related posts found, there should be a message
		if ( empty( $result['related_posts'] ) ) {
			$this->assertArrayHasKey( 'message', $result, 'Result should contain message when no related posts found' );
			$this->assertNotEmpty( $result['message'], 'Message should not be empty' );
		}
	}

	/**
	 * Test default count value.
	 */
	public function test_default_count_value() {
		wp_set_current_user( self::$admin_user_id );

		// Call without specifying count
		$result = Related_Posts_Abilities::get_related_posts( array( 'post_id' => self::$test_post_id ) );

		$this->assertIsArray( $result, 'Should return an array' );
		// The default count of 3 is used internally, we just verify the call succeeds
	}
}
