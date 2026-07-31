<?php
/**
 * Tests for the Newsletter Mode REST controller.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Newsletter\Mode;
use Automattic\Jetpack\Newsletter\Mode_REST_Controller;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * The REST controller reads and updates the mode's per-site option.
 *
 * @covers \Automattic\Jetpack\Newsletter\Mode_REST_Controller
 */
#[CoversClass( Mode_REST_Controller::class )]
class Mode_REST_Controller_Test extends BaseTestCase {

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		$user_id = wp_insert_user(
			array(
				'user_login' => 'mode_rest_admin',
				'user_pass'  => 'password',
				'user_email' => 'mode_rest_admin@example.com',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( $user_id );
		delete_option( Mode::OPTION_NAME );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_newsletter_mode_available', '__return_true' );
		remove_action( 'rest_api_init', array( Mode_REST_Controller::class, 'register_routes' ) );
		delete_option( Mode::OPTION_NAME );

		parent::tear_down();
	}

	/**
	 * The REST GET handler reports the effective enabled state, including the
	 * availability gate.
	 */
	public function test_get_reports_the_effective_enabled_state() {
		update_option( Mode::OPTION_NAME, true );

		$this->assertFalse( Mode_REST_Controller::get_mode()->get_data()['enabled'] );

		add_filter( 'jetpack_newsletter_mode_available', '__return_true' );

		$this->assertTrue( Mode_REST_Controller::get_mode()->get_data()['enabled'] );
	}

	/**
	 * The REST POST handler writes the option and returns the resulting state.
	 */
	public function test_update_persists_the_mode_flag() {
		add_filter( 'jetpack_newsletter_mode_available', '__return_true' );

		$request = new \WP_REST_Request( 'POST', '/' . Mode_REST_Controller::REST_NAMESPACE . '/mode' );
		$request->set_param( 'enabled', true );

		$response = Mode_REST_Controller::update_mode( $request );

		$this->assertTrue( get_option( Mode::OPTION_NAME ) );
		$this->assertTrue( $response->get_data()['enabled'] );

		$request->set_param( 'enabled', false );
		$response = Mode_REST_Controller::update_mode( $request );

		$this->assertFalse( (bool) get_option( Mode::OPTION_NAME ) );
		$this->assertFalse( $response->get_data()['enabled'] );
	}

	/**
	 * Only users who can manage options can use the mode routes.
	 */
	public function test_permission_requires_manage_options() {
		$this->assertTrue( Mode_REST_Controller::permission_check() );

		$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'mode_rest_subscriber',
				'user_pass'  => 'password',
				'user_email' => 'mode_rest_subscriber@example.com',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber_id );

		$this->assertFalse( Mode_REST_Controller::permission_check() );
	}

	/**
	 * The controller registers readable and writable mode endpoints.
	 */
	public function test_registers_mode_routes() {
		add_action( 'rest_api_init', array( Mode_REST_Controller::class, 'register_routes' ) );
		do_action( 'rest_api_init' );

		$routes     = rest_get_server()->get_routes();
		$route_name = '/' . Mode_REST_Controller::REST_NAMESPACE . '/mode';

		$this->assertArrayHasKey( $route_name, $routes );
		$callbacks = array_column( $routes[ $route_name ], 'callback' );
		$this->assertContains(
			array( Mode_REST_Controller::class, 'get_mode' ),
			$callbacks
		);
		$this->assertContains(
			array( Mode_REST_Controller::class, 'update_mode' ),
			$callbacks
		);

		$update_endpoint = current(
			array_filter(
				$routes[ $route_name ],
				function ( $endpoint ) {
					return isset( $endpoint['callback'] )
						&& array( Mode_REST_Controller::class, 'update_mode' ) === $endpoint['callback'];
				}
			)
		);
		$this->assertSame(
			array(
				'type'     => 'boolean',
				'required' => true,
			),
			$update_endpoint['args']['enabled']
		);
	}
}
