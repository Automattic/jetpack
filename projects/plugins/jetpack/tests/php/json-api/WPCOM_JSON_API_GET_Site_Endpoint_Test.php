<?php
/**
 * WPCOM_JSON_API_GET_Site_Endpoint REST-vs-XML-RPC parity tests.
 *
 * Run this test with command: jetpack docker phpunit jetpack -- --filter=WPCOM_JSON_API_GET_Site_Endpoint_Test
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';
// Registers every endpoint version so the get-site endpoint resolves.
require_once JETPACK__PLUGIN_DIR . 'json-endpoints.php';
require_once __DIR__ . '/trait-assert-rest-xmlrpc-parity.php';

/**
 * Tests for the /sites/%s get-site endpoint.
 *
 * @covers \WPCOM_JSON_API_GET_Site_Endpoint
 */
#[CoversClass( WPCOM_JSON_API_GET_Site_Endpoint::class )]
class WPCOM_JSON_API_GET_Site_Endpoint_Test extends WP_UnitTestCase {
	use WP_UnitTestCase_Fix;
	use Assert_Rest_Xmlrpc_Parity;

	/**
	 * Prepare the environment for each test.
	 */
	public function set_up() {
		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );
		}

		parent::set_up();

		$_SERVER['REQUEST_METHOD'] = 'GET';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		$this->tear_down_rest_parity();
		parent::tear_down();
		WPCOM_JSON_API::init()->query = array();
	}

	/**
	 * The SAL `after_render()` adds `updates` for admins -- past the `fields` filter, and only when
	 * `options` is in the response (is_main_site() reads it). XML-RPC's output() trims it via
	 * filter_fields(); before rest_callback() did the same, it leaked on the REST transport only.
	 * A distinct trigger from the posts force-add: the extra key comes from after_render(), not the
	 * endpoint's own render loop.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_rest_xmlrpc_parity_fields_trims_after_render_updates() {
		// Precondition: with `updates` (and `options`, which is_main_site() requires) in `fields`,
		// our admin sees it -- confirming this environment actually surfaces the key to be trimmed.
		list( , $with_updates ) = $this->assert_rest_parity(
			$this->get_endpoint(),
			array( 'fields' => 'ID,options,updates' )
		);
		if ( ! array_key_exists( 'updates', $with_updates ) ) {
			$this->markTestSkipped( 'Environment did not surface get-site `updates`; nothing to assert.' );
		}

		// The fix: with `updates` NOT requested (but `options` present so after_render still adds it),
		// both transports must trim it.
		list( $xmlrpc, $rest ) = $this->assert_rest_parity(
			$this->get_endpoint(),
			array( 'fields' => 'ID,options' )
		);

		$this->assertArrayHasKey( 'ID', $rest );
		$this->assertArrayNotHasKey( 'updates', $rest, 'rest_callback() must trim after_render-added `updates` not in `fields`.' );
		$this->assertArrayNotHasKey( 'updates', $xmlrpc );
		// assert_rest_parity() already asserts the bodies match; this pins the regression.
		$this->assertSame( array_keys( $xmlrpc ), array_keys( $rest ) );
	}

	/**
	 * Retrieve the registered v1.1 get-site endpoint.
	 *
	 * @return WPCOM_JSON_API_GET_Site_Endpoint
	 *
	 * @phan-suppress PhanTypeArraySuspicious
	 */
	private function get_endpoint() {
		$api = WPCOM_JSON_API::init();
		foreach ( $api->endpoints as $endpoints_by_method ) {
			$endpoint = $endpoints_by_method['GET'] ?? null;
			// Pick the get-site endpoint (base or v1.2 subclass) that is actually REST-enabled,
			// rather than matching a specific version -- robust to registration order/state.
			if (
				$endpoint instanceof WPCOM_JSON_API_GET_Site_Endpoint
				&& '/sites/%s' === $endpoint->path
				&& ! empty( $endpoint->rest_route )
			) {
				return $endpoint;
			}
		}
		$this->markTestSkipped( 'No REST-enabled get-site endpoint (/sites/%s) is registered in this run.' );
	}
}
