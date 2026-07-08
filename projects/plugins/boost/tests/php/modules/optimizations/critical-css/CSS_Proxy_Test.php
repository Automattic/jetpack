<?php
/**
 * Tests for CSS_Proxy class.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Critical_CSS;

use Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS\CSS_Proxy;
use WorDBless\BaseTestCase;

/**
 * Class CSS_Proxy_Test
 *
 * Covers the cache/fetch resolution used by the boost_proxy_css endpoint:
 * cache hits replay the stored body, cache misses fetch + cache it, empty
 * bodies are not cached, and a non-CSS response is rejected.
 */
class CSS_Proxy_Test extends BaseTestCase {

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'wp_die_handler' );
		remove_all_filters( 'wp_die_ajax_handler' );
		parent::tear_down();
	}

	/**
	 * Make wp_die() throw instead of terminating, regardless of request context.
	 */
	private function make_wp_die_throw() {
		$handler = function () {
			/**
			 * @param string|\WP_Error $message Message passed to wp_die().
			 * @return never
			 */
			$thrower = function ( $message ) {
				throw new \RuntimeException( is_string( $message ) ? $message : 'wp_die' );
			};

			return $thrower;
		};
		add_filter( 'wp_die_handler', $handler );
		add_filter( 'wp_die_ajax_handler', $handler );
	}

	/**
	 * Invoke the protected CSS_Proxy::get_proxied_css() resolver via a subclass
	 * (avoids ReflectionMethod::setAccessible(), deprecated as of PHP 8.5).
	 *
	 * @param string $proxy_url URL to resolve.
	 * @return string
	 */
	private function resolve( $proxy_url ) {
		$proxy = new class() extends CSS_Proxy {
			/**
			 * Expose the protected resolver for testing.
			 *
			 * @param string $url URL to resolve.
			 * @return string
			 */
			public function resolve_proxied_css( $url ) {
				return $this->get_proxied_css( $url );
			}
		};

		return $proxy->resolve_proxied_css( $proxy_url );
	}

	/**
	 * Mock the next HTTP request with the given content type, body and status.
	 *
	 * @param string $content_type Response content-type header.
	 * @param string $body         Response body.
	 * @param int    $status_code  Response HTTP status code.
	 */
	private function mock_http_response( $content_type, $body, $status_code = 200 ) {
		add_filter(
			'pre_http_request',
			function () use ( $content_type, $body, $status_code ) {
				return array(
					'headers'  => array( 'content-type' => $content_type ),
					'body'     => $body,
					'response' => array(
						'code'    => $status_code,
						'message' => 'OK',
					),
				);
			}
		);
	}

	/**
	 * A cached string body is replayed verbatim on a cache hit.
	 */
	public function test_returns_cached_css_body_on_cache_hit() {
		$url = 'https://example.com/cached.css';
		$css = '.cached { color: red; }';
		set_transient( 'jb_css_proxy_' . md5( $url ), $css, HOUR_IN_SECONDS );

		$this->assertSame( $css, $this->resolve( $url ) );
	}

	/**
	 * A cache miss fetches the body and caches it for subsequent hits.
	 */
	public function test_fetches_and_caches_body_on_cache_miss() {
		$url = 'https://example.com/fresh.css';
		$css = '.fresh { background: url("data:image/svg+xml,<svg></svg>"); }';
		$this->mock_http_response( 'text/css', $css );

		$result = $this->resolve( $url );

		$this->assertSame( $css, $result );
		$this->assertSame( $css, get_transient( 'jb_css_proxy_' . md5( $url ) ) );
	}

	/**
	 * An empty (but successful) body is returned but never cached, so a single
	 * empty fetch is not replayed for the full TTL.
	 */
	public function test_empty_body_is_not_cached() {
		$url = 'https://example.com/empty.css';
		$this->mock_http_response( 'text/css', '' );

		$result = $this->resolve( $url );

		$this->assertSame( '', $result );
		$this->assertFalse( get_transient( 'jb_css_proxy_' . md5( $url ) ) );
	}

	/**
	 * A non-CSS response is rejected (and the error cached) via wp_die().
	 */
	public function test_non_css_response_is_rejected_and_error_cached() {
		$url = 'https://example.com/notcss.css';
		$this->mock_http_response( 'text/html', '<html></html>' );
		$this->make_wp_die_throw();

		try {
			$this->resolve( $url );
			$this->fail( 'Expected wp_die() for a non-CSS response.' );
		} catch ( \RuntimeException $e ) {
			$this->assertStringContainsString( 'Invalid content type', $e->getMessage() );
		}

		$cached = get_transient( 'jb_css_proxy_' . md5( $url ) );
		$this->assertIsArray( $cached );
		$this->assertArrayHasKey( 'error', $cached );
	}

	/**
	 * A transport failure exits with a 5xx (never a 200 the generator would
	 * consume as a stylesheet) and is not cached.
	 */
	public function test_transport_error_fails_loudly_and_is_not_cached() {
		$url = 'https://example.com/down.css';
		add_filter(
			'pre_http_request',
			function () {
				return new \WP_Error( 'http_request_failed', 'Connection refused' );
			}
		);
		$this->make_wp_die_throw();

		try {
			$this->resolve( $url );
			$this->fail( 'Expected wp_die() for a transport failure.' );
		} catch ( \RuntimeException $e ) {
			$this->addToAssertionCount( 1 );
		}

		$this->assertFalse( get_transient( 'jb_css_proxy_' . md5( $url ) ) );
	}

	/**
	 * A non-2xx response served as text/css is rejected and not cached, so a
	 * 404/500 body is never treated as valid CSS.
	 */
	public function test_non_2xx_response_is_rejected_and_not_cached() {
		$url = 'https://example.com/missing.css';
		$this->mock_http_response( 'text/css', '.a { color: red; }', 404 );
		$this->make_wp_die_throw();

		try {
			$this->resolve( $url );
			$this->fail( 'Expected wp_die() for a non-2xx response.' );
		} catch ( \RuntimeException $e ) {
			$this->addToAssertionCount( 1 );
		}

		$this->assertFalse( get_transient( 'jb_css_proxy_' . md5( $url ) ) );
	}

	/**
	 * The served output neutralizes a </style sequence in the proxied body, so a
	 * proxied stylesheet cannot break out of a downstream <style> element.
	 */
	public function test_serve_proxied_css_neutralizes_style_breakout() {
		$proxy = new class() extends CSS_Proxy {
			/**
			 * Expose the protected output method for testing.
			 *
			 * @param string $css CSS body to serve.
			 */
			public function serve( $css ) {
				$this->serve_proxied_css( $css );
			}
		};

		ob_start();
		$proxy->serve( 'body { color: red; }</style><script>alert(1)</script>' );
		$output = ob_get_clean();

		$this->assertStringNotContainsString( '</style', $output );
		$this->assertStringContainsString( '<\/style><script>', $output );
	}
}
