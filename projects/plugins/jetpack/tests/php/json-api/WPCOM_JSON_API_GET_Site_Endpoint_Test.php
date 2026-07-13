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
require_once __DIR__ . '/fixtures/wpcom-get-site-functions.php';

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
		WPCOM_JSON_API::init()->query         = array();
		WPCOM_JSON_API::init()->token_details = array();
		delete_option( 'jetpack_callable_wp_get_environment_type' );
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
	 * Test that WordPress.com-only fields are returned when explicitly requested.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_requested_wpcom_only_fields_are_rendered_for_site_response() {
		global $blog_id;

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		update_option( 'jetpack_callable_wp_get_environment_type', 'local' );
		WPCOM_JSON_API::init()->query         = array( 'fields' => 'ID,hosting_provider_guess,environment_type' );
		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => $blog_id );

		$response = $this->get_wpcom_endpoint()->callback( '/sites/%s', $blog_id );

		$this->assertSame( get_jetpack_hosting_provider( $blog_id ), $response['hosting_provider_guess'] );
		$this->assertSame( 'local', $response['environment_type'] );
	}

	/**
	 * Test that WordPress.com platform fields are only returned when explicitly requested.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_wpcom_platform_fields_are_not_rendered_without_explicit_fields() {
		global $blog_id;

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		update_option( 'jetpack_callable_wp_get_environment_type', 'local' );
		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => $blog_id );

		$endpoint = $this->get_wpcom_endpoint();

		WPCOM_JSON_API::init()->query = array();
		$response                     = $endpoint->callback( '/sites/%s', $blog_id );

		$this->assertArrayNotHasKey( 'hosting_provider_guess', $response );
		$this->assertArrayNotHasKey( 'environment_type', $response );

		WPCOM_JSON_API::init()->query = array( 'fields' => 'ID,name' );
		$response                     = $endpoint->callback( '/sites/%s', $blog_id );

		$this->assertArrayNotHasKey( 'hosting_provider_guess', $response );
		$this->assertArrayNotHasKey( 'environment_type', $response );
	}

	/**
	 * Test that WordPress.com platform fields are returned for v1.2 site responses when explicitly requested.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_requested_wpcom_platform_fields_are_rendered_for_v1_2_site_response() {
		global $blog_id;

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		update_option( 'jetpack_callable_wp_get_environment_type', 'staging' );
		WPCOM_JSON_API::init()->query         = array( 'fields' => 'ID,hosting_provider_guess,environment_type' );
		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => $blog_id );

		$endpoint = $this->get_wpcom_v1_2_endpoint();
		$response = $endpoint->callback( '/sites/%s', $blog_id );

		remove_filter( 'sites_site_format', array( $endpoint, 'site_format' ) );

		$this->assertSame( get_jetpack_hosting_provider( $blog_id ), $response['hosting_provider_guess'] );
		$this->assertSame( 'staging', $response['environment_type'] );
	}

	/**
	 * Test that WordPress.com-only decorations are added to Jetpack responses when explicitly requested.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_requested_wpcom_only_fields_decorate_jetpack_response() {
		global $blog_id;

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		update_option( 'jetpack_callable_wp_get_environment_type', 'staging' );
		WPCOM_JSON_API::init()->query         = array( 'fields' => 'ID,hosting_provider_guess,environment_type' );
		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => $blog_id );

		$endpoint = $this->get_wpcom_endpoint();

		$response = (object) array( 'ID' => $blog_id );
		$endpoint->decorate_jetpack_response( $response );

		$this->assertSame( get_jetpack_hosting_provider( $blog_id ), $response->hosting_provider_guess );
		$this->assertSame( 'staging', $response->environment_type );
	}

	/**
	 * Test that public Jetpack responses do not get WordPress.com-only decorations.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_wpcom_only_fields_do_not_decorate_public_jetpack_response() {
		global $blog_id;

		wp_set_current_user( 0 );
		update_option( 'jetpack_callable_wp_get_environment_type', 'staging' );
		WPCOM_JSON_API::init()->query         = array( 'fields' => 'ID,hosting_provider_guess,environment_type' );
		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => $blog_id );

		$endpoint = $this->get_wpcom_endpoint();

		$response = (object) array( 'ID' => $blog_id );
		$endpoint->decorate_jetpack_response( $response );

		$this->assertFalse( property_exists( $response, 'hosting_provider_guess' ) );
		$this->assertFalse( property_exists( $response, 'environment_type' ) );
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

	/**
	 * Get a test endpoint that behaves as if it is running on WordPress.com.
	 *
	 * @return WPCOM_JSON_API_GET_Site_Endpoint
	 */
	private function get_wpcom_endpoint() {
		return new class(
			array(
				'description'                          => 'Get information about a site.',
				'group'                                => 'sites',
				'stat'                                 => 'sites:X',
				'allowed_if_flagged'                   => true,
				'method'                               => 'GET',
				'max_version'                          => '1.1',
				'new_version'                          => '1.2',
				'path'                                 => '/sites/%s',
				'path_labels'                          => array(
					'$site' => '(int|string) Site ID or domain',
				),
				'rest_route'                           => '/site',
				'rest_min_jp_version'                  => '15.9',
				'allow_jetpack_site_auth'              => true,
				'allow_fallback_to_jetpack_blog_token' => true,
				'query_parameters'                     => array(
					'context' => false,
					'options' => '(string) Optional. Returns specified options only. Comma-separated list. Example: options=login_url,timezone',
				),
				'response_format'                      => WPCOM_JSON_API_GET_Site_Endpoint::$site_format,
				'example_request'                      => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/',
			)
		) extends WPCOM_JSON_API_GET_Site_Endpoint {
			/**
			 * Whether this request is running on WordPress.com.
			 *
			 * @return bool
			 */
			protected function is_wpcom() {
				return true;
			}
		};
	}

	/**
	 * Get a v1.2 test endpoint that behaves as if it is running on WordPress.com.
	 *
	 * @return WPCOM_JSON_API_GET_Site_V1_2_Endpoint
	 */
	private function get_wpcom_v1_2_endpoint() {
		return new class(
			array(
				'method'          => 'GET',
				'path'            => '/sites/%s',
				'response_format' => WPCOM_JSON_API_GET_Site_V1_2_Endpoint::$site_format,
			)
		) extends WPCOM_JSON_API_GET_Site_V1_2_Endpoint {
			/**
			 * Whether this request is running on WordPress.com.
			 *
			 * @return bool
			 */
			protected function is_wpcom() {
				return true;
			}
		};
	}
}
