<?php
/**
 * Unit tests for Jetpack Related Posts Abilities
 *
 * @package automattic/jetpack
 * @phan-file-suppress PhanPluginUnreachableCode -- markTestSkipped throws but Phan doesn't know that
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Ability API added in WP 6.9, but then we need a suppression for the WP 6.8 compat run. @todo Remove this line when we drop WP <6.9.

require_once __DIR__ . '/../../../../modules/related-posts.php';

/**
 * Unit tests for Related Posts Abilities registration and execution.
 */
class Related_Posts_Abilities_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	private $admin_user_id;

	/**
	 * Subscriber user ID.
	 *
	 * @var int
	 */
	private $subscriber_user_id;

	/**
	 * A test post ID.
	 *
	 * @var int
	 */
	private $test_post_id;

	/**
	 * Set up the test fixture.
	 */
	public function set_up() {
		parent::set_up();

		Jetpack_RelatedPosts_Module::instance()->action_on_load();

		$this->admin_user_id = wp_insert_user(
			array(
				'user_login' => 'rp_test_admin',
				'user_pass'  => 'password123',
				'role'       => 'administrator',
			)
		);

		$this->subscriber_user_id = wp_insert_user(
			array(
				'user_login' => 'rp_test_subscriber',
				'user_pass'  => 'password123',
				'role'       => 'subscriber',
			)
		);

		$this->test_post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post for Related Posts',
				'post_content' => 'This is a test post content for related posts abilities testing.',
				'post_status'  => 'publish',
				'post_author'  => $this->admin_user_id,
			)
		);
	}

	/**
	 * Test that the get-related ability is registered.
	 *
	 * The ability is registered by action_on_load() → Related_Posts_Abilities::init()
	 * which runs in set_up().
	 */
	public function test_get_related_ability_registered() {
		if ( ! function_exists( 'wp_get_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available (requires WP 6.9+)' );
			return;
		}

		$ability = wp_get_ability( 'jetpack/get-related-posts' );
		$this->assertNotNull( $ability, 'get-related ability should be registered' );
	}

	/**
	 * Test that ability category is registered.
	 *
	 * The category is registered by action_on_load() → Related_Posts_Abilities::init()
	 * which runs in set_up().
	 */
	public function test_ability_category_registered() {
		if ( ! function_exists( 'wp_has_ability_category' ) ) {
			$this->markTestSkipped( 'Abilities API not available (requires WP 6.9+)' );
			return;
		}

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
		$result = Related_Posts_Abilities::get_related_posts( array( 'post_id' => $this->test_post_id ) );

		$this->assertIsArray( $result, 'Should return an array for valid post' );
		$this->assertArrayHasKey( 'post_id', $result, 'Result should contain post_id key' );
		$this->assertArrayHasKey( 'related_posts', $result, 'Result should contain related_posts key' );
		$this->assertEquals( $this->test_post_id, $result['post_id'], 'Returned post_id should match input' );
		$this->assertIsArray( $result['related_posts'], 'related_posts should be an array' );
	}

	/**
	 * Test permission callback - admin returns true.
	 */
	public function test_permission_callback_admin_returns_true() {
		wp_set_current_user( $this->admin_user_id );

		$this->assertTrue(
			Related_Posts_Abilities::can_edit_posts(),
			'Admin user should have edit_posts capability'
		);
	}

	/**
	 * Test permission callback - subscriber returns false.
	 */
	public function test_permission_callback_subscriber_returns_false() {
		wp_set_current_user( $this->subscriber_user_id );

		$this->assertFalse(
			Related_Posts_Abilities::can_edit_posts(),
			'Subscriber user should not have edit_posts capability'
		);
	}

	/**
	 * Test that result includes helpful message when no related posts found.
	 *
	 * In test environments without Elasticsearch, related_posts is always empty.
	 */
	public function test_no_results_includes_message() {
		$result = Related_Posts_Abilities::get_related_posts( array( 'post_id' => $this->test_post_id ) );

		$this->assertIsArray( $result );
		$this->assertEmpty( $result['related_posts'], 'Test environment should return no related posts' );
		$this->assertArrayHasKey( 'message', $result, 'Result should contain message when no related posts found' );
		$this->assertNotEmpty( $result['message'], 'Message should not be empty' );
	}
}
