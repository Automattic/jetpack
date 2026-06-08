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
use PHPUnit\Framework\Attributes\DataProvider;
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
	 * Define WPCOM_JSON_API__BASE (endpoints build links from it) so the sweep runs in isolation.
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
	 * One data set per REST-enabled simple GET endpoint. Captures the endpoint object itself --
	 * the shared registry can be overwritten by other tests, so re-resolving by path later is unsafe.
	 *
	 * @return array
	 *
	 * @phan-suppress PhanTypeArraySuspicious -- $api->endpoints is a map of method => endpoint.
	 */
	public static function simple_get_endpoints_provider(): array {
		$cases = array();

		foreach ( WPCOM_JSON_API::init()->endpoints as $endpoints_by_method ) {
			$endpoint = $endpoints_by_method['GET'] ?? null;

			if ( ! $endpoint instanceof WPCOM_JSON_API_Endpoint || empty( $endpoint->rest_route ) ) {
				continue;
			}

			// Only the site placeholder; a post id / slug needs a fixture-backed bespoke test.
			if ( substr_count( (string) $endpoint->path, '%' ) !== 1 ) {
				continue;
			}

			$cases[ $endpoint->path . ' (v' . $endpoint->max_version . ')' ] = array( $endpoint );
		}

		return $cases;
	}

	/**
	 * Each endpoint returns the same body on both transports for a default request.
	 *
	 * @dataProvider simple_get_endpoints_provider
	 * @group json-api
	 *
	 * @param WPCOM_JSON_API_Endpoint $endpoint The discovered endpoint.
	 */
	#[DataProvider( 'simple_get_endpoints_provider' )]
	#[Group( 'json-api' )]
	public function test_endpoint_has_rest_xmlrpc_parity( WPCOM_JSON_API_Endpoint $endpoint ) {
		$this->assert_rest_parity( $endpoint );
	}

	/**
	 * Each endpoint also matches across transports for a `fields`-scoped request. This guards the
	 * rest_callback()->filter_fields() fix generically: any key that reaches the body past the
	 * caller's `fields` must be trimmed on REST exactly as output()/filter_fields() trims it on
	 * XML-RPC. (Endpoints needing fixtures or specific `fields` to surface such a key get their own
	 * bespoke case -- e.g. get-site `updates`, posts `type`/`password` -- next to that endpoint.)
	 *
	 * @dataProvider simple_get_endpoints_provider
	 * @group json-api
	 *
	 * @param WPCOM_JSON_API_Endpoint $endpoint The discovered endpoint.
	 */
	#[DataProvider( 'simple_get_endpoints_provider' )]
	#[Group( 'json-api' )]
	public function test_endpoint_fields_parity( WPCOM_JSON_API_Endpoint $endpoint ) {
		$this->assert_rest_parity( $endpoint, array( 'fields' => 'ID' ) );
	}

	/**
	 * Fail if discovery finds nothing -- an empty provider would mark the parity test risky.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_sweep_discovers_endpoints() {
		$this->assertNotEmpty(
			self::simple_get_endpoints_provider(),
			'Expected at least one REST-enabled simple GET endpoint to be discovered.'
		);
	}
}
