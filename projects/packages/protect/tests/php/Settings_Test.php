<?php
/**
 * Tests for the Protect dashboard's settings route.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Waf\Waf_Rules_Manager;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Error;
use WP_REST_Request;

/**
 * @covers \Automattic\Jetpack\Protect\Settings
 */
#[CoversClass( Settings::class )]
class Settings_Test extends BaseTestCase {

	/**
	 * Modules the test site offers.
	 *
	 * @var string[]
	 */
	private $available = array( 'protect' );

	/**
	 * The $_SERVER to restore.
	 *
	 * @var array
	 */
	private $server;

	/**
	 * URLs requested from WordPress.com.
	 *
	 * @var string[]
	 */
	private $requests = array();

	/**
	 * Start as a visitor at a known address, with only the `protect` module offered.
	 */
	public function set_up() {
		parent::set_up();
		$this->server           = $_SERVER;
		$_SERVER['REMOTE_ADDR'] = '203.0.113.7';
		$this->requests         = array();
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'available_modules' ) );
	}

	/**
	 * Leave no filters, options or users behind.
	 */
	public function tear_down() {
		$_SERVER = $this->server;
		Constants::clear_constants();
		remove_all_filters( 'jetpack_get_available_standalone_modules' );
		remove_all_filters( 'jetpack_active_modules' );
		remove_all_filters( 'pre_http_request' );
		Jetpack_Options::delete_option( array( 'active_modules', 'id', 'blog_token', 'user_tokens' ) );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Filter callback: the modules this test site offers.
	 *
	 * @return string[]
	 */
	public function available_modules() {
		return $this->available;
	}

	/**
	 * Filter callback: WordPress.com can't be reached.
	 *
	 * @param false|array|WP_Error $preempt Unused.
	 * @param array                $args    Unused.
	 * @param string               $url     The requested URL.
	 * @return WP_Error
	 */
	public function fail_request( $preempt, $args, $url ) {
		$this->requests[] = $url;
		return new WP_Error( 'http_request_failed', 'unreachable' );
	}

	/**
	 * A POST to the route with a JSON body.
	 *
	 * @param array $patch The body.
	 * @return array|WP_Error
	 */
	private static function save( $patch ) {
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/protect-dashboard/settings' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $patch, JSON_UNESCAPED_SLASHES ) );
		return Settings::update_settings( $request );
	}

	/**
	 * A refused IP list stops the whole save, even for keys sent before it.
	 *
	 * @dataProvider provide_refused_ip_lists
	 *
	 * @param array  $patch The request body.
	 * @param string $key   The key the error names.
	 */
	#[DataProvider( 'provide_refused_ip_lists' )]
	public function test_refused_ip_list_saves_nothing( $patch, $key ) {
		update_option( Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME, '203.0.113.0/24' );
		update_option( Waf_Rules_Manager::IP_ALLOW_LIST_ENABLED_OPTION_NAME, '1' );

		$result = self::save( $patch );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_invalid_param', $result->get_error_code() );
		$this->assertSame( 400, $result->get_error_data()['status'] );
		$this->assertArrayHasKey( $key, $result->get_error_data()['params'] );
		$this->assertSame( array(), Jetpack_Options::get_option( 'active_modules', array() ) );
		$this->assertSame( '203.0.113.0/24', get_option( Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME ) );
		$this->assertFalse( get_option( Waf_Rules_Manager::IP_BLOCK_LIST_OPTION_NAME ) );
	}

	/**
	 * Data provider for test_refused_ip_list_saves_nothing.
	 *
	 * @return array
	 */
	public static function provide_refused_ip_lists() {
		return array(
			'block list covering the allowed visitor' => array(
				array(
					'protect'                   => true,
					'jetpack_waf_ip_block_list' => '203.0.113.7',
				),
				'jetpack_waf_ip_block_list',
			),
			'block list that is not a string'         => array(
				array(
					'protect'                   => true,
					'jetpack_waf_ip_block_list' => array( '198.51.100.2' ),
				),
				'jetpack_waf_ip_block_list',
			),
			'allow list that is not a string'         => array(
				array(
					'protect'                   => true,
					'jetpack_waf_ip_allow_list' => 5,
				),
				'jetpack_waf_ip_allow_list',
			),
		);
	}

	public function test_accepted_ip_lists_are_stored_escaped() {
		// A host the firewall doesn't run on, so saving skips the rules rebuild, which needs a registered site.
		Constants::set_constant( 'WPCOM_IS_VIP_ENV', true );

		$result = self::save(
			array(
				'jetpack_waf_ip_allow_list' => '203.0.113.7&',
				'jetpack_waf_ip_block_list' => '198.51.100.2&',
			)
		);

		$this->assertNotInstanceOf( WP_Error::class, $result );
		$this->assertSame( '203.0.113.7&amp;', get_option( Waf_Rules_Manager::IP_ALLOW_LIST_OPTION_NAME ) );
		$this->assertSame( '198.51.100.2&amp;', get_option( Waf_Rules_Manager::IP_BLOCK_LIST_OPTION_NAME ) );
	}

	public function test_module_a_filter_forces_on_reports_it_could_not_be_switched_off() {
		Jetpack_Options::update_option( 'active_modules', array( 'protect' ) );
		add_filter(
			'jetpack_active_modules',
			static function ( $active ) {
				return array_merge( $active, array( 'protect' ) );
			}
		);

		$result = self::save( array( 'protect' => false ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'module_update_failed', $result->get_error_code() );
	}

	public function test_sso_options_are_ignored_when_sso_is_not_a_module() {
		$result = self::save( array( 'jetpack_sso_require_two_step' => true ) );

		$this->assertFalse( get_option( 'jetpack_sso_require_two_step' ) );
		$this->assertArrayNotHasKey( 'jetpack_sso_require_two_step', $result );
	}

	public function test_failed_monitor_lookup_is_not_retried_on_every_load() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'settings_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );
		Constants::set_constant( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );
		Jetpack_Options::update_option( 'id', 123 );
		Jetpack_Options::update_option( 'blog_token', 'blog.token' );
		Jetpack_Options::update_option( 'user_tokens', array( $user_id => "token.secret.$user_id" ) );
		Jetpack_Options::update_option( 'active_modules', array( 'monitor' ) );
		$this->available = array( 'monitor' );
		add_filter( 'pre_http_request', array( $this, 'fail_request' ), 10, 3 );

		$first  = Settings::get_settings();
		$second = Settings::get_settings();

		$this->assertFalse( $first[ Settings::MONITOR_NOTIFICATIONS ] );
		$this->assertFalse( $second[ Settings::MONITOR_NOTIFICATIONS ] );
		$this->assertCount( 1, $this->requests );
	}
}
