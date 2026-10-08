<?php
/**
 * Tests for REST_Controller.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\Send\REST_Controller
 */
#[CoversClass( REST_Controller::class )]
class REST_Controller_Test extends BaseTestCase {

	/**
	 * REST server.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Register the routes on a fresh server.
	 */
	public function set_up() {
		parent::set_up();
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;
		add_action( 'rest_api_init', array( REST_Controller::class, 'register_routes' ) );
		do_action( 'rest_api_init', $this->server );
	}

	/**
	 * Reset globals and filters.
	 */
	public function tear_down() {
		global $wp_rest_server;
		$wp_rest_server = null;
		remove_all_actions( 'rest_api_init' );
		remove_all_filters( 'jetpack_send_provisioner' );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Log in as a new user with a role.
	 *
	 * @param string $role Role.
	 */
	private function login( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => $role . '_user',
				'user_pass'  => 'pass',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );
	}

	/**
	 * Dispatch a request.
	 *
	 * @param string $method Method.
	 * @param string $route  Route under the namespace.
	 * @param array  $params Params.
	 * @return \WP_REST_Response
	 */
	private function request( $method, $route, array $params = array() ) {
		$request = new WP_REST_Request( $method, '/jetpack-send/v1' . $route );
		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}
		return $this->server->dispatch( $request );
	}

	/**
	 * A stored account with overrides.
	 *
	 * @param array $overrides Keys to replace.
	 * @return array
	 */
	private static function account( array $overrides = array() ) {
		return array_merge(
			array(
				'handle'           => 'jpsendtest',
				'api_key'          => 'secret-sub-key',
				'lockdown_auth_id' => 'jpsendtest',
				'domain'           => 'example.com',
				'dkim_selector'    => '',
				'monthly_limit'    => -1,
				'dns_records'      => array(),
				'provider'         => 'local',
				'provisioned_at'   => '2026-10-07T00:00:00+00:00',
				'dns_check'        => null,
			),
			$overrides
		);
	}

	/**
	 * Every route, with params that pass validation.
	 *
	 * @return array[]
	 */
	public static function provide_routes() {
		return array(
			'status'    => array( 'GET', '/status', array() ),
			'setup'     => array( 'POST', '/setup', array( 'domain' => 'example.com' ) ),
			'check-dns' => array( 'POST', '/check-dns', array() ),
			'settings'  => array( 'POST', '/settings', array() ),
			'test'      => array( 'POST', '/test', array( 'to' => 'someone@example.com' ) ),
			'usage'     => array( 'GET', '/usage', array() ),
			'log'       => array( 'GET', '/log', array() ),
			'reset'     => array( 'POST', '/reset', array() ),
		);
	}

	/**
	 * @dataProvider provide_routes
	 *
	 * @param string $method Method.
	 * @param string $route  Route.
	 * @param array  $params Params.
	 */
	#[DataProvider( 'provide_routes' )]
	public function test_routes_require_manage_options( $method, $route, array $params ) {
		$this->login( 'editor' );

		$this->assertSame( 403, $this->request( $method, $route, $params )->get_status() );
	}

	/**
	 * DNS check states and whether enabling is allowed.
	 *
	 * @return array[]
	 */
	public static function provide_enable_states() {
		return array(
			'not checked yet'                    => array( null, 400 ),
			'lockdown failing'                   => array(
				array(
					'domain_lockdown' => 'failed',
					'sender_domain'   => 'passed',
				),
				400,
			),
			'lockdown and sender domain passing' => array(
				array(
					'domain_lockdown' => 'passed',
					'sender_domain'   => 'passed',
					'spf'             => 'failed',
					'dkim'            => 'unknown',
				),
				200,
			),
		);
	}

	/**
	 * @dataProvider provide_enable_states
	 *
	 * @param array|null $dns_check Stored DNS check.
	 * @param int        $status    Expected HTTP status.
	 */
	#[DataProvider( 'provide_enable_states' )]
	public function test_enabling_requires_lockdown_and_sender_domain( $dns_check, $status ) {
		$this->login( 'administrator' );
		Account::save( self::account( array( 'dns_check' => $dns_check ) ) );

		$response = $this->request( 'POST', '/settings', array( 'enabled' => true ) );

		$this->assertSame( $status, $response->get_status() );
		$this->assertSame( 200 === $status, Settings::get()['enabled'] );
	}

	public function test_status_never_exposes_the_api_key() {
		$this->login( 'administrator' );
		Account::save( self::account() );

		$response = $this->request( 'GET', '/status' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'example.com', $response->get_data()['account']['domain'] );
		$this->assertStringNotContainsString( 'secret-sub-key', (string) wp_json_encode( $response->get_data(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) );
	}

	public function test_setup_stores_the_account_and_turns_sending_off() {
		$this->login( 'administrator' );
		Settings::update( array( 'enabled' => true ) );
		add_filter( 'jetpack_send_provisioner', fn() => new Fake_Provisioner() );

		$response = $this->request( 'POST', '/setup', array( 'domain' => 'Example.com' ) );

		$this->assertSame( 200, $response->get_status() );
		$account = Account::get();
		$this->assertIsArray( $account );
		$this->assertSame( 'example.com', $account['domain'] );
		$this->assertSame( 'fake-key', $account['api_key'] );
		$this->assertSame( 'jpsend', $account['dkim_selector'] );
		$this->assertFalse( Settings::get()['enabled'] );
	}
}
