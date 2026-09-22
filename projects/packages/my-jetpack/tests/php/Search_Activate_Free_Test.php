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
	 * The response the mocked WordPress.com endpoint should return.
	 *
	 * @var array|WP_Error
	 */
	private $wpcom_response;

	/**
	 * How many outbound HTTP requests were attempted.
	 *
	 * @var int
	 */
	private $http_calls = 0;

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

		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );

		// Without an absolute base the signed request URL has no host and signing fails.
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		$this->http_calls = 0;
		add_filter( 'pre_http_request', array( $this, 'answer_as_wpcom' ) );
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
	 * @return array|WP_Error
	 */
	public function answer_as_wpcom() {
		++$this->http_calls;
		return $this->wpcom_response;
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
		$this->wpcom_response = array(
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
		$this->wpcom_response = new WP_Error( 'http_request_failed', 'Simulated WPCOM failure.' );

		$result = Search::activate_free_product( 'my-jetpack' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_search_free_activation_failed', $result->get_error_code() );
		$this->assertTrue( $result->get_error_data()['checkout_fallback'] );
	}

	/**
	 * A response that isn't the documented shape is treated as a refusal, and — because the
	 * endpoint flags every error it raises — one checkout cannot resolve either.
	 */
	public function test_unrecognized_response_does_not_fall_back_to_checkout() {
		$this->connect_user();
		$this->expect_wpcom_response( 502, array( 'error' => 'bad gateway' ) );

		$result = Search::activate_free_product( 'my-jetpack' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_search_free_activation_failed', $result->get_error_code() );
		$this->assertFalse( $result->get_error_data()['checkout_fallback'] );
	}
}
