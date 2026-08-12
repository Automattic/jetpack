<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Waf\Waf_Runner;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the capability filtering of the WAF configuration served by
 * GET /my-jetpack/v1/site/protect/data.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Products\Protect::get_site_protect_data
 */
class Protect_Waf_Config_Test extends TestCase {

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * A representative Waf_Runner::get_config() payload.
	 *
	 * @var array
	 */
	private $waf_config = array(
		'jetpack_waf_automatic_rules'       => '1',
		'jetpack_waf_ip_allow_list'         => '203.0.113.55',
		'jetpack_waf_ip_allow_list_enabled' => true,
		'jetpack_waf_ip_block_list'         => '198.51.100.7',
		'jetpack_waf_ip_block_list_enabled' => true,
		'jetpack_waf_share_data'            => '1',
		'jetpack_waf_share_debug_data'      => '1',
		'bootstrap_path'                    => '/var/www/html/wp-content/jetpack-waf/bootstrap.php',
		'standalone_mode'                   => false,
		'automatic_rules_available'         => true,
		'brute_force_protection'            => true,
		'jetpack_waf_ip_list'               => true,
	);

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		require_once __DIR__ . '/stubs/class-waf-runner.php';
		// The stub is excluded from Phan so it can't mask the suppressions in class-protect.php.
		// @phan-suppress-next-line PhanUndeclaredClassStaticProperty
		Waf_Runner::$config = $this->waf_config;

		// Protect_Status::get_status() ships in the same response and would otherwise reach out to WPCOM.
		add_filter( 'pre_http_request', array( $this, 'fail_http_request' ) );

		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );

		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		Initializer::init();
		do_action( 'rest_api_init' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		remove_filter( 'pre_http_request', array( $this, 'fail_http_request' ) );

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Short-circuit every outbound HTTP request.
	 *
	 * @return \WP_Error
	 */
	public function fail_http_request() {
		return new \WP_Error( 'http_request_blocked', 'Blocked in tests.' );
	}

	/**
	 * Set the current user to a freshly created user with the given role.
	 *
	 * @param string $role The role to create the user with.
	 * @return void
	 */
	private function set_current_user_role( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => "test_$role",
				'user_pass'  => '123',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );
	}

	/**
	 * Dispatch the Protect data endpoint and return the `wafConfig` it served.
	 *
	 * @return array
	 */
	private function get_served_waf_config() {
		$response = $this->server->dispatch( new WP_REST_Request( 'GET', '/my-jetpack/v1/site/protect/data' ) );

		$this->assertSame( 200, $response->get_status() );

		return $response->get_data()['wafConfig'];
	}

	/**
	 * Administrators keep receiving the full WAF configuration.
	 */
	public function test_administrator_receives_full_waf_config() {
		$this->set_current_user_role( 'administrator' );

		$this->assertSame(
			array_merge(
				$this->waf_config,
				array(
					'waf_supported'  => true,
					'waf_enabled'    => true,
					'blocked_logins' => 0,
				)
			),
			$this->get_served_waf_config()
		);
	}

	/**
	 * Users without `manage_options` only receive the status keys the Protect card renders.
	 *
	 * @dataProvider provide_non_admin_roles
	 *
	 * @param string $role A role without the `manage_options` capability.
	 */
	#[DataProvider( 'provide_non_admin_roles' )]
	public function test_non_admin_receives_only_status_keys( $role ) {
		$this->set_current_user_role( $role );

		$waf_config = $this->get_served_waf_config();

		$this->assertArrayNotHasKey( 'bootstrap_path', $waf_config );
		$this->assertArrayNotHasKey( 'jetpack_waf_ip_allow_list', $waf_config );
		$this->assertArrayNotHasKey( 'jetpack_waf_ip_block_list', $waf_config );

		$this->assertSame(
			array(
				'jetpack_waf_automatic_rules' => '1',
				'brute_force_protection'      => true,
				'waf_supported'               => true,
				'waf_enabled'                 => true,
				'blocked_logins'              => 0,
			),
			$waf_config
		);
	}

	/**
	 * Roles that hold `edit_posts` but not `manage_options`.
	 *
	 * @return array[]
	 */
	public static function provide_non_admin_roles() {
		return array(
			'editor'      => array( 'editor' ),
			'author'      => array( 'author' ),
			'contributor' => array( 'contributor' ),
		);
	}
}
