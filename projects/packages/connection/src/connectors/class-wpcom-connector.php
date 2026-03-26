<?php
/**
 * WordPress.com connector card for the WP core Connectors screen.
 *
 * Registers a connector in the WP 7.0+ Connectors registry and enqueues
 * a script module that provides a custom render function with connection
 * details (owner, connected plugins, disconnect).
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * WordPress.com connector card handler.
 *
 * @since $$next-version$$
 */
class Wpcom_Connector {

	/**
	 * Whether the connector has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Script module identifier.
	 *
	 * @var string
	 */
	const MODULE_ID = '@automattic/jetpack-connection-connectors';

	/**
	 * Initialize the connector.
	 */
	public static function init() {
		if ( static::$initialized ) {
			return;
		}
		static::$initialized = true;

		add_action( 'wp_connectors_init', array( static::class, 'register_connector' ) );
		add_action( 'admin_enqueue_scripts', array( static::class, 'enqueue_script_module' ) );
	}

	/**
	 * Register WordPress.com as a connector in the WP core Connectors screen.
	 *
	 * The wp_connectors_init action is available in WordPress 7.0+.
	 * On older versions this action never fires, so the hook is safely a no-op.
	 *
	 * @since $$next-version$$
	 *
	 * @param \WP_Connector_Registry $registry Connector registry instance.
	 */
	public static function register_connector( $registry ) {
		// @phan-suppress-previous-line PhanUndeclaredTypeParameter -- WP 7.0+ class.
		$registry->register( // @phan-suppress-current-line PhanUndeclaredClassMethod -- WP 7.0+ class.
			'wordpress_com',
			array(
				'name'           => __( 'WordPress.com account', 'jetpack-connection' ),
				'description'    => __( 'Connect your site to WordPress.com for enhanced functionality, Jetpack and WooCommerce services.', 'jetpack-connection' ),
				'type'           => 'cloud_service',
				'logo_url'       => plugins_url( 'images/wpcom-logo.svg', __FILE__ ),
				'authentication' => array(
					'method' => 'none',
				),
			)
		);
	}

	/**
	 * Enqueue the connectors card script module on the Settings > Connectors page.
	 *
	 * @since $$next-version$$
	 */
	public static function enqueue_script_module() {
		$screen = get_current_screen();

		if ( ! $screen || 'options-connectors' !== $screen->id ) {
			return;
		}

		if ( ! class_exists( 'WP_Connector_Registry' ) ) {
			return;
		}

		wp_register_script_module(
			static::MODULE_ID,
			plugins_url( 'js/connectors-card.js', __FILE__ ),
			array(
				array(
					'id'     => '@wordpress/connectors',
					'import' => 'static',
				),
			)
		);
		wp_enqueue_script_module( static::MODULE_ID );

		add_filter(
			'script_module_data_' . static::MODULE_ID,
			array( static::class, 'get_connector_data' )
		);
	}

	/**
	 * Build the data passed to the script module via the script_module_data_ filter.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $data Existing script module data.
	 * @return array Filtered script module data.
	 */
	public static function get_connector_data( $data ) {
		$manager      = new Manager();
		$is_connected = $manager->is_connected() && $manager->has_connected_owner();

		$data['isConnected']  = $is_connected;
		$data['isRegistered'] = $manager->is_connected();
		$data['apiRoot']      = esc_url_raw( rest_url() );
		$data['apiNonce']     = wp_create_nonce( 'wp_rest' );
		$data['redirectUri']  = static::get_connectors_page_path();

		if ( $is_connected ) {
			$data['connectionOwner']  = static::get_connection_owner_data( $manager );
			$data['connectedPlugins'] = static::get_connected_plugins_data( $manager );
		}

		return $data;
	}

	/**
	 * Get the connection owner details for the script module.
	 *
	 * @param Manager $manager Connection manager instance.
	 * @return array|null Owner data or null if unavailable.
	 */
	private static function get_connection_owner_data( $manager ) {
		$owner = $manager->get_connection_owner();

		if ( false === $owner ) {
			return null;
		}

		$wpcom_user_data = $manager->get_connected_user_data( $owner->ID );

		$display_name = $owner->display_name;
		$login        = $owner->user_login;

		if ( is_array( $wpcom_user_data ) ) {
			if ( ! empty( $wpcom_user_data['display_name'] ) ) {
				$display_name = $wpcom_user_data['display_name'];
			}
			if ( ! empty( $wpcom_user_data['login'] ) ) {
				$login = $wpcom_user_data['login'];
			}
		}

		return array(
			'displayName' => $display_name,
			'login'       => $login,
			'avatar'      => get_avatar_url(
				$owner->ID,
				array(
					'size'    => 48,
					'default' => 'mysteryman',
				)
			),
		);
	}

	/**
	 * Return the admin-relative path for the Connectors page.
	 *
	 * WP 7.0 core uses the standalone `options-connectors.php` file while
	 * the Gutenberg plugin registers a submenu page under options-general.php
	 * with slug `options-connectors-wp-admin`. Both set parent_file to
	 * `options-general.php` for menu highlighting, so we distinguish them by
	 * checking the actual script filename being served.
	 *
	 * The result is suitable for the `redirect_uri` parameter accepted by the
	 * `jetpack/v4/connection/register` REST endpoint (which wraps it in `admin_url()`).
	 *
	 * @return string Admin-relative path, e.g. 'options-connectors.php'.
	 */
	private static function get_connectors_page_path() {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- only compared against a hardcoded string.
		$script = isset( $_SERVER['SCRIPT_NAME'] ) ? wp_basename( wp_unslash( $_SERVER['SCRIPT_NAME'] ) ) : '';

		if ( 'options-connectors.php' === $script ) {
			return 'options-connectors.php';
		}

		// Gutenberg plugin registers the page under options-general.php.
		$screen = get_current_screen();
		if ( $screen ) {
			return 'options-general.php?page=' . rawurlencode( $screen->id );
		}

		return 'options-connectors.php';
	}

	/**
	 * Get connected plugins data for the script module.
	 *
	 * @param Manager $manager Connection manager instance.
	 * @return array List of connected plugin data.
	 */
	private static function get_connected_plugins_data( $manager ) {
		$plugins = $manager->get_connected_plugins();

		if ( is_wp_error( $plugins ) || ! is_array( $plugins ) ) {
			return array();
		}

		$result = array();

		foreach ( $plugins as $slug => $plugin_data ) {
			$name = isset( $plugin_data['name'] ) ? $plugin_data['name'] : $slug;

			$result[] = array(
				'name' => $name,
				'slug' => $slug,
			);
		}

		return $result;
	}
}
