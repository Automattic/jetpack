<?php
/**
 * Tests for Publicize_Assets.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use PHPUnit\Framework\TestCase;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;

/**
 * Class Publicize_Assets_Test
 *
 * Covers the capability gate on the block editor assets. It shares a definition with
 * the script data — Publicize_Utils::current_user_can_access_publicize_data() — so
 * these assertions and Publicize_Script_Data_Test's exist to keep the two from
 * drifting apart again.
 */
class Publicize_Assets_Test extends TestCase {

	/**
	 * User IDs keyed by role.
	 *
	 * @var array
	 */
	private $user_ids = array();

	/**
	 * The $publicize global as we found it.
	 *
	 * @var Publicize|null
	 */
	private $original_publicize;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		global $publicize;
		$this->original_publicize = $publicize;

		foreach ( array( 'author', 'contributor' ) as $role ) {
			$this->user_ids[ $role ] = wp_insert_user(
				array(
					'user_login' => 'dummy_' . $role,
					'user_pass'  => 'dummy_pass',
					'role'       => $role,
				)
			);
		}

		add_post_type_support( 'post', 'publicize' );

		// should_enqueue_block_editor_scripts() reads the post type from the global post.
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'A post',
				'post_status' => 'publish',
				'post_type'   => 'post',
			)
		);

		$GLOBALS['post'] = get_post( $post_id );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		global $publicize;
		$publicize = $this->original_publicize;

		unset( $GLOBALS['post'] );

		remove_post_type_support( 'post', 'publicize' );

		wp_set_current_user( 0 );

		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * A user who can publish gets the editor scripts.
	 */
	public function test_author_gets_the_editor_scripts() {
		wp_set_current_user( $this->user_ids['author'] );

		$this->assertTrue( Publicize_Assets::should_enqueue_block_editor_scripts() );
	}

	/**
	 * A Contributor does not, which is why the script data must not carry
	 * connection details for them either.
	 */
	public function test_contributor_does_not_get_the_editor_scripts() {
		wp_set_current_user( $this->user_ids['contributor'] );

		$this->assertFalse( Publicize_Assets::should_enqueue_block_editor_scripts() );
	}

	/**
	 * The two gates agree. This is the invariant the shared helper exists to hold:
	 * anyone refused the editor UI is also refused the connection data.
	 */
	public function test_the_assets_gate_and_the_script_data_gate_agree() {
		foreach ( array( 'author', 'contributor' ) as $role ) {
			wp_set_current_user( $this->user_ids[ $role ] );

			$this->assertSame(
				Publicize_Assets::should_enqueue_block_editor_scripts(),
				Publicize_Utils::current_user_can_access_publicize_data(),
				"The assets gate and the shared capability gate disagreed for the $role role."
			);
		}
	}

	/**
	 * Anyone refused the editor UI gets no connection data. This is the bug that
	 * started all of this, asserted across the two gates rather than one.
	 */
	public function test_a_user_refused_the_editor_ui_gets_no_connections() {
		wp_set_current_user( $this->user_ids['contributor'] );

		$this->assertFalse( Publicize_Assets::should_enqueue_block_editor_scripts() );

		$state = Publicize_Script_Data::get_store_initial_state();

		$this->assertSame( array(), $state['connectionData']['connections'] );
	}

	/**
	 * A post type without publicize support is refused regardless of capability.
	 */
	public function test_unsupported_post_type_is_refused() {
		remove_post_type_support( 'post', 'publicize' );

		wp_set_current_user( $this->user_ids['author'] );

		$this->assertFalse( Publicize_Assets::should_enqueue_block_editor_scripts() );
	}

	/**
	 * Sites that move Publicize to another capability keep working.
	 */
	public function test_jetpack_publicize_capability_filter_is_respected() {
		$to_read = function () {
			return 'read';
		};

		add_filter( 'jetpack_publicize_capability', $to_read );

		wp_set_current_user( $this->user_ids['contributor'] );

		$can_enqueue = Publicize_Assets::should_enqueue_block_editor_scripts();

		remove_filter( 'jetpack_publicize_capability', $to_read );

		$this->assertTrue( $can_enqueue );
	}
}
