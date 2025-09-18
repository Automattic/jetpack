<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Plugin Name: WooCommerce Analytics - Proxy Speed Module
 * Description: Speeds up WooCommerce Analytics' proxy for avoiding ad blockers.
 * Plugin URI: https://woocommerce.com
 * Author: WooCommerce
 * Version: 1.0.0
 * Author URI: https://woocommerce.com
 *
 * Text Domain: woocommerce-analytics
 *
 * Inspired by: https://github.com/plausible/wordpress/blob/092b97b247f45bf347ae32f9614f20a81d9e10c0/mu-plugin/plausible-proxy-speed-module.php
 */
class WooCommerceAnalyticsProxySpeed {
	/**
	 * Is current request a request to our proxy?
	 *
	 * @var bool
	 */
	private $is_proxy_request = false;

	/**
	 * Current request URI.
	 *
	 * @var string
	 */
	private $request_uri = '';

	/**
	 * Path of the proxy request.
	 *
	 * @var string
	 */
	private $path = 'woocommerce-analytics/v1/track';

	/**
	 * Allowed plugin files.
	 *
	 * @var array
	 */
	private $allowed_plugin_files = array( 'woocommerce.php', 'woocommerce-analytics.php', 'jetpack.php' );

	/**
	 * Build properties.
	 *
	 * @return void
	 */
	public function __construct() {
		$this->request_uri      = $this->get_request_uri();
		$this->is_proxy_request = $this->is_proxy_request();

		$this->init();
	}

	/**
	 * Helper method to retrieve Request URI. Checks several globals.
	 *
	 * @return mixed
	 */
	private function get_request_uri() {
		return isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	}

	/**
	 * Check if current request is a proxy request.
	 *
	 * @return bool
	 */
	private function is_proxy_request() {

		if ( ! $this->path ) {
			return false;
		}

		return strpos( $this->request_uri, $this->path ) !== false;
	}

	/**
	 * Add filters and actions.
	 *
	 * @return void
	 */
	private function init() {
		add_filter( 'option_active_plugins', array( $this, 'filter_active_plugins' ) );
	}

	/**
	 * Filter the list of active plugins for custom endpoint requests.
	 *
	 * @param array $active_plugins The list of active plugins.
	 *
	 * @return array The filtered list of active plugins.
	 */
	public function filter_active_plugins( $active_plugins ) {
		if ( ! $this->is_proxy_request || ! is_array( $active_plugins ) ) {
			return $active_plugins;
		}

		$filtered_plugins = array();

		foreach ( $active_plugins as $plugin ) {
			foreach ( $this->allowed_plugin_files as $allowed_plugin_file ) {
				if ( strpos( $plugin, $allowed_plugin_file ) !== false ) {
					$filtered_plugins[] = $plugin;
					break;
				}
			}
		}

		return $filtered_plugins;
	}
}

new WooCommerceAnalyticsProxySpeed(); // @phan-suppress-current-line PhanNoopNew
