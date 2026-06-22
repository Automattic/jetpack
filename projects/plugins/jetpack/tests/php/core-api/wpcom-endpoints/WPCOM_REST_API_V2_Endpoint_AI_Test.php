<?php
/**
 * Tests for /wpcom/v2/jetpack-ai endpoints.
 *
 * Focused on the deferral introduced in JETPACK-1747: route registration (and
 * the Jetpack_AI_Helper gate checks) moved out of the constructor into
 * maybe_register_routes() on rest_api_init. These tests lock in that the routes
 * still register on rest_api_init and that the feature gate is evaluated at
 * that point — so a `jetpack_ai_enabled` filter added before rest_api_init
 * reaches route registration.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_AI_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_AI
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_AI::class )]
class WPCOM_REST_API_V2_Endpoint_AI_Test extends Jetpack_REST_TestCase {

	const BASIC_ROUTE = '/wpcom/v2/jetpack-ai/ai-assistant-feature';
	const GATED_ROUTE = '/wpcom/v2/jetpack-ai/completions';

	/**
	 * Reset the environment to its original state after the test.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_ai_enabled' );

		parent::tear_down();
	}

	/**
	 * Replace the global REST server with a fresh spy so a test can observe the
	 * route table both before and after rest_api_init fires.
	 *
	 * @return WP_REST_Server The fresh server, also assigned to $this->server.
	 */
	private function reset_rest_server() {
		global $wp_rest_server;
		$wp_rest_server = new JPTest_Spy_REST_Server();
		$this->server   = $wp_rest_server;

		return $wp_rest_server;
	}

	public function test_basic_route_registers_only_after_rest_api_init() {
		$server = $this->reset_rest_server();

		// Deferred: the constructor no longer registers routes, so the route is
		// absent until rest_api_init fires maybe_register_routes().
		$this->assertArrayNotHasKey(
			self::BASIC_ROUTE,
			$server->get_routes(),
			'The jetpack-ai route must not register before rest_api_init fires.'
		);

		do_action( 'rest_api_init' );

		$this->assertArrayHasKey(
			self::BASIC_ROUTE,
			$server->get_routes(),
			'The ungated jetpack-ai route must register on rest_api_init.'
		);
	}

	public function test_gated_routes_stay_unregistered_when_ai_disabled() {
		$server = $this->reset_rest_server();

		// No `jetpack_ai_enabled` filter and not on WPCOM/WoA, so Jetpack AI is
		// disabled: the gated routes must not register, but the basic one still does.
		do_action( 'rest_api_init' );

		$routes = $server->get_routes();
		$this->assertArrayHasKey( self::BASIC_ROUTE, $routes, 'The ungated route registers regardless of the AI gate.' );
		$this->assertArrayNotHasKey(
			self::GATED_ROUTE,
			$routes,
			'AI-gated routes must not register when Jetpack AI is disabled.'
		);
	}

	public function test_jetpack_ai_enabled_filter_added_before_rest_api_init_registers_gated_routes() {
		$server = $this->reset_rest_server();

		/*
		 * The gate (Jetpack_AI_Helper::is_enabled()) is now evaluated inside the
		 * rest_api_init callback rather than in the constructor, so a filter
		 * added before rest_api_init fires reaches route registration. This is
		 * the behavior contract for the deferral.
		 */
		add_filter( 'jetpack_ai_enabled', '__return_true' );

		do_action( 'rest_api_init' );

		$this->assertArrayHasKey(
			self::GATED_ROUTE,
			$server->get_routes(),
			'AI-gated routes must register when jetpack_ai_enabled is filtered true before rest_api_init.'
		);
	}
}
