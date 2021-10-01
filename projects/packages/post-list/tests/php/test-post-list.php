<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * This file contains PHPUnit tests for the Post_List class.
 * To run the package unit tests:
 * - go the post-list folder "cd projects/packages/post-list"
 * - run the command "composer test-php"
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
		$this->assertFalse( has_action( 'current_screen', array( $post_list, 'add_thumbnail_filters_and_actions' ) ) );

		// Set up our action callbacks using the register() method.
		$post_list->register();

		// Assert the action was added.
		$this->assertNotFalse( has_action( 'admin_enqueue_scripts', array( $post_list, 'enqueue_scripts' ) ) );
		$this->assertNotFalse( has_action( 'current_screen', array( $post_list, 'add_thumbnail_filters_and_actions' ) ) );

		// Confirm it was only fired once even though we call it twice.
		$post_list->register();
		$this->assertSame( 1, did_action( 'jetpack_on_posts_list_init' ) );
	}

	/**
	 * Test the enqueue_scripts() method.
	 */
	public function test_enqueue_scripts() {
		$post_list = Post_List::get_instance();

		// Confirm that our style, filter, and action have not been added before the enqueue_scripts() method call.
		$this->assertFalse( wp_style_is( 'jetpack_posts_list_ui_style' ) );

		$post_list->enqueue_scripts( 'edit.php' );

		// Assert that our style, filter, and action has been added.
		$this->assertTrue( wp_style_is( 'jetpack_posts_list_ui_style' ) );
	}

	/**
	 * Test the add_thumbnail_filters_and_actions() method.
	 */
	public function test_add_thumbnail_filters_and_actions() {
		$post_list = Post_List::get_instance();

		// Confirm that our style, filter, and action have not been added before the enqueue_scripts() method call.
		$this->assertFalse( has_filter( 'manage_posts_columns' ) );
		$this->assertFalse( has_action( 'manage_posts_custom_column' ) );
		$this->assertFalse( has_filter( 'manage_pages_columns' ) );
		$this->assertFalse( has_action( 'manage_pages_custom_column' ) );

		$current_screen = (object) array( 'base' => 'edit' );
		$post_list->add_thumbnail_filters_and_actions( $current_screen );

		// Assert that our style, filter, and action has been added.
		$this->assertTrue( has_filter( 'manage_posts_columns' ) );
		$this->assertTrue( has_action( 'manage_posts_custom_column' ) );
		$this->assertTrue( has_filter( 'manage_pages_columns' ) );
		$this->assertTrue( has_action( 'manage_pages_custom_column' ) );
	}

	/**
	 * Test the add_thumbnail_filters_and_actions() method doesn't add if screen not 'edit' base.
	 */
	public function test_add_thumbnail_filters_and_actions_wrong_screen() {
		$post_list      = Post_List::get_instance();
		$current_screen = (object) array( 'base' => 'edit-tags' );
		$post_list->add_thumbnail_filters_and_actions( $current_screen );

		// Confirm that our style, filter, and action have not been added before the enqueue_scripts() method call.
		$this->assertFalse( has_filter( 'manage_posts_columns' ) );
		$this->assertFalse( has_action( 'manage_posts_custom_column' ) );
		$this->assertFalse( has_filter( 'manage_pages_columns' ) );
		$this->assertFalse( has_action( 'manage_pages_custom_column' ) );
	}

	/**
	 * Test the add_thumbnail_column() method.
	 */
	public function test_add_thumbnail_column() {
		$columns = array(
			'cb'         => '<input type="checkbox" />',
			'title'      => 'Title',
			'author'     => 'Author',
			'categories' => 'Categories',
			'tags'       => 'Tags',
			'comments'   => '<span class="vers comment-grey-bubble" title="Comments"><span class="screen-reader-text">Comments</span></span>',
			'date'       => 'Date',
		);

		$columns_expected = array(
			'cb'         => '<input type="checkbox" />',
			'thumbnail'  => '<span>Thumbnail</span>',
			'title'      => 'Title',
			'author'     => 'Author',
			'categories' => 'Categories',
			'tags'       => 'Tags',
			'comments'   => '<span class="vers comment-grey-bubble" title="Comments"><span class="screen-reader-text">Comments</span></span>',
			'date'       => 'Date',
		);

		$post_list       = Post_List::get_instance();
		$columns_results = $post_list->add_thumbnail_column( $columns );

		$this->assertSame( $columns_results, $columns_expected );
	}

	/**
	 * Test the add_thumbnail_column() method with 'title' missing.
	 */
	public function test_add_thumbnail_column_no_title() {
		$columns = array(
			'cb'         => '<input type="checkbox" />',
			'author'     => 'Author',
			'categories' => 'Categories',
			'tags'       => 'Tags',
			'comments'   => '<span class="vers comment-grey-bubble" title="Comments"><span class="screen-reader-text">Comments</span></span>',
			'date'       => 'Date',
		);

		$post_list       = Post_List::get_instance();
		$columns_results = $post_list->add_thumbnail_column( $columns );

		$this->assertSame( $columns_results, $columns );
	}
}
