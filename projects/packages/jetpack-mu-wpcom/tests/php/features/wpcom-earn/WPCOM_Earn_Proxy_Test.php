<?php
/**
 * Tests for the Monetize page's WordPress.com proxy.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Utils as Connection_Utils;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Earn;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Earn_Proxy;
use PHPUnit\Framework\Attributes\DataProvider;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-earn/wpcom-earn.php';

/**
 * Tests for the Monetize page's WordPress.com proxy.
 */
class WPCOM_Earn_Proxy_Test extends \WorDBless\BaseTestCase {

	/**
	 * The administrator the requests run as.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Upstream requests made during a test, as URL => request args.
	 *
	 * @var array
	 */
	private $upstream = array();

	/**
	 * Sign in a connected administrator on a connected site.
	 *
	 * @return void
	 */
	public function set_up() {
		parent::set_up();

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'wpcom_earn_proxy_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->admin_id );

		\Jetpack_Options::update_option( 'id', 12345 );
		\Jetpack_Options::update_option( 'blog_token', 'blog.token' );
		\Jetpack_Options::update_option( 'user_tokens', array( $this->admin_id => "token.secret.{$this->admin_id}" ) );
		Connection_Utils::init_default_constants();
	}

	/**
	 * Leave the connection, constants and flag as they were found.
	 *
	 * @return void
	 */
	public function tear_down() {
		\Jetpack_Options::delete_option( array( 'id', 'blog_token', 'user_tokens' ) );
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'jetpack_feature_flag_enabled_' . WPCOM_Earn::FLAG );
		remove_all_actions( 'rest_api_init' );
		Feature_Flags::reset();
		Constants::clear_constants();

		parent::tear_down();
	}

	/**
	 * Answer every upstream request with the given status and body, recording what was asked.
	 *
	 * @param int    $status HTTP status.
	 * @param string $body   Response body.
	 * @return void
	 */
	private function answer_upstream( $status, $body ) {
		add_filter(
			'pre_http_request',
			function ( $pre, $args, $url ) use ( $status, $body ) {
				$this->upstream[ $url ] = $args;

				return array(
					'response' => array( 'code' => $status ),
					'body'     => $body,
				);
			},
			10,
			3
		);
	}

	/**
	 * A proxy request to the given upstream endpoint.
	 *
	 * @param string $method HTTP method.
	 * @param string $api    Upstream API.
	 * @param string $path   Upstream path.
	 * @return WP_REST_Request
	 */
	private function request( $method, $api, $path ) {
		$request = new WP_REST_Request( $method, '/wpcom/v2/earn-proxy/' . $api . '/' . $path );
		$request->set_url_params(
			array(
				'api'  => $api,
				'path' => $path,
			)
		);

		return $request;
	}

	/**
	 * The proxy is the only thing between an admin's browser and their WordPress.com
	 * account, so anything off the list must be refused.
	 *
	 * @param string $method  HTTP method.
	 * @param string $api     Upstream API.
	 * @param string $path    Upstream path.
	 * @param bool   $allowed Whether the proxy should forward it.
	 * @dataProvider provide_endpoints
	 */
	#[DataProvider( 'provide_endpoints' )]
	public function test_only_allowlisted_endpoints_are_forwarded( $method, $api, $path, $allowed ) {
		$this->assertSame( $allowed, WPCOM_Earn_Proxy::is_allowed( $method, $api, $path ) );
	}

	/**
	 * Data provider for test_only_allowlisted_endpoints_are_forwarded.
	 *
	 * @return array
	 */
	public static function provide_endpoints() {
		return array(
			'a listed read'                   => array( 'GET', 'wpcom/v2', 'memberships/coupons', true ),
			'a listed write with an ID'       => array( 'DELETE', 'wpcom/v2', 'memberships/coupon/42', true ),
			'a v1.1 endpoint'                 => array( 'POST', 'rest/v1.1', 'memberships/subscriptions/7/cancel', true ),
			'a per-user endpoint'             => array( 'GET', 'rest/v1.1', 'me/peer-referral-link', true ),
			'a listed path, unlisted method'  => array( 'DELETE', 'wpcom/v2', 'memberships/coupons', false ),
			'a listed path, other API'        => array( 'GET', 'rest/v1.1', 'memberships/coupons', false ),
			'a non-numeric ID'                => array( 'DELETE', 'wpcom/v2', 'memberships/coupon/all', false ),
			'a listed path with a suffix'     => array( 'GET', 'wpcom/v2', 'memberships/earnings/export', false ),
			'an unlisted endpoint'            => array( 'GET', 'rest/v1.1', 'me/settings', false ),
			'an unlisted endpoint, other API' => array( 'GET', 'rest/v1.2', 'memberships/status', false ),
		);
	}

	/**
	 * Nothing but this ties the route to the path the page calls, and a mismatch 404s every Atomic request.
	 */
	public function test_the_page_calls_the_route_this_registers() {
		$this->assertStringContainsString(
			"PROXY_BASE = '/" . WPCOM_Earn_Proxy::REST_NAMESPACE . '/' . WPCOM_Earn_Proxy::REST_BASE . "'",
			(string) file_get_contents( Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-earn/js/wpcom-request.ts' )
		);
	}

	public function test_non_admins_are_refused() {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'wpcom_earn_proxy_editor',
					'user_pass'  => 'password',
					'role'       => 'editor',
				)
			)
		);

		$result = WPCOM_Earn_Proxy::permission_check( $this->request( 'GET', 'wpcom/v2', 'memberships/status' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_forbidden', $result->get_error_code() );
	}

	/**
	 * Simple sites reach WordPress.com directly, and the route there would shadow its own.
	 */
	public function test_route_registers_on_atomic_only() {
		add_filter( 'jetpack_feature_flag_enabled_' . WPCOM_Earn::FLAG, '__return_true' );
		$hook = array( WPCOM_Earn_Proxy::class, 'register_routes' );

		WPCOM_Earn::init();
		$this->assertFalse( has_action( 'rest_api_init', $hook ) );

		Constants::set_constant( 'IS_ATOMIC', true );
		WPCOM_Earn::init();
		$this->assertNotFalse( has_action( 'rest_api_init', $hook ) );
	}

	public function test_site_endpoints_are_forwarded_under_the_site_and_per_user_ones_are_not() {
		$this->answer_upstream( 200, '{"ok":true}' );

		$coupons = $this->request( 'POST', 'wpcom/v2', 'memberships/coupons' );
		$coupons->set_query_params(
			array(
				'type'       => 'all',
				'rest_route' => '/wpcom/v2/earn-proxy',
			)
		);
		$coupons->set_body( '{"coupon_code":"SAVE10"}' );

		$this->assertSame( array( 'ok' => true ), WPCOM_Earn_Proxy::proxy( $coupons ) );
		WPCOM_Earn_Proxy::proxy( $this->request( 'GET', 'rest/v1.1', 'me/peer-referral-link' ) );

		$urls = array_keys( $this->upstream );
		parse_str( (string) wp_parse_url( $urls[0], PHP_URL_QUERY ), $query );
		$this->assertSame( '/wpcom/v2/sites/12345/memberships/coupons', wp_parse_url( $urls[0], PHP_URL_PATH ) );
		$this->assertSame( 'all', $query['type'] );
		$this->assertArrayNotHasKey( 'rest_route', $query );
		$this->assertSame( 'POST', $this->upstream[ $urls[0] ]['method'] );
		$this->assertSame( '{"coupon_code":"SAVE10"}', $this->upstream[ $urls[0] ]['body'] );
		$this->assertSame( '/rest/v1.1/me/peer-referral-link', wp_parse_url( $urls[1], PHP_URL_PATH ) );
	}

	/**
	 * The v1.1 API names its error code `error`, and the page shows the message it carries.
	 */
	public function test_upstream_errors_keep_their_code_message_and_status() {
		$this->answer_upstream( 403, '{"error":"unauthorized","message":"Only the site owner can do that."}' );

		$result = WPCOM_Earn_Proxy::proxy( $this->request( 'POST', 'rest/v1.1', 'wordads/approve' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'unauthorized', $result->get_error_code() );
		$this->assertSame( 'Only the site owner can do that.', $result->get_error_message() );
		$this->assertSame( 403, $result->get_error_data()['status'] );
	}

	public function test_admins_without_a_wpcom_connection_are_told_to_connect() {
		\Jetpack_Options::delete_option( 'user_tokens' );
		$this->answer_upstream( 200, '{}' );

		$result = WPCOM_Earn_Proxy::proxy( $this->request( 'GET', 'wpcom/v2', 'memberships/status' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_unauthorized', $result->get_error_code() );
		$this->assertSame( array(), $this->upstream );
	}
}
