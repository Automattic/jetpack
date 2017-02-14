<?php
require dirname( __FILE__ ) . '/../../../../modules/likes.php';

class WP_Test_Likes extends WP_UnitTestCase {

	/**
	 * Test if likes are rendered correctly.
	 *
	 * @since 4.6.0
	 */
	public function test_post_likes() {

		// Enable Likes
		add_filter( 'wpl_is_likes_visible', '__return_true' );

		$content = 'Some content.';

		// There's no post set so return the same.
		$this->assertEquals( 'Some content.', Jetpack_Likes::init()->post_likes( $content ) );

		// Create and set a global post
		$post_id = $this->factory->post->create( array() );
		global $post;
		$post = get_post( $post_id );

		// This time there's a post set so return the HTML.
		$this->assertContains( "<div class='sharedaddy sd-block", Jetpack_Likes::init()->post_likes( $content ) );

		// Disable likes
		remove_filter( 'wpl_is_likes_visible', '__return_true' );

		// Likes are disabled this time so return the same content.
		$this->assertContains( 'Some content.', Jetpack_Likes::init()->post_likes( $content ) );
	}

	/**
	 * Test Likes visibility.
	 *
	 * @since 4.6.0
	 */
	public function test_is_likes_visible() {
		$post_id = self::factory()->post->create( array( 'post_content' => 'Some content.' ) );
		$this->go_to( get_permalink( $post_id ) );

		// Are we on a single post?
		$this->assertQueryTrue( 'is_single', 'is_singular' );

		// Disable support for 'post' type
		add_filter( 'wpl_is_single_post_disabled', '__return_false' );

		// Likes should not be visible where they're not supported
		$this->assertEquals( false, Jetpack_Likes::init()->is_likes_visible() );

		// Reenable support
		remove_filter( 'wpl_is_single_post_disabled', '__return_false' );

		$GLOBALS['post']->post_status = 'draft';

		// Likes should not be visible in draft posts
		$this->assertEquals( false, Jetpack_Likes::init()->is_likes_visible() );

		$GLOBALS['post']->post_status = 'publish';

		// Likes should be visible
		$this->assertEquals( true, Jetpack_Likes::init()->is_likes_visible() );
	}

	/**
	 * Check that Likes are properly added to admin bar.
	 *
	 * @since 4.6.0
	 */
	public function test_admin_bar_likes() {
		$post_id = self::factory()->post->create( array( 'post_content' => 'Some content.' ) );
		$this->go_to( get_permalink( $post_id ) );

		// Initialize admin bar
		add_filter( 'show_admin_bar', '__return_true' );
		_wp_admin_bar_init();

		// Add Likes to admin bar
		Jetpack_Likes::init()->admin_bar_likes();

		// The widget must be added to admin bar now.
		global $wp_admin_bar;
		$this->assertArrayHasKey( 'admin-bar-likes-widget', $wp_admin_bar->get_nodes() );
	}
}
