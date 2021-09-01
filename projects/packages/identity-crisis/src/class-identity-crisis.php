<?php
/**
 * Identity_Crisis package.
 *
 * @package  automattic/jetpack-identity-crisis
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Assets\Logo as Jetpack_Logo;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Urls;
use Automattic\Jetpack\Constants as Constants;
use Automattic\Jetpack\Status as Status;
use Automattic\Jetpack\Tracking as Tracking;
use Jetpack_Options;
use Jetpack_Tracks_Client;
use WP_Error;

/**
 * This class will handle everything involved with fixing an Identity Crisis.
 *
 * @since 0.2.0
 * @since-jetpack 4.4.0
 */
class Identity_Crisis {

	/**
	 * Package Version
	 */
	const PACKAGE_VERSION = '0.2.5';

	/**
	 * Instance of the object.
	 *
	 * @var Identity_Crisis
	 **/
	private static $instance = null;

	/**
	 * The wpcom value of the home URL.
	 *
	 * @var string
	 */
	public static $wpcom_home_url;

	/**
	 * Has safe mode been confirmed?
	 *
	 * @var bool
	 */
	public static $is_safe_mode_confirmed;

	/**
	 * The current screen, which is set if the current user is a non-admin and this is an admin page.
	 *
	 * @var WP_Screen
	 */
	public static $current_screen;

	/**
	 * Initializer.
	 *
	 * @return object
	 */
	public static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Identity_Crisis();
		}

		return self::$instance;
	}

	/**
	 * Class constructor.
	 *
	 * @return void
	 */
	private function __construct() {
		add_action( 'jetpack_sync_processed_actions', array( $this, 'maybe_clear_migrate_option' ) );
		add_action( 'rest_api_init', array( 'Automattic\\Jetpack\\IdentityCrisis\\REST_Endpoints', 'initialize_rest_api' ) );
		add_action( 'jetpack_idc_disconnect', array( __CLASS__, 'do_jetpack_idc_disconnect' ) );

		add_filter( 'jetpack_connection_disconnect_site_wpcom', array( __CLASS__, 'jetpack_connection_disconnect_site_wpcom_filter' ) );

		$urls_in_crisis = self::check_identity_crisis();
		if ( false === $urls_in_crisis ) {
			return;
		}

		self::$wpcom_home_url = $urls_in_crisis['wpcom_home'];
		add_action( 'init', array( $this, 'wordpress_init' ) );
	}

	/**
	 * Disconnect current connection and clear IDC options.
	 */
	public static function do_jetpack_idc_disconnect() {
		$connection = new Connection_Manager();

		// If the site is in an IDC because sync is not allowed,
		// let's make sure to not disconnect the production site.
		if ( ! self::validate_sync_error_idc_option() ) {
			$connection->disconnect_site( true );
		} else {
			$connection->disconnect_site( false );
		}

		// Clear IDC options.
		self::clear_all_idc_options();
	}

	/**
	 * Filter to prevent site from disconnecting from WPCOM if it's in an IDC.
	 *
	 * @see jetpack_connection_disconnect_site_wpcom filter.
	 *
	 * @return bool False if the site is in IDC, true otherwise.
	 */
	public static function jetpack_connection_disconnect_site_wpcom_filter() {
		return ! self::validate_sync_error_idc_option();
	}

	/**
	 * Gets the link to the support document used to explain Safe Mode to users.
	 *
	 * @return string
	 */
	public static function get_safe_mod_doc_url() {
		return Redirect::get_url( 'jetpack-support-safe-mode' );
	}

	/**
	 * This method loops through the array of processed items from sync and checks if one of the items was the
	 * home_url or site_url callable. If so, then we delete the jetpack_migrate_for_idc option.
	 *
	 * @param array $processed_items Array of processed items that were synced to WordPress.com.
	 */
	public function maybe_clear_migrate_option( $processed_items ) {
		foreach ( (array) $processed_items as $item ) {

			// First, is this item a jetpack_sync_callable action? If so, then proceed.
			$callable_args = ( is_array( $item ) && isset( $item[0], $item[1] ) && 'jetpack_sync_callable' === $item[0] )
				? $item[1]
				: null;

			// Second, if $callable_args is set, check if the callable was home_url or site_url. If so,
			// clear the migrate option.
			if (
				isset( $callable_args, $callable_args[0] )
				&& ( 'home_url' === $callable_args[0] || 'site_url' === $callable_args[1] )
			) {
				Jetpack_Options::delete_option( 'migrate_for_idc' );
				break;
			}
		}
	}

	/**
	 * WordPress init.
	 *
	 * @return void
	 */
	public function wordpress_init() {
		if ( ! current_user_can( 'jetpack_disconnect' ) && is_admin() ) {
			add_action( 'admin_notices', array( $this, 'display_non_admin_idc_notice' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_idc_notice_files' ) );
			add_action( 'current_screen', array( $this, 'non_admins_current_screen_check' ) );

			return;
		}

		if (
			isset( $_GET['jetpack_idc_clear_confirmation'], $_GET['_wpnonce'] ) &&
			wp_verify_nonce( $_GET['_wpnonce'], 'jetpack_idc_clear_confirmation' )
		) {
			Jetpack_Options::delete_option( 'safe_mode_confirmed' );
			self::$is_safe_mode_confirmed = false;
		} else {
			self::$is_safe_mode_confirmed = (bool) Jetpack_Options::get_option( 'safe_mode_confirmed' );
		}

		// 121 Priority so that it's the most inner Jetpack item in the admin bar.
		add_action( 'admin_bar_menu', array( $this, 'display_admin_bar_button' ), 121 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_bar_css' ) );

		if ( is_admin() && ! self::$is_safe_mode_confirmed ) {
			add_action( 'admin_notices', array( $this, 'display_idc_notice' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_idc_notice_files' ) );
		}
	}

	/**
	 * Non-admins current screen check.
	 *
	 * @param object $current_screen Current screen.
	 *
	 * @return null
	 */
	public function non_admins_current_screen_check( $current_screen ) {
		self::$current_screen = $current_screen;
		if ( isset( $current_screen->id ) && 'toplevel_page_jetpack' === $current_screen->id ) {
			return null;
		}

		// If the user has dismissed the notice, and we're not currently on a Jetpack page,
		// then do not show the non-admin notice.
		if ( isset( $_COOKIE, $_COOKIE['jetpack_idc_dismiss_notice'] ) ) {
			remove_action( 'admin_notices', array( $this, 'display_non_admin_idc_notice' ) );
			remove_action( 'admin_enqueue_scripts', array( $this, 'enqueue_idc_notice_files' ) );
		}

		return null;
	}

	/**
	 * Renders the admin bar button.
	 *
	 * @return void
	 */
	public function display_admin_bar_button() {
		global $wp_admin_bar;

		$href = is_admin()
			? add_query_arg( 'jetpack_idc_clear_confirmation', '1' )
			: add_query_arg( 'jetpack_idc_clear_confirmation', '1', admin_url() );

		$href = wp_nonce_url( $href, 'jetpack_idc_clear_confirmation' );

		$title = sprintf(
			'<span class="jp-idc-admin-bar">%s %s</span>',
			'<span class="dashicons dashicons-warning"></span>',
			esc_html__( 'Jetpack Safe Mode', 'jetpack' )
		);

		$menu = array(
			'id'     => 'jetpack-idc',
			'title'  => $title,
			'href'   => esc_url( $href ),
			'parent' => 'top-secondary',
		);

		if ( ! self::$is_safe_mode_confirmed ) {
			$menu['meta'] = array(
				'class' => 'hide',
			);
		}

		$wp_admin_bar->add_node( $menu );
	}

	/**
	 * Checks if the site is currently in an identity crisis.
	 *
	 * @return array|bool Array of options that are in a crisis, or false if everything is OK.
	 */
	public static function check_identity_crisis() {
		$connection = new Connection_Manager( 'jetpack' );

		if ( ! $connection->is_connected() || ( new Status() )->is_offline_mode() || ! self::validate_sync_error_idc_option() ) {
			return false;
		}

		return Jetpack_Options::get_option( 'sync_error_idc' );
	}

	/**
	 * Prepare URL for display.
	 *
	 * @param string $url URL to display.
	 *
	 * @return string
	 */
	public static function prepare_url_for_display( $url ) {
		return untrailingslashit( self::normalize_url_protocol_agnostic( $url ) );
	}

	/**
	 * Clears all IDC specific options. This method is used on disconnect and reconnect.
	 *
	 * @return void
	 */
	public static function clear_all_idc_options() {
		// If the site is currently in IDC, let's also clear the VaultPress connection options.
		// We have to check if the site is in IDC, otherwise we'd be clearing the VaultPress
		// connection any time the Jetpack connection is cycled.
		if ( self::validate_sync_error_idc_option() ) {
			delete_option( 'vaultpress' );
			delete_option( 'vaultpress_auto_register' );
		}

		Jetpack_Options::delete_option(
			array(
				'sync_error_idc',
				'safe_mode_confirmed',
				'migrate_for_idc',
			)
		);
	}

	/**
	 * Checks whether the sync_error_idc option is valid or not, and if not, will do cleanup.
	 *
	 * @return bool
	 * @since-jetpack 5.4.0 Do not call get_sync_error_idc_option() unless site is in IDC
	 *
	 * @since 0.2.0
	 * @since-jetpack 4.4.0
	 */
	public static function validate_sync_error_idc_option() {
		$is_valid = false;

		// Is the site opted in and does the stored sync_error_idc option match what we now generate?
		$sync_error = Jetpack_Options::get_option( 'sync_error_idc' );
		if ( $sync_error && self::sync_idc_optin() ) {
			$local_options = self::get_sync_error_idc_option();
			// Ensure all values are set.
			if ( isset( $sync_error['home'] ) && isset( $local_options['home'] ) && isset( $sync_error['siteurl'] ) && isset( $local_options['siteurl'] ) ) {
				// If the WP.com expected home and siteurl match local home and siteurl it is not valid IDC.
				if (
					isset( $sync_error['wpcom_home'] ) &&
					isset( $sync_error['wpcom_siteurl'] ) &&
					$sync_error['wpcom_home'] === $local_options['home'] &&
					$sync_error['wpcom_siteurl'] === $local_options['siteurl']
				) {
					$is_valid = false;
					// Enable migrate_for_idc so that sync actions are accepted.
					Jetpack_Options::update_option( 'migrate_for_idc', true );
				} elseif ( $sync_error['home'] === $local_options['home'] && $sync_error['siteurl'] === $local_options['siteurl'] ) {
					$is_valid = true;
				}
			}
		}

		/**
		 * Filters whether the sync_error_idc option is valid.
		 *
		 * @param bool $is_valid If the sync_error_idc is valid or not.
		 *
		 * @since 0.2.0
		 * @since-jetpack 4.4.0
		 */
		$is_valid = (bool) apply_filters( 'jetpack_sync_error_idc_validation', $is_valid );

		if ( ! $is_valid && $sync_error ) {
			// Since the option exists, and did not validate, delete it.
			Jetpack_Options::delete_option( 'sync_error_idc' );
		}

		return $is_valid;
	}

	/**
	 * Normalizes a url by doing three things:
	 *  - Strips protocol
	 *  - Strips www
	 *  - Adds a trailing slash
	 *
	 * @param string $url URL to parse.
	 *
	 * @return WP_Error|string
	 * @since 0.2.0
	 * @since-jetpack 4.4.0
	 */
	public static function normalize_url_protocol_agnostic( $url ) {
		$parsed_url = wp_parse_url( trailingslashit( esc_url_raw( $url ) ) );
		if ( ! $parsed_url || empty( $parsed_url['host'] ) || empty( $parsed_url['path'] ) ) {
			return new WP_Error(
				'cannot_parse_url',
				sprintf(
				/* translators: %s: URL to parse. */
					esc_html__( 'Cannot parse URL %s', 'jetpack' ),
					$url
				)
			);
		}

		// Strip www and protocols.
		$url = preg_replace( '/^www\./i', '', $parsed_url['host'] . $parsed_url['path'] );

		return $url;
	}

	/**
	 * Gets the value that is to be saved in the jetpack_sync_error_idc option.
	 *
	 * @param array $response HTTP response.
	 *
	 * @return array Array of the local urls, wpcom urls, and error code.
	 * @since 0.2.0
	 * @since-jetpack 4.4.0
	 * @since-jetpack 5.4.0 Add transient since home/siteurl retrieved directly from DB.
	 */
	public static function get_sync_error_idc_option( $response = array() ) {
		// Since the local options will hit the database directly, store the values
		// in a transient to allow for autoloading and caching on subsequent views.
		$local_options = get_transient( 'jetpack_idc_local' );
		if ( false === $local_options ) {
			$local_options = array(
				'home'    => Urls::home_url(),
				'siteurl' => Urls::site_url(),
			);
			set_transient( 'jetpack_idc_local', $local_options, MINUTE_IN_SECONDS );
		}

		$options = array_merge( $local_options, $response );

		$returned_values = array();
		foreach ( $options as $key => $option ) {
			if ( 'error_code' === $key ) {
				$returned_values[ $key ] = $option;
				continue;
			}

			$normalized_url = self::normalize_url_protocol_agnostic( $option );
			if ( is_wp_error( $normalized_url ) ) {
				continue;
			}

			$returned_values[ $key ] = $normalized_url;
		}

		set_transient( 'jetpack_idc_option', $returned_values, MINUTE_IN_SECONDS );

		return $returned_values;
	}

	/**
	 * Returns the value of the jetpack_sync_idc_optin filter, or constant.
	 * If set to true, the site will be put into staging mode.
	 *
	 * @return bool
	 * @since 0.2.0
	 * @since-jetpack 4.3.2
	 */
	public static function sync_idc_optin() {
		if ( Constants::is_defined( 'JETPACK_SYNC_IDC_OPTIN' ) ) {
			$default = Constants::get_constant( 'JETPACK_SYNC_IDC_OPTIN' );
		} else {
			$default = ! Constants::is_defined( 'SUNRISE' ) && ! is_multisite();
		}

		/**
		 * Allows sites to opt in for IDC mitigation which blocks the site from syncing to WordPress.com when the home
		 * URL or site URL do not match what WordPress.com expects. The default value is either true, or the value of
		 * JETPACK_SYNC_IDC_OPTIN constant if set.
		 *
		 * @param bool $default Whether the site is opted in to IDC mitigation.
		 *
		 * @since 0.2.0
		 * @since-jetpack 4.3.2
		 */
		return (bool) apply_filters( 'jetpack_sync_idc_optin', $default );
	}

	/**
	 * Does the current admin page have help tabs?
	 *
	 * @return bool
	 */
	public function admin_page_has_help_tabs() {
		if ( ! function_exists( 'get_current_screen' ) ) {
			return false;
		}

		$current_screen = get_current_screen();
		$tabs           = $current_screen->get_help_tabs();

		return ! empty( $tabs );
	}

	/**
	 * Renders the non-admin IDC notice.
	 *
	 * @return void
	 */
	public function display_non_admin_idc_notice() {
		$classes = 'jp-idc-notice inline is-non-admin notice notice-warning';
		if ( isset( self::$current_screen ) && 'toplevel_page_jetpack' !== self::$current_screen->id ) {
			$classes .= ' is-dismissible';
		}

		if ( $this->admin_page_has_help_tabs() ) {
			$classes .= ' has-help-tabs';
		}
		?>

		<div class="<?php echo esc_attr( $classes ); ?>">
			<?php $this->render_notice_header(); ?>
			<div class="jp-idc-notice__content-header">
				<h3 class="jp-idc-notice__content-header__lead">
					<?php echo $this->get_non_admin_notice_text(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</h3>

				<p class="jp-idc-notice__content-header__explanation">
					<?php echo $this->get_non_admin_contact_admin_text(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</p>
			</div>
		</div>
		<?php
	}

	/**
	 * First "step" of the IDC mitigation. Will provide some messaging and two options/buttons.
	 * "Confirm Staging" - Dismiss the notice and continue on with our lives in staging mode.
	 * "Fix Jetpack Connection" - Will disconnect the site and start the mitigation...
	 *
	 * @return void
	 */
	public function display_idc_notice() {
		$classes = 'jp-idc-notice inline notice notice-warning';
		if ( $this->admin_page_has_help_tabs() ) {
			$classes .= ' has-help-tabs';
		}
		?>
		<div class="<?php echo esc_attr( $classes ); ?>">
			<?php $this->render_notice_header(); ?>
			<?php $this->render_notice_first_step(); ?>
			<?php $this->render_notice_second_step(); ?>
		</div>
		<?php
	}

	/**
	 * Enqueue CSS for the admin bar.
	 *
	 * @return void
	 */
	public function enqueue_admin_bar_css() {

		$build_assets = require __DIR__ . '/../build/index.asset.php';

		wp_enqueue_style(
			'jetpack-idc-admin-bar-css',
			plugin_dir_url( __DIR__ ) . 'build/css/jetpack-idc-admin-bar.css',
			array( 'dashicons' ),
			$build_assets['version']
		);
	}

	/**
	 * Enqueue scripts for the notice.
	 *
	 * @return void
	 */
	public function enqueue_idc_notice_files() {
		$build_assets                   = require __DIR__ . '/../build/index.asset.php';
		$build_assets['dependencies'][] = 'jquery';

		wp_enqueue_script(
			'jetpack-idc-js',
			plugin_dir_url( __DIR__ ) . 'build/index.js',
			$build_assets['dependencies'],
			$build_assets['version'],
			true
		);

		wp_localize_script(
			'jetpack-idc-js',
			'idcL10n',
			array(
				'apiRoot'         => esc_url_raw( rest_url() ),
				'nonce'           => wp_create_nonce( 'wp_rest' ),
				'tracksUserData'  => Jetpack_Tracks_Client::get_connected_user_tracks_identity(),
				'currentUrl'      => remove_query_arg( '_wpnonce', remove_query_arg( 'jetpack_idc_clear_confirmation' ) ),
				'tracksEventData' => array(
					'isAdmin'       => current_user_can( 'jetpack_disconnect' ),
					'currentScreen' => self::$current_screen ? self::$current_screen->id : false,
				),
			)
		);

		if ( ! wp_style_is( 'jetpack-dops-style', 'registered' ) ) {
			wp_register_style(
				'jetpack-dops-style',
				plugin_dir_url( __DIR__ ) . 'src/_inc/admin.css', // TODO Detangle style depenedencies instead of copying whole css file.
				array(),
				self::PACKAGE_VERSION
			);
		}

		wp_enqueue_style(
			'jetpack-idc-admin-bar-css',
			plugin_dir_url( __DIR__ ) . 'build/css/jetpack-idc-admin-bar.css',
			array( 'jetpack-dops-style' ),
			self::PACKAGE_VERSION
		);
		wp_enqueue_style(
			'jetpack-idc-css',
			plugin_dir_url( __DIR__ ) . 'build/css/jetpack-idc.css',
			array( 'jetpack-dops-style' ),
			self::PACKAGE_VERSION
		);

		// Register and Enqueue jp-tracks-functions.
		Tracking::register_tracks_functions_scripts( true );
	}

	/**
	 * Renders the notice header.
	 *
	 * @return void
	 */
	public function render_notice_header() {
		?>
		<div class="jp-idc-notice__header">
			<div class="jp-idc-notice__header__emblem">
				<?php
				$jetpack_logo = new Jetpack_Logo();
				echo $jetpack_logo->get_jp_emblem(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				?>
			</div>
			<p class="jp-idc-notice__header__text">
				<?php esc_html_e( 'Jetpack Safe Mode', 'jetpack' ); ?>
			</p>
		</div>

		<div class="jp-idc-notice__separator"></div>
		<?php
	}

	/**
	 * Is a container for the error notices.
	 * Will be shown/controlled by jQuery in idc-notice.js.
	 *
	 * @return void
	 */
	public function render_error_notice() {
		?>
		<div class="jp-idc-error__notice dops-notice is-error">
			<svg class="gridicon gridicons-notice dops-notice__icon" height="24" width="24" viewBox="0 0 24 24">
				<g>
					<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-2h2v2zm0-4h-2l-.5-6h3l-.5 6z"></path>
				</g>
			</svg>
			<div class="dops-notice__content">
				<span class="dops-notice__text">
					<?php esc_html_e( 'Something went wrong:', 'jetpack' ); ?>
					<span class="jp-idc-error__desc"></span>
				</span>
				<a class="dops-notice__action" href="javascript:void(0);">
					<span id="jp-idc-error__action">
						<?php esc_html_e( 'Try Again', 'jetpack' ); ?>
					</span>
				</a>
			</div>
		</div>
		<?php
	}

	/**
	 * Renders the first step notice.
	 *
	 * @return void
	 */
	public function render_notice_first_step() {
		?>
		<div class="jp-idc-notice__first-step">
			<div class="jp-idc-notice__content-header">
				<h3 class="jp-idc-notice__content-header__lead">
					<?php echo $this->get_first_step_header_lead(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</h3>

				<p class="jp-idc-notice__content-header__explanation">
					<?php echo $this->get_first_step_header_explanation(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</p>
			</div>

			<?php $this->render_error_notice(); ?>

			<div class="jp-idc-notice__actions">
				<div class="jp-idc-notice__action">
					<p class="jp-idc-notice__action__explanation">
						<?php echo $this->get_confirm_safe_mode_action_explanation(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</p>
					<button id="jp-idc-confirm-safe-mode-action" class="dops-button">
						<?php echo $this->get_confirm_safe_mode_button_text(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</button>
				</div>

				<div class="jp-idc-notice__action">
					<p class="jp-idc-notice__action__explanation">
						<?php echo $this->get_first_step_fix_connection_action_explanation(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</p>
					<button id="jp-idc-fix-connection-action" class="dops-button">
						<?php echo $this->get_first_step_fix_connection_button_text(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</button>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Renders the second step notice.
	 *
	 * @return void
	 */
	public function render_notice_second_step() {
		?>
		<div class="jp-idc-notice__second-step">
			<div class="jp-idc-notice__content-header">
				<h3 class="jp-idc-notice__content-header__lead">
					<?php echo $this->get_second_step_header_lead(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</h3>
			</div>

			<?php $this->render_error_notice(); ?>

			<div class="jp-idc-notice__actions">
				<div class="jp-idc-notice__action">
					<p class="jp-idc-notice__action__explanation">
						<?php echo $this->get_migrate_site_action_explanation(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</p>
					<button id="jp-idc-migrate-action" class="dops-button">
						<?php echo $this->get_migrate_site_button_text(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</button>
				</div>

				<div class="jp-idc-notice__action">
					<p class="jp-idc-notice__action__explanation">
						<?php echo $this->get_start_fresh_action_explanation(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</p>
					<button id="jp-idc-reconnect-site-action" class="dops-button">
						<?php echo $this->get_start_fresh_button_text(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</button>
				</div>

			</div>

			<p class="jp-idc-notice__unsure-prompt">
				<?php echo $this->get_unsure_prompt(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</p>
		</div>
		<?php
	}

	/**
	 * Returns the first step header lead.
	 *
	 * @return string
	 */
	public function get_first_step_header_lead() {
		$html = wp_kses(
			sprintf(
			/* translators: %s: Safe mode docs URL and site URL. */
				__( 'Jetpack has been placed into <a href="%1$s">Safe mode</a> because we noticed this is an exact copy of <a href="%2$s">%3$s</a>.', 'jetpack' ),
				esc_url( self::get_safe_mod_doc_url() ),
				esc_url( self::$wpcom_home_url ),
				self::prepare_url_for_display( esc_url_raw( self::$wpcom_home_url ) )
			),
			array( 'a' => array( 'href' => array() ) )
		);

		/**
		 * Allows overriding of the default header text in the first step of the Safe Mode notice.
		 *
		 * @param string $html The HTML to be displayed.
		 *
		 * @since 0.2.0
		 * @since-jetpack 4.4.0
		 */
		return apply_filters( 'jetpack_idc_first_step_header_lead', $html );
	}

	/**
	 * Returns the first step header explanation.
	 *
	 * @return string
	 */
	public function get_first_step_header_explanation() {
		$html = wp_kses(
			sprintf(
			/* translators: %s: Safe mode docs URL. */
				__( 'Please confirm Safe Mode or fix the Jetpack connection. Select one of the options below or <a href="%1$s">learn more about Safe Mode</a>.', 'jetpack' ),
				esc_url( self::get_safe_mod_doc_url() )
			),
			array( 'a' => array( 'href' => array() ) )
		);

		/**
		 * Allows overriding of the default header explanation text in the first step of the Safe Mode notice.
		 *
		 * @param string $html The HTML to be displayed.
		 *
		 * @since 0.2.0
		 * @since-jetpack 4.4.0
		 */
		return apply_filters( 'jetpack_idc_first_step_header_explanation', $html );
	}

	/**
	 * Returns the confirm safe mode explanation.
	 *
	 * @return string
	 */
	public function get_confirm_safe_mode_action_explanation() {
		$html = wp_kses(
			sprintf(
			/* translators: %s: Site URL. */
				__( 'Is this website a temporary duplicate of <a href="%1$s">%2$s</a> for the purposes of testing, staging or development? If so, we recommend keeping it in Safe Mode.', 'jetpack' ),
				esc_url( untrailingslashit( self::$wpcom_home_url ) ),
				self::prepare_url_for_display( esc_url( self::$wpcom_home_url ) )
			),
			array( 'a' => array( 'href' => array() ) )
		);

		/**
		 * Allows overriding of the default text used to explain the confirm safe mode action.
		 *
		 * @param string $html The HTML to be displayed.
		 *
		 * @since 0.2.0
		 * @since-jetpack 4.4.0
		 */
		return apply_filters( 'jetpack_idc_confirm_safe_mode_explanation', $html );
	}

	/**
	 * Returns the confirm safe mode button text.
	 *
	 * @return string
	 */
	public function get_confirm_safe_mode_button_text() {
		$string = esc_html__( 'Confirm Safe Mode', 'jetpack' );

		/**
		 * Allows overriding of the default text used for the confirm safe mode action button.
		 *
		 * @param string $string The string to be displayed.
		 *
		 * @since 0.2.0
		 * @since-jetpack 4.4.0
		 */
		return apply_filters( 'jetpack_idc_confirm_safe_mode_button_text', $string );
	}

	/**
	 * Returns the first step fix connection action explanation.
	 *
	 * @return string
	 */
	public function get_first_step_fix_connection_action_explanation() {
		$html = wp_kses(
			sprintf(
			/* translators: %s: Site URL. */
				__( 'If this is a separate and new website, or the new home of <a href="%1$s">%2$s</a>, we recommend turning Safe Mode off, and re-establishing your connection to WordPress.com.', 'jetpack' ),
				esc_url( untrailingslashit( self::$wpcom_home_url ) ),
				self::prepare_url_for_display( esc_url( self::$wpcom_home_url ) )
			),
			array( 'a' => array( 'href' => array() ) )
		);

		/**
		 * Allows overriding of the default text used to explain the fix Jetpack connection action.
		 *
		 * @param string $html The HTML to be displayed.
		 *
		 * @since 0.2.0
		 * @since-jetpack 4.4.0
		 */
		return apply_filters( 'jetpack_idc_first_fix_connection_explanation', $html );
	}

	/**
	 * Returns the first step fix connection button text.
	 *
	 * @return string
	 */
	public function get_first_step_fix_connection_button_text() {
		$string = esc_html__( "Fix Jetpack's Connection", 'jetpack' );

		/**
		 * Allows overriding of the default text used for the fix Jetpack connection action button.
		 *
		 * @param string $string The string to be displayed.
		 *
		 * @since 0.2.0
		 * @since-jetpack 4.4.0
		 */
		return apply_filters( 'jetpack_idc_first_step_fix_connection_button_text', $string );
	}

	/**
	 * Returns the second step header lead.
	 *
	 * @return string
	 */
	public function get_second_step_header_lead() {
		$string = sprintf(
		/* translators: %s: Site URL. */
			esc_html__( 'Is %1$s the new home of %2$s?', 'jetpack' ),
			untrailingslashit( self::normalize_url_protocol_agnostic( get_home_url() ) ),
			untrailingslashit( self::normalize_url_protocol_agnostic( esc_url_raw( self::$wpcom_home_url ) ) )
		);

		/**
		 * Allows overriding of the default header text in the second step of the Safe Mode notice.
		 *
		 * @param string $html The HTML to be displayed.
		 *
		 * @since 0.2.0
		 * @since-jetpack 4.4.0
		 */
		return apply_filters( 'jetpack_idc_second_step_header_lead', $string );
	}

	/**
	 * Returns the site action explanation.
	 *
	 * @return string
	 */
	public function get_migrate_site_action_explanation() {
		$html = wp_kses(
			sprintf(
			/* translators: %s: Site URL. */
				__( 'Yes. <a href="%1$s">%2$s</a> is replacing <a href="%3$s">%4$s</a>. I would like to migrate my stats and subscribers from <a href="%3$s">%4$s</a> to <a href="%1$s">%2$s</a>.', 'jetpack' ),
				esc_url( get_home_url() ),
				self::prepare_url_for_display( get_home_url() ),
				esc_url( self::$wpcom_home_url ),
				untrailingslashit( self::normalize_url_protocol_agnostic( esc_url_raw( self::$wpcom_home_url ) ) )
			),
			array( 'a' => array( 'href' => array() ) )
		);

		/**
		 * Allows overriding of the default text for explaining the migrate site action.
		 *
		 * @param string $html The HTML to be displayed.
		 *
		 * @since 0.2.0
		 * @since-jetpack 4.4.0
		 */
		return apply_filters( 'jetpack_idc_migrate_site_explanation', $html );
	}

	/**
	 * Returns the migrate site button text.
	 *
	 * @return string
	 */
	public function get_migrate_site_button_text() {
		$string = esc_html__( 'Migrate Stats &amp; Subscribers', 'jetpack' );

		/**
		 * Allows overriding of the default text used for the migrate site action button.
		 *
		 * @param string $string The string to be displayed.
		 *
		 * @since 0.2.0
		 * @since-jetpack 4.4.0
		 */
		return apply_filters( 'jetpack_idc_migrate_site_button_text', $string );
	}

	/**
	 * Returns the start fresh explanation.
	 *
	 * @return string
	 */
	public function get_start_fresh_action_explanation() {
		$html = wp_kses(
			sprintf(
			/* translators: %s: Site URL. */
				__( 'No. <a href="%1$s">%2$s</a> is a new and different website that\'s separate from <a href="%3$s">%4$s</a>. It requires  a new connection to WordPress.com for new stats and subscribers.', 'jetpack' ),
				esc_url( get_home_url() ),
				self::prepare_url_for_display( get_home_url() ),
				esc_url( self::$wpcom_home_url ),
				untrailingslashit( self::normalize_url_protocol_agnostic( esc_url_raw( self::$wpcom_home_url ) ) )
			),
			array( 'a' => array( 'href' => array() ) )
		);

		/**
		 * Allows overriding of the default text for explaining the start fresh action.
		 *
		 * @param string $html The HTML to be displayed.
		 *
		 * @since 0.2.0
		 * @since-jetpack 4.4.0
		 */
		return apply_filters( 'jetpack_idc_start_fresh_explanation', $html );
	}

	/**
	 * Returns the start fresh button text.
	 *
	 * @return string
	 */
	public function get_start_fresh_button_text() {
		$string = esc_html__( 'Start Fresh &amp; Create New Connection', 'jetpack' );

		/**
		 * Allows overriding of the default text used for the start fresh action button.
		 *
		 * @param string $string The string to be displayed.
		 *
		 * @since 0.2.0
		 * @since-jetpack 4.4.0
		 */
		return apply_filters( 'jetpack_idc_start_fresh_button_text', $string );
	}

	/**
	 * Returns the unsure prompt text.
	 *
	 * @return string
	 */
	public function get_unsure_prompt() {
		$html = wp_kses(
			sprintf(
			/* translators: %s: Safe mode docs URL. */
				__( 'Unsure what to do? <a href="%1$s">Read more about Jetpack Safe Mode</a>', 'jetpack' ),
				esc_url( self::get_safe_mod_doc_url() )
			),
			array( 'a' => array( 'href' => array() ) )
		);

		/**
		 * Allows overriding of the default text using in the "Unsure what to do?" prompt.
		 *
		 * @param string $html The HTML to be displayed.
		 *
		 * @since 0.2.0
		 * @since-jetpack 4.4.0
		 */
		return apply_filters( 'jetpack_idc_unsure_prompt', $html );
	}

	/**
	 * Returns the non-admin notice text.
	 *
	 * @return string
	 */
	public function get_non_admin_notice_text() {
		$html = wp_kses(
			sprintf(
			/* translators: %s: Safe mode docs URL. */
				__( 'Jetpack has been placed into Safe Mode. Learn more about <a href="%1$s">Safe Mode</a>.', 'jetpack' ),
				esc_url( self::get_safe_mod_doc_url() )
			),
			array( 'a' => array( 'href' => array() ) )
		);

		/**
		 * Allows overriding of the default text that is displayed to non-admin on the Jetpack admin page.
		 *
		 * @param string $html The HTML to be displayed.
		 *
		 * @since 0.2.0
		 * @since-jetpack 4.4.0
		 */
		return apply_filters( 'jetpack_idc_non_admin_notice_text', $html );
	}

	/**
	 * Returns the non-admin contact admin text.
	 *
	 * @return string
	 */
	public function get_non_admin_contact_admin_text() {
		$string = esc_html__( 'An administrator of this site can take Jetpack out of Safe Mode.', 'jetpack' );

		/**
		 * Allows overriding of the default text that is displayed to non-admins prompting them to contact an admin.
		 *
		 * @param string $string The string to be displayed.
		 *
		 * @since 0.2.0
		 * @since-jetpack 4.4.0
		 */
		return apply_filters( 'jetpack_idc_non_admin_contact_admin_text', $string );
	}
}
