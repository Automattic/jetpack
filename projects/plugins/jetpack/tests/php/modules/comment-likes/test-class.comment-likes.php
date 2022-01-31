<?php
/**
 * Tests for the WP_Test_Comment_Likes class.
 *
 * @package automattic/jetpack
 * @since 8.4.0
 */

/** Include comment-likes.php module */
require __DIR__ . '/../../../../modules/comment-likes.php';

/**
 * Test class for Jetpack_Comment_Likes.
 *
 * @since 8.4.0
 */
class WP_Test_Comment_Likes extends WP_UnitTestCase {

	/**
	 * Test that the assets are not enqueued if likes are not visible.
	 *
	 * @since 8.4.0
	 */
	public function test_load_styles_register_scripts_likes_not_visible() {
		$instance = Jetpack_Comment_Likes::init();
		$instance->load_styles_register_scripts();

		$this->assertFalse( wp_style_is( 'jetpack_likes' ) );
	}

	/**
	 * Test that the assets are enqueued if likes are visible.
	 *
	 * @since 8.4.0
	 */
	public function test_load_styles_register_scripts_likes_visible() {
		add_filter( 'wpl_is_likes_visible', '__return_true' );
		$instance = Jetpack_Comment_Likes::init();
		$instance->load_styles_register_scripts();

		$this->assertTrue( wp_style_is( 'jetpack_likes' ) );
	}
}
