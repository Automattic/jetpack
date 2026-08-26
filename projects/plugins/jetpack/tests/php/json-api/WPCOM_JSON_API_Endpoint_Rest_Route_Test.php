<?php
/**
 * Unit tests for path-parameter REST route building on WPCOM_JSON_API_Endpoint.
 *
 * Run this test with command: jetpack docker phpunit jetpack -- --filter=WPCOM_JSON_API_Endpoint_Rest_Route_Test
 *
 * @package automattic/jetpack
 *
 * @phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */

use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Tests build_rest_route_regex() (route registration on the remote) and build_concrete_rest_route()
 * (route the proxy sends per request). Together they let path-parameter endpoints ride the REST
 * transport, which only ever carried a static route before.
 *
 * @covers \WPCOM_JSON_API_Endpoint
 * @covers \WPCOM_JSON_API_Endpoint::build_concrete_rest_route
 * @covers \WPCOM_JSON_API_Endpoint::build_rest_route_regex
 */
#[CoversClass( WPCOM_JSON_API_Endpoint::class )]
#[CoversMethod( WPCOM_JSON_API_Endpoint::class, 'build_rest_route_regex' )]
#[CoversMethod( WPCOM_JSON_API_Endpoint::class, 'build_concrete_rest_route' )]
class WPCOM_JSON_API_Endpoint_Rest_Route_Test extends WP_UnitTestCase {
	use WP_UnitTestCase_Fix;

	/**
	 * Build a minimal endpoint with the route-shaping properties set. rest_route is assigned after
	 * construction so the constructor does not register the route as a side effect.
	 *
	 * @param string $rest_route  The endpoint rest_route (may contain %d/%s tokens).
	 * @param string $path        The endpoint path template.
	 * @param string $max_version The endpoint max version.
	 * @return WPCOM_JSON_API_Endpoint
	 */
	private function make_endpoint( $rest_route, $path = '', $max_version = '1.1' ) {
		$endpoint             = new WPCOM_JSON_API_Rest_Route_Test_Endpoint(
			array(
				'stat'        => 'test',
				'path'        => $path,
				'max_version' => $max_version,
			)
		);
		$endpoint->rest_route = $rest_route;
		return $endpoint;
	}

	/**
	 * Path tokens (%d/%s) become ordered named captures via build_rest_route_regex(); static routes are unchanged.
	 *
	 * @dataProvider provide_regex_cases
	 *
	 * @param string $rest_route Endpoint rest_route.
	 * @param string $expected   Expected registration route.
	 * @group json-api
	 */
	#[DataProvider( 'provide_regex_cases' )]
	#[Group( 'json-api' )]
	public function test_build_rest_route_regex( $rest_route, $expected ) {
		$this->assertSame( $expected, $this->make_endpoint( $rest_route )->build_rest_route_regex() );
	}

	/**
	 * Data provider for build_rest_route_regex().
	 *
	 * @return array<string, array{string, string}>
	 */
	public static function provide_regex_cases() {
		return array(
			'static (no token)'  => array( '/posts', 'v1.1/posts' ),
			'by id'              => array( '/posts/%d', 'v1.1/posts/(?P<p1>\d+)' ),
			'by slug (prefix)'   => array( '/posts/slug:%s', 'v1.1/posts/slug:(?P<p1>[^/]+)' ),
			'token then literal' => array( '/posts/%d/autosave', 'v1.1/posts/(?P<p1>\d+)/autosave' ),
			'multiple tokens'    => array( '/taxonomies/%s/terms/slug:%s', 'v1.1/taxonomies/(?P<p1>[^/]+)/terms/slug:(?P<p2>[^/]+)' ),
		);
	}

	/**
	 * The real request path is reflowed into the route via build_concrete_rest_route(); static routes are unchanged.
	 *
	 * @dataProvider provide_concrete_cases
	 *
	 * @param string $rest_route  Endpoint rest_route.
	 * @param string $path        Endpoint path template.
	 * @param string $url         Full request URL.
	 * @param string $max_version Endpoint max version.
	 * @param string $expected    Expected concrete route.
	 * @group json-api
	 */
	#[DataProvider( 'provide_concrete_cases' )]
	#[Group( 'json-api' )]
	public function test_build_concrete_rest_route( $rest_route, $path, $url, $max_version, $expected ) {
		$this->assertSame( $expected, $this->make_endpoint( $rest_route, $path, $max_version )->build_concrete_rest_route( $url ) );
	}

	/**
	 * Data provider for build_concrete_rest_route().
	 *
	 * @return array<string, array{string, string, string, string, string}>
	 */
	public static function provide_concrete_cases() {
		return array(
			'static (no token)'  => array( '/posts', '/sites/%s/posts', 'https://public-api.wordpress.com/rest/v1.1/sites/12/posts?number=10', '1.1', 'v1.1/posts' ),
			'by id'              => array( '/posts/%d', '/sites/%s/posts/%d', 'https://public-api.wordpress.com/rest/v1.1/sites/en.blog.wordpress.com/posts/7?context=display', '1.1', 'v1.1/posts/7' ),
			'by slug'            => array( '/posts/slug:%s', '/sites/%s/posts/slug:%s', 'https://public-api.wordpress.com/rest/v1.1/sites/12/posts/slug:hello-world', '1.1', 'v1.1/posts/slug:hello-world' ),
			'token then literal' => array( '/posts/%d/autosave', '/sites/%s/posts/%d/autosave', 'https://public-api.wordpress.com/rest/v1.1/sites/12/posts/7/autosave', '1.1', 'v1.1/posts/7/autosave' ),
			'multiple tokens'    => array( '/taxonomies/%s/terms/slug:%s', '/sites/%s/taxonomies/%s/terms/slug:%s', 'https://public-api.wordpress.com/rest/v1.1/sites/12/taxonomies/category/terms/slug:foo', '1.1', 'v1.1/taxonomies/category/terms/slug:foo' ),
			'encoded slash'      => array( '/plugins/%s', '/sites/%s/plugins/%s', 'https://public-api.wordpress.com/rest/v1.2/sites/12/plugins/akismet%2Fakismet', '1.2', 'v1.2/plugins/akismet%2Fakismet' ),
			'domain site'        => array( '/posts/%d', '/sites/%s/posts/%d', 'https://public-api.wordpress.com/rest/v1.1/sites/example.com/posts/42', '1.1', 'v1.1/posts/42' ),
		);
	}

	/**
	 * The end-to-end guarantee: for every tokenized shape the concrete route a request produces must
	 * match the pattern the remote registered. This is what makes a request actually route.
	 *
	 * @dataProvider provide_roundtrip_cases
	 *
	 * @param string $rest_route Endpoint rest_route.
	 * @param string $path       Endpoint path template.
	 * @param string $url        Full request URL.
	 * @group json-api
	 */
	#[DataProvider( 'provide_roundtrip_cases' )]
	#[Group( 'json-api' )]
	public function test_concrete_route_matches_registered_pattern( $rest_route, $path, $url ) {
		$endpoint = $this->make_endpoint( $rest_route, $path );
		$pattern  = $endpoint->build_rest_route_regex();
		$concrete = $endpoint->build_concrete_rest_route( $url );

		$this->assertSame( 1, preg_match( '#^' . $pattern . '$#', $concrete ), "Concrete route '$concrete' should match registered pattern '$pattern'." );
	}

	/**
	 * Data provider for the round-trip test.
	 *
	 * @return array<string, array{string, string, string}>
	 */
	public static function provide_roundtrip_cases() {
		return array(
			'by id'              => array( '/posts/%d', '/sites/%s/posts/%d', 'https://public-api.wordpress.com/rest/v1.1/sites/12/posts/7' ),
			'by slug'            => array( '/posts/slug:%s', '/sites/%s/posts/slug:%s', 'https://public-api.wordpress.com/rest/v1.1/sites/12/posts/slug:hello-world' ),
			'token then literal' => array( '/posts/%d/autosave', '/sites/%s/posts/%d/autosave', 'https://public-api.wordpress.com/rest/v1.1/sites/12/posts/7/autosave' ),
			'multiple tokens'    => array( '/taxonomies/%s/terms/slug:%s', '/sites/%s/taxonomies/%s/terms/slug:%s', 'https://public-api.wordpress.com/rest/v1.1/sites/12/taxonomies/category/terms/slug:foo' ),
		);
	}
}

/**
 * Minimal concrete endpoint for exercising the route-building methods.
 */
class WPCOM_JSON_API_Rest_Route_Test_Endpoint extends WPCOM_JSON_API_Endpoint {

	/**
	 * Callback implementation (unused by these tests).
	 *
	 * @param string $path The request path.
	 * @return mixed
	 */
	public function callback( $path = '' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array();
	}
}
