<?php
/**
 * Tests for the /wpcom/v2/mailchimp/settings endpoint.
 *
 * @covers WPCOM_REST_API_V2_Endpoint_Mailchimp
 */

use PHPUnit\Framework\Attributes\CoversClass;
use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Mailchimp_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_Mailchimp
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_Mailchimp::class )]
class WPCOM_REST_API_V2_Endpoint_Mailchimp_Test extends Jetpack_REST_TestCase {

	/**
	 * Mock admin user ID.
	 *
	 * @var int
	 */
	private static $admin_id = 0;

	/**
	 * The mocked WordPress.com response to the settings save.
	 *
	 * @var array
	 */
	private $save_response;

	/**
	 * The body sent to WordPress.com when saving.
	 *
	 * @var array|null
	 */
	private $saved_data;

	/**
	 * Create shared database fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	/**
	 * Setup the environment for a test.
	 */
	public function set_up() {
		wp_set_current_user( static::$admin_id );

		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );
		add_filter( 'pre_option_jetpack_options', array( $this, 'mock_jetpack_options' ) );
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom' ), 10, 3 );

		// @phan-suppress-next-line PhanNoopNew -- instantiated for the constructor's add_action side effect.
		new WPCOM_REST_API_V2_Endpoint_Mailchimp();

		parent::set_up();
	}

	/**
	 * Reset the environment to its original state after the test.
	 */
	public function tear_down() {
		remove_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );
		remove_filter( 'pre_option_jetpack_options', array( $this, 'mock_jetpack_options' ) );
		remove_filter( 'pre_http_request', array( $this, 'mock_wpcom' ), 10 );

		parent::tear_down();
	}

	/**
	 * Mock the Jetpack private options so the test admin is a connected user.
	 *
	 * @return array
	 */
	public function mock_jetpack_private_options() {
		return array(
			'user_tokens' => array(
				static::$admin_id => 'pretend_this_is_valid.secret.' . static::$admin_id,
			),
		);
	}

	/**
	 * Mock the Jetpack options so the site has a WordPress.com ID.
	 *
	 * @return array
	 */
	public function mock_jetpack_options() {
		return array( 'id' => 123 );
	}

	/**
	 * Mock the WordPress.com connections lookup and settings save.
	 *
	 * @param false|array $preempt     Whether to preempt the request.
	 * @param array       $parsed_args Request arguments.
	 * @param string      $url         Request URL.
	 * @return array
	 */
	public function mock_wpcom( $preempt, $parsed_args, $url ) {
		if ( str_contains( $url, '/me/connections' ) ) {
			$code = 200;
			$body = array(
				'connections' => array(
					array(
						'ID'      => 55,
						'service' => 'mailchimp',
					),
				),
			);
		} else {
			$this->saved_data    = json_decode( $parsed_args['body'], true );
			list( $code, $body ) = $this->save_response;
		}

		return array(
			'headers'  => array(),
			'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
			'response' => array( 'code' => $code ),
			'cookies'  => array(),
			'filename' => null,
		);
	}

	/**
	 * Dispatch a settings save.
	 *
	 * @return WP_REST_Response
	 */
	private function save_audience() {
		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/mailchimp/settings' );
		$request->set_header( 'content_type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'follower_list_id' => 'abc123' ), JSON_UNESCAPED_SLASHES ) );
		return $this->server->dispatch( $request );
	}

	/**
	 * Without this, picking an audience would not store it and the block would stay "not connected".
	 */
	public function test_save_stores_audience_with_connection() {
		$this->save_response = array( 200, array() );

		$response = $this->save_audience();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				'follower_list_id' => 'abc123',
				'keyring_id'       => 55,
			),
			$this->saved_data
		);
	}

	/**
	 * Without this, a list WordPress.com rejects would be reported as saved.
	 */
	public function test_save_surfaces_wpcom_error() {
		$this->save_response = array(
			400,
			array(
				'error'   => 'required-merge-fields',
				'message' => 'Please make these merge fields not required in Mailchimp: PHONE',
			),
		);

		$response = $this->save_audience();

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'Please make these merge fields not required in Mailchimp: PHONE', $response->get_data()['message'] );
	}
}
