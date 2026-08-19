<?php
/**
 * Tests for the Jetpack_Comment_Likes class.
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
	 * With the Likes module off and the Sharing module off, nothing registers
	 * Settings > Sharing, where the settings gating comment likes are displayed.
	 * Comment Likes carries its own copy of that wiring, so it needs its own test.
	 */
	public function test_registers_sharing_menu_when_sharedaddy_is_inactive() {
		Jetpack_Options::update_option( 'active_modules', array( 'comment-likes' ) );

		// Sidestep the singleton in Jetpack_Comment_Likes::init(), which memoizes the wiring.
		$class       = new ReflectionClass( 'Jetpack_Comment_Likes' );
		$instance    = $class->newInstanceWithoutConstructor();
		$constructor = $class->getConstructor();
		// setAccessible() is a no-op as of PHP 8.1 and deprecated in 8.5; only
		// needed (and only called) on the older PHP versions Jetpack still supports.
		if ( PHP_VERSION_ID < 80100 ) {
			$constructor->setAccessible( true );
		}
		$constructor->invoke( $instance );

		Jetpack_Options::delete_option( 'active_modules' );

		$this->assertNotFalse( has_action( 'admin_menu', array( $instance->settings, 'sharing_menu' ) ) );
	}
}
