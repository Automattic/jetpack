<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Jetpack_Options;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the Zendesk Chat REST API endpoints.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\REST_Zendesk_Chat
 */
class Rest_Zendesk_Chat_Test extends TestCase {

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * The administrator user id.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * The subscriber user id.
	 *
	 * @var int
	 */
	private $subscriber_id;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		// Mock site connection.
		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );

		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		Initializer::init();
		do_action( 'rest_api_init' );

		// No test should reach the network.
		add_filter( 'pre_http_request', array( $this, 'block_http_requests' ) );

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);

		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'test_subscriber',
				'user_pass'  => '123',
				'role'       => 'subscriber',
			)
		);
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		remove_filter( 'pre_http_request', array( $this, 'block_http_requests' ) );
		remove_filter( 'pre_http_request', array( $this, 'mint_token_for_current_user' ) );

		Constants::clear_constants();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		parent::tearDown();
	}

	/**
	 * Short-circuits every outgoing HTTP request.
	 *
	 * @return WP_Error
	 */
	public function block_http_requests() {
		return new WP_Error( 'http_request_blocked', 'HTTP requests are blocked in tests.' );
	}

	/**
	 * Stands in for WordPress.com, returning a token tied to the calling user.
	 *
	 * @return array
	 */
	public function mint_token_for_current_user() {
		return array(
			'headers'  => array(),
			'body'     => wp_json_encode( 'token-for-' . get_current_user_id(), JSON_UNESCAPED_SLASHES ),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Connects only the administrator, so the subscriber has no WordPress.com user token
	 * and cannot mint a token of their own.
	 */
	private function allow_token_minting_for_admin_only() {
		( new Tokens() )->update_user_token( $this->admin_id, 'test.test.' . $this->admin_id, true );

		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		remove_filter( 'pre_http_request', array( $this, 'block_http_requests' ) );
		add_filter( 'pre_http_request', array( $this, 'mint_token_for_current_user' ) );
	}

	/**
	 * Connects both users to WordPress.com and lets requests reach the mocked endpoint.
	 */
	private function allow_token_minting() {
		( new Tokens() )->update_user_token( $this->admin_id, 'test.test.' . $this->admin_id, true );
		( new Tokens() )->update_user_token( $this->subscriber_id, 'test.test.' . $this->subscriber_id, false );

		// Without an absolute base the signed request URL has no host and signing fails.
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		remove_filter( 'pre_http_request', array( $this, 'block_http_requests' ) );
		add_filter( 'pre_http_request', array( $this, 'mint_token_for_current_user' ) );
	}

	/**
	 * Dispatches a chat authentication request.
	 *
	 * @return \WP_REST_Response
	 */
	private function dispatch_authentication_request() {
		return $this->server->dispatch( new WP_REST_Request( 'GET', '/my-jetpack/v1/chat/authentication' ) );
	}

	/**
	 * A token minted for one user must not reach another.
	 *
	 * This drives the real cache-population path rather than seeding a transient, so it does
	 * not depend on knowing which key the handler writes to.
	 */
	public function test_minted_token_is_not_shared_between_users() {
		$this->allow_token_minting();

		wp_set_current_user( $this->admin_id );
		$admin_response = $this->dispatch_authentication_request();

		// Guards the test itself: without this the subscriber assertions below prove nothing.
		$this->assertSame( 200, $admin_response->get_status() );
		$this->assertSame( 'token-for-' . $this->admin_id, $admin_response->get_data() );

		wp_set_current_user( $this->subscriber_id );
		$subscriber_response = $this->dispatch_authentication_request();

		$this->assertNotSame( 'token-for-' . $this->admin_id, $subscriber_response->get_data() );
		$this->assertSame( 'token-for-' . $this->subscriber_id, $subscriber_response->get_data() );
	}

	/**
	 * An administrator warms the cache through the real path, then a subscriber with no
	 * WordPress.com token of their own calls the endpoint.
	 * They must be refused rather than handed the administrator's token.
	 */
	public function test_tokenless_user_cannot_read_another_users_cached_token() {
		$this->allow_token_minting_for_admin_only();

		wp_set_current_user( $this->admin_id );
		$admin_response = $this->dispatch_authentication_request();

		// Guards the test itself: the cache must actually be warm before the subscriber calls.
		$this->assertSame( 200, $admin_response->get_status() );
		$this->assertSame( 'token-for-' . $this->admin_id, $admin_response->get_data() );

		wp_set_current_user( $this->subscriber_id );
		$subscriber_response = $this->dispatch_authentication_request();

		$data = $subscriber_response->get_data();

		$this->assertNotSame( 'token-for-' . $this->admin_id, $data );
		$this->assertIsArray( $data );
		$this->assertSame( 'chat_authentication_failed', $data['code'] ?? null );
	}

	/**
	 * A user's own cached token is still served back to them.
	 */
	public function test_own_cached_token_is_returned() {
		wp_set_current_user( $this->admin_id );
		set_transient( REST_Zendesk_Chat::ZENDESK_AUTH_TOKEN . '_' . $this->admin_id, 'admin-token', REST_Zendesk_Chat::TRANSIENT_EXPIRY );

		$response = $this->dispatch_authentication_request();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'admin-token', $response->get_data() );
	}

	/**
	 * A token cached under the pre-fix site-wide key is neither served nor kept.
	 */
	public function test_legacy_site_wide_token_is_discarded() {
		set_transient( REST_Zendesk_Chat::ZENDESK_AUTH_TOKEN, 'legacy-token', REST_Zendesk_Chat::TRANSIENT_EXPIRY );

		wp_set_current_user( $this->subscriber_id );
		$response = $this->dispatch_authentication_request();

		$this->assertNotSame( 'legacy-token', $response->get_data() );
		$this->assertFalse( get_transient( REST_Zendesk_Chat::ZENDESK_AUTH_TOKEN ) );
	}

	/**
	 * Logged out requests are still rejected.
	 */
	public function test_logged_out_request_is_rejected() {
		wp_set_current_user( 0 );

		$response = $this->dispatch_authentication_request();

		$this->assertSame( 401, $response->get_status() );
	}
}
