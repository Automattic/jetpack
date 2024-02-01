<?php
require __DIR__ . '/../../../../modules/likes.php';

class WP_Test_Likes extends WP_UnitTestCase {

	/**
	 * Test that the actions are not added if likes are not visible.
	 *
	 * @since 8.4.0
	 */
	public function test_action_init_likes_not_visible() {
		$instance = new Jetpack_Likes();
		$instance->action_init();

		$this->assertFalse( has_filter( 'the_content', array( $instance, 'post_likes' ) ) );
		$this->assertFalse( has_filter( 'the_excerpt', array( $instance, 'post_likes' ) ) );
	}

	/**
	 * Test that the actions are added if likes are visible.
	 *
	 * @since 8.4.0
	 */
	public function test_action_init_likes_visible() {
		$this->go_to( get_permalink( self::factory()->post->create() ) );
		add_filter( 'wpl_is_enabled_sitewide', '__return_true' );
		add_filter( 'wpl_is_single_post_disabled', '__return_true' );
		$instance = new Jetpack_Likes();
		$instance->action_init();

		$this->assertEquals( 30, has_filter( 'the_content', array( $instance, 'post_likes' ) ) );
		$this->assertEquals( 30, has_filter( 'the_excerpt', array( $instance, 'post_likes' ) ) );
	}

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
		$post_id = self::factory()->post->create( array() );
		global $post;
		$post = get_post( $post_id );

		// This time there's a post set so return the HTML.
		$this->assertStringContainsString( "<div class='sharedaddy sd-block", Jetpack_Likes::init()->post_likes( $content ) );

		// Disable likes
		remove_filter( 'wpl_is_likes_visible', '__return_true' );

		// Likes are disabled this time so return the same content.
		$this->assertStringContainsString( 'Some content.', Jetpack_Likes::init()->post_likes( $content ) );
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
		$this->assertFalse( Jetpack_Likes::init()->settings->is_likes_visible() );

		// Reenable support
		remove_filter( 'wpl_is_single_post_disabled', '__return_false' );

		$GLOBALS['post']->post_status = 'draft';

		// Likes should not be visible in draft posts
		$this->assertFalse( Jetpack_Likes::init()->settings->is_likes_visible() );

		$GLOBALS['post']->post_status = 'publish';

		// Likes should be visible
		$this->assertTrue( Jetpack_Likes::init()->settings->is_likes_visible() );
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
