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

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;

/**
 * WordPress.com connector card handler.
 *
 * @since 8.2.0
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
	 * Screen ID assigned by WordPress to the Gutenberg plugin's connectors submenu page.
	 *
	 * @var string
	 */
	const GUTENBERG_CONNECTORS_SCREEN_ID = 'settings_page_options-connectors-wp-admin';

	/**
	 * Page slug registered by the Gutenberg plugin for the connectors submenu page.
	 *
	 * @var string
	 */
	const GUTENBERG_CONNECTORS_PAGE_SLUG = 'options-connectors-wp-admin';

	/**
	 * Initialize the connector.
	 */
	public static function init() {
		if ( static::$initialized ) {
			return;
		}
		static::$initialized = true;

		add_action( 'wp_connectors_init', array( static::class, 'register_connector' ), 20 );
		add_action( 'admin_enqueue_scripts', array( static::class, 'enqueue_script_module' ) );
		add_action( 'jetpack_client_authorize_error', array( static::class, 'store_auth_error' ) );
	}

	/**
	 * Register WordPress.com as a connector in the WP core Connectors screen.
	 *
	 * The wp_connectors_init action is available in WordPress 7.0+.
	 * On older versions this action never fires, so the hook is safely a no-op.
	 *
	 * @since 8.2.0
	 *
	 * @param \WP_Connector_Registry $registry Connector registry instance.
	 */
	public static function register_connector( $registry ) {
		// @phan-suppress-previous-line PhanUndeclaredTypeParameter -- WP 7.0+ class.
		$registry->register( // @phan-suppress-current-line PhanUndeclaredClassMethod -- WP 7.0+ class.
			'wordpress_com',
			array(
				'name'           => 'WordPress.com',
				'description'    => __( 'Enhanced functionality with Jetpack and WooCommerce.', 'jetpack-connection' ),
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
	 * @since 8.2.0
	 */
	public static function enqueue_script_module() {
		$screen = get_current_screen();

		if ( ! $screen || ! static::is_connectors_screen( $screen ) ) {
			return;
		}

		if ( ! class_exists( 'WP_Connector_Registry' ) ) {
			return;
		}

		$css_path = __DIR__ . '/css/connectors-card.css';
		wp_enqueue_style(
			'wpcom-connector-card',
			plugins_url( 'css/connectors-card.css', __FILE__ ),
			array(),
			(string) @filemtime( $css_path ) // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- fallback to empty string if file is missing.
		);

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
	 * @since 8.2.0
	 *
	 * @param array $data Existing script module data.
	 * @return array Filtered script module data.
	 */
	public static function get_connector_data( $data ) {
		$manager       = new Manager();
		$is_registered = $manager->is_connected();
		$is_connected  = $is_registered && $manager->has_connected_owner();

		$data['isConnected']          = $is_connected;
		$data['isRegistered']         = $is_registered;
		$data['apiRoot']              = esc_url_raw( rest_url() );
		$data['apiNonce']             = wp_create_nonce( 'wp_rest' );
		$data['redirectUri']          = static::get_connectors_page_path();
		$data['connectorName']        = 'WordPress.com';
		$data['connectorDescription'] = __( 'Enhanced functionality with Jetpack and WooCommerce.', 'jetpack-connection' );
		$data['connectorLogoUrl']     = plugins_url( 'images/wpcom-logo.svg', __FILE__ );

		if ( $is_registered ) {
			$data['connectedPlugins'] = static::get_connected_plugins_data( $manager );
			$data['siteDetails']      = array(
				'blogId'  => (int) \Jetpack_Options::get_option( 'id' ),
				'siteUrl' => site_url(),
				'homeUrl' => home_url(),
			);

			if ( in_array( 'jetpack', array_column( $data['connectedPlugins'], 'slug' ), true ) ) {
				$data['ssoStatus'] = ( new Modules() )->is_active( 'sso', false );
			}
		}

		if ( $is_connected ) {
			$data['currentUser']     = static::get_current_user_data( $manager );
			$data['connectionOwner'] = static::get_connection_owner_data( $manager );
		}

		$host              = new Host();
		$data['isWoaSite'] = $host->is_woa_site();
		$data['isVipSite'] = $host->is_vip_site();

		$auth_error = static::consume_auth_error();
		if ( $auth_error ) {
			$data['authError'] = $auth_error;
		}

		return $data;
	}

	/**
	 * Get the current (logged-in) user's connection details.
	 *
	 * @param Manager $manager Connection manager instance.
	 * @return array|null Current user data or null if not connected.
	 */
	private static function get_current_user_data( $manager ) {
		$user_id = get_current_user_id();

		if ( ! $user_id || ! $manager->is_user_connected( $user_id ) ) {
			return null;
		}

		$user      = get_userdata( $user_id );
		$user_info = static::resolve_user_fields( $user, $manager->get_connected_user_data( $user_id ) );
		$is_owner  = $manager->is_connection_owner( $user_id );

		$has_other_connected_users = false;
		if ( $is_owner ) {
			$connected_users           = $manager->get_connected_users( 'any', 2 );
			$has_other_connected_users = count( $connected_users ) > 1;
		}

		return array_merge(
			$user_info,
			array(
				'isOwner'                => $is_owner,
				'hasOtherConnectedUsers' => $has_other_connected_users,
			)
		);
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

		$fields = static::resolve_user_fields( $owner, $manager->get_connected_user_data( $owner->ID ) );

		$fields['localLogin'] = $owner->user_login;

		return $fields;
	}

	/**
	 * Merge local WP user fields with WordPress.com user data.
	 *
	 * WPCOM values take precedence when available. Returns the common
	 * user shape used by both currentUser and connectionOwner.
	 *
	 * @param \WP_User|false $wp_user        Local WordPress user object (false if unavailable).
	 * @param array|false    $wpcom_user_data WPCOM user data from the connection manager.
	 * @return array User data with displayName, login, email, and avatar.
	 */
	private static function resolve_user_fields( $wp_user, $wpcom_user_data ) {
		$display_name = $wp_user ? $wp_user->display_name : '';
		$login        = $wp_user ? $wp_user->user_login : '';
		$email        = $wp_user ? $wp_user->user_email : '';

		if ( is_array( $wpcom_user_data ) ) {
			if ( ! empty( $wpcom_user_data['display_name'] ) ) {
				$display_name = $wpcom_user_data['display_name'];
			}
			if ( ! empty( $wpcom_user_data['login'] ) ) {
				$login = $wpcom_user_data['login'];
			}
			if ( ! empty( $wpcom_user_data['email'] ) ) {
				$email = $wpcom_user_data['email'];
			}
		}

		$user_id = $wp_user ? $wp_user->ID : 0;

		return array(
			'displayName' => $display_name,
			'login'       => $login,
			'email'       => $email,
			'avatar'      => $user_id
				? get_avatar_url(
					$user_id,
					array(
						'size'    => 48,
						'default' => 'mysteryman',
					)
				)
				: '',
		);
	}

	/**
	 * Check whether the given screen is the Connectors settings page.
	 *
	 * Handles both WP 7.0 core (`options-connectors`) and the Gutenberg
	 * plugin (`settings_page_options-connectors-wp-admin`).
	 *
	 * @param \WP_Screen $screen Current admin screen.
	 * @return bool
	 */
	private static function is_connectors_screen( $screen ) {
		return 'options-connectors' === $screen->id
			|| static::GUTENBERG_CONNECTORS_SCREEN_ID === $screen->id;
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
	 * Note: for the Gutenberg case we use the registered page slug directly,
	 * not `$screen->id`. WordPress auto-prefixes screen IDs for submenu pages
	 * (e.g. `settings_page_options-connectors-wp-admin`), so using `$screen->id`
	 * as the `page=` parameter produces an invalid URL.
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
		if ( $screen && static::GUTENBERG_CONNECTORS_SCREEN_ID === $screen->id ) {
			return 'options-general.php?page=' . static::GUTENBERG_CONNECTORS_PAGE_SLUG;
		}

		return 'options-connectors.php';
	}

	/**
	 * Store an authorization error in a short-lived transient.
	 *
	 * Hooked to `jetpack_client_authorize_error` which fires when
	 * the auth webhook fails. The transient is read on the next
	 * Connectors page load so the JS card can display the error.
	 *
	 * @since 8.2.0
	 *
	 * @param \WP_Error $error Authorization error.
	 */
	public static function store_auth_error( $error ) {
		if ( is_wp_error( $error ) ) {
			$user_id = get_current_user_id();
			if ( $user_id ) {
				set_transient(
					'wpcom_connector_auth_error_' . $user_id,
					$error->get_error_message(),
					60
				);
			}
		}
	}

	/**
	 * Read and delete a stored authorization error for the current user.
	 *
	 * @return string|false Error message or false if none.
	 */
	private static function consume_auth_error() {
		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return false;
		}

		$key   = 'wpcom_connector_auth_error_' . $user_id;
		$error = get_transient( $key );
		if ( false !== $error ) {
			delete_transient( $key );
		}

		return $error;
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
			$name = $plugin_data['name'] ?? $slug;

			$entry = array(
				'name' => $name,
				'slug' => $slug,
			);

			$logo_url = static::get_plugin_logo_url( $slug );
			if ( $logo_url ) {
				$entry['logoUrl'] = $logo_url;
			}

			$result[] = $entry;
		}

		return $result;
	}

	/**
	 * Map a plugin slug to a brand logo URL.
	 *
	 * Jetpack-family plugins get the Jetpack mark, WooCommerce-family
	 * plugins get the Woo mark, and Automattic for Agencies gets the
	 * Automattic mark. Unknown slugs return null (the JS falls back
	 * to a generic dashicon).
	 *
	 * @param string $slug Plugin slug.
	 * @return string|null Logo URL or null.
	 */
	private static function get_plugin_logo_url( $slug ) {
		if ( str_starts_with( $slug, 'jetpack' ) ) {
			return plugins_url( 'images/jetpack-icon.svg', __FILE__ ); // str_starts_with() is polyfilled by WP since 5.9; this code only runs on WP 7.0+.
		}

		if ( str_starts_with( $slug, 'woocommerce' ) || str_starts_with( $slug, 'woo' ) ) {
			return plugins_url( 'images/woo-icon.svg', __FILE__ );
		}

		if ( str_starts_with( $slug, 'automattic' ) ) {
			return plugins_url( 'images/automattic-icon.svg', __FILE__ );
		}

		return null;
	}
}
