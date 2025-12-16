<?php
/**
 * Share action testing.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use WorDBless\BaseTestCase;

/**
 * Share action testing.
 */
class Share_Action_Test extends BaseTestCase {

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		// Reset filters before each test.
		remove_all_filters( 'post_row_actions' );
		remove_all_filters( 'page_row_actions' );
		remove_all_filters( 'jetpack_post_list_display_share_action' );
	}

	/**
	 * Test Share action filter is added for post types supporting publicize when filter is enabled.
	 */
	public function test_add_share_action_for_publicize_post_type() {
		// Register CPT with publicize support.
		register_post_type(
			'test_pub_cpt',
			array(
				'show_in_rest' => true,
				'supports'     => array( 'editor', 'publicize' ),
			)
		);

		$current_screen = (object) array(
			'base'      => 'edit',
			'post_type' => 'test_pub_cpt',
		);

		// Enable via filter.
		add_filter( 'jetpack_post_list_display_share_action', '__return_true' );

		Publicize_Setup::add_filters_and_actions_for_screen( $current_screen );

		$this->assertNotFalse( has_action( 'post_row_actions', array( Publicize_Setup::class, 'add_share_action' ) ) );
		$this->assertNotFalse( has_action( 'page_row_actions', array( Publicize_Setup::class, 'add_share_action' ) ) );
	}

	/**
	 * Test Share action filter is NOT added when filter returns false and no plan support.
	 */
	public function test_no_share_action_when_disabled() {
		$current_screen = (object) array(
			'base'      => 'edit',
			'post_type' => 'post',
		);

		// Filter defaults to false, no plan support.
		Publicize_Setup::add_filters_and_actions_for_screen( $current_screen );

		$this->assertFalse( has_action( 'post_row_actions', array( Publicize_Setup::class, 'add_share_action' ) ) );
	}

	/**
	 * Test Share action is not added for draft posts.
	 */
	public function test_share_action_not_added_for_draft_posts() {
		$draft_post_id = wp_insert_post(
			array(
				'post_title'  => 'Test Draft Post',
				'post_status' => 'draft',
				'post_type'   => 'post',
			)
		);
		$draft_post    = get_post( $draft_post_id );
		$post_actions  = array();

		$result = Publicize_Setup::add_share_action( $post_actions, $draft_post );

		$this->assertArrayNotHasKey( 'share', $result );
	}

	/**
	 * Test Share action filter is NOT added on non-edit screens.
	 */
	public function test_no_share_action_on_non_edit_screen() {
		$current_screen = (object) array(
			'base'      => 'edit-tags',
			'post_type' => 'post',
		);

		// Enable via filter.
		add_filter( 'jetpack_post_list_display_share_action', '__return_true' );

		Publicize_Setup::add_filters_and_actions_for_screen( $current_screen );

		$this->assertFalse( has_action( 'post_row_actions', array( Publicize_Setup::class, 'add_share_action' ) ) );
	}

	/**
	 * Test Share action filter is NOT added for post types that don't support publicize.
	 */
	public function test_no_share_action_for_non_publicize_post_type() {
		// Register CPT without publicize support (max 20 chars for post type name).
		register_post_type(
			'test_no_pub_cpt',
			array(
				'show_in_rest' => true,
				'supports'     => array( 'editor' ),
			)
		);

		$current_screen = (object) array(
			'base'      => 'edit',
			'post_type' => 'test_no_pub_cpt',
		);

		// Enable via filter.
		add_filter( 'jetpack_post_list_display_share_action', '__return_true' );

		Publicize_Setup::add_filters_and_actions_for_screen( $current_screen );

		$this->assertFalse( has_action( 'post_row_actions', array( Publicize_Setup::class, 'add_share_action' ) ) );
	}
}
