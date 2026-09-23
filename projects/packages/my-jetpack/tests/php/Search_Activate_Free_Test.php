<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\My_Jetpack\Products\Search;
use Jetpack_Options;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_Error;

/**
 * Tests granting the free Search product in place of a $0 checkout.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Products\Search::activate_free_product
 */
class Search_Activate_Free_Test extends TestCase {

	/**
	 * The administrator running the activation.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Responses the mocked WordPress.com endpoint returns, in order. The success path makes a
	 * second call to refresh plan info, so a test can answer each leg differently.
	 *
	 * @var array<array|WP_Error>
	 */
	private $wpcom_responses = array();

	/**
	 * How many outbound HTTP requests were attempted.
	 *
	 * @var int
	 */
	private $http_calls = 0;

	/**
	 * Decoded bodies of the outbound requests, in order.
	 *
	 * @var array<array>
	 */
	private $request_bodies = array();

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->admin_id );

		( new Tokens() )->update_blog_token( 'test.test' );
		Jetpack_Options::update_option( 'id', 123 );

		// Without an absolute base the signed request URL has no host and signing fails.
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		$this->http_calls      = 0;
		$this->request_bodies  = array();
		$this->wpcom_responses = array();
		add_filter( 'pre_http_request', array( $this, 'answer_as_wpcom' ), 10, 3 );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		remove_filter( 'pre_http_request', array( $this, 'answer_as_wpcom' ) );
		Constants::clear_constants();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
		parent::tearDown();
	}

	/**
	 * Stands in for WordPress.com.
	 *
	 * @throws \RuntimeException If a request is made with no queued response.
	 * @return array|WP_Error
	 */
	public function answer_as_wpcom( $preempt = false, $args = array() ) {
		++$this->http_calls;
		$this->request_bodies[] = json_decode( $args['body'] ?? '{}', true ) ?? array();

		// Returning false here would let the request reach WordPress.com for real.
		if ( ! $this->wpcom_responses ) {
			throw new \RuntimeException( 'Unexpected outbound request: no queued WordPress.com response.' );
		}

		return count( $this->wpcom_responses ) > 1
			? array_shift( $this->wpcom_responses )
			: reset( $this->wpcom_responses );
	}

	/**
	 * Connect the current user, so the request can be signed as them.
	 */
	private function connect_user() {
		( new Tokens() )->update_user_token( $this->admin_id, 'test.test.' . $this->admin_id, true );
	}

	/**
	 * Queue a JSON response from WordPress.com.
	 *
	 * @param int   $code HTTP status code.
	 * @param array $body Response body.
	 */
	private function expect_wpcom_response( $code, $body ) {
		$this->wpcom_responses[] = array(
			'headers'  => array(),
			'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
			'response' => array(
				'code'    => $code,
				'message' => 'OK',
			),
		);
	}

	/**
	 * A granted product comes back as-is so the caller can show its success state.
	 */
	public function test_granted_product_is_returned() {
		$this->connect_user();
		$this->expect_wpcom_response(
			200,
			array(
				'success'                 => true,
				'status'                  => 'granted',
				'blog_id'                 => 123,
				'product_id'              => 2130,
				'subscription_id'         => 789,
				'supports_search'         => true,
				'supports_instant_search' => true,
			)
		);

		$result = Search::activate_free_product( 'my-jetpack' );

		$this->assertIsArray( $result );
		$this->assertSame( 'granted', $result['status'] );
		$this->assertTrue( $result['supports_instant_search'] );
	}

	/**
	 * A site that already has Search is a success, not an error — the caller skips checkout.
	 */
	public function test_already_entitled_is_a_success() {
		$this->connect_user();
		$this->expect_wpcom_response(
			200,
			array(
				'success'                 => true,
				'status'                  => 'already_entitled',
				'blog_id'                 => 123,
				'product_id'              => 2130,
				'subscription_id'         => null,
				'supports_search'         => true,
				'supports_instant_search' => true,
			)
		);

		$result = Search::activate_free_product( 'my-jetpack' );

		$this->assertIsArray( $result );
		$this->assertSame( 'already_entitled', $result['status'] );
	}

	/**
	 * Without a connected user there is nobody to own the subscription. The request is not
	 * worth making — checkout signs the user in itself, so the caller is sent there.
	 */
	public function test_unconnected_user_short_circuits_to_checkout() {
		$result = Search::activate_free_product( 'my-jetpack' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'no_connected_user', $result->get_error_code() );
		$this->assertTrue( $result->get_error_data()['checkout_fallback'] );
		$this->assertSame( 0, $this->http_calls );
	}

	/**
	 * A Simple site buys the product from within WordPress.com, so the request is skipped.
	 */
	public function test_wpcom_simple_short_circuits_to_checkout() {
		$this->connect_user();
		Constants::set_constant( 'IS_WPCOM', true );

		$result = Search::activate_free_product( 'my-jetpack' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'not_supported_on_wpcom_simple', $result->get_error_code() );
		$this->assertTrue( $result->get_error_data()['checkout_fallback'] );
		$this->assertSame( 0, $this->http_calls );
	}

	/**
	 * An unregistered site has no blog to grant the product to.
	 */
	public function test_unregistered_site_short_circuits_to_checkout() {
		$this->connect_user();
		Jetpack_Options::delete_option( 'id' );

		$result = Search::activate_free_product( 'my-jetpack' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'site_not_registered', $result->get_error_code() );
		$this->assertTrue( $result->get_error_data()['checkout_fallback'] );
		$this->assertSame( 0, $this->http_calls );
	}

	/**
	 * A spent free tier is refused by checkout too, so the caller must not send the user there.
	 */
	public function test_spent_free_tier_does_not_fall_back_to_checkout() {
		$this->connect_user();
		$this->expect_wpcom_response(
			403,
			array(
				'code'    => 'jetpack_search_free_disabled',
				'message' => 'Jetpack Search Free has already been used for this site.',
				'data'    => array(
					'status'            => 403,
					'checkout_fallback' => false,
				),
			)
		);

		$result = Search::activate_free_product( 'my-jetpack' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_search_free_disabled', $result->get_error_code() );
		$this->assertFalse( $result->get_error_data()['checkout_fallback'] );
	}

	/**
	 * A conflicting product keeps the detail WordPress.com sent, so the UI can name it.
	 */
	public function test_product_conflict_preserves_wpcom_error_data() {
		$this->connect_user();
		$this->expect_wpcom_response(
			409,
			array(
				'code'    => 'jetpack_search_product_conflict',
				'message' => 'This site has a product that cannot be combined with Jetpack Search Free.',
				'data'    => array(
					'status'                 => 409,
					'checkout_fallback'      => false,
					'conflicting_product_id' => 1009,
				),
			)
		);

		$result = Search::activate_free_product( 'my-jetpack' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_search_product_conflict', $result->get_error_code() );
		$this->assertFalse( $result->get_error_data()['checkout_fallback'] );
		$this->assertSame( 1009, $result->get_error_data()['conflicting_product_id'] );
	}

	/**
	 * A request that never reached WordPress.com leaves checkout worth trying.
	 */
	public function test_transport_failure_falls_back_to_checkout() {
		$this->connect_user();
		$this->wpcom_responses = array( new WP_Error( 'http_request_failed', 'Simulated WPCOM failure.' ) );

		$result = Search::activate_free_product( 'my-jetpack' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_search_free_activation_failed', $result->get_error_code() );
		$this->assertTrue( $result->get_error_data()['checkout_fallback'] );
	}

	/**
	 * A body carrying no error code did not come from the endpoint — a 404 before it deploys,
	 * or a proxy error page. Checkout still works in that case, so the caller is sent there.
	 */
	public function test_unrecognized_response_falls_back_to_checkout() {
		$this->connect_user();
		$this->expect_wpcom_response( 502, array( 'error' => 'bad gateway' ) );

		$result = Search::activate_free_product( 'my-jetpack' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_search_free_activation_failed', $result->get_error_code() );
		$this->assertTrue( $result->get_error_data()['checkout_fallback'] );
	}

	/**
	 * The route is not deployed yet, so this is the response every site gets today.
	 */
	public function test_missing_route_falls_back_to_checkout() {
		$this->connect_user();
		$this->expect_wpcom_response(
			404,
			array(
				'code'    => 'rest_no_route',
				'message' => 'No route was found matching the URL and request method.',
				'data'    => array( 'status' => 404 ),
			)
		);

		$result = Search::activate_free_product( 'my-jetpack' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertTrue( $result->get_error_data()['checkout_fallback'] );

		/*
		 * Never 404: the REST client special-cases that status and throws a bare error with no
		 * body, so the `checkout_fallback` above would never reach the dashboard.
		 */
		$this->assertSame( 502, $result->get_error_data()['status'] );
	}

	/**
	 * A refusal must never carry a success status: both REST clients read a 2xx as a grant.
	 */
	public function test_refusal_never_answers_with_a_success_status() {
		$this->connect_user();
		$this->expect_wpcom_response( 200, array( 'success' => false ) );

		$result = Search::activate_free_product( 'my-jetpack' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertGreaterThanOrEqual( 400, $result->get_error_data()['status'] );
	}

	/**
	 * WordPress.com records an unfamiliar source as `unknown` rather than refusing, so a value
	 * this copy predates must still reach it.
	 */
	public function test_unfamiliar_source_is_forwarded_not_dropped() {
		$this->connect_user();
		$this->expect_wpcom_response(
			200,
			array(
				'success' => true,
				'status'  => 'granted',
			)
		);

		Search::activate_free_product( 'a-new-surface' );

		$this->assertSame( 'a-new-surface', $this->request_bodies[0]['source'] ?? null );
	}

	/**
	 * Creating the subscription needs more than the Search dashboard route's own bar.
	 */
	public function test_non_admin_cannot_activate() {
		$this->connect_user();
		$subscriber = wp_insert_user(
			array(
				'user_login' => 'test_subscriber',
				'user_pass'  => '123',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber );

		$result = Search::activate_free_product( 'my-jetpack' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_cannot_activate', $result->get_error_code() );
		$this->assertFalse( $result->get_error_data()['checkout_fallback'] );
		$this->assertSame( 0, $this->http_calls );
	}

	/**
	 * A grant that lands while the local module stays off must be visible, not silent —
	 * re-running the activation is what repairs it.
	 */
	public function test_failed_local_sync_is_reported_on_an_otherwise_successful_grant() {
		$this->connect_user();
		$this->expect_wpcom_response(
			200,
			array(
				'success' => true,
				'status'  => 'granted',
			)
		);
		// Second leg: the plan refresh this site makes after the grant.
		$this->expect_wpcom_response( 500, array( 'error' => 'upstream unavailable' ) );

		$result = Search::activate_free_product( 'my-jetpack' );

		$this->assertIsArray( $result );
		$this->assertSame( 'granted', $result['status'] );
		$this->assertArrayHasKey( 'local_activation', $result );
		$this->assertNotSame( 'activated', $result['local_activation'] );
	}

	/**
	 * The module comes on locally once the refreshed plan says Search is supported.
	 */
	public function test_successful_grant_activates_the_module_locally() {
		$this->connect_user();
		$this->expect_wpcom_response(
			200,
			array(
				'success' => true,
				'status'  => 'granted',
			)
		);
		$this->expect_wpcom_response(
			200,
			array(
				'supports_search'         => true,
				'supports_instant_search' => true,
			)
		);

		$result = Search::activate_free_product( 'my-jetpack' );

		$this->assertIsArray( $result );
		$this->assertSame( 'activated', $result['local_activation'] );
		$this->assertContains( 'search', (array) get_option( 'jetpack_active_modules', array() ) );
	}
}
