<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Guide;

use Automattic\Jetpack\Image_CDN\Image_CDN_Core;

/**
 * Add an ajax endpoint to proxy external CSS files.
 */
class Image_Guide_Proxy {
	const NONCE_ACTION = 'jb-ig-proxy-nonce';

	public static function init() {
		add_action( 'wp_ajax_boost_proxy_ig', array( __CLASS__, 'handle_proxy' ) );
	}

	/**
	 * AJAX handler to handle proxying of external image resources.
	 *
	 * @return never
	 */
	public static function handle_proxy() {
		// Verify valid nonce.
		if ( empty( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['nonce'] ), self::NONCE_ACTION ) ) {
			wp_send_json_error( 'bad nonce', 400 );
		}

		// Make sure currently logged in as admin.
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( 'not admin', 400 );
		}

		// Validate URL and fetch.
		$proxy_url = filter_var( wp_unslash( isset( $_POST['proxy_url'] ) ? $_POST['proxy_url'] : null ), FILTER_VALIDATE_URL );
		if ( ! wp_http_validate_url( $proxy_url ) ) {
			wp_send_json_error( 'Invalid URL', 400 );
		}

		$photon_url = Image_CDN_Core::cdn_url( $proxy_url );
		if ( ! Image_CDN_Core::is_cdn_url( $proxy_url ) ) {
			wp_send_json_error( 'Failed to proxy the image.', 400 );
		}

		$response = wp_safe_remote_get( $photon_url );
		if ( is_wp_error( $response ) ) {
			wp_send_json_error( 'error', 400 );
		}

		wp_send_json_success( iterator_to_array( wp_remote_retrieve_headers( $response ) ) );
	}
}
