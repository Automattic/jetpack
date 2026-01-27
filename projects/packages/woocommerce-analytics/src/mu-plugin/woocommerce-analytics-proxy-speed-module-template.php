<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Plugin Name: WooCommerce Analytics - Proxy Speed Module
 * Description: Speeds up WooCommerce Analytics' proxy by handling requests at MU-plugin stage and exiting early.
 * Plugin URI: https://woocommerce.com
 * Author: WooCommerce
 * Version: {{VERSION}}
 * Author URI: https://woocommerce.com
 *
 * Text Domain: woocommerce-analytics
 *
 * This module intercepts proxy tracking requests at the MU-plugin stage (before regular plugins load)
 * and handles them completely, then exits. This dramatically reduces response time by avoiding
 * the full WordPress plugin initialization.
 */

/**
 * WooCommerce Analytics Proxy Speed Module
 */
class WooCommerceAnalyticsProxySpeed {

	/**
	 * Path of the proxy request.
	 *
	 * @var string
	 */
	const PROXY_REQUEST_PATH = 'woocommerce-analytics/v1/track';

	/**
	 * Autoloader path - this placeholder is replaced during installation.
	 * DO NOT MODIFY - this value is injected by the parent plugin.
	 *
	 * @var string
	 */
	const AUTOLOADER_PATH = '{{AUTOLOADER_PATH}}';

	/**
	 * Initialize the proxy speed module.
	 *
	 * @return void
	 */
	public function init() {
		// Only intercept POST requests to the proxy endpoint.
		if ( ! $this->is_proxy_request() ) {
			return;
		}

		// If autoloader failed, let WordPress continue loading
		// and fallback to the regular REST API.
		if ( ! $this->load_autoloader() ) {
			return;
		}

		// Handle the request completely and exit.
		$this->handle_proxy_request();
		exit;
	}

	/**
	 * Check if current request is a proxy request.
	 *
	 * @return bool
	 */
	private function is_proxy_request() {
		if ( 'POST' !== $this->get_request_method() ) {
			return false;
		}

		$request_uri = $this->get_request_uri();
		$path        = wp_parse_url( $request_uri, PHP_URL_PATH );

		if ( ! is_string( $path ) || '' === $path ) {
			return false;
		}

		$normalized_path = rtrim( $path, '/' );
		$proxy_suffix    = '/' . ltrim( self::PROXY_REQUEST_PATH, '/' );

		if ( strlen( $normalized_path ) < strlen( $proxy_suffix ) ) {
			return false;
		}

		return substr( $normalized_path, -strlen( $proxy_suffix ) ) === $proxy_suffix;
	}

	/**
	 * Load the autoloader.
	 *
	 * At MU-plugin stage, plugins haven't loaded yet, so we bootstrap
	 * the autoloader directly using the path injected during installation.
	 *
	 * @return bool True if autoloader loaded and classes are available.
	 */
	private function load_autoloader() {
		$autoload_path = self::AUTOLOADER_PATH;

		// Validate the path was properly injected (not still a placeholder).
		if ( strpos( $autoload_path, '{{' ) !== false ) {
			return false;
		}

		if ( file_exists( $autoload_path ) ) {
			require_once $autoload_path;
			return class_exists( '\Automattic\Woocommerce_Analytics\WC_Analytics_Tracking' );
		}

		return false;
	}

	/**
	 * Handle the proxy request completely.
	 *
	 * Processes the events and sends the response without loading
	 * regular WordPress plugins.
	 *
	 * @return void
	 */
	private function handle_proxy_request() {
		// Set headers for JSON response.
		if ( ! headers_sent() ) {
			header( 'Content-Type: application/json; charset=utf-8' );
			header( 'Cache-Control: no-cache, must-revalidate' );
		}

		// Apply magic quotes to the $_COOKIE superglobal so it's compatible with the regular API flow.
		if ( function_exists( 'wp_magic_quotes' ) ) {
			wp_magic_quotes();
		}

		// Parse the request body.
		$body = file_get_contents( 'php://input' );
		if ( empty( $body ) ) {
			$this->send_json_response(
				array(
					'success' => false,
					'error'   => 'Empty request body',
				),
				400
			);
			return;
		}

		$events = json_decode( $body, true );
		if ( json_last_error() !== JSON_ERROR_NONE ) {
			$this->send_json_response(
				array(
					'success' => false,
					'error'   => 'Invalid JSON',
				),
				400
			);
			return;
		}

		// Normalize single event to array.
		if ( ! is_array( $events ) || isset( $events['event_name'] ) ) {
			$events = array( $events );
		}

		// Process events.
		$results    = array();
		$has_errors = false;

		foreach ( $events as $index => $event ) {
			// Validate event structure.
			if ( empty( $event ) || ! is_array( $event ) ) {
				$results[ $index ] = array(
					'success' => false,
					'error'   => 'Invalid event format',
				);
				$has_errors        = true;
				continue;
			}

			// Validate event name and properties.
			$event_name = $event['event_name'] ?? null;
			$properties = $event['properties'] ?? array();

			if ( ! $event_name || ! is_array( $properties ) ) {
				$results[ $index ] = array(
					'success' => false,
					'error'   => 'Missing event_name or invalid properties',
				);
				$has_errors        = true;
				continue;
			}

			// Record the event.
			$result = \Automattic\Woocommerce_Analytics\WC_Analytics_Tracking::record_event( $event_name, $properties );

			if ( is_wp_error( $result ) ) {
				$results[ $index ] = array(
					'success' => false,
					'error'   => $result->get_error_message(),
				);
				$has_errors        = true;
				continue;
			}

			$results[ $index ] = array( 'success' => true );
		}

		// Flush any batched pixels before exiting.
		\Automattic\Woocommerce_Analytics\WC_Analytics_Tracking::send_batched_pixels();

		// Send response.
		$this->send_json_response(
			array(
				'success'               => ! $has_errors,
				'results'               => $results,
				'is_proxy_speed_module' => true,
			),
			$has_errors ? 207 : 200
		);
	}

	/**
	 * Send a JSON response.
	 *
	 * @param array $data Response data.
	 * @param int   $status_code HTTP status code.
	 * @return void
	 */
	private function send_json_response( $data, $status_code = 200 ) {
		http_response_code( $status_code );
		echo wp_json_encode( $data, JSON_UNESCAPED_SLASHES );
	}

	/**
	 * Helper method to retrieve Request URI.
	 *
	 * Returns a normalized and validated path component derived from
	 * $_SERVER['REQUEST_URI'] for safe internal matching.
	 *
	 * @return string
	 */
	private function get_request_uri() {
		$raw_uri = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

		if ( ! is_string( $raw_uri ) ) {
			return '';
		}

		// Extract just the path component to avoid matching against query strings, etc.
		$path = wp_parse_url( $raw_uri, PHP_URL_PATH );

		if ( ! is_string( $path ) ) {
			return '';
		}

		// Ensure the path contains only expected URL path characters.
		if ( preg_match( '/[^A-Za-z0-9\-._~\/]/', $path ) ) {
			return '';
		}

		return $path;
	}

	/**
	 * Helper method to get request method.
	 *
	 * @return string
	 */
	private function get_request_method() {
		return isset( $_SERVER['REQUEST_METHOD'] ) ? strtoupper( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	}
}

( new WooCommerceAnalyticsProxySpeed() )->init();
