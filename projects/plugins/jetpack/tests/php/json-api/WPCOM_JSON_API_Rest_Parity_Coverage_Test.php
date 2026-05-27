<?php
/**
 * Auto-discovered REST-vs-XML-RPC parity coverage.
 *
 * Asserts that every registered GET endpoint which exposes a rest_route -- and whose only
 * path placeholder is the site -- returns the same body via REST and XML-RPC for a default
 * request. New conversions are covered the moment they add a rest_route; nothing per-endpoint
 * to write here. Endpoints that need specific inputs, URL placeholders (post id / slug), or
 * fixtures get their own bespoke parity case next to that endpoint's existing tests.
 *
 * Run this test with command: jetpack docker phpunit jetpack -- --filter=WPCOM_JSON_API_Rest_Parity_Coverage_Test
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';
require_once JETPACK__PLUGIN_DIR . 'json-endpoints.php';
require_once __DIR__ . '/trait-assert-rest-xmlrpc-parity.php';

/**
 * Parity coverage across all REST-enabled simple GET endpoints.
 *
 * @covers \WPCOM_JSON_API_Endpoint::rest_callback
 */
#[CoversMethod( WPCOM_JSON_API_Endpoint::class, 'rest_callback' )]
class WPCOM_JSON_API_Rest_Parity_Coverage_Test extends WP_UnitTestCase {
	use WP_UnitTestCase_Fix;
	use Assert_Rest_Xmlrpc_Parity;

	/**
	 * Per-test setup.
	 *
	 * Endpoints build links via WPCOM_JSON_API__BASE (sal/class.json-api-links.php); define it as
	 * the sibling endpoint tests do so the sweep is runnable in isolation, not just when another
	 * test in the run has already defined the constant.
	 */
	public function set_up() {
		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );
		}

		parent::set_up();
	}

	/**
	 * Per-test cleanup.
	 */
	public function tear_down() {
		$this->tear_down_rest_parity();
		parent::tear_down();
	}

	/**
	 * Every REST-enabled GET endpoint whose only path placeholder is the site returns the
	 * same body on both transports for a default request.
	 *
	 * @group json-api
	 *
	 * @phan-suppress PhanTypeArraySuspicious -- $api->endpoints is a map of method => endpoint.
	 */
	#[Group( 'json-api' )]
	public function test_simple_get_endpoints_have_rest_xmlrpc_parity() {
		$checked = array();

		foreach ( WPCOM_JSON_API::init()->endpoints as $endpoints_by_method ) {
			$endpoint = $endpoints_by_method['GET'] ?? null;

			if ( ! $endpoint instanceof WPCOM_JSON_API_Endpoint || empty( $endpoint->rest_route ) ) {
				continue;
			}

			// Only the site placeholder: anything with a post id / slug needs a fixture-backed
			// bespoke test, so it is out of scope for this generic default-request sweep.
			if ( substr_count( (string) $endpoint->path, '%' ) !== 1 ) {
				continue;
			}

			$this->assert_rest_parity( $endpoint );
			$checked[] = $endpoint->path . ' (v' . $endpoint->max_version . ')';
		}

		$this->assertNotEmpty(
			$checked,
			'Expected at least one REST-enabled simple GET endpoint to be discovered and checked.'
		);
	}
}
