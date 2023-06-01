<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Guide;

/**
 * Add an ajax endpoint to proxy external CSS files.
 */
class Image_Guide_Proxy {
	const NONCE_ACTION = 'jb-ig-proxy-nonce';

	public static function init() {
		$instance = new self();
		add_action( 'wp_ajax_boost_proxy_ig', array( $instance, 'handle_ig_proxy' ) );
	}

	/**
	 * AJAX handler to handle proxying of external image resources.
	 */
	public function handle_ig_proxy() {
		// Verify valid nonce.
		if ( empty( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['nonce'] ), self::NONCE_ACTION ) ) {
			wp_die( 'bad nonce', 400 );
		}

		// Make sure currently logged in as admin.
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'not admin', 400 );
		}

		// Validate URL and fetch.
		$proxy_url = filter_var( wp_unslash( isset( $_POST['proxy_url'] ) ? $_POST['proxy_url'] : null ), FILTER_VALIDATE_URL );
		if ( ! wp_http_validate_url( $proxy_url ) ) {
			die( 'Invalid URL' );
		}

		$response = wp_remote_get( $proxy_url );
		if ( is_wp_error( $response ) ) {
			// TODO: Nicer error handling.
			die( 'error' );
		}

		header( 'Content-type: text/html' );
		echo (int) $response['headers']['content-length'];

		die();
	}
}
