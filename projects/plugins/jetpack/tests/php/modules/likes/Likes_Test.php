<?php
require __DIR__ . '/../../../../modules/likes.php';

use Automattic\Jetpack\Constants;

class Likes_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Clean up after the sharing menu tests, which set the active module list.
	 */
	public function tear_down() {
		Jetpack_Options::delete_option( 'active_modules' );
		Constants::clear_constants();

		parent::tear_down();
	}

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

	/**
	 * The Likes settings live on Settings > Sharing, but that screen is registered by
	 * the Sharing Buttons (sharedaddy) module. With that module off, Likes must register
	 * the screen itself, or its settings become unreachable.
	 */
	public function test_registers_sharing_menu_when_sharedaddy_is_inactive() {
		Jetpack_Options::update_option( 'active_modules', array( 'likes' ) );

		$instance = new Jetpack_Likes();

		$this->assertNotFalse( has_action( 'admin_menu', array( $instance->settings, 'sharing_menu' ) ) );
	}

	/**
	 * Sharedaddy registers Settings > Sharing and the global options area on it,
	 * so Likes must not register a second menu item.
	 */
	public function test_does_not_register_sharing_menu_when_sharedaddy_is_active() {
		Jetpack_Options::update_option( 'active_modules', array( 'likes', 'sharedaddy' ) );

		$instance = new Jetpack_Likes();

		$this->assertFalse( has_action( 'admin_menu', array( $instance->settings, 'sharing_menu' ) ) );
	}

	/**
	 * Publicize no longer registers Settings > Sharing, so Likes has to. When it does,
	 * it renders the settings block itself and must not also hook it onto
	 * pre_admin_screen_sharing, which would print the block twice.
	 */
	public function test_registers_sharing_menu_once_when_publicize_is_active() {
		Jetpack_Options::update_option( 'active_modules', array( 'likes', 'publicize' ) );

		$instance = new Jetpack_Likes();

		$this->assertNotFalse( has_action( 'admin_menu', array( $instance->settings, 'sharing_menu' ) ) );
		$this->assertFalse( has_action( 'pre_admin_screen_sharing', array( $instance->settings, 'sharing_block' ) ) );
	}

	/**
	 * The helper shared by the Likes and Comment Likes modules: we only register the
	 * screen when the module that usually owns it is off.
	 */
	public function test_needs_own_sharing_menu() {
		$settings = new Jetpack_Likes_Settings();

		$this->assertTrue( $settings->needs_own_sharing_menu( false ) );
		$this->assertFalse( $settings->needs_own_sharing_menu( true ) );
	}

	/**
	 * Simple sites get Settings > Sharing from elsewhere, so we have to stay out of the
	 * way there, or the site ends up with two menu items.
	 */
	public function test_does_not_need_own_sharing_menu_on_simple_sites() {
		Constants::set_constant( 'IS_WPCOM', true );
		$settings = new Jetpack_Likes_Settings();

		$this->assertFalse( $settings->needs_own_sharing_menu( false ) );
	}

	/**
	 * The menu item has to land on options-general.php under the `sharing` slug, since
	 * that is the URL the Likes module's own configuration link points at.
	 */
	public function test_sharing_menu_registers_the_sharing_slug() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		// add_submenu_page() writes to all three of these, and WP_UnitTestCase restores none of them.
		global $submenu, $_registered_pages, $_parent_pages;
		$submenu_backup          = $submenu;
		$registered_pages_backup = $_registered_pages;
		$parent_pages_backup     = $_parent_pages;

		$settings = new Jetpack_Likes_Settings();
		$settings->sharing_menu();

		$slugs = wp_list_pluck( $submenu['options-general.php'], 2 );

		$submenu           = $submenu_backup;
		$_registered_pages = $registered_pages_backup;
		$_parent_pages     = $parent_pages_backup;

		$this->assertContains( 'sharing', $slugs );
	}
}
