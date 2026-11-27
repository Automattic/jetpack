<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase, WordPress.Files.FileName.InvalidClassFileName -- Test helper.
/**
 * Queue-based `pre_http_request` mock for tests.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WP_Error;

/**
 * Answers outgoing HTTP requests from a queue and records them.
 */
class Http_Mock {

	/**
	 * Requests seen, in order: method, url, body (decoded JSON), headers.
	 *
	 * @var array<int, array{method: string, url: string, body: mixed, headers: array<string, string>}>
	 */
	public $requests = array();

	/**
	 * Responses still to hand out: `array( code, body )` or a WP_Error.
	 *
	 * @var array
	 */
	private $responses;

	/**
	 * Start intercepting.
	 *
	 * @param array $responses Responses, in request order.
	 */
	public function __construct( array $responses ) {
		$this->responses = $responses;
		add_filter( 'pre_http_request', array( $this, 'handle' ), 10, 3 );
	}

	/**
	 * Stop intercepting.
	 */
	public function remove() {
		remove_filter( 'pre_http_request', array( $this, 'handle' ), 10 );
	}

	/**
	 * The `pre_http_request` callback.
	 *
	 * @param false|array|WP_Error $pre  Short-circuit value.
	 * @param array                $args Request arguments.
	 * @param string               $url  Request URL.
	 * @return array|WP_Error
	 */
	public function handle( $pre, $args, $url ) {
		$this->requests[] = array(
			'method'  => $args['method'] ?? 'GET',
			'url'     => $url,
			'body'    => isset( $args['body'] ) && is_string( $args['body'] ) ? json_decode( $args['body'], true ) : null,
			'headers' => $args['headers'] ?? array(),
		);

		$next = array_shift( $this->responses );
		if ( $next instanceof WP_Error ) {
			return $next;
		}
		if ( null === $next ) {
			return new WP_Error( 'http_mock_exhausted', 'No mocked response left for ' . $url );
		}

		list( $code, $body ) = $next;
		return array(
			'headers'  => array(),
			'body'     => is_string( $body ) ? $body : wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
			'response' => array(
				'code'    => $code,
				'message' => '',
			),
			'cookies'  => array(),
			'filename' => null,
		);
	}
}
