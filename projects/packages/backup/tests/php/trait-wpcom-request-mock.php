<?php
/**
 * Shared scaffolding for exercising a bridge callback against a faked WPCOM.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005\REST;

use Automattic\Jetpack\Connection\Utils as Connection_Utils;
use WP_Error;
use function add_filter;
use function get_current_user_id;
use function get_status_header_desc;
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
 * The `user_tokens` this installs are enough for `Rest_Controller::permission_check()`
 * to pass, so a test may call a bridge callback directly or dispatch through the REST
 * server. Dispatch when the route's arg schema, regex or permission callback is part of
 * what is asserted; call directly when the point is one branch inside a callback.
 *
 * Dispatch wraps a `WP_Error` in a response envelope, moving the code to
 * `get_data()['code']` and the reason to `get_data()['data']['wpcom']`.
 */
trait Wpcom_Request_Mock {

	/**
	 * URL of the last request a bridge made to WPCOM.
	 *
	 * @var string
	 */
	protected $captured_url = '';

	/**
	 * URLs of every request a bridge made to WPCOM, in call order.
	 *
	 * `get_file_content()` makes two outbound calls — the signed-URL
	 * lookup and then the stream fetch — so `$captured_url` only ever
	 * holds the second. A test asserting on how the first one was built
	 * has to read this instead.
	 *
	 * @var string[]
	 */
	protected $captured_urls = array();

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
	 * The parsed `wp_remote_*` arguments of every request a bridge made, in call order.
	 *
	 * What `$captured_body` cannot answer: whether the bridge asked for something *about*
	 * the request rather than sending it. `get_file_content()`'s `limit_response_size`
	 * never appears in a body.
	 *
	 * @var array<int, array<string, mixed>>
	 */
	protected $captured_request_args = array();

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

		// Without this the *first* outbound `Client` call in a process fails before
		// reaching `pre_http_request`: `JETPACK__WPCOM_JSON_API_BASE` is undefined until
		// `Client::build_signed_request()` installs the filter supplying it, so the URL
		// is built with no host and refused as malformed. Every bridge reports that as a
		// 502, which makes a test's result depend on what ran before it.
		//
		// Only tests using this trait are covered, which is why `Backup_Abilities_Test`
		// calls this too.
		Connection_Utils::init_default_constants();

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
				$this->record_request( $args, $url );
				return array(
					'response' => self::mock_response_headers( $status ),
					'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
				);
			},
			10,
			3
		);
	}

	/**
	 * Sign in and have WPCOM answer with a body exactly as given.
	 *
	 * `arrange_wpcom()` takes an array and always `wp_json_encode`s it, so
	 * every body it can produce decodes back to an array. That makes the
	 * "WordPress.com answered 200 with something we cannot read" case —
	 * a truncated response, an HTML error page, a bare scalar —
	 * unreachable through it, and that case is exactly the one a bridge's
	 * projection has to refuse rather than quietly read as an empty list.
	 *
	 * @param string     $body   Raw body WPCOM should answer with.
	 * @param int|string $status HTTP status WPCOM should answer with. A string is
	 *                           legitimate here: the transport does not guarantee
	 *                           an int, and a bridge that compares strictly
	 *                           against 200 has to be tested against that.
	 */
	protected function arrange_wpcom_raw( $body, $status = 200 ) {
		$this->sign_in_as_admin();

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $body, $status ) {
				$this->record_request( $args, $url );
				return array(
					'response' => self::mock_response_headers( $status ),
					'body'     => $body,
				);
			},
			10,
			3
		);
	}

	/**
	 * Sign in and have WPCOM answer each outbound call differently.
	 *
	 * `get_file_content()` is why this exists: it makes two calls, and the single canned
	 * answer the other arrangers install serves both, so a failure belonging to only one
	 * leg is unreachable through them.
	 *
	 * Answers are consumed in call order. A call past the end of the list is a transport
	 * failure rather than a repeat, so fetching more than expected fails visibly.
	 *
	 * @param array<int, array{body?: string, status?: int|string}|WP_Error> $answers One answer per outbound call, in order.
	 */
	protected function arrange_wpcom_answers( array $answers ) {
		$this->sign_in_as_admin();

		$remaining = $answers;

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$remaining ) {
				$this->record_request( $args, $url );

				if ( ! $remaining ) {
					return new WP_Error(
						'test_unexpected_request',
						sprintf( 'The bridge made an outbound request this test did not arrange an answer for: %s', $url )
					);
				}

				$answer = array_shift( $remaining );
				if ( $answer instanceof WP_Error ) {
					return $answer;
				}

				return array(
					'response' => self::mock_response_headers( $answer['status'] ?? 200 ),
					'body'     => $answer['body'] ?? '',
				);
			},
			10,
			3
		);
	}

	/**
	 * Record one outbound request.
	 *
	 * `captured_body` means "the body of the last request", so it is overwritten rather
	 * than appended to, and is `null` both when no request was made and when the last
	 * one carried no body. Read `captured_request_args` when that distinction matters.
	 *
	 * @param array<string, mixed> $args Parsed `wp_remote_*` arguments.
	 * @param string               $url  Request URL.
	 */
	private function record_request( $args, $url ) {
		$this->captured_url            = $url;
		$this->captured_urls[]         = $url;
		$this->captured_request_args[] = $args;
		$this->captured_body           = isset( $args['body'] ) ? json_decode( $args['body'], true ) : null;
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
	 * The `response` half of a faked `wp_remote_*` return value.
	 *
	 * The reason phrase is here because a real response always carries one,
	 * and `wp_remote_retrieve_response_message()` reads it without checking:
	 * a fixture that omits it makes any code path calling that helper emit
	 * an "Undefined array key" warning that belongs to the fixture rather
	 * than to the code under test. `get_status_header_desc()` is what core
	 * itself would have put there, and answers `''` for a status it does not
	 * recognise — including the deliberately malformed ones these tests
	 * feed in.
	 *
	 * @param int|string $status HTTP status WordPress.com should answer with.
	 * @return array<string, mixed>
	 */
	private static function mock_response_headers( $status ) {
		return array(
			'code'    => $status,
			'message' => get_status_header_desc( (int) $status ),
		);
	}

	/**
	 * Undo everything this trait installed. Call from `tearDown()`.
	 */
	protected function reset_wpcom_request_mock() {
		remove_all_filters( 'pre_http_request' );
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_connection_options' ), 10 );
		wp_set_current_user( 0 );

		$this->captured_url          = '';
		$this->captured_urls         = array();
		$this->captured_body         = null;
		$this->captured_request_args = array();
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
