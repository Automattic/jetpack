<?php
/**
 * Share action testing.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Current_Plan;
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

		// Clear any plan cache populated by earlier tests/init-time code so the
		// `update_option` calls below take effect on the first `Current_Plan::get()`.
		self::reset_active_plan_cache();

		// Reset filters before each test.
		remove_all_filters( 'post_row_actions' );
		remove_all_filters( 'page_row_actions' );
		remove_all_filters( 'jetpack_post_list_display_share_action' );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		// Unregister test post types.
		unregister_post_type( 'test_pub_cpt' );
		unregister_post_type( 'test_no_pub_cpt' );

		// Clean up filters.
		remove_all_filters( 'post_row_actions' );
		remove_all_filters( 'page_row_actions' );
		remove_all_filters( 'jetpack_post_list_display_share_action' );

		// Clear the Current_Plan cache to avoid affecting other tests.
		self::reset_active_plan_cache();

		parent::tear_down();
	}

	/**
	 * Force the next `Current_Plan::get()` to re-read from the option store.
	 */
	private static function reset_active_plan_cache() {
		$reflection = new \ReflectionClass( Current_Plan::class );
		$property   = $reflection->getProperty( 'active_plan_cache' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}

	/**
	 * Test Share action is added when plan supports republicize.
	 */
	public function test_add_share_action_when_plan_supports_republicize() {
		// Set up a plan that supports republicize.
		$plan                       = Current_Plan::PLAN_DATA['free'];
		$plan['features']['active'] = array( 'republicize' );
		update_option( Current_Plan::PLAN_OPTION, $plan, true );

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

		Publicize_Setup::add_filters_and_actions_for_screen( $current_screen );

		$this->assertNotFalse( has_action( 'post_row_actions', array( Publicize_Setup::class, 'add_share_action' ) ) );
		$this->assertNotFalse( has_action( 'page_row_actions', array( Publicize_Setup::class, 'add_share_action' ) ) );
	}

	/**
	 * Test Share action can be disabled via filter even when plan supports it.
	 */
	public function test_share_action_can_be_disabled_via_filter() {
		// Set up a plan that supports republicize.
		$plan                       = Current_Plan::PLAN_DATA['free'];
		$plan['features']['active'] = array( 'republicize' );
		update_option( Current_Plan::PLAN_OPTION, $plan, true );

		$current_screen = (object) array(
			'base'      => 'edit',
			'post_type' => 'post',
		);

		// Disable via filter.
		add_filter( 'jetpack_post_list_display_share_action', '__return_false' );

		Publicize_Setup::add_filters_and_actions_for_screen( $current_screen );

		$this->assertFalse( has_action( 'post_row_actions', array( Publicize_Setup::class, 'add_share_action' ) ) );
	}

	/**
	 * Test Share action filter is NOT added when plan does not support republicize.
	 */
	public function test_no_share_action_without_plan_support() {
		$current_screen = (object) array(
			'base'      => 'edit',
			'post_type' => 'post',
		);

		// No plan support, filter won't help.
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
		// Set up a plan that supports republicize.
		$plan                       = Current_Plan::PLAN_DATA['free'];
		$plan['features']['active'] = array( 'republicize' );
		update_option( Current_Plan::PLAN_OPTION, $plan, true );

		$current_screen = (object) array(
			'base'      => 'edit-tags',
			'post_type' => 'post',
		);

		Publicize_Setup::add_filters_and_actions_for_screen( $current_screen );

		$this->assertFalse( has_action( 'post_row_actions', array( Publicize_Setup::class, 'add_share_action' ) ) );
	}

	/**
	 * Test Share action filter is NOT added for post types that don't support publicize.
	 */
	public function test_no_share_action_for_non_publicize_post_type() {
		// Set up a plan that supports republicize.
		$plan                       = Current_Plan::PLAN_DATA['free'];
		$plan['features']['active'] = array( 'republicize' );
		update_option( Current_Plan::PLAN_OPTION, $plan, true );

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

		Publicize_Setup::add_filters_and_actions_for_screen( $current_screen );

		$this->assertFalse( has_action( 'post_row_actions', array( Publicize_Setup::class, 'add_share_action' ) ) );
	}
}
