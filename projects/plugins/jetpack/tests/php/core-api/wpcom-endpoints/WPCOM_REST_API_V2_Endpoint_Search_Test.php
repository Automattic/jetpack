<?php
/**
 * Tests for the /wpcom/v2/search endpoint wrapper.
 *
 * Focused on the deferral introduced in JETPACK-1747: the Search package
 * REST_Controller is now instantiated inside register_routes() on rest_api_init
 * rather than in the constructor. The contract worth locking down is that the
 * route is absent until rest_api_init fires and then registers with the expected
 * method, permission callback, and controller binding.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Search_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_Search
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_Search::class )]
class WPCOM_REST_API_V2_Endpoint_Search_Test extends Jetpack_REST_TestCase {

	const ROUTE = '/wpcom/v2/search';

	/**
	 * Swap in a fresh spy REST server without firing rest_api_init, so the route
	 * table reflects only what has registered so far. The endpoint object is
	 * constructed once at plugins_loaded (test bootstrap) and stays hooked on
	 * rest_api_init.
	 *
	 * @return JPTest_Spy_REST_Server The fresh server.
	 */
	private function fresh_server() {
		global $wp_rest_server;
		$wp_rest_server = new JPTest_Spy_REST_Server();
		$this->server   = $wp_rest_server;

		return $wp_rest_server;
	}

	/**
	 * Normalize a route handler's `methods` (assoc array or comma string,
	 * depending on WP version) to a list of HTTP methods.
	 *
	 * @param array $handler A single route handler config.
	 * @return string[] The HTTP methods the handler responds to.
	 */
	private function route_methods( array $handler ) {
		$methods = $handler['methods'];

		return is_array( $methods )
			? array_keys( array_filter( $methods ) )
			: array_map( 'trim', explode( ',', (string) $methods ) );
	}

	public function test_search_route_is_deferred_to_rest_api_init() {
		$server = $this->fresh_server();

		$this->assertArrayNotHasKey(
			self::ROUTE,
			$server->get_routes(),
			'The search route must not register before rest_api_init fires (the deferral).'
		);

		do_action( 'rest_api_init' );

		$routes = $server->get_routes();
		$this->assertArrayHasKey(
			self::ROUTE,
			$routes,
			'The search route must register once rest_api_init fires.'
		);

		$handler = $routes[ self::ROUTE ][0];
		$this->assertContains(
			'GET',
			$this->route_methods( $handler ),
			'The search route must respond to GET (WP_REST_Server::READABLE).'
		);
		$this->assertSame(
			'is_user_logged_in',
			$handler['permission_callback'],
			'The search route must keep its is_user_logged_in permission callback.'
		);
		$this->assertIsArray(
			$handler['callback'],
			'The search route callback must be bound to a controller instance.'
		);
		$this->assertSame(
			'get_search_results',
			$handler['callback'][1],
			'The search route must be bound to REST_Controller::get_search_results.'
		);
	}

	public function test_controller_is_not_instantiated_until_route_registration() {
		/*
		 * The load-bearing assertion for the JETPACK-1747 deferral: the Search
		 * package REST_Controller is built in register_routes() (on rest_api_init),
		 * not in the constructor. A fresh endpoint must therefore have a null
		 * controller after construction and a REST_Controller only after
		 * register_routes() runs. Were the instantiation moved back into the
		 * constructor (the pre-deferral behavior, which loaded the package class on
		 * every request), the first assertion would fail — this is the regression
		 * guard the route-registration test above cannot provide, since the route
		 * was always registered on rest_api_init.
		 */
		$endpoint = new WPCOM_REST_API_V2_Endpoint_Search();

		$controller = new ReflectionProperty( $endpoint, 'controller' );

		/*
		 * setAccessible() is required to read a protected property on PHP < 8.1,
		 * but is a no-op on 8.1+ and emits a deprecation on 8.5+ (which the suite
		 * treats as a risky-test failure), so only call it where it is needed.
		 */
		if ( PHP_VERSION_ID < 80100 ) {
			$controller->setAccessible( true );
		}

		$this->assertNull(
			$controller->getValue( $endpoint ),
			'The constructor must not instantiate the Search REST_Controller (the deferral).'
		);

		// Register against a throwaway server so this test does not leak a
		// /wpcom/v2/search route onto whatever global server is current.
		$this->fresh_server();
		$endpoint->register_routes();

		$this->assertInstanceOf(
			\Automattic\Jetpack\Search\REST_Controller::class,
			$controller->getValue( $endpoint ),
			'register_routes() must instantiate the Search REST_Controller on rest_api_init.'
		);

		// The fresh endpoint hooked its own register_routes() on construction; drop
		// it so it does not re-register on a later test's rest_api_init.
		remove_action( 'rest_api_init', array( $endpoint, 'register_routes' ) );
	}
}
