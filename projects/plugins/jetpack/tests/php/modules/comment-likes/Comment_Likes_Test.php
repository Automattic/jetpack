<?php
/**
 * Tests for the Jetpack_Comment_Likes class.
 *
 * @package automattic/jetpack
 * @since 8.4.0
 */

use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/** Include comment-likes.php module */
require __DIR__ . '/../../../../modules/comment-likes.php';

/**
 * Test class for Jetpack_Comment_Likes.
 *
 * @since 8.4.0
 */
class Comment_Likes_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

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

	/**
	 * The block editor can turn comment likes on for one post while the Likes module is off.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_block_editor_turns_comment_likes_on_per_post_without_the_likes_module() {
		$this->assertFalse( class_exists( 'Jetpack_Likes', false ), 'The Likes module must not be loaded.' );

		update_option( 'disabled_likes', 1 );
		$post_id = self::factory()->post->create();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$request = new WP_REST_Request( 'POST', '/wp/v2/posts/' . $post_id );
		$request->set_body_params( array( 'jetpack_likes_enabled' => true ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['jetpack_likes_enabled'] ?? null );
		$this->assertSame( '1', get_post_meta( $post_id, 'switch_like_status', true ) );
	}
}
