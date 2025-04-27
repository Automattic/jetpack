<?php // phpcs:disable WordPress.Files.FileName.InvalidClassFileName, Squiz.Commenting.InlineComment.WrongStyle
/**
 * Tests for Share Status.
 */

namespace Automattic\Jetpack\Publicize;

use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\PostMeta as WorDBless_PostMeta;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;

/**
 * Class Share_Status_Test
 */
class Share_Status_Test extends TestCase {

	/**
	 * The admin user ID.
	 *
	 * @var int
	 */
	private static $admin_id = 0;

	/**
	 * The post ID.
	 *
	 * @var int
	 */
	private static $post_id = 0;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		static::$admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_admin',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);

		static::$post_id = wp_insert_post(
			array(
				'post_author'  => static::$admin_id,
				'post_title'   => 'acd',
				'post_excerpt' => 'dsad',
				'post_status'  => 'publish',
				'post_type'    => 'post',
			)
		);

		$connections = array(
			array(
				'connection_id' => '111',
				'display_name'  => 'Tumblr Connection',
				'service_name'  => 'tumblr',
				'service_label' => 'Tumblr',
				'shared'        => true,
				'wpcom_user_id' => 0,
			),
			array(
				'connection_id' => '112',
				'display_name'  => 'Mastodon Connection',
				'service_name'  => 'mastodon',
				'service_label' => 'Mastodon',
				'shared'        => true,
				'wpcom_user_id' => 0,
			),
		);

		set_transient( Connections::CONNECTIONS_TRANSIENT, $connections, DAY_IN_SECONDS );

		wp_set_current_user( static::$admin_id );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		wp_set_current_user( 0 );

		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();
		WorDBless_PostMeta::init()->clear_all_meta();

		delete_transient( Connections::CONNECTIONS_TRANSIENT );
	}

	/**
	 * Test for get_post_share_status for an invalid post.
	 */
	public function test_get_post_share_status__for__invalid_post() {
		$shares = Share_Status::get_post_share_status( -1 );

		$this->assertEquals(
			array(
				'done'   => false,
				'shares' => array(),
			),
			$shares
		);
	}

	/**
	 * Test for get_post_share_status for non-existent meta.
	 */
	public function test_get_post_share_status__for__non_existent_meta() {
		$shares = Share_Status::get_post_share_status( static::$post_id );

		$this->assertEquals(
			array(
				'done'   => false,
				'shares' => array(),
			),
			$shares
		);
	}

	/**
	 * Test for get_post_share_status for existent meta.
	 */
	public function test_get_post_share_status__for__existent_meta() {
		$shares = array(
			array(
				'connection_id' => '111',
				'service'       => 'tumblr',
				'timestamp'     => 1234567890,
				'status'        => 'success',
			),
			array(
				'connection_id' => '123', // Non-existent connection.
				'service'       => 'bluesky',
				'timestamp'     => 1234567890,
				'status'        => 'success',
			),
		);
		update_post_meta(
			static::$post_id,
			Share_Status::SHARES_META_KEY,
			$shares
		);

		// By default it should filter by access.
		$shares_data = Share_Status::get_post_share_status(
			static::$post_id
		);
		$this->assertEquals(
			array(
				'done'   => true,
				'shares' => array(
					$shares[0],
				),
			),
			$shares_data
		);

		// Now it should not filter by access.
		$shares_data = Share_Status::get_post_share_status(
			static::$post_id,
			false
		);
		$this->assertEquals(
			array(
				'done'   => true,
				'shares' => $shares,
			),
			$shares_data
		);
	}

	/**
	 * Test for get_post_share_status for inconsistent format.
	 */
	public function test_get_post_share_status__for__inconsistent_format() {
		$shares = array(
			array(
				'connection_id' => '111',
				'service'       => 'tumblr',
				'timestamp'     => 1234567890,
				'status'        => 'success',
			),
			array(
				'connection_id' => '112',
				'service'       => 'mastodon',
				'timestamp'     => 1234567890,
				'status'        => 'success',
			),
		);
		add_post_meta(
			static::$post_id,
			Share_Status::SHARES_META_KEY,
			$shares[0]
		);
		add_post_meta(
			static::$post_id,
			Share_Status::SHARES_META_KEY,
			$shares[1]
		);

		// Let us verify that $single=true returns the first element.
		$this->assertEquals(
			get_post_meta(
				static::$post_id,
				Share_Status::SHARES_META_KEY,
				true
			),
			$shares[0]
		);

		// Let us verify that $single=false returns all elements.
		$this->assertEquals(
			get_post_meta(
				static::$post_id,
				Share_Status::SHARES_META_KEY
			),
			array(
				$shares[0],
				$shares[1],
			)
		);

		// Now it should handle the inconsistent format.
		$shares_data = Share_Status::get_post_share_status(
			static::$post_id
		);
		$this->assertEquals(
			array(
				'done'   => true,
				'shares' => $shares,
			),
			$shares_data
		);
	}

	/**
	 * Test for get_post_share_status for sort order.
	 */
	public function test_get_post_share_status__for__sort_order() {
		$shares = array(
			array(
				'connection_id' => '111',
				'service'       => 'tumblr',
				'timestamp'     => 1234567890,
				'status'        => 'success',
			),
			array(
				'connection_id' => '112',
				'service'       => 'mastodon',
				'timestamp'     => 2345678901,
				'status'        => 'success',
			),
		);
		update_post_meta(
			static::$post_id,
			Share_Status::SHARES_META_KEY,
			$shares
		);

		$shares_data = Share_Status::get_post_share_status(
			static::$post_id
		);
		$this->assertEquals(
			array(
				'done'   => true,
				'shares' => array(
					// It should sort the shares by timestamp in descending order.
					$shares[1],
					$shares[0],
				),
			),
			$shares_data
		);
	}
}
