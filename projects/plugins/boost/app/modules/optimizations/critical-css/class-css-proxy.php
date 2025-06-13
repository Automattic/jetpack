<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;

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
		$proxy_url = filter_var( wp_unslash( isset( $_POST['proxy_url'] ) ? $_POST['proxy_url'] : null ), FILTER_VALIDATE_URL );
		if ( ! wp_http_validate_url( $proxy_url ) ) {
			die( 'Invalid URL' );
		}

		$url_path = wp_parse_url( $proxy_url, PHP_URL_PATH );
		if ( ! $url_path || substr( strtolower( $url_path ), -4 ) !== '.css' ) {
			wp_die( 'Invalid CSS file URL', 400 );
		}

		$cache_key = 'jb_css_proxy_' . md5( $proxy_url );
		$response  = get_transient( $cache_key );

		if ( is_array( $response ) && isset( $response['error'] ) ) {
			wp_die( esc_html( $response['error'] ), 400 );
		}

		$css = '';
		if ( false === $response ) {
			$response     = wp_safe_remote_get( $proxy_url );
			$content_type = wp_remote_retrieve_header( $response, 'content-type' );
			if ( strpos( $content_type, 'text/css' ) === false ) {
				set_transient( $cache_key, array( 'error' => 'Invalid content type. Expected CSS.' ), HOUR_IN_SECONDS );
				wp_die( 'Invalid content type. Expected CSS.', 400 );
			}
			$css = wp_remote_retrieve_body( $response );
			set_transient( $cache_key, $css, HOUR_IN_SECONDS );
		}

		if ( is_wp_error( $response ) ) {
			// TODO: Nicer error handling.
			die( 'error' );
		}

		if ( $css ) {
			header( 'Content-type: text/css' );
			// Outputting proxied CSS contents unescaped.
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo wp_strip_all_tags( $css );
			die( 0 );
		}
	}
}
