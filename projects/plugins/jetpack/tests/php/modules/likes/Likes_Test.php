<?php
require __DIR__ . '/../../../../modules/likes.php';

class Likes_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

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
	 * Password-protected posts must never be likeable, even with likes enabled
	 * sitewide and an explicit per-post enable. The gate keys off the post
	 * having a password rather than post_password_required(), which is
	 * request-scoped and would let the Like button leak once a viewer unlocked
	 * the post.
	 */
	public function test_is_post_likeable_false_for_password_protected_post() {
		$post_id = self::factory()->post->create( array( 'post_password' => 'hunter2' ) );
		update_post_meta( $post_id, 'switch_like_status', 1 );

		add_filter( 'wpl_is_enabled_sitewide', '__return_true' );
		$likeable = Jetpack_Likes::init()->settings->is_post_likeable( $post_id );
		remove_filter( 'wpl_is_enabled_sitewide', '__return_true' );

		$this->assertFalse( $likeable );
	}

	/**
	 * Control: a normal (non-password) post is likeable with likes enabled
	 * sitewide, proving the guard is specific to password-protected posts.
	 */
	public function test_is_post_likeable_true_for_normal_post() {
		$post_id = self::factory()->post->create();

		add_filter( 'wpl_is_enabled_sitewide', '__return_true' );
		$likeable = Jetpack_Likes::init()->settings->is_post_likeable( $post_id );
		remove_filter( 'wpl_is_enabled_sitewide', '__return_true' );

		$this->assertTrue( $likeable );
	}
}
