<?php
/**
 * Tests for Publicize_Script_Data.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
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
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

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

		global $publicize;
		$publicize = null;

		wp_set_current_user( 0 );

		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();

		delete_transient( Connections::CONNECTIONS_TRANSIENT );
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
		global $publicize;
		$publicize = new Publicize();

		wp_set_current_user( $this->user_ids['author'] );

		$this->assertSame( $this->connections, $this->get_connections_from_store() );
	}

	/**
	 * A Contributor gets no connection data, shared or otherwise.
	 */
	public function test_contributor_gets_no_connections() {
		global $publicize;
		$publicize = new Publicize();

		wp_set_current_user( $this->user_ids['contributor'] );

		$this->assertSame( array(), $this->get_connections_from_store() );
	}

	/**
	 * A logged-out request gets no connection data.
	 */
	public function test_logged_out_gets_no_connections() {
		global $publicize;
		$publicize = new Publicize();

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
		global $publicize;
		$publicize = new Publicize();

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
