<?php
/**
 * Identity_Crisis package.
 *
 * @package  automattic/jetpack-identity-crisis
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Urls;
use Automattic\Jetpack\IdentityCrisis\Exception;
use Automattic\Jetpack\IdentityCrisis\UI;
use Automattic\Jetpack\IdentityCrisis\URL_Secret;
use Jetpack_Options;
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
	const PACKAGE_VERSION = '0.17.1-alpha';

	/**
	 * Persistent WPCOM blog ID that stays in the options after disconnect.
	 */
	const PERSISTENT_BLOG_ID_OPTION_NAME = 'jetpack_persistent_blog_id';

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
	 * Beware, it never contains `true` for non-admins, so doesn't always reflect the actual value.
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
		if ( self::$instance === null ) {
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
		add_action( 'jetpack_received_remote_request_response', array( $this, 'check_http_response_for_idc_detected' ) );

		add_filter( 'jetpack_connection_disconnect_site_wpcom', array( __CLASS__, 'jetpack_connection_disconnect_site_wpcom_filter' ) );

		add_filter( 'jetpack_remote_request_url', array( $this, 'add_idc_query_args_to_url' ) );

		add_filter( 'jetpack_connection_validate_urls_for_idc_mitigation_response', array( static::class, 'add_secret_to_url_validation_response' ) );
		add_filter( 'jetpack_connection_validate_urls_for_idc_mitigation_response', array( static::class, 'add_ip_requester_to_url_validation_response' ) );

		add_filter( 'jetpack_options', array( static::class, 'reverse_wpcom_urls_for_idc' ) );

		add_filter( 'jetpack_register_request_body', array( static::class, 'register_request_body' ) );
		add_action( 'jetpack_site_registered', array( static::class, 'site_registered' ) );

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

		delete_option( static::PERSISTENT_BLOG_ID_OPTION_NAME );

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
	 * @deprecated since 0.17.0 Use `@automattic/jetpack-idc` instead.
	 * @return string
	 */
	public static function get_safe_mod_doc_url() {
		_deprecated_function( __METHOD__, 'package-0.17.0' );
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
			$callable_args = ( is_array( $item ) && isset( $item[0] ) && isset( $item[1] ) && 'jetpack_sync_callable' === $item[0] )
				? $item[1]
				: null;

			// Second, if $callable_args is set, check if the callable was home_url or site_url. If so,
			// clear the migrate option.
			if (
				isset( $callable_args[0] )
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
		if ( current_user_can( 'jetpack_disconnect' ) ) {
			if (
					isset( $_GET['jetpack_idc_clear_confirmation'] ) && isset( $_GET['_wpnonce'] ) &&
					wp_verify_nonce( $_GET['_wpnonce'], 'jetpack_idc_clear_confirmation' ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- WordPress core doesn't unslash or verify nonces either.
			) {
				Jetpack_Options::delete_option( 'safe_mode_confirmed' );
				self::$is_safe_mode_confirmed = false;
			} else {
				self::$is_safe_mode_confirmed = (bool) Jetpack_Options::get_option( 'safe_mode_confirmed' );
			}
		}

		// 121 Priority so that it's the most inner Jetpack item in the admin bar.
		add_action( 'admin_bar_menu', array( $this, 'display_admin_bar_button' ), 121 );

		UI::init();
	}

	/**
	 * Add the idc query arguments to the url.
	 *
	 * @param string $url The remote request url.
	 */
	public function add_idc_query_args_to_url( $url ) {
		$status = new Status();
		if ( ! is_string( $url )
			|| $status->is_offline_mode()
			|| self::validate_sync_error_idc_option() ) {
			return $url;
		}
		$home_url = Urls::home_url();
		$site_url = Urls::site_url();
		$hostname = wp_parse_url( $site_url, PHP_URL_HOST );

		// If request is from an IP, make sure ip_requester option is set
		if ( self::url_is_ip( $hostname ) ) {
			self::maybe_update_ip_requester( $hostname );
		}

		$query_args = array(
			'home'    => $home_url,
			'siteurl' => $site_url,
		);

		if ( self::should_handle_idc() ) {
			$query_args['idc'] = true;
		}

		if ( \Jetpack_Options::get_option( 'migrate_for_idc', false ) ) {
			$query_args['migrate_for_idc'] = true;
		}

		if ( is_multisite() ) {
			$query_args['multisite'] = true;
		}

		return add_query_arg( $query_args, $url );
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

		$consumer_data = UI::get_consumer_data();
		$label         = isset( $consumer_data['customContent']['adminBarSafeModeLabel'] )
			? esc_html( $consumer_data['customContent']['adminBarSafeModeLabel'] )
			: esc_html__( 'Jetpack Safe Mode', 'jetpack-idc' );

		$title = sprintf(
			'<span class="jp-idc-admin-bar">%s %s</span>',
			'<span class="dashicons dashicons-info-outline"></span>',
			$label
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
	 * Checks the HTTP response body for the 'idc_detected' key. If the key exists,
	 * checks the idc_detected value for a valid idc error.
	 *
	 * @param array|WP_Error $http_response The HTTP response.
	 *
	 * @return bool Whether the site is in an identity crisis.
	 */
	public function check_http_response_for_idc_detected( $http_response ) {
		if ( ! is_array( $http_response ) ) {
			return false;
		}
		$response_body = json_decode( wp_remote_retrieve_body( $http_response ), true );

		if ( isset( $response_body['idc_detected'] ) ) {
			return $this->check_response_for_idc( $response_body['idc_detected'] );
		}

		if ( isset( $response_body['migrated_for_idc'] ) ) {
			Jetpack_Options::delete_option( 'migrate_for_idc' );
		}

		return false;
	}

	/**
	 * Checks the WPCOM response to determine if the site is in an identity crisis. Updates the
	 * sync_error_idc option if it is.
	 *
	 * @param array $response The response data.
	 *
	 * @return bool Whether the site is in an identity crisis.
	 */
	public function check_response_for_idc( $response ) {
		if ( ! is_array( $response ) ) {
			return false;
		}

		if ( is_array( $response ) && isset( $response['error_code'] ) ) {
			$error_code              = $response['error_code'];
			$allowed_idc_error_codes = array(
				'jetpack_url_mismatch',
				'jetpack_home_url_mismatch',
				'jetpack_site_url_mismatch',
			);

			if ( in_array( $error_code, $allowed_idc_error_codes, true ) ) {
				Jetpack_Options::update_option(
					'sync_error_idc',
					self::get_sync_error_idc_option( $response )
				);
			}

			return true;
		}

		return false;
	}

	/**
	 * Prepare URL for display.
	 *
	 * @deprecated since 0.17.0 Use `@automattic/jetpack-idc` instead.
	 * @param string $url URL to display.
	 *
	 * @return string
	 */
	public static function prepare_url_for_display( $url ) {
		_deprecated_function( __METHOD__, 'package-0.17.0' );
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

		delete_transient( 'jetpack_idc_possible_dynamic_site_url_detected' );
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
		if ( $sync_error && self::should_handle_idc() ) {
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
	 * Reverses WP.com URLs stored in sync_error_idc option.
	 *
	 * @param array $sync_error error option containing reversed URLs.
	 * @return array
	 */
	public static function reverse_wpcom_urls_for_idc( $sync_error ) {
		if ( isset( $sync_error['reversed_url'] ) ) {
			if ( array_key_exists( 'wpcom_siteurl', $sync_error ) ) {
				$sync_error['wpcom_siteurl'] = strrev( $sync_error['wpcom_siteurl'] );
			}
			if ( array_key_exists( 'wpcom_home', $sync_error ) ) {
				$sync_error['wpcom_home'] = strrev( $sync_error['wpcom_home'] );
			}
		}
		return $sync_error;
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
					esc_html__( 'Cannot parse URL %s', 'jetpack-idc' ),
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
		// We need to protect WPCOM URLs from search & replace by reversing them. See https://wp.me/pf5801-3R
		// Add 'reversed_url' key for backward compatibility
		if ( array_key_exists( 'wpcom_home', $returned_values ) && array_key_exists( 'wpcom_siteurl', $returned_values ) ) {
			$returned_values['reversed_url'] = true;
			$returned_values                 = self::reverse_wpcom_urls_for_idc( $returned_values );
		}

		return $returned_values;
	}

	/**
	 * Returns the value of the jetpack_should_handle_idc filter or constant.
	 * If set to true, the site will be put into staging mode.
	 *
	 * This method uses both the current jetpack_should_handle_idc filter
	 * and constant to determine whether an IDC should be handled.
	 *
	 * @return bool
	 * @since 0.2.6
	 */
	public static function should_handle_idc() {
		if ( Constants::is_defined( 'JETPACK_SHOULD_HANDLE_IDC' ) ) {
			$default = Constants::get_constant( 'JETPACK_SHOULD_HANDLE_IDC' );
		} else {
			$default = ! Constants::is_defined( 'SUNRISE' ) && ! is_multisite();
		}

		/**
		 * Allows sites to opt in for IDC mitigation which blocks the site from syncing to WordPress.com when the home
		 * URL or site URL do not match what WordPress.com expects. The default value is either true, or the value of
		 * JETPACK_SHOULD_HANDLE_IDC constant if set.
		 *
		 * @param bool $default Whether the site is opted in to IDC mitigation.
		 *
		 * @since 0.2.6
		 */
		return (bool) apply_filters( 'jetpack_should_handle_idc', $default );
	}

	/**
	 * Is a container for the error notices.
	 * Will be shown/controlled by jQuery in idc-notice.js.
	 *
	 * @deprecated  0.17.0 Use `@automattic/jetpack-idc` instead.
	 * @return void
	 */
	public function render_error_notice() {
		_deprecated_function( __METHOD__, 'package-0.17.0' );
		?>
		<div class="jp-idc-error__notice dops-notice is-error">
			<svg class="gridicon gridicons-notice dops-notice__icon" height="24" width="24" viewBox="0 0 24 24">
				<g>
					<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-2h2v2zm0-4h-2l-.5-6h3l-.5 6z"></path>
				</g>
			</svg>
			<div class="dops-notice__content">
				<span class="dops-notice__text">
					<?php esc_html_e( 'Something went wrong:', 'jetpack-idc' ); ?>
					<span class="jp-idc-error__desc"></span>
				</span>
				<a class="dops-notice__action" href="javascript:void(0);">
					<span id="jp-idc-error__action">
						<?php esc_html_e( 'Try Again', 'jetpack-idc' ); ?>
					</span>
				</a>
			</div>
		</div>
		<?php
	}

	/**
	 * Renders the first step notice.
	 *
	 * @deprecated  0.17.0 Use `@automattic/jetpack-idc` instead.
	 * @return void
	 */
	public function render_notice_first_step() {
		_deprecated_function( __METHOD__, ' 0.17.0' );
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
	 * @deprecated  0.17.0 Use `@automattic/jetpack-idc` instead.
	 *
	 * @return void
	 */
	public function render_notice_second_step() {
		_deprecated_function( __METHOD__, ' 0.17.0' );
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
	 * @deprecated  0.17.0 Use `@automattic/jetpack-idc` instead.
	 *
	 * @return string
	 */
	public function get_first_step_header_lead() {
		_deprecated_function( __METHOD__, 'package-0.17.0' );
		$html = wp_kses(
			sprintf(
			/* translators: %s: Safe mode docs URL and site URL. */
				__( 'Jetpack has been placed into <a href="%1$s">Safe mode</a> because we noticed this is an exact copy of <a href="%2$s">%3$s</a>.', 'jetpack-idc' ),
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
	 * @deprecated since 0.17.0 Use `@automattic/jetpack-idc` instead.
	 *
	 * @return string
	 */
	public function get_first_step_header_explanation() {
		_deprecated_function( __METHOD__, 'package-0.17.0' );
		$html = wp_kses(
			sprintf(
			/* translators: %s: Safe mode docs URL. */
				__( 'Please confirm Safe Mode or fix the Jetpack connection. Select one of the options below or <a href="%1$s">learn more about Safe Mode</a>.', 'jetpack-idc' ),
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
	 * @deprecated since 0.17.0 Use `@automattic/jetpack-idc` instead.
	 * @return string
	 */
	public function get_confirm_safe_mode_action_explanation() {
		_deprecated_function( __METHOD__, 'package-0.17.0' );
		$html = wp_kses(
			sprintf(
			/* translators: %s: Site URL. */
				__( 'Is this website a temporary duplicate of <a href="%1$s">%2$s</a> for the purposes of testing, staging or development? If so, we recommend keeping it in Safe Mode.', 'jetpack-idc' ),
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
	 * @deprecated since 0.17.0 Use `@automattic/jetpack-idc` instead.
	 * @return string
	 */
	public function get_confirm_safe_mode_button_text() {
		_deprecated_function( __METHOD__, 'package-0.17.0' );
		$string = esc_html__( 'Confirm Safe Mode', 'jetpack-idc' );

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
	 * @deprecated since 0.17.0 Use `@automattic/jetpack-idc` instead.
	 * @return string
	 */
	public function get_first_step_fix_connection_action_explanation() {
		_deprecated_function( __METHOD__, 'package-0.17.0' );
		$html = wp_kses(
			sprintf(
			/* translators: %s: Site URL. */
				__( 'If this is a separate and new website, or the new home of <a href="%1$s">%2$s</a>, we recommend turning Safe Mode off, and re-establishing your connection to WordPress.com.', 'jetpack-idc' ),
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
	 * @deprecated since 0.17.0 Use `@automattic/jetpack-idc` instead.
	 * @return string
	 */
	public function get_first_step_fix_connection_button_text() {
		_deprecated_function( __METHOD__, 'package-0.17.0' );
		$string = esc_html__( "Fix Jetpack's Connection", 'jetpack-idc' );

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
	 * @deprecated since 0.17.0 Use `@automattic/jetpack-idc` instead.
	 * @return string
	 */
	public function get_second_step_header_lead() {
		_deprecated_function( __METHOD__, 'package-0.17.0' );
		$string = sprintf(
		/* translators: %s: Site URL. */
			esc_html__( 'Is %1$s the new home of %2$s?', 'jetpack-idc' ),
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
	 * @deprecated since 0.17.0 Use `@automattic/jetpack-idc` instead.
	 * @return string
	 */
	public function get_migrate_site_action_explanation() {
		_deprecated_function( __METHOD__, 'package-0.17.0' );
		$html = wp_kses(
			sprintf(
			/* translators: %s: Site URL. */
				__( 'Yes. <a href="%1$s">%2$s</a> is replacing <a href="%3$s">%4$s</a>. I would like to migrate my stats and subscribers from <a href="%3$s">%4$s</a> to <a href="%1$s">%2$s</a>.', 'jetpack-idc' ),
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
	 * @deprecated since 0.17.0 Use `@automattic/jetpack-idc` instead.
	 * @return string
	 */
	public function get_migrate_site_button_text() {
		_deprecated_function( __METHOD__, 'package-0.17.0' );
		$string = esc_html__( 'Migrate Stats &amp; Subscribers', 'jetpack-idc' );

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
	 * @deprecated since 0.17.0 Use `@automattic/jetpack-idc` instead.
	 * @return string
	 */
	public function get_start_fresh_action_explanation() {
		_deprecated_function( __METHOD__, 'package-0.17.0' );
		$html = wp_kses(
			sprintf(
			/* translators: %s: Site URL. */
				__( 'No. <a href="%1$s">%2$s</a> is a new and different website that\'s separate from <a href="%3$s">%4$s</a>. It requires  a new connection to WordPress.com for new stats and subscribers.', 'jetpack-idc' ),
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
	 * @deprecated since 0.17.0 Use `@automattic/jetpack-idc` instead.
	 * @return string
	 */
	public function get_start_fresh_button_text() {
		_deprecated_function( __METHOD__, 'package-0.17.0' );
		$string = esc_html__( 'Start Fresh &amp; Create New Connection', 'jetpack-idc' );

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
	 * @deprecated since 0.17.0 Use `@automattic/jetpack-idc` instead.
	 * @return string
	 */
	public function get_unsure_prompt() {
		_deprecated_function( __METHOD__, 'package-0.17.0' );
		$html = wp_kses(
			sprintf(
			/* translators: %s: Safe mode docs URL. */
				__( 'Unsure what to do? <a href="%1$s">Read more about Jetpack Safe Mode</a>', 'jetpack-idc' ),
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
	 * Whether the site is undergoing identity crisis.
	 *
	 * @return bool
	 */
	public static function has_identity_crisis() {
		return false !== static::check_identity_crisis() && ! static::$is_safe_mode_confirmed;
	}

	/**
	 * Whether an admin has confirmed safe mode.
	 * Unlike `static::$is_safe_mode_confirmed` this function always returns the actual flag value.
	 *
	 * @return bool
	 */
	public static function safe_mode_is_confirmed() {
		return Jetpack_Options::get_option( 'safe_mode_confirmed' );
	}

	/**
	 * Returns the mismatched URLs.
	 *
	 * @return array|bool The mismatched urls, or false if the site is not connected, offline, in safe mode, or the IDC error is not valid.
	 */
	public static function get_mismatched_urls() {
		if ( ! static::has_identity_crisis() ) {
			return false;
		}

		$data = static::check_identity_crisis();

		if ( ! $data ||
			! isset( $data['error_code'] ) ||
			! isset( $data['wpcom_home'] ) ||
			! isset( $data['home'] ) ||
			! isset( $data['wpcom_siteurl'] ) ||
			! isset( $data['siteurl'] )
			) {
			// The jetpack_sync_error_idc option is missing a key.
			return false;
		}

		if ( 'jetpack_site_url_mismatch' === $data['error_code'] ) {
			return array(
				'wpcom_url'   => $data['wpcom_siteurl'],
				'current_url' => $data['siteurl'],
			);
		}

		return array(
			'wpcom_url'   => $data['wpcom_home'],
			'current_url' => $data['home'],
		);
	}

	/**
	 * Try to detect $_SERVER['HTTP_HOST'] being used within WP_SITEURL or WP_HOME definitions inside of wp-config.
	 *
	 * If `HTTP_HOST` usage is found, it's possbile (though not certain) that site URLs are dynamic.
	 *
	 * When a site URL is dynamic, it can lead to a Jetpack IDC. If potentially dynamic usage is detected,
	 * helpful support info will be shown on the IDC UI about setting a static site/home URL.
	 *
	 * @return bool True if potentially dynamic site urls were detected in wp-config, false otherwise.
	 */
	public static function detect_possible_dynamic_site_url() {
		$transient_key = 'jetpack_idc_possible_dynamic_site_url_detected';
		$transient_val = get_transient( $transient_key );

		if ( false !== $transient_val ) {
			return (bool) $transient_val;
		}

		$path      = self::locate_wp_config();
		$wp_config = $path ? file_get_contents( $path ) : false; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		if ( $wp_config ) {
			$matched = preg_match(
				'/define ?\( ?[\'"](?:WP_SITEURL|WP_HOME).+(?:HTTP_HOST).+\);/',
				$wp_config
			);

			if ( $matched ) {
				set_transient( $transient_key, 1, HOUR_IN_SECONDS );
				return true;
			}
		}

		set_transient( $transient_key, 0, HOUR_IN_SECONDS );
		return false;
	}

	/**
	 * Gets path to WordPress configuration.
	 * Source: https://github.com/wp-cli/wp-cli/blob/master/php/utils.php
	 *
	 * @return string
	 */
	public static function locate_wp_config() {
		static $path;

		if ( null === $path ) {
			$path = false;

			if ( getenv( 'WP_CONFIG_PATH' ) && file_exists( getenv( 'WP_CONFIG_PATH' ) ) ) {
				$path = getenv( 'WP_CONFIG_PATH' );
			} elseif ( file_exists( ABSPATH . 'wp-config.php' ) ) {
				$path = ABSPATH . 'wp-config.php';
			} elseif ( file_exists( dirname( ABSPATH ) . '/wp-config.php' ) && ! file_exists( dirname( ABSPATH ) . '/wp-settings.php' ) ) {
				$path = dirname( ABSPATH ) . '/wp-config.php';
			}

			if ( $path ) {
				$path = realpath( $path );
			}
		}

		return $path;
	}

	/**
	 * Adds `url_secret` to the `jetpack.idcUrlValidation` URL validation endpoint.
	 * Adds `url_secret_error` in case of an error.
	 *
	 * @param array $response The endpoint response that we're modifying.
	 *
	 * @return array
	 * phpcs:ignore Squiz.Commenting.FunctionCommentThrowTag -- The exception is being caught, false positive.
	 */
	public static function add_secret_to_url_validation_response( array $response ) {
		try {
			$secret = new URL_Secret();

			$secret->create();

			if ( $secret->exists() ) {
				$response['url_secret'] = $secret->get_secret();
			}
		} catch ( Exception $e ) {
			$response['url_secret_error'] = new WP_Error( 'unable_to_create_url_secret', $e->getMessage() );
		}

		return $response;
	}

	/**
	 * Check if URL is an IP.
	 *
	 * @param string $hostname The hostname to check.
	 * @return bool
	 */
	public static function url_is_ip( $hostname = null ) {

		if ( ! $hostname ) {
			$hostname = wp_parse_url( Urls::site_url(), PHP_URL_HOST );
		}

		$is_ip = filter_var( $hostname, FILTER_VALIDATE_IP ) !== false ? $hostname : false;
		return $is_ip;
	}

	/**
	 * Add IDC-related data to the registration query.
	 *
	 * @param array $params The existing query params.
	 *
	 * @return array
	 */
	public static function register_request_body( array $params ) {
		$persistent_blog_id = get_option( static::PERSISTENT_BLOG_ID_OPTION_NAME );
		if ( $persistent_blog_id ) {
			$params['persistent_blog_id'] = $persistent_blog_id;
			$params['url_secret']         = URL_Secret::create_secret( 'registration_request_url_secret_failed' );
		}

		return $params;
	}

	/**
	 * Set the necessary options when site gets registered.
	 *
	 * @param int $blog_id The blog ID.
	 *
	 * @return void
	 */
	public static function site_registered( $blog_id ) {
		update_option( static::PERSISTENT_BLOG_ID_OPTION_NAME, (int) $blog_id, false );
	}

	/**
	 * Check if we need to update the ip_requester option.
	 *
	 * @param string $hostname The hostname to check.
	 *
	 * @return void
	 */
	public static function maybe_update_ip_requester( $hostname ) {
		// Check if transient exists
		$transient_key = ip2long( $hostname );
		if ( $transient_key && ! get_transient( 'jetpack_idc_ip_requester_' . $transient_key ) ) {
			self::set_ip_requester_for_idc( $hostname, $transient_key );
		}
	}

	/**
	 * If URL is an IP, add the IP value to the ip_requester option with its expiry value.
	 *
	 * @param string $hostname The hostname to check.
	 * @param int    $transient_key The transient key.
	 */
	public static function set_ip_requester_for_idc( $hostname, $transient_key ) {
		// Check if option exists
		$data = Jetpack_Options::get_option( 'identity_crisis_ip_requester' );

		$ip_requester = array(
			'ip'         => $hostname,
			'expires_at' => time() + 360,
		);

		// If not set, initialize it
		if ( empty( $data ) ) {
			$data = array( $ip_requester );
		} else {
			$updated_data  = array();
			$updated_value = false;

			// Remove expired values and update existing IP
			foreach ( $data as $item ) {
				if ( time() > $item['expires_at'] ) {
					continue; // Skip expired IP
				}

				if ( $item['ip'] === $hostname ) {
					$item['expires_at'] = time() + 360;
					$updated_value      = true;
				}

				$updated_data[] = $item;
			}

			if ( ! $updated_value || empty( $updated_data ) ) {
				$updated_data[] = $ip_requester;
			}

			$data = $updated_data;
		}

		self::update_ip_requester( $data, $transient_key );
	}

	/**
	 * Update the ip_requester option and set a transient to expire in 5 minutes.
	 *
	 * @param array $data The data to be updated.
	 * @param int   $transient_key The transient key.
	 *
	 * @return void
	 */
	public static function update_ip_requester( $data, $transient_key ) {
		// Update the option
		$updated = Jetpack_Options::update_option( 'identity_crisis_ip_requester', $data );
		// Set a transient to expire in 5 minutes
		if ( $updated ) {
			$transient_name = 'jetpack_idc_ip_requester_' . $transient_key;
			set_transient( $transient_name, $data, 300 );
		}
	}

	/**
	 * Adds `ip_requester` to the `jetpack.idcUrlValidation` URL validation endpoint.
	 *
	 * @param array $response The enpoint response that we're modifying.
	 *
	 * @return array
	 */
	public static function add_ip_requester_to_url_validation_response( array $response ) {
		$requesters = Jetpack_Options::get_option( 'identity_crisis_ip_requester' );
		if ( $requesters ) {
			// Loop through the requesters and add the IP to the response if it's not expired
			$i = 0;
			foreach ( $requesters as $ip ) {
				if ( $ip['expires_at'] > time() ) {
					$response['ip_requester'][] = $ip['ip'];
				}
				// Limit the response to five IPs
				$i = ++$i;
				if ( $i === 5 ) {
					break;
				}
			}
		}
		return $response;
	}
}
