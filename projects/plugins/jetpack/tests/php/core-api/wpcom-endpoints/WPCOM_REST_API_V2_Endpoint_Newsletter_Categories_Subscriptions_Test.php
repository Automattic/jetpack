<?php
/**
 * Tests for the /wpcom/v2/newsletter-categories/subscriptions/{id} proxy endpoint.
 *
 * @covers WPCOM_REST_API_V2_Endpoint_Newsletter_Categories_Subscriptions
 */

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Newsletter_Categories_Subscriptions_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_Newsletter_Categories_Subscriptions
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_Newsletter_Categories_Subscriptions::class )]
class WPCOM_REST_API_V2_Endpoint_Newsletter_Categories_Subscriptions_Test extends Jetpack_REST_TestCase {

	/**
	 * Mock admin user ID.
	 *
	 * @var int
	 */
	private static $admin_id = 0;

	/**
	 * Mock author user ID.
	 *
	 * @var int
	 */
	private static $author_id = 0;

	/**
	 * The route under test, with a stand-in id.
	 *
	 * @var string
	 */
	private const ROUTE = '/wpcom/v2/newsletter-categories/subscriptions/229907063';

	/**
	 * Create shared database fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$admin_id  = $factory->user->create( array( 'role' => 'administrator' ) );
		static::$author_id = $factory->user->create( array( 'role' => 'author' ) );
	}

	/**
	 * Set up the environment for a test.
	 */
	public function set_up() {
		wp_set_current_user( static::$admin_id );

		// Manually load the class under test — `wpcom_rest_api_v2_load_plugin()` only runs on
		// `plugins_loaded`, which has already passed by the time the test harness boots.
		// @phan-suppress-next-line PhanNoopNew -- instantiated for the constructor's add_action side effect.
		new WPCOM_REST_API_V2_Endpoint_Newsletter_Categories_Subscriptions();

		parent::set_up();
	}

	/**
	 * Reset the environment to its original state after the test.
	 */
	public function tear_down() {
		Constants::clear_constants();

		parent::tear_down();
	}

	/**
	 * The route is registered on Jetpack-connected sites, where WP.com's own implementation is
	 * out of reach.
	 */
	public function test_route_is_registered() {
		$routes = $this->server->get_routes( 'wpcom/v2' );

		$this->assertArrayHasKey(
			'/wpcom/v2/newsletter-categories/subscriptions/(?P<subscription_id>[0-9]+)',
			$routes
		);
	}

	/**
	 * On WP.com Simple, WP.com registers this exact route itself — registering a proxy there would
	 * shadow the real implementation, so the class stands down.
	 */
	public function test_route_is_not_registered_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		$GLOBALS['wp_rest_server'] = new JPTest_Spy_REST_Server();
		// @phan-suppress-next-line PhanNoopNew -- instantiated for the constructor's add_action side effect.
		new WPCOM_REST_API_V2_Endpoint_Newsletter_Categories_Subscriptions();
		do_action( 'rest_api_init' );
		$this->server = $GLOBALS['wp_rest_server'];

		$this->assertArrayNotHasKey(
			'/wpcom/v2/newsletter-categories/subscriptions/(?P<subscription_id>[0-9]+)',
			$this->server->get_routes( 'wpcom/v2' )
		);
	}

	/**
	 * Anonymous requests are rejected before any proxying happens.
	 */
	public function test_rejects_anonymous() {
		wp_set_current_user( 0 );

		$response = $this->server->dispatch( new WP_REST_Request( Requests::GET, self::ROUTE ) );

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * A subscriber's categories are site management data, so contributors and authors can't read
	 * them either.
	 */
	public function test_rejects_non_admin() {
		wp_set_current_user( static::$author_id );

		$response = $this->server->dispatch( new WP_REST_Request( Requests::GET, self::ROUTE ) );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * The id is part of the path, so a non-numeric one simply doesn't match the route.
	 */
	public function test_non_numeric_id_does_not_match_the_route() {
		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/newsletter-categories/subscriptions/abc' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'rest_no_route', $response->get_data()['code'] );
	}

	/**
	 * `type` only accepts `wpcom` — WP.com uses it to decide whether the path id is a user id or a
	 * subscription id, and any other value would silently change which record is read.
	 */
	public function test_rejects_unknown_type() {
		$request = new WP_REST_Request( Requests::GET, self::ROUTE );
		$request->set_param( 'type', 'email' );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
	}
}
