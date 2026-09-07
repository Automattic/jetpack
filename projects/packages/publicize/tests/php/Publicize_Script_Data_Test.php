<?php
/**
 * Tests for Publicize_Script_Data.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use PHPUnit\Framework\TestCase;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;

/**
 * Class Publicize_Script_Data_Test
 */
class Publicize_Script_Data_Test extends TestCase {

	/**
	 * User IDs keyed by role.
	 *
	 * @var array
	 */
	private $user_ids = array();

	/**
	 * The connections seeded into the transient.
	 *
	 * @var array
	 */
	private $connections = array();

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

		foreach ( array( 'administrator', 'author', 'contributor' ) as $role ) {
			$this->user_ids[ $role ] = wp_insert_user(
				array(
					'user_login' => 'dummy_' . $role,
					'user_pass'  => 'dummy_pass',
					'role'       => $role,
				)
			);
		}

		$this->connections = array(
			array(
				'connection_id' => '111',
				'display_name'  => 'Tumblr Connection',
				'service_name'  => 'tumblr',
				'service_label' => 'Tumblr',
				'shared'        => true,
				'wpcom_user_id' => 0,
			),
		);

		set_transient( Connections::CONNECTIONS_TRANSIENT, $this->connections, DAY_IN_SECONDS );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		/*
		 * Restore rather than clear. Base_Controller::publicize_permissions_check()
		 * 403s on a falsy $publicize, and the REST controller tests do not set the
		 * global themselves — they inherit it from whichever test class ran before
		 * them. Nulling it here would break the next class in the file order.
		 */
		global $publicize;
		$publicize = $this->original_publicize;

		wp_set_current_user( 0 );

		/*
		 * Clear only what this class created. WorDBless_Options::clear_options()
		 * would wipe the whole option table, including the Jetpack options that
		 * later test classes inherit from earlier ones.
		 */
		delete_transient( Connections::CONNECTIONS_TRANSIENT );

		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Put a Publicize instance in the global.
	 *
	 * Built without its constructor on purpose: that registers hooks which would
	 * outlive this class and leak into the test classes running after it. Every
	 * method is the real one, so current_user_can_access_publicize_data() behaves
	 * exactly as it does in production.
	 *
	 * @throws \ReflectionException If Publicize cannot be reflected.
	 */
	private function set_publicize_instance() {
		global $publicize;

		$publicize = ( new \ReflectionClass( Publicize::class ) )->newInstanceWithoutConstructor();
	}

	/**
	 * Read the connections out of the store initial state.
	 *
	 * @return array
	 */
	private function get_connections_from_store() {
		$state = Publicize_Script_Data::get_store_initial_state();

		return $state['connectionData']['connections'];
	}

	/**
	 * A shared connection reaches a user who can publish.
	 */
	public function test_author_gets_connections() {
		$this->set_publicize_instance();

		wp_set_current_user( $this->user_ids['author'] );

		$this->assertSame( $this->connections, $this->get_connections_from_store() );
	}

	/**
	 * A Contributor gets no connection data, shared or otherwise.
	 */
	public function test_contributor_gets_no_connections() {
		$this->set_publicize_instance();

		wp_set_current_user( $this->user_ids['contributor'] );

		$this->assertSame( array(), $this->get_connections_from_store() );
	}

	/**
	 * A logged-out request gets no connection data.
	 */
	public function test_logged_out_gets_no_connections() {
		$this->set_publicize_instance();

		wp_set_current_user( 0 );

		$this->assertSame( array(), $this->get_connections_from_store() );
	}

	/**
	 * The capability is still enforced when no Publicize instance is available,
	 * so the gate does not depend on global initialization order.
	 */
	public function test_capability_is_enforced_without_a_publicize_instance() {
		global $publicize;
		$publicize = null;

		wp_set_current_user( $this->user_ids['contributor'] );
		$this->assertSame( array(), $this->get_connections_from_store() );

		wp_set_current_user( $this->user_ids['administrator'] );
		$this->assertSame( $this->connections, $this->get_connections_from_store() );
	}

	/**
	 * Sites that move Publicize to another capability keep working.
	 */
	public function test_jetpack_publicize_capability_filter_is_respected() {
		$this->set_publicize_instance();

		$to_read = function () {
			return 'read';
		};

		add_filter( 'jetpack_publicize_capability', $to_read );

		wp_set_current_user( $this->user_ids['contributor'] );

		$connections = $this->get_connections_from_store();

		remove_filter( 'jetpack_publicize_capability', $to_read );

		$this->assertSame( $this->connections, $connections );
	}
}
