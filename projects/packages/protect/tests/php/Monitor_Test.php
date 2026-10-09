<?php
/**
 * Tests for the Protect dashboard's Monitor section.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect\Sections;

use Automattic\Jetpack\Constants;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * @covers \Automattic\Jetpack\Protect\Sections\Monitor
 */
#[CoversClass( Monitor::class )]
class Monitor_Test extends BaseTestCase {

	/**
	 * What WordPress.com answers for the uptime history.
	 *
	 * @var array|WP_Error
	 */
	private $uptime_response;

	/**
	 * What WordPress.com answers for the current status.
	 *
	 * @var array|WP_Error
	 */
	private $status_response;

	/**
	 * URLs requested from WordPress.com.
	 *
	 * @var string[]
	 */
	private $requests = array();

	/**
	 * Start as a connected admin on a site with Monitor on, and WordPress.com answering.
	 */
	public function set_up() {
		parent::set_up();

		$user_id = wp_insert_user(
			array(
				'user_login' => 'monitor_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		Jetpack_Options::update_option( 'id', 123 );
		Jetpack_Options::update_option( 'blog_token', 'blog.token' );
		Jetpack_Options::update_option( 'user_tokens', array( $user_id => "token.secret.$user_id" ) );
		Jetpack_Options::update_option( 'active_modules', array( 'monitor' ) );
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'make_monitor_available' ) );

		$this->requests        = array();
		$this->uptime_response = self::json_response( array( '2026-10-01' => array( 'status' => 'up' ) ) );
		$this->status_response = self::json_response( array( 'status' => true ) );
		add_filter( 'pre_http_request', array( $this, 'answer_as_wpcom' ), 10, 3 );
	}

	/**
	 * Leave no cache, filters or routes behind.
	 */
	public function tear_down() {
		global $wp_rest_server;
		$wp_rest_server = null;

		delete_transient( Monitor::UPTIME_TRANSIENT );
		Constants::clear_constants();
		remove_filter( 'pre_http_request', array( $this, 'answer_as_wpcom' ) );
		remove_filter( 'jetpack_get_available_standalone_modules', array( $this, 'make_monitor_available' ) );
		remove_all_actions( 'rest_api_init' );
		remove_all_actions( 'jetpack_activate_module_monitor' );
		remove_all_actions( 'jetpack_deactivate_module_monitor' );
		parent::tear_down();
	}

	/**
	 * Filter callback: Monitor is a module of this site.
	 *
	 * @param string[] $modules Module slugs.
	 * @return string[]
	 */
	public function make_monitor_available( $modules ) {
		$modules[] = 'monitor';
		return $modules;
	}

	/**
	 * Filter callback: answer WordPress.com requests from the test's fixtures.
	 *
	 * @param false|array|WP_Error $preempt Unused.
	 * @param array                $args    Unused.
	 * @param string               $url     The requested URL.
	 * @return array|WP_Error
	 */
	public function answer_as_wpcom( $preempt, $args, $url ) {
		$this->requests[] = $url;
		if ( false !== strpos( $url, '/wpcom/v2/sites/123/jetpack-monitor-status' ) ) {
			return $this->status_response;
		}
		if ( false !== strpos( $url, '/wpcom/v2/sites/123/jetpack-monitor-uptime?period=90+days' ) ) {
			return $this->uptime_response;
		}
		return new WP_Error( 'unexpected_request', $url );
	}

	/**
	 * Build an HTTP response.
	 *
	 * @param mixed $body The decoded body.
	 * @param int   $code The status code.
	 * @return array
	 */
	private static function json_response( $body, $code = 200 ) {
		return array(
			'response' => array( 'code' => $code ),
			'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
		);
	}

	public function test_get_uptime_keeps_the_newest_valid_days_oldest_first() {
		$body = array(
			'total'      => array( 'status' => 'up' ),
			'2026-01-01' => 'not a day',
		);
		// 42 days, newest first, so both the sort and the 40-day cut have work to do.
		for ( $i = 41; $i >= 0; $i-- ) {
			$body[ gmdate( 'Y-m-d', strtotime( "2026-02-01 +$i days" ) ) ] = array( 'status' => 'up' );
		}
		$body['2026-03-13']    = array(
			'status'              => 'down',
			'downtime_in_minutes' => '12',
		);
		$body['2026-03-14']    = array( 'status' => 'paused' );
		$this->uptime_response = self::json_response( $body );

		$uptime = ( new Monitor() )->get_uptime();

		$this->assertCount( Monitor::UPTIME_DAYS, $uptime['days'] );
		$this->assertSame(
			array(
				'date'              => '2026-02-03',
				'status'            => 'up',
				'downtimeInMinutes' => 0,
			),
			$uptime['days'][0]
		);
		$this->assertSame(
			array(
				array(
					'date'              => '2026-03-13',
					'status'            => 'down',
					'downtimeInMinutes' => 12,
				),
				array(
					'date'              => '2026-03-14',
					'status'            => 'monitor_inactive',
					'downtimeInMinutes' => 0,
				),
			),
			array_slice( $uptime['days'], -2 )
		);
	}

	/**
	 * Current-status answers, the `isUp` each gives, and how long the result may be cached.
	 *
	 * @return array[]
	 */
	public static function provide_statuses() {
		return array(
			'up'                => array( self::json_response( array( 'status' => true ) ), true, 10 * MINUTE_IN_SECONDS ),
			'down'              => array( self::json_response( array( 'status' => false ) ), false, 10 * MINUTE_IN_SECONDS ),
			'not a boolean'     => array( self::json_response( array( 'status' => 'up' ) ), null, MINUTE_IN_SECONDS ),
			'WordPress.com 500' => array( self::json_response( array(), 500 ), null, MINUTE_IN_SECONDS ),
		);
	}

	/**
	 * @dataProvider provide_statuses
	 *
	 * @param array     $status_response WordPress.com's answer for the current status.
	 * @param bool|null $is_up           The expected `isUp`.
	 * @param int       $max_ttl         The longest the result may stay cached, in seconds.
	 */
	#[DataProvider( 'provide_statuses' )]
	public function test_get_uptime_reports_the_current_status_and_caches_an_unknown_one_briefly( $status_response, $is_up, $max_ttl ) {
		$this->status_response = $status_response;
		$monitor               = new Monitor();

		$uptime = $monitor->get_uptime();
		$monitor->get_uptime();

		$this->assertSame( $is_up, $uptime['isUp'] );
		$this->assertCount( 2, $this->requests, 'The second call should be served from the cache.' );
		$ttl = (int) get_option( '_transient_timeout_' . Monitor::UPTIME_TRANSIENT ) - time();
		$this->assertGreaterThan( $max_ttl - 10, $ttl );
		$this->assertLessThanOrEqual( $max_ttl, $ttl );
	}

	/**
	 * Uptime-history answers that can't be shown, and how many requests two calls make.
	 *
	 * @return array[]
	 */
	public static function provide_unusable_histories() {
		return array(
			'request failed'         => array( new WP_Error( 'http_request_failed', 'Timed out' ), 1 ),
			'WordPress.com 500'      => array( self::json_response( array(), 500 ), 1 ),
			'no days'                => array( self::json_response( array() ), 1 ),
			'no valid days'          => array( self::json_response( array( 'total' => array( 'status' => 'up' ) ) ), 1 ),
			'this user is refused'   => array( self::json_response( array(), 403 ), 2 ),
			'this user is not known' => array( self::json_response( array(), 401 ), 2 ),
		);
	}

	/**
	 * @dataProvider provide_unusable_histories
	 *
	 * @param array|WP_Error $uptime_response WordPress.com's answer for the uptime history.
	 * @param int            $requests        Requests made by two calls: 1 when the failure is cached for everyone.
	 */
	#[DataProvider( 'provide_unusable_histories' )]
	public function test_get_uptime_is_a_502_when_the_history_is_unusable_and_caches_only_shared_failures( $uptime_response, $requests ) {
		$this->uptime_response = $uptime_response;
		$monitor               = new Monitor();

		$first  = $monitor->get_uptime();
		$second = $monitor->get_uptime();

		$this->assertInstanceOf( WP_Error::class, $first );
		$this->assertSame( 'uptime_unavailable', $first->get_error_code() );
		$this->assertSame( array( 'status' => 502 ), $first->get_error_data() );
		$this->assertInstanceOf( WP_Error::class, $second );
		$this->assertCount( $requests, $this->requests );
	}

	public function test_get_uptime_refuses_a_disconnected_user_even_with_a_warm_cache() {
		$monitor = new Monitor();
		$monitor->get_uptime();
		Jetpack_Options::delete_option( 'user_tokens' );

		$uptime = $monitor->get_uptime();

		$this->assertInstanceOf( WP_Error::class, $uptime );
		$this->assertSame( 'not_connected', $uptime->get_error_code() );
		$this->assertSame( array( 'status' => 403 ), $uptime->get_error_data() );
	}

	public function test_get_uptime_asks_nothing_of_wpcom_while_monitor_is_off() {
		Jetpack_Options::update_option( 'active_modules', array() );

		$uptime = ( new Monitor() )->get_uptime();

		$this->assertInstanceOf( WP_Error::class, $uptime );
		$this->assertSame( 'monitor_inactive', $uptime->get_error_code() );
		$this->assertSame( array(), $this->requests );
	}

	public function test_get_state_says_whether_the_user_can_reach_wpcom() {
		$monitor = new Monitor();

		$this->assertTrue( $monitor->get_state()['userConnected'] );
		Jetpack_Options::delete_option( 'user_tokens' );
		$this->assertFalse( $monitor->get_state()['userConnected'] );
	}

	/**
	 * The hooks Jetpack fires when Monitor is turned on or off.
	 *
	 * @return array[]
	 */
	public static function provide_toggle_hooks() {
		return array(
			array( 'jetpack_activate_module_monitor' ),
			array( 'jetpack_deactivate_module_monitor' ),
		);
	}

	/**
	 * @dataProvider provide_toggle_hooks
	 *
	 * @param string $hook The module hook.
	 */
	#[DataProvider( 'provide_toggle_hooks' )]
	public function test_toggling_monitor_drops_the_cached_history( $hook ) {
		( new Monitor() )->get_uptime();
		$this->assertIsArray( get_transient( Monitor::UPTIME_TRANSIENT ) );

		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.DynamicHooknameFound -- The Jetpack module hooks under test.
		do_action( $hook, 'monitor' );

		$this->assertFalse( get_transient( Monitor::UPTIME_TRANSIENT ) );
	}

	/**
	 * Users who may not use the route, and the status each gets.
	 *
	 * @return array[]
	 */
	public static function provide_refused_users() {
		return array(
			'logged out' => array( null, 401 ),
			'subscriber' => array( 'subscriber', 403 ),
		);
	}

	/**
	 * @dataProvider provide_refused_users
	 *
	 * @param string|null $role   The user's role, or null when logged out.
	 * @param int         $status The expected HTTP status.
	 */
	#[DataProvider( 'provide_refused_users' )]
	public function test_the_route_refuses_users_who_cannot_manage_the_site( $role, $status ) {
		global $wp_rest_server;
		$wp_rest_server = null;
		add_action( 'rest_api_init', array( new Monitor(), 'register_routes' ) );
		$user_id = null === $role ? 0 : wp_insert_user(
			array(
				'user_login' => 'monitor_visitor',
				'user_pass'  => 'password',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );

		$response = rest_do_request( new \WP_REST_Request( 'GET', '/jetpack/v4/protect-dashboard/uptime' ) );

		$this->assertSame( $status, $response->get_status() );
		$this->assertSame( array(), $this->requests );
	}
}
