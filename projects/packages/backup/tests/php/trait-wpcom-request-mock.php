<?php
/**
 * Shared scaffolding for exercising a bridge callback against a faked WPCOM.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005\REST;

use WP_Error;
use function add_filter;
use function get_current_user_id;
use function remove_all_filters;
use function remove_filter;
use function wp_insert_user;
use function wp_rand;
use function wp_set_current_user;

/**
 * Signs in an administrator, stands in for a connected site, and lets a
 * test decide how WPCOM answers.
 *
 * Every bridge callback needs the same three things before it will run,
 * and each was being rebuilt per test file. Consumers must call
 * `reset_wpcom_request_mock()` from their own `tearDown()`.
 *
 * One thing worth knowing before adding tests with this: the callbacks
 * are invoked directly rather than dispatched through the REST server.
 * `Rest_Controller::permission_check()` additionally requires a
 * user-level WPCOM connection that WorDBless cannot stand up, so a
 * dispatch never reaches the callback body. The permission boundary
 * itself is covered separately, by each file's `manage_options` test.
 */
trait Wpcom_Request_Mock {

	/**
	 * URL of the last request a bridge made to WPCOM.
	 *
	 * @var string
	 */
	protected $captured_url = '';

	/**
	 * Decoded body of the last request a bridge made to WPCOM.
	 *
	 * Stays null when no request was made, which is how a test asserts
	 * that a guard refused before reaching the network.
	 *
	 * @var array|null
	 */
	protected $captured_body = null;

	/**
	 * Sign in as an administrator and make `Client` able to sign a request.
	 *
	 * @return int The administrator's user id.
	 */
	protected function sign_in_as_admin() {
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'admin_user_' . wp_rand( 1, PHP_INT_MAX ),
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );

		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_connection_options' ), 10, 2 );

		return $admin_id;
	}

	/**
	 * Sign in and have WPCOM answer with a body and status.
	 *
	 * @param array $body   Payload WPCOM should answer with.
	 * @param int   $status HTTP status WPCOM should answer with.
	 */
	protected function arrange_wpcom( array $body, $status = 200 ) {
		$this->sign_in_as_admin();

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $body, $status ) {
				$this->captured_url  = $url;
				$this->captured_body = isset( $args['body'] ) ? json_decode( $args['body'], true ) : null;
				return array(
					'response' => array( 'code' => $status ),
					'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
				);
			},
			10,
			3
		);
	}

	/**
	 * Sign in and make the request fail in transport.
	 *
	 * `pre_http_request` returning a `WP_Error` is what the HTTP client
	 * itself does when the request never leaves the host — DNS, TLS, or
	 * the cURL timeout behind JETPACK-2173. It is a different failure
	 * from a non-200 and has to be tested separately: there is no
	 * response to read a status or a WPCOM error envelope out of, so the
	 * bridges' non-200 branch never runs.
	 */
	protected function arrange_wpcom_unreachable() {
		$this->sign_in_as_admin();

		add_filter(
			'pre_http_request',
			static function () {
				return new WP_Error(
					'http_request_failed',
					'cURL error 28: Operation timed out after 10001 milliseconds with 0 bytes received'
				);
			}
		);
	}

	/**
	 * Undo everything this trait installed. Call from `tearDown()`.
	 */
	protected function reset_wpcom_request_mock() {
		remove_all_filters( 'pre_http_request' );
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_connection_options' ), 10 );
		wp_set_current_user( 0 );

		$this->captured_url  = '';
		$this->captured_body = null;
	}

	/**
	 * Stand in for a connected site so `Client` can sign a request.
	 *
	 * Public because it is registered as a filter callback.
	 *
	 * @param mixed  $value Original option value.
	 * @param string $name  Option name.
	 * @return mixed
	 */
	public function mock_jetpack_connection_options( $value, $name ) {
		switch ( $name ) {
			case 'blog_token':
				return 'test.blogtoken';
			case 'id':
				return '999';
			case 'user_tokens':
				$user_id = get_current_user_id();
				if ( $user_id ) {
					return array( $user_id => sprintf( 'token%d.secret%d.%d', $user_id, $user_id, $user_id ) );
				}
		}
		return $value;
	}
}
