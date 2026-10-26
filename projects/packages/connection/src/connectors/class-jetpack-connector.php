<?php
/**
 * Jetpack connector card for the WP core Connectors screen.
 *
 * Registers a connector in the WP 7.0+ Connectors registry and enqueues
 * a script module that provides a custom render function with connection
 * details (owner, connected plugins, disconnect).
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Identity_Crisis;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Terms_Of_Service;
use Automattic\Jetpack\Tracking;

/**
 * Jetpack connector card handler.
 *
 * @since 8.2.0
 */
class Jetpack_Connector {

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
	 * Path of the card's built script module relative to this file, without the extension.
	 *
	 * @since 9.11.0
	 *
	 * @var string
	 */
	const MODULE_FILE = '../../dist/connectors/connectors-card';

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
	 * Register Jetpack as a connector in the WP core Connectors screen.
	 *
	 * The wp_connectors_init action is available in WordPress 7.0+.
	 * On older versions this action never fires, so the hook is safely a no-op.
	 *
	 * @since 8.2.0
	 *
	 * @param \WP_Connector_Registry $registry Connector registry instance.
	 */
	public static function register_connector( $registry ) {
		$registry->register(
			'wordpress_com',
			array(
				'name'           => 'Jetpack Connection',
				'description'    => __( 'Enhanced functionality for Jetpack and WooCommerce with WordPress.com cloud services.', 'jetpack-connection' ),
				'type'           => 'cloud_service',
				'logo_url'       => static::get_connector_logo_url(),
				'authentication' => array(
					'method' => 'none',
				),
			)
		);
	}

	/**
	 * Enqueue the connectors card script module on the Settings > Connectors page.
	 *
	 * Skips the card when its built files are missing.
	 *
	 * @since 8.2.0
	 * @since 9.11.0 Loads the webpack build from dist/, with its dependencies and version from the asset file.
	 * @since 9.14.0 Loads the Tracks script when tracking is allowed.
	 */
	public static function enqueue_script_module() {
		$screen = get_current_screen();

		if ( ! $screen || ! static::is_connectors_screen( $screen ) ) {
			return;
		}

		if ( ! class_exists( 'WP_Connector_Registry' ) ) {
			return;
		}

		// The built files are missing in a checkout that hasn't run the build, or mid-deploy.
		$asset = static::get_module_asset( __DIR__ . '/' . static::MODULE_FILE );
		if ( null === $asset ) {
			return;
		}

		$css_path = __DIR__ . '/css/connectors-card.css';
		wp_enqueue_style(
			'jetpack-connector-card',
			plugins_url( 'css/connectors-card.css', __FILE__ ),
			array(),
			(string) @filemtime( $css_path ) // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- fallback to empty string if file is missing.
		);

		wp_register_script_module(
			static::MODULE_ID,
			// Resolve the '..' so core finds translations under the file's real path, as Assets::register_script() does.
			Assets::normalize_path( plugins_url( static::MODULE_FILE . '.js', __FILE__ ) ),
			$asset['module_dependencies'] ?? array(),
			$asset['version'] ?? false
		);
		// WP 7.0+; the Gutenberg plugin's Connectors screen can run on older cores.
		if ( function_exists( 'wp_set_script_module_translations' ) ) {
			wp_set_script_module_translations( static::MODULE_ID, 'jetpack-connection' );
		}
		wp_enqueue_script_module( static::MODULE_ID );

		// A script module can't depend on classic scripts, so the ones the card imports are enqueued beside it.
		// Assets::enqueue_script also loads the stylesheet registered with the handle.
		foreach ( $asset['dependencies'] ?? array() as $handle ) {
			Assets::enqueue_script( $handle );
		}

		// The shared components the card renders push Tracks events to _tkq; only w.js is needed to send them. Same gate as My Jetpack.
		if ( ( new Tracking() )->should_enable_tracking( new Terms_Of_Service(), new Status() ) ) {
			Tracking::register_tracks_functions_scripts();
			wp_enqueue_script( 'jp-tracks' );
		}

		add_filter(
			'script_module_data_' . static::MODULE_ID,
			array( static::class, 'get_connector_data' )
		);
	}

	/**
	 * Read the asset file the build emits beside the card's script module.
	 *
	 * @since 9.11.0
	 *
	 * @param string $module_path Path of the built module, without the extension.
	 * @return array|null Asset data, or null if the module or its asset file is missing, or the asset is invalid.
	 */
	private static function get_module_asset( $module_path ) {
		$asset_path = $module_path . '.asset.php';
		if ( ! file_exists( $module_path . '.js' ) || ! file_exists( $asset_path ) ) {
			return null;
		}

		$asset = require $asset_path;

		return is_array( $asset ) ? $asset : null;
	}

	/**
	 * Build the data passed to the script module via the script_module_data_ filter.
	 *
	 * Card-only data. Connection state that the package's components also read (registration,
	 * owner, viewer, connected plugins, offline mode) comes from the jetpack-connection store,
	 * which Initial_State fills, so it is not repeated here.
	 *
	 * @since 8.2.0
	 * @since 9.13.0 Shared connection state moved to the jetpack-connection store.
	 * @since 9.14.0 Adds `connectorsUrl`; sends `connectedUsersUrl` whenever there are account rows, including while the owner's token is broken.
	 *
	 * @param array $data Existing script module data.
	 * @return array Filtered script module data.
	 */
	public static function get_connector_data( $data ) {
		$manager       = new Manager();
		$is_registered = $manager->is_connected();

		$data['apiRoot']              = esc_url_raw( rest_url() );
		$data['apiNonce']             = wp_create_nonce( 'wp_rest' );
		$data['redirectUri']          = static::get_connectors_page_path();
		$data['connectorsUrl']        = admin_url( $data['redirectUri'] );
		$data['connectorName']        = 'Jetpack Connection';
		$data['connectorDescription'] = __( 'Enhanced functionality for Jetpack and WooCommerce with WordPress.com cloud services.', 'jetpack-connection' );
		$data['connectorLogoUrl']     = static::get_connector_logo_url();

		$connected_plugins   = $manager->get_connected_plugins();
		$connected_plugins   = is_array( $connected_plugins ) ? $connected_plugins : array();
		$data['pluginLogos'] = static::get_plugin_logos( array_keys( $connected_plugins ) );

		if ( $is_registered ) {
			$data['siteDetails'] = array(
				'siteUrl' => site_url(),
				'homeUrl' => home_url(),
			);

			if ( array_key_exists( 'jetpack', $connected_plugins ) ) {
				$data['ssoStatus'] = ( new Modules() )->is_active( 'sso', false );
			}

			static::add_identity_crisis_data( $data );
		}

		// Not gated on has_connected_owner(): it is false when the owner's token breaks,
		// and the card still lists the owner of record and a healthy viewer's account then.
		if ( $is_registered && ( (int) \Jetpack_Options::get_option( 'master_user' ) > 0 || $manager->is_user_connected() ) ) {
			$data['connectedUsersUrl'] = Users_Connection_Admin::get_connected_view_url();
		}

		$data['connectionOwnerEditUrl'] = static::get_connection_owner_edit_url( ( new Status() )->is_offline_mode() );

		$protected_owner = static::get_protected_owner_card_state( $manager );
		if ( null !== $protected_owner ) {
			$data['protectedOwner'] = $protected_owner;
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
	 * Add Jetpack Identity Crisis (Safe Mode) data to the script module data.
	 *
	 * Sent only in Safe Mode, which the card reads from the store's `connectionStatus.isInSafeMode`.
	 * The card uses it to render IDC resolution options (migrate / start fresh / stay in safe
	 * mode) in the expanded details. Mirrors the data assembled by
	 * \Automattic\Jetpack\IdentityCrisis\UI::get_initial_state_data().
	 *
	 * @since 8.7.0
	 * @since 9.13.0 No longer sends `isInSafeMode`; the card reads it from the store.
	 *
	 * @param array $data Script module data passed by reference.
	 */
	private static function add_identity_crisis_data( &$data ) {
		if ( ! class_exists( Identity_Crisis::class ) ) {
			return;
		}

		if ( ! ( new Status() )->in_safe_mode() ) {
			return;
		}

		$idc_urls = Identity_Crisis::get_mismatched_urls();

		$data['isSafeModeConfirmed'] = (bool) Identity_Crisis::$is_safe_mode_confirmed;
		$data['idc']                 = array(
			'currentUrl'                     => ( is_array( $idc_urls ) && array_key_exists( 'current_url', $idc_urls ) ) ? $idc_urls['current_url'] : home_url(),
			'wpcomHomeUrl'                   => ( is_array( $idc_urls ) && array_key_exists( 'wpcom_url', $idc_urls ) ) ? $idc_urls['wpcom_url'] : '',
			'isDevelopmentSite'              => (bool) Status::is_development_site(),
			'possibleDynamicSiteUrlDetected' => (bool) Identity_Crisis::detect_possible_dynamic_site_url(),
		);
	}

	/**
	 * Protected-owner state for the connector card.
	 *
	 * Omitted when nothing requests a protected owner and no anchor is stored,
	 * so the card keeps its current account sections. The status is
	 * Manager::resolve_protected_owner_state(), which the card switches on.
	 *
	 * `viewerIsConfirmedOwner` is that method's `is_current_user_the_po`. It tells the recovery
	 * copy apart: an owner whose own token broke is asked to reconnect, not to connect.
	 *
	 * The card always uses the package dialogs. `jetpack_connection_protected_owner_default_ui`
	 * is for a consumer's own surface, not this one.
	 *
	 * @since 9.9.0
	 *
	 * @param Manager $manager Connection manager instance.
	 * @return array{status: string, viewerIsConfirmedOwner: bool}|null
	 */
	private static function get_protected_owner_card_state( $manager ) {
		$requires = $manager->requires_protected_owner();
		$anchor   = Protected_Owner::get_locked();

		if ( ! $requires && ! $anchor ) {
			return null;
		}

		$state = $manager->resolve_protected_owner_state();

		// No anchor and this viewer cannot confirm: leave the card as it is.
		if ( ! $anchor && Manager::PO_STATE_NOT_ELIGIBLE === $state['status'] ) {
			return null;
		}

		return array(
			'status'                 => $state['status'],
			'viewerIsConfirmedOwner' => $state['is_current_user_the_po'],
		);
	}

	/**
	 * The connection owner's profile URL, for a viewer who may open it.
	 *
	 * Needs `jetpack_connect` outside offline mode, so a restricted site admin sees the name as plain
	 * text. get_edit_user_link() adds the `edit_user` check, since multisite site admins cannot edit other users.
	 *
	 * @since 9.13.0
	 *
	 * @param bool $is_offline_mode Whether the site is in offline mode.
	 * @return string|null
	 */
	private static function get_connection_owner_edit_url( $is_offline_mode ) {
		if ( ! $is_offline_mode && ! current_user_can( 'jetpack_connect' ) ) {
			return null;
		}

		$owner_id = (int) \Jetpack_Options::get_option( 'master_user' );
		$url      = $owner_id > 0 ? get_edit_user_link( $owner_id ) : '';

		return '' !== $url ? $url : null;
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
					'jetpack_connector_auth_error_' . $user_id,
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

		$key   = 'jetpack_connector_auth_error_' . $user_id;
		$error = get_transient( $key );
		if ( false !== $error ) {
			delete_transient( $key );
		}

		return $error;
	}

	/**
	 * Map connected plugin slugs to their logo URLs.
	 *
	 * The plugin list itself comes from the jetpack-connection store; logos stay here because
	 * third parties add them through a PHP filter.
	 *
	 * @since 9.13.0
	 *
	 * @param string[] $slugs Connected plugin slugs.
	 * @return array<string,string> Logo URL by slug, for slugs that have one.
	 */
	private static function get_plugin_logos( $slugs ) {
		$logos = array();

		foreach ( $slugs as $slug ) {
			$logo_url = static::get_plugin_logo_url( (string) $slug );
			if ( $logo_url ) {
				$logos[ $slug ] = $logo_url;
			}
		}

		return $logos;
	}

	/**
	 * Detect which plugin families are using the connection.
	 *
	 * @since 8.5.0
	 *
	 * @return array{has_woo: bool, has_a4a: bool}
	 */
	public static function get_connected_plugin_families() {
		$plugins = Plugin_Storage::get_all();

		$has_woo = false;
		$has_a4a = false;

		if ( is_array( $plugins ) ) {
			foreach ( array_keys( $plugins ) as $slug ) {
				if ( str_starts_with( $slug, 'woocommerce' ) ) {
					$has_woo = true;
				}
				if ( str_starts_with( $slug, 'automattic' ) ) {
					$has_a4a = true;
				}
			}
		}

		return array(
			'has_woo' => $has_woo,
			'has_a4a' => $has_a4a,
		);
	}

	/**
	 * Determine the connector card logo based on which plugin families are connected.
	 *
	 * Priority:
	 * 1. Both Woo-family and A4A plugins → jetpack-connect-all.svg
	 * 2. Woo-family only                 → jetpack-connect-woo.svg
	 * 3. A4A only                        → jetpack-connect-a8c.svg
	 * 4. Default (Jetpack only or other) → jetpack-connect.svg
	 *
	 * @since 8.3.2
	 *
	 * @return string Logo URL.
	 */
	public static function get_connector_logo_url() {
		$families = self::get_connected_plugin_families();

		if ( $families['has_woo'] && $families['has_a4a'] ) {
			return plugins_url( 'images/jetpack-connect-all.svg', __FILE__ );
		}

		if ( $families['has_woo'] ) {
			return plugins_url( 'images/jetpack-connect-woo.svg', __FILE__ );
		}

		if ( $families['has_a4a'] ) {
			return plugins_url( 'images/jetpack-connect-a8c.svg', __FILE__ );
		}

		return plugins_url( 'images/jetpack-connect.svg', __FILE__ );
	}

	/**
	 * Get the inline (single-row) connector logo for use in compact contexts like table cells.
	 *
	 * All circles are arranged horizontally in a single row, unlike the card
	 * logos which stack circles vertically for 3+ plugins.
	 *
	 * @since 8.5.0
	 *
	 * @return string Logo URL.
	 */
	public static function get_inline_connector_logo_url() {
		$families = self::get_connected_plugin_families();

		if ( $families['has_woo'] && $families['has_a4a'] ) {
			return plugins_url( 'images/jetpack-connect-all-inline.svg', __FILE__ );
		}

		if ( $families['has_woo'] ) {
			return plugins_url( 'images/jetpack-connect-woo-inline.svg', __FILE__ );
		}

		if ( $families['has_a4a'] ) {
			return plugins_url( 'images/jetpack-connect-a8c-inline.svg', __FILE__ );
		}

		return plugins_url( 'images/jetpack-connect.svg', __FILE__ );
	}

	/**
	 * Map a plugin slug to a brand logo URL.
	 *
	 * Jetpack-family plugins get the Jetpack mark, WooCommerce-family
	 * plugins get the Woo mark, and Automattic for Agencies gets the
	 * Automattic mark. Unknown slugs fall through to the
	 * `jetpack_connection_plugin_logo_url` filter so that third-party
	 * plugins can register their own logo. Only SVG URLs are accepted
	 * to keep the icons sharp at every display density.
	 *
	 * @since 8.3.2
	 *
	 * @param string $slug Plugin slug.
	 * @return string|null Logo URL or null.
	 */
	private static function get_plugin_logo_url( $slug ) {
		if ( str_starts_with( $slug, 'jetpack' ) ) {
			return plugins_url( 'images/jetpack-icon.svg', __FILE__ ); // str_starts_with() is polyfilled by WP since 5.9; this code only runs on WP 7.0+.
		}

		if ( str_starts_with( $slug, 'woocommerce' ) ) {
			return plugins_url( 'images/woo-icon.svg', __FILE__ );
		}

		if ( str_starts_with( $slug, 'automattic' ) ) {
			return plugins_url( 'images/automattic-icon.svg', __FILE__ );
		}

		/**
		 * Filters a map of plugin slugs to custom logo URLs for the
		 * Settings → Connectors card.
		 *
		 * Add entries as `$slug => $url` pairs. URLs must point to an
		 * SVG file (`.svg` extension required); non-SVG values are
		 * silently ignored and the generic fallback icon is shown.
		 *
		 * Example:
		 *
		 *     add_filter( 'jetpack_connection_plugin_logos', function ( $logos ) {
		 *         $logos['my-plugin'] = plugins_url( 'assets/logo.svg', __FILE__ );
		 *         return $logos;
		 *     } );
		 *
		 * @since 8.3.2
		 *
		 * @param array<string,string> $logos Map of plugin slug to SVG URL.
		 */
		$logos = apply_filters( 'jetpack_connection_plugin_logos', array() );

		if ( isset( $logos[ $slug ] ) && is_string( $logos[ $slug ] ) && str_ends_with( strtolower( $logos[ $slug ] ), '.svg' ) ) {
			return esc_url( $logos[ $slug ] );
		}

		return null;
	}
}
