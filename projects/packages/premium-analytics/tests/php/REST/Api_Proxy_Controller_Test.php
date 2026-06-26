<?php
/**
 * Tests for Api_Proxy_Controller.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\REST\Api_Proxy_Controller
 */
#[CoversClass( Api_Proxy_Controller::class )]
class Api_Proxy_Controller_Test extends BaseTestCase {

	/**
	 * Controller under test.
	 *
	 * @var Api_Proxy_Controller
	 */
	private $controller;

	/**
	 * Set up the controller and a fresh REST server.
	 */
	public function set_up() {
		parent::set_up();
		$this->controller = new Api_Proxy_Controller();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( $this->controller, 'register_routes' ) );
		do_action( 'rest_api_init' );
	}

	public function test_legacy_proxy_route_is_no_longer_registered() {
		$this->assertArrayNotHasKey( '/jetpack-premium-analytics/v1/proxy/(?P<endpoint>.*)', rest_get_server()->get_routes() );
	}

	public function test_analytics_is_served_by_the_data_route() {
		// Analytics is now an allowed prefix on the single agnostic route, not a dedicated route.
		$this->assertStringContainsString( 'analytics', $this->data_route_key() );
	}

	public function test_analytics_requires_manage_options() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'jpa_stats_only',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		$user    = new \WP_User( $user_id );
		$user->add_cap( 'view_stats' );
		wp_set_current_user( $user_id );

		// view_stats reaches stats data but NOT the premium analytics surface.
		$this->assertFalse( $this->controller->check_data_permission( $this->build_data_request( 'GET', 'analytics/reports/totals' ) ) );
		$this->assertTrue( $this->controller->check_data_permission( $this->build_data_request( 'GET', 'stats/top-posts' ) ) );
	}

	public function test_permission_denied_without_manage_options() {
		wp_set_current_user( 0 );
		$this->assertFalse( $this->controller->check_data_permission( $this->build_data_request( 'GET', 'analytics/reports/totals' ) ) );
	}

	public function test_permission_granted_for_administrator() {
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'jpa_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );
		$this->assertTrue( $this->controller->check_data_permission( $this->build_data_request( 'GET', 'analytics/reports/totals' ) ) );
	}

	public function test_returns_403_error_when_not_connected() {
		$response = $this->controller->handle_data_request( $this->build_request( 'reports/totals' ) );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'no_connection', $response->get_error_code() );
		$this->assertSame( 403, $response->get_error_data()['status'] );
	}

	public function test_cache_hit_serves_stored_payload_without_a_connection() {
		$request = $this->build_request( 'reports/totals', array( 'period' => 'week' ) );
		$payload = array(
			'data'    => (object) array( 'orders' => 42 ),
			'status'  => 200,
			'headers' => array( 'x-wp-total' => '42' ),
		);
		set_transient( $this->cache_key( $request ), $payload, MINUTE_IN_SECONDS );

		$response = $this->controller->handle_data_request( $request );

		$this->assertInstanceOf( WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 42, $response->get_data()->orders );
		$this->assertSame( '42', $response->get_headers()['x-wp-total'] );
	}

	public function test_cache_key_ignores_query_param_order_but_not_values() {
		$a = $this->build_request(
			'reports/totals',
			array(
				'period' => 'week',
				'fields' => 'orders',
			)
		);
		$b = $this->build_request(
			'reports/totals',
			array(
				'fields' => 'orders',
				'period' => 'week',
			)
		);
		$c = $this->build_request( 'reports/totals', array( 'period' => 'month' ) );

		$this->assertSame( $this->cache_key( $a ), $this->cache_key( $b ) );
		$this->assertNotSame( $this->cache_key( $a ), $this->cache_key( $c ) );
	}

	public function test_cache_key_ignores_wordpress_routing_params() {
		$bare    = $this->build_request( 'reports/totals', array( 'period' => 'week' ) );
		$routing = $this->build_request(
			'reports/totals',
			array(
				'period'     => 'week',
				'rest_route' => '/jetpack-premium-analytics/v1/proxy/v2/analytics/reports/totals',
				'_locale'    => 'user',
			)
		);

		$this->assertSame( $this->cache_key( $bare ), $this->cache_key( $routing ) );
	}

	public function test_undecodable_200_body_returns_502_and_is_not_cached() {
		$request  = $this->build_request( 'reports/totals' );
		$response = $this->cache_and_build_response(
			array(
				'response' => array( 'code' => 200 ),
				'body'     => '<html>not json</html>',
				'headers'  => array(),
			),
			$this->cache_key( $request )
		);

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'api_error', $response->get_error_code() );
		$this->assertSame( 502, $response->get_error_data()['status'] );
		$this->assertFalse( get_transient( $this->cache_key( $request ) ) );
	}

	public function test_response_with_null_cache_key_is_not_cached() {
		$response = $this->cache_and_build_response(
			array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode( array( 'ok' => true ), JSON_UNESCAPED_SLASHES ),
				'headers'  => array(),
			),
			null
		);

		$this->assertInstanceOf( WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );
	}

	public function test_registers_data_route_with_read_and_write_methods() {
		$route = $this->data_route_key();
		$this->assertNotSame( '', $route, 'The agnostic data route should be registered.' );

		$methods = rest_get_server()->get_routes()[ $route ][0]['methods'];
		$this->assertArrayHasKey( 'GET', $methods );
		$this->assertArrayHasKey( 'POST', $methods );
	}

	public function test_data_route_uses_data_callbacks() {
		$handler = rest_get_server()->get_routes()[ $this->data_route_key() ][0];

		$this->assertSame( array( $this->controller, 'handle_data_request' ), $handler['callback'] );
		$this->assertSame( array( $this->controller, 'check_data_permission' ), $handler['permission_callback'] );
	}

	public function test_data_route_validates_endpoint_and_version() {
		$args = rest_get_server()->get_routes()[ $this->data_route_key() ][0]['args'];

		$this->assertSame( array( $this->controller, 'validate_data_endpoint' ), $args['endpoint']['validate_callback'] );
		$this->assertSame( array( $this->controller, 'validate_version' ), $args['version']['validate_callback'] );
		$this->assertTrue( $args['version']['required'] );
	}

	public function test_data_route_carries_proxy_and_version_path_segments() {
		// The route is proxy/v<version>/<prefix>/<subpath>.
		$route = $this->data_route_key();
		$this->assertStringContainsString( 'proxy/v', $route );
		$this->assertStringContainsString( '(?P<version>', $route );
	}

	public function test_data_route_only_matches_allowed_prefixes() {
		// The route regex enumerates the allowed prefixes — a non-allowed prefix is absent.
		$route = $this->data_route_key();
		$this->assertStringContainsString( 'analytics', $route );
		$this->assertStringContainsString( 'stats', $route );
		$this->assertStringContainsString( 'commercial', $route );
		$this->assertStringNotContainsString( 'posts', $route );
		$this->assertStringNotContainsString( 'media', $route );
	}

	public function test_data_permission_dispatches_by_endpoint() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'jpa_viewer',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		$user    = new \WP_User( $user_id );
		$user->add_cap( 'view_stats' );
		wp_set_current_user( $user_id );

		// view_stats reaches the stats data but not WordAds.
		$this->assertTrue( $this->controller->check_data_permission( $this->build_data_request( 'GET', 'stats/top-posts' ) ) );
		$this->assertFalse( $this->controller->check_data_permission( $this->build_data_request( 'GET', 'wordads/earnings' ) ) );
		// WordPress routes case-insensitively — a mixed-case WordAds path must still hit the WordAds gate.
		$this->assertFalse( $this->controller->check_data_permission( $this->build_data_request( 'GET', 'WordAds/earnings' ) ) );
	}

	public function test_stats_permission_granted_for_view_stats_capability() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'jpa_viewer2',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		$user    = new \WP_User( $user_id );
		$user->add_cap( 'view_stats' );
		wp_set_current_user( $user_id );

		// view_stats reaches stats, but not the WordAds (activate_wordads) or analytics (manage_options) tiers.
		$this->assertTrue( $this->controller->check_data_permission( $this->build_data_request( 'GET', 'stats/top-posts' ) ) );
		$this->assertFalse( $this->controller->check_data_permission( $this->build_data_request( 'GET', 'wordads/earnings' ) ) );
		$this->assertFalse( $this->controller->check_data_permission( $this->build_data_request( 'GET', 'analytics/reports/totals' ) ) );
	}

	public function test_permissions_denied_for_anonymous_user() {
		wp_set_current_user( 0 );
		$this->assertFalse( $this->controller->check_data_permission( $this->build_data_request( 'GET', 'stats/top-posts' ) ) );
		$this->assertFalse( $this->controller->check_data_permission( $this->build_data_request( 'GET', 'wordads/earnings' ) ) );
	}

	/**
	 * @dataProvider data_data_paths
	 *
	 * @param string $endpoint The validated endpoint.
	 * @param string $expected The expected WPCOM path (with %d for the site id).
	 */
	#[DataProvider( 'data_data_paths' )]
	public function test_build_data_path( string $endpoint, string $expected ) {
		$accessor = function ( string $e ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call() below.
			return $this->build_data_path( $e );
		};

		$site_id = (int) \Jetpack_Options::get_option( 'id' );
		$this->assertSame( sprintf( $expected, $site_id ), $accessor->call( $this->controller, $endpoint ) );
	}

	/**
	 * @return array<string, string[]>
	 */
	public static function data_data_paths(): array {
		return array(
			'stats resource'  => array( 'stats/top-posts', '/sites/%d/stats/top-posts' ),
			'wordads'         => array( 'wordads/earnings', '/sites/%d/wordads/earnings' ),
			'utm commas'      => array( 'stats/utm/utm_campaign,utm_source', '/sites/%d/stats/utm/utm_campaign,utm_source' ),
			'purchases'       => array( 'upgrades', '/upgrades?site=%d' ),
			'purchases slash' => array( 'upgrades/', '/upgrades?site=%d' ),
		);
	}

	/**
	 * @dataProvider data_write_endpoints
	 *
	 * @param string $endpoint The endpoint to check.
	 * @param bool   $allowed  Whether a non-GET method is permitted.
	 */
	#[DataProvider( 'data_write_endpoints' )]
	public function test_is_write_allowed( string $endpoint, bool $allowed ) {
		$accessor = function ( string $e ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call() below.
			return $this->is_write_allowed( $e );
		};

		$this->assertSame( $allowed, $accessor->call( $this->controller, $endpoint ) );
	}

	/**
	 * @return array<string, array{0: string, 1: bool}>
	 */
	public static function data_write_endpoints(): array {
		return array(
			'dashboard modules'  => array( 'jetpack-stats-dashboard/modules', true ),
			'module settings'    => array( 'jetpack-stats-dashboard/module-settings', true ),
			'commercial class.'  => array( 'commercial-classification', true ),
			'spam new'           => array( 'stats/referrers/spam/new', true ),
			'spam delete'        => array( 'stats/referrers/spam/delete', true ),
			'mixed case write'   => array( 'JETPACK-STATS-DASHBOARD/modules', true ),
			'commercial subpath' => array( 'commercial-classification/foo', false ),
			'stats read'         => array( 'stats/top-posts', false ),
			'subscribers read'   => array( 'subscribers/counts', false ),
			'usage read'         => array( 'jetpack-stats/usage', false ),
			'wordads read'       => array( 'wordads/earnings', false ),
		);
	}

	public function test_write_to_read_only_endpoint_returns_405() {
		$response = $this->controller->handle_data_request( $this->build_data_request( 'POST', 'stats/top-posts' ) );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'rest_read_only', $response->get_error_code() );
		$this->assertSame( 405, $response->get_error_data()['status'] );
	}

	public function test_put_to_write_endpoint_returns_405() {
		// Only POST may mutate — PUT/PATCH on a write-allowed endpoint is still rejected locally.
		$response = $this->controller->handle_data_request( $this->build_data_request( 'PUT', 'jetpack-stats-dashboard/modules' ) );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'rest_read_only', $response->get_error_code() );
		$this->assertSame( 405, $response->get_error_data()['status'] );
	}

	public function test_post_to_write_endpoint_passes_the_method_gate() {
		// A POST to a write-allowed endpoint clears the gate and reaches the connection check.
		$response = $this->controller->handle_data_request( $this->build_data_request( 'POST', 'jetpack-stats-dashboard/modules' ) );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'no_connection', $response->get_error_code() );
	}

	public function test_forwarded_params_drop_control_and_site_params() {
		// `site` (path-scoping) and the `endpoint`/`version` control captures must never be
		// forwarded to WPCOM or folded into the cache key, even if passed as query params.
		$request  = $this->build_data_request(
			'GET',
			'upgrades',
			array(
				'site'     => '999',
				'endpoint' => 'me/settings',
				'version'  => '9',
				'period'   => 'year',
			)
		);
		$accessor = function ( WP_REST_Request $req ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call() below.
			return $this->get_forwarded_params( $req );
		};

		$forwarded = $accessor->call( $this->controller, $request );
		$this->assertArrayNotHasKey( 'site', $forwarded );
		$this->assertArrayNotHasKey( 'endpoint', $forwarded );
		$this->assertArrayNotHasKey( 'version', $forwarded );
		$this->assertArrayHasKey( 'period', $forwarded );
	}

	public function test_validate_data_endpoint_accepts_commas_and_rejects_traversal() {
		$this->assertTrue( $this->controller->validate_data_endpoint( 'stats/utm/utm_campaign,utm_source,utm_medium' ) );
		$this->assertTrue( $this->controller->validate_data_endpoint( 'stats/opens/emails/123/rate' ) );
		$this->assertTrue( $this->controller->validate_data_endpoint( 'analytics/reports/totals' ) );
		$this->assertFalse( $this->controller->validate_data_endpoint( 'stats/../../purchases' ) );
		$this->assertFalse( $this->controller->validate_data_endpoint( 'stats/a:b' ) );
	}

	public function test_validate_data_endpoint_re_enforces_the_prefix_allowlist() {
		// WP get_param() prefers a GET/JSON/POST `endpoint` over the URL capture, so a shadowed
		// value with a non-allowed prefix must be rejected even though the URL matched the route.
		$this->assertFalse( $this->controller->validate_data_endpoint( 'me/settings' ) );
		$this->assertFalse( $this->controller->validate_data_endpoint( 'posts' ) );
		$this->assertFalse( $this->controller->validate_data_endpoint( 'sites/123/users' ) );
	}

	public function test_validate_data_endpoint_rejects_upgrades_subpaths() {
		// `upgrades` is site-less and takes no sub-path; build_data_path only handles the exact form.
		$this->assertTrue( $this->controller->validate_data_endpoint( 'upgrades' ) );
		$this->assertFalse( $this->controller->validate_data_endpoint( 'upgrades/foo' ) );
	}

	/**
	 * Unsupported endpoints must not route at all — the request never reaches the handler and the
	 * blog token is never forwarded. Covers other resources, foreign namespaces, prefix-extension
	 * strings, and deep sub-paths under a non-allowed prefix.
	 *
	 * @dataProvider data_unsupported_paths
	 *
	 * @param string $path The endpoint path (after proxy/v2/).
	 */
	#[DataProvider( 'data_unsupported_paths' )]
	public function test_unsupported_endpoint_is_not_routed( string $path ) {
		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/jetpack-premium-analytics/v1/proxy/v2/' . $path )
		);

		$this->assertSame( 404, $response->get_status(), "$path must not route" );
	}

	/**
	 * @return array<string, string[]>
	 */
	public static function data_unsupported_paths(): array {
		return array(
			'other resource'        => array( 'posts' ),
			'core wp namespace'     => array( 'wp/v2/users' ),
			'me namespace'          => array( 'me/settings' ),
			'raw sites passthrough' => array( 'sites/1/options' ),
			'prefix extension'      => array( 'statsfoo' ),
			'analytics extension'   => array( 'analyticsx' ),
			'deep unsupported path' => array( 'posts/123/revisions/456' ),
		);
	}

	public function test_shadowed_unsupported_endpoint_is_rejected_on_dispatch() {
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'jpa_admin_shadow',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );

		// URL prefix is allowed (stats), but a shadowing ?endpoint= points outside the allowlist.
		// Even as an admin the request is rejected before anything is forwarded.
		foreach ( array( 'me/settings', 'posts/1', 'wp/v2/users/1/meta' ) as $shadow ) {
			$request = new WP_REST_Request( 'GET', '/jetpack-premium-analytics/v1/proxy/v1.1/stats' );
			$request->set_query_params( array( 'endpoint' => $shadow ) );
			$response = rest_get_server()->dispatch( $request );

			$this->assertGreaterThanOrEqual( 400, $response->get_status(), "shadow $shadow must be rejected" );
		}
	}

	public function test_permission_denies_unsupported_prefix_even_for_admin() {
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'jpa_admin_unsupported',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );

		// A prefix outside the config fails closed (config lookup misses) — admins included.
		$this->assertFalse( $this->controller->check_data_permission( $this->build_data_request( 'GET', 'posts' ) ) );
		$this->assertFalse( $this->controller->check_data_permission( $this->build_data_request( 'GET', 'wp/v2/users' ) ) );
	}

	/**
	 * @dataProvider data_version_bases
	 *
	 * @param string $version A version string.
	 * @param string $base    The expected WPCOM base.
	 */
	#[DataProvider( 'data_version_bases' )]
	public function test_base_for_version( string $version, string $base ) {
		$accessor = function ( string $v ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call() below.
			return $this->base_for_version( $v );
		};

		$this->assertSame( $base, $accessor->call( $this->controller, $version ) );
	}

	/**
	 * @return array<string, string[]>
	 */
	public static function data_version_bases(): array {
		return array(
			'v2'   => array( '2', 'wpcom' ),
			'v2.0' => array( '2.0', 'wpcom' ),
			'v1.1' => array( '1.1', 'rest' ),
			'v1.2' => array( '1.2', 'rest' ),
		);
	}

	/**
	 * Exhaustive behavior matrix: every WPCOM-proxy endpoint the controller exposes must still
	 * validate, resolve to the same capability tier + method policy + WPCOM path it did before the
	 * config refactor (and as the originating stats-admin controller forwarded it).
	 *
	 * @dataProvider data_endpoint_matrix
	 *
	 * @param string $endpoint   The endpoint sub-path (after proxy/v<version>/).
	 * @param string $capability The capability that gates it.
	 * @param bool   $writable   Whether a POST is permitted.
	 * @param string $wpcom_path The expected WPCOM path (with %d for the site id).
	 */
	#[DataProvider( 'data_endpoint_matrix' )]
	public function test_endpoint_behavior_matrix( string $endpoint, string $capability, bool $writable, string $wpcom_path ) {
		$site_id = (int) \Jetpack_Options::get_option( 'id' );

		$resolve = function ( string $e ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call().
			$cfg = $this->config_for( $e );
			return array(
				// @phan-suppress-next-line PhanUndeclaredMethod
				'valid'      => $this->validate_data_endpoint( $e ),
				'capability' => $cfg['capability'] ?? null,
				// @phan-suppress-next-line PhanUndeclaredMethod
				'writable'   => $this->is_write_allowed( $e ),
				// @phan-suppress-next-line PhanUndeclaredMethod
				'path'       => $this->build_data_path( $e ),
			);
		};
		$got     = $resolve->call( $this->controller, $endpoint );

		$this->assertTrue( $got['valid'], "$endpoint should validate" );
		$this->assertSame( $capability, $got['capability'], "$endpoint capability" );
		$this->assertSame( $writable, $got['writable'], "$endpoint writability" );
		$this->assertSame( sprintf( $wpcom_path, $site_id ), $got['path'], "$endpoint WPCOM path" );
	}

	/**
	 * Every WPCOM-proxy endpoint, with the capability / writability / path it forwarded as in
	 * stats-admin. Reads are GET-only (writable=false); the four mutations are POST.
	 *
	 * @return array<string, array{0: string, 1: string, 2: bool, 3: string}>
	 */
	public static function data_endpoint_matrix(): array {
		$stats   = 'view_stats';
		$wordads = 'activate_wordads';
		$admin   = 'manage_options';

		return array(
			// Analytics (manage_options).
			'analytics report'     => array( 'analytics/reports/totals', $admin, false, '/sites/%d/analytics/reports/totals' ),

			// Site stats + every /stats/* read family (v1.1, view_stats).
			'site stats'           => array( 'stats', $stats, false, '/sites/%d/stats' ),
			'stats resource'       => array( 'stats/top-posts', $stats, false, '/sites/%d/stats/top-posts' ),
			'stats file dl'        => array( 'stats/file-downloads', $stats, false, '/sites/%d/stats/file-downloads' ),
			'stats subscribers'    => array( 'stats/subscribers', $stats, false, '/sites/%d/stats/subscribers' ),
			'single post stats'    => array( 'stats/post/123', $stats, false, '/sites/%d/stats/post/123' ),
			'single video stats'   => array( 'stats/video/45', $stats, false, '/sites/%d/stats/video/45' ),
			'email summary'        => array( 'stats/emails/summary', $stats, false, '/sites/%d/stats/emails/summary' ),
			'email opens single'   => array( 'stats/opens/emails/12/rate', $stats, false, '/sites/%d/stats/opens/emails/12/rate' ),
			'email clicks single'  => array( 'stats/clicks/emails/12/link', $stats, false, '/sites/%d/stats/clicks/emails/12/link' ),
			'email time series'    => array( 'stats/opens/emails/12', $stats, false, '/sites/%d/stats/opens/emails/12' ),
			'utm series'           => array( 'stats/utm/utm_source,utm_medium', $stats, false, '/sites/%d/stats/utm/utm_source,utm_medium' ),
			'devices series'       => array( 'stats/devices/screensize', $stats, false, '/sites/%d/stats/devices/screensize' ),
			'location views'       => array( 'stats/location-views/country', $stats, false, '/sites/%d/stats/location-views/country' ),
			'referrer spam list'   => array( 'stats/referrers/spam', $stats, false, '/sites/%d/stats/referrers/spam' ),

			// Stats writes (POST, v1.1, view_stats).
			'referrer spam new'    => array( 'stats/referrers/spam/new', $stats, true, '/sites/%d/stats/referrers/spam/new' ),
			'referrer spam delete' => array( 'stats/referrers/spam/delete', $stats, true, '/sites/%d/stats/referrers/spam/delete' ),

			// v2 / wpcom endpoints (view_stats).
			'subscribers counts'   => array( 'subscribers/counts', $stats, false, '/sites/%d/subscribers/counts' ),
			'never published'      => array( 'site-has-never-published-post', $stats, false, '/sites/%d/site-has-never-published-post' ),
			'plan usage'           => array( 'jetpack-stats/usage', $stats, false, '/sites/%d/jetpack-stats/usage' ),
			'dashboard modules'    => array( 'jetpack-stats-dashboard/modules', $stats, true, '/sites/%d/jetpack-stats-dashboard/modules' ),
			'module settings'      => array( 'jetpack-stats-dashboard/module-settings', $stats, true, '/sites/%d/jetpack-stats-dashboard/module-settings' ),
			'commercial class.'    => array( 'commercial-classification', $stats, true, '/sites/%d/commercial-classification' ),

			// WordAds (activate_wordads).
			'wordads earnings'     => array( 'wordads/earnings', $wordads, false, '/sites/%d/wordads/earnings' ),
			'wordads stats'        => array( 'wordads/stats', $wordads, false, '/sites/%d/wordads/stats' ),

			// Purchases — site-less path (view_stats).
			'purchases'            => array( 'upgrades', $stats, false, '/upgrades?site=%d' ),
		);
	}

	/**
	 * @dataProvider data_versions
	 *
	 * @param string $version A version string.
	 * @param bool   $valid   Whether it should validate.
	 */
	#[DataProvider( 'data_versions' )]
	public function test_validate_version( string $version, bool $valid ) {
		$this->assertSame( $valid, $this->controller->validate_version( $version ) );
	}

	/**
	 * @return array<string, array{0: string, 1: bool}>
	 */
	public static function data_versions(): array {
		return array(
			'v2'        => array( '2', true ),
			'v1.1'      => array( '1.1', true ),
			'v1.2'      => array( '1.2', true ),
			'word'      => array( 'latest', false ),
			'injection' => array( '2;DROP', false ),
			'empty'     => array( '', false ),
		);
	}

	public function test_data_cache_key_varies_by_version() {
		$accessor = function ( string $path, string $version ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call() below.
			return $this->cache_key_for( $path, $version, '2' === $version ? 'wpcom' : 'rest', array() );
		};

		$v2  = $accessor->call( $this->controller, '/sites/0/stats/top-posts', '2' );
		$v11 = $accessor->call( $this->controller, '/sites/0/stats/top-posts', '1.1' );
		$this->assertNotSame( $v2, $v11 );
	}

	/**
	 * @dataProvider data_cache_bust_endpoints
	 *
	 * @param string $endpoint The endpoint.
	 * @param bool   $busts    Whether a successful write should invalidate the read cache.
	 */
	#[DataProvider( 'data_cache_bust_endpoints' )]
	public function test_busts_cache_decision_from_config( string $endpoint, bool $busts ) {
		$accessor = function ( string $e ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call().
			return $this->busts_cache( $e );
		};

		$this->assertSame( $busts, $accessor->call( $this->controller, $endpoint ) );
	}

	/**
	 * @return array<string, array{0: string, 1: bool}>
	 */
	public static function data_cache_bust_endpoints(): array {
		return array(
			'dashboard modules' => array( 'jetpack-stats-dashboard/modules', true ),
			'module settings'   => array( 'jetpack-stats-dashboard/module-settings', true ),
			'commercial class.' => array( 'commercial-classification', false ),
			'referrer spam new' => array( 'stats/referrers/spam/new', false ),
			'stats read'        => array( 'stats/top-posts', false ),
		);
	}

	public function test_register_transient_cleanup_prefix_covers_the_stored_transients() {
		$prefixes = $this->controller->register_transient_cleanup_prefix( array() );

		$this->assertContains( 'jetpack-premium-analytics_proxy_', $prefixes );

		// The registered prefix must genuinely prefix the keys the controller writes, so the stats
		// cron's LIKE match reaches them — guards against it drifting from CACHE_PREFIX.
		$real_key = $this->cache_key( $this->build_data_request( 'GET', 'analytics/reports/totals' ) );
		$this->assertStringStartsWith( 'jetpack-premium-analytics_proxy_', $real_key );
	}

	public function test_register_transient_cleanup_prefix_preserves_existing_and_passes_non_array_through() {
		$this->assertSame(
			array( 'other_prefix_', 'jetpack-premium-analytics_proxy_' ),
			$this->controller->register_transient_cleanup_prefix( array( 'other_prefix_' ) )
		);

		// A non-array (from a misbehaving upstream filter) is returned untouched, so the stats
		// consumer's own fall-back-to-defaults normalization runs instead of being masked.
		$this->assertSame(
			'not-an-array',
			$this->controller->register_transient_cleanup_prefix( 'not-an-array' )
		);
	}

	public function test_register_hooks_the_proxy_prefix_onto_the_stats_cleanup_filter() {
		remove_all_filters( 'jetpack_stats_transient_cleanup_prefixes' );

		Api_Proxy_Controller::register();
		$prefixes = apply_filters( 'jetpack_stats_transient_cleanup_prefixes', array() );

		$this->assertContains( 'jetpack-premium-analytics_proxy_', $prefixes );

		remove_all_filters( 'jetpack_stats_transient_cleanup_prefixes' );
	}

	public function test_successful_write_busts_matching_read_cache() {
		// A no-param GET to this dashboard read caches under this key; a 200 POST to it clears it.
		$endpoint = 'jetpack-stats-dashboard/modules';
		$read_key = $this->read_cache_key( $endpoint, '2' );
		set_transient( $read_key, array( 'data' => 'stale' ), MINUTE_IN_SECONDS );

		$this->invoke_bust( $endpoint, '2', true, true, 200 );

		$this->assertFalse( get_transient( $read_key ), 'a 200 write to a bust endpoint clears its read cache' );
	}

	/**
	 * @dataProvider data_non_busting_cases
	 *
	 * @param bool $is_write      Whether the request was a write.
	 * @param bool $bust_on_write Whether the prefix opted into cache-busting.
	 * @param int  $status        The WPCOM response status.
	 */
	#[DataProvider( 'data_non_busting_cases' )]
	public function test_read_cache_survives_when_bust_conditions_are_not_met( bool $is_write, bool $bust_on_write, int $status ) {
		$endpoint = 'jetpack-stats-dashboard/modules';
		$read_key = $this->read_cache_key( $endpoint, '2' );
		set_transient( $read_key, array( 'data' => 'keep' ), MINUTE_IN_SECONDS );

		$this->invoke_bust( $endpoint, '2', $is_write, $bust_on_write, $status );

		$this->assertNotFalse( get_transient( $read_key ) );
	}

	/**
	 * @return array<string, array{0: bool, 1: bool, 2: int}>
	 */
	public static function data_non_busting_cases(): array {
		return array(
			'read request'        => array( false, true, 200 ),
			'non-200 write'       => array( true, true, 500 ),
			'prefix not opted in' => array( true, false, 200 ),
		);
	}

	public function test_bust_is_scoped_to_the_written_path_and_version() {
		// An unrelated path, and the same path at a different version, must survive a bust.
		$other_path    = $this->read_cache_key( 'stats/top-posts', '1.1' );
		$other_version = $this->read_cache_key( 'jetpack-stats-dashboard/modules', '1.1' );
		set_transient( $other_path, array( 'data' => 'keep' ), MINUTE_IN_SECONDS );
		set_transient( $other_version, array( 'data' => 'keep' ), MINUTE_IN_SECONDS );

		$this->invoke_bust( 'jetpack-stats-dashboard/modules', '2', true, true, 200 );

		$this->assertNotFalse( get_transient( $other_path ), 'an unrelated path must not be busted' );
		$this->assertNotFalse( get_transient( $other_version ), 'a different version of the same path must not be busted' );
	}

	/**
	 * Invoke the (connection-free) cache-bust decision with a synthetic response.
	 *
	 * @param string $endpoint      The endpoint.
	 * @param string $version       The WPCOM API version.
	 * @param bool   $is_write      Whether the request was a write.
	 * @param bool   $bust_on_write Whether the prefix opted into cache-busting.
	 * @param int    $status        The WPCOM response status.
	 *
	 * @return void
	 */
	private function invoke_bust( string $endpoint, string $version, bool $is_write, bool $bust_on_write, int $status ): void {
		$accessor = function ( string $e, string $v, bool $w, bool $b, int $s ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call().
			$path = $this->build_data_path( $e );
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call().
			$this->maybe_bust_read_cache(
				array( 'response' => array( 'code' => $s ) ),
				$w,
				array( 'bust_on_write' => $b ),
				$path,
				$v,
				'2' === $v ? 'wpcom' : 'rest'
			);
		};

		$accessor->call( $this->controller, $endpoint, $version, $is_write, $bust_on_write, $status );
	}

	/**
	 * The param-less read cache key for an endpoint at a given version (what a no-param GET caches
	 * under, and what a successful write to it busts).
	 *
	 * @param string $endpoint The endpoint.
	 * @param string $version  The WPCOM API version.
	 *
	 * @return string
	 */
	private function read_cache_key( string $endpoint, string $version ): string {
		$accessor = function ( string $e, string $v ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call().
			return $this->cache_key_for( $this->build_data_path( $e ), $v, '2' === $v ? 'wpcom' : 'rest', array() );
		};

		return $accessor->call( $this->controller, $endpoint, $version );
	}

	/**
	 * Build an analytics GET request on the data route (analytics is the `analytics` prefix, v2).
	 *
	 * @param string $endpoint The analytics sub-path (without the `analytics/` prefix).
	 * @param array  $params   Forwarded query params.
	 *
	 * @return WP_REST_Request
	 */
	private function build_request( string $endpoint, array $params = array() ): WP_REST_Request {
		return $this->build_data_request( 'GET', 'analytics/' . $endpoint, $params, '2' );
	}

	/**
	 * Build a data proxy request with the endpoint capture set.
	 *
	 * @param string      $method   HTTP method.
	 * @param string      $endpoint The data endpoint to proxy.
	 * @param array       $params   Forwarded query params.
	 * @param string|null $version  WPCOM API version param, if any.
	 *
	 * @return WP_REST_Request
	 */
	private function build_data_request( string $method, string $endpoint, array $params = array(), ?string $version = null ): WP_REST_Request {
		$version = $version ?? '2';
		$request = new WP_REST_Request( $method, '/jetpack-premium-analytics/v1/proxy/v' . $version . '/' . $endpoint );
		// `endpoint` and `version` are both route (URL) captures in production.
		$request->set_url_params(
			array(
				'endpoint' => $endpoint,
				'version'  => $version,
			)
		);
		$request->set_query_params( $params );

		return $request;
	}

	/**
	 * The registered route key of the agnostic data proxy.
	 *
	 * @return string
	 */
	private function data_route_key(): string {
		// Identify the route by its stable structural markers (the proxy/v<version>/ shape and the
		// endpoint capture), not by any one prefix — so it survives changes to the allowlist.
		foreach ( array_keys( rest_get_server()->get_routes() ) as $key ) {
			if ( str_contains( $key, '/proxy/v' ) && str_contains( $key, '(?P<endpoint>' ) ) {
				return $key;
			}
		}

		return '';
	}

	/**
	 * Compute the controller's transient cache key for an analytics request (v2 / wpcom).
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return string
	 */
	private function cache_key( WP_REST_Request $request ): string {
		$accessor = function ( WP_REST_Request $req ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call() below.
			$path = $this->build_data_path( (string) $req->get_param( 'endpoint' ) );
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call() below.
			return $this->cache_key_for( $path, '2', 'wpcom', $this->get_forwarded_params( $req ) );
		};

		return $accessor->call( $this->controller, $request );
	}

	/**
	 * Invoke the controller's private cache_and_build_response().
	 *
	 * @param array       $http_response Raw HTTP response array.
	 * @param string|null $cache_key     Transient key, or null to skip caching.
	 *
	 * @return WP_REST_Response|\WP_Error
	 */
	private function cache_and_build_response( array $http_response, ?string $cache_key ) {
		$accessor = function ( array $resp, ?string $key ) {
			return $this->cache_and_build_response( $resp, $key );
		};

		return $accessor->call( $this->controller, $http_response, $cache_key );
	}
}
