<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * This file contains PHPUnit tests for the Post_List class.
 *
 * @package automattic/jetpack-post-list
 */

namespace Automattic\Jetpack\Post_List;

use WorDBless\BaseTestCase;

/**
 * PHPUnit tests for the Post_List class.
 *
 * @package automattic/jetpack-post-list
 */
class Test_Post_List extends BaseTestCase {

	/**
	 * Post_List::get_instance() should return and instance of the Post_List class.
	 */
	public function test_get_instance() {
		$this->assertInstanceOf( Post_List::class, Post_List::get_instance() );
	}

	/**
	 * Test the register() method.
	 */
	public function test_register() {
		$post_list = Post_List::get_instance();

		// did_action() Retrieves the number of times an action has been fired during the current request.
		// Assert our action hasn't been fired yet.
		$this->assertSame( 0, did_action( 'jetpack_on_posts_list_init' ) );

		// Assert our action has not been added yet.
		$this->assertFalse( has_action( 'admin_enqueue_scripts', array( $post_list, 'enqueue_scripts' ) ) );

		// Set up our action callbacks using the register() method.
		$post_list->register();

		// Assert the action was added.
		$this->assertNotFalse( has_action( 'admin_enqueue_scripts', array( $post_list, 'enqueue_scripts' ) ) );

		// Confirm it was only fired once even though we call it twice.
		$post_list->register();
		$this->assertSame( 1, did_action( 'jetpack_on_posts_list_init' ) );
	}

	/**
	 * Test the enqueue_scripts() method.
	 */
	public function test_enqueue_scripts() {
		$post_list = Post_List::get_instance();

		// Confirm that our script, style, and action have not been added before the enqueue_scripts() method call.
		$this->assertFalse( wp_script_is( 'jetpack_posts_list_ui_script' ) );
		$this->assertFalse( wp_style_is( 'jetpack_posts_list_ui_style' ) );
		$this->assertFalse( has_action( 'admin_footer' ) );

		$post_list->enqueue_scripts( 'edit.php' );

		// Assert that our script, style, and action have been added.
		$this->assertTrue( wp_script_is( 'jetpack_posts_list_ui_script' ) );
		$this->assertTrue( wp_style_is( 'jetpack_posts_list_ui_style' ) );
		$this->assertTrue( has_action( 'admin_footer' ) );
	}
}
