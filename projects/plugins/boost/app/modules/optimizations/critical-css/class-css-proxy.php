<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Display_Critical_CSS;

/**
 * Add an ajax endpoint to proxy external CSS files.
 */
class CSS_Proxy {
	const NONCE_ACTION = 'jb-generate-proxy-nonce';

	public static function init() {
		$instance = new self();

		if ( is_admin() ) {
			add_action( 'wp_ajax_boost_proxy_css', array( $instance, 'handle_css_proxy' ) );
		}
	}

	/**
	 * AJAX handler to handle proxying of external CSS resources.
	 *
	 * @return void
	 */
	public function handle_css_proxy() {

		// Verify valid nonce.
		if ( empty( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['nonce'] ), self::NONCE_ACTION ) ) {
			wp_die( '', 400 );
		}

		// Make sure currently logged in as admin.
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( '', 400 );
		}

		// Reject any request made when not generating.
		if ( ! ( new Critical_CSS_State() )->is_requesting() ) {
			wp_die( '', 400 );
		}

		// Validate URL and fetch.
		$proxy_url = filter_var( wp_unslash( $_POST['proxy_url'] ?? '' ), FILTER_VALIDATE_URL );
		if ( ! wp_http_validate_url( $proxy_url ) ) {
			die( 'Invalid URL' );
		}

		$url_path = wp_parse_url( $proxy_url, PHP_URL_PATH );
		if ( ! $url_path || substr( strtolower( $url_path ), -4 ) !== '.css' ) {
			wp_die( 'Invalid CSS file URL', 400 );
		}

		$css = $this->get_proxied_css( $proxy_url );

		if ( $css ) {
			$this->serve_proxied_css( $css );
			die( 0 );
		}
	}

	/**
	 * Output the proxied CSS body with the appropriate headers.
	 *
	 * Separated from handle_css_proxy() so the output (and its </style
	 * neutralization) is testable without the request teardown (die()).
	 *
	 * @param string $css CSS body to serve.
	 */
	protected function serve_proxied_css( $css ) {
		if ( ! headers_sent() ) {
			header( 'Content-type: text/css' );
			header( 'X-Content-Type-Options: nosniff' );
		}

		/*
		 * Outputting proxied CSS contents unescaped. Do not strip tags here;
		 * valid CSS values may contain markup (e.g. inline SVGs in data: URIs),
		 * and stripping them corrupts the CSS fed to the generator. The
		 * text/css + nosniff headers stop a browser from sniffing this body as
		 * HTML; neutralizing </style is defense-in-depth in case the body is
		 * ever embedded inside a <style> element downstream.
		 */
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo Display_Critical_CSS::neutralize_style_closing_tags( $css );
	}

	/**
	 * Resolve the CSS for a proxied URL from cache, or by fetching and caching it.
	 *
	 * Separated from handle_css_proxy() so the cache/fetch logic is unit-testable
	 * without the surrounding request teardown (die()).
	 *
	 * @param string $proxy_url Validated external CSS URL.
	 * @return string The CSS body, or '' when there is none to serve.
	 */
	protected function get_proxied_css( $proxy_url ) {
		$cache_key = 'jb_css_proxy_' . md5( $proxy_url );
		$response  = get_transient( $cache_key );

		if ( is_array( $response ) && isset( $response['error'] ) ) {
			wp_die( esc_html( $response['error'] ), 400 );
		}

		if ( is_string( $response ) ) {
			// Cache hit: the transient stores the CSS body from a previous
			// successful fetch. Without this branch a cached body was ignored
			// (the handler saw no CSS), so it returned nothing to the Critical
			// CSS generator.
			return $response;
		}

		// Anything other than a missing entry (false) has been handled above.
		if ( false !== $response ) {
			return '';
		}

		$response = wp_safe_remote_get( $proxy_url );

		// A transport failure must fail loudly with a 5xx. Falling through would
		// either mis-cache it as a bad content type or (via die()) emit an HTTP
		// 200 the Critical CSS generator would happily consume as a stylesheet,
		// silently corrupting that provider's Critical CSS.
		if ( is_wp_error( $response ) ) {
			wp_die( '', 502 );
		}

		// Likewise, only a 2xx response is usable: an upstream 404/500 served with
		// a text/css content type must not be cached and served as valid CSS.
		$status_code = (int) wp_remote_retrieve_response_code( $response );
		if ( $status_code < 200 || $status_code >= 300 ) {
			wp_die( '', 502 );
		}

		$content_type = wp_remote_retrieve_header( $response, 'content-type' );
		if ( strpos( $content_type, 'text/css' ) === false ) {
			set_transient( $cache_key, array( 'error' => 'Invalid content type. Expected CSS.' ), HOUR_IN_SECONDS );
			wp_die( 'Invalid content type. Expected CSS.', 400 );
		}

		$css = wp_remote_retrieve_body( $response );

		// Only cache a non-empty body. Caching an empty string would make
		// is_string() cache hits replay it for the full TTL, pinning empty
		// CSS for an hour after a single transient empty/failed fetch.
		if ( '' !== $css ) {
			set_transient( $cache_key, $css, HOUR_IN_SECONDS );
		}

		return $css;
	}
}
