<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\My_Jetpack\Products\Protect;
use Automattic\Jetpack\Waf\Waf_Rules_Manager;
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
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		// Populate the options Waf_Runner::get_config() reads, so the endpoint is exercised
		// against the real WAF package rather than a hand-written stub.
		update_option( Waf_Rules_Manager::AUTOMATIC_RULES_ENABLED_OPTION_NAME, '1' );
		update_option( Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME, '203.0.113.55' );
		update_option( Waf_Rules_Manager::IP_ALLOW_LIST_ENABLED_OPTION_NAME, '1' );
		update_option( Waf_Rules_Manager::IP_BLOCK_LIST_OPTION_NAME, '198.51.100.7' );
		update_option( Waf_Rules_Manager::IP_BLOCK_LIST_ENABLED_OPTION_NAME, '1' );
		update_option( Waf_Runner::SHARE_DATA_OPTION_NAME, '1' );
		update_option( Waf_Runner::SHARE_DEBUG_DATA_OPTION_NAME, '1' );

		// Waf_Runner::is_enabled() and Brute_Force_Protection::is_enabled() both read the active
		// module list, which is empty without the Jetpack plugin present.
		add_filter( 'jetpack_active_modules', array( $this, 'activate_waf_modules' ) );

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
		remove_filter( 'jetpack_active_modules', array( $this, 'activate_waf_modules' ) );

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
	 * Report the WAF and brute force protection modules as active.
	 *
	 * @return string[]
	 */
	public function activate_waf_modules() {
		return array( 'waf', 'protect' );
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

		$waf_config = $this->get_served_waf_config();

		$this->assertSame(
			array_merge(
				Waf_Runner::get_config(),
				array(
					'waf_supported'  => true,
					'waf_enabled'    => true,
					'blocked_logins' => 0,
				)
			),
			$waf_config
		);

		// Spot-check the administrator-only values, so the assertion above can't pass on an
		// empty configuration.
		$this->assertSame( '203.0.113.55', $waf_config['jetpack_waf_ip_allow_list'] );
		$this->assertSame( '198.51.100.7', $waf_config['jetpack_waf_ip_block_list'] );
		$this->assertTrue( $waf_config['jetpack_waf_automatic_rules'] );
		$this->assertTrue( $waf_config['brute_force_protection'] );

		// Only the key: the value is the absolute WAF bootstrap path, which varies by install.
		$this->assertArrayHasKey( 'bootstrap_path', $waf_config );
	}

	/**
	 * The endpoint filters the WAF configuration by key name. A rename in Waf_Rules_Manager
	 * would silently drop the non-admin keys from the response instead of failing, so assert
	 * the allowlist is still a subset of what the real Waf_Runner::get_config() returns.
	 */
	public function test_non_admin_allowlist_matches_real_waf_config_keys() {
		$allowlist = ( new \ReflectionClass( Protect::class ) )->getConstant( 'NON_ADMIN_WAF_CONFIG_KEYS' );

		$this->assertNotEmpty( $allowlist );

		$config_keys = array_keys( Waf_Runner::get_config() );

		foreach ( $allowlist as $key ) {
			$this->assertContains(
				$key,
				$config_keys,
				"Protect::NON_ADMIN_WAF_CONFIG_KEYS lists '$key', which Waf_Runner::get_config() no longer returns."
			);
		}
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
				'jetpack_waf_automatic_rules' => true,
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
