<?php
/**
 * Identity_Crisis class of the Connection package.
 *
 * @package  automattic/jetpack-connection
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Client;
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
 * @since automattic/jetpack-identity-crisis:0.2.0
 * @since-jetpack 4.4.0
 * @since 2.9.0
 */
class Identity_Crisis {
	/**
	 * Persistent WPCOM blog ID that stays in the options after disconnect.
	 */
	const PERSISTENT_BLOG_ID_OPTION_NAME = 'jetpack_persistent_blog_id';

	/**
	 * Initial delay for IDC validation in seconds (1 hour).
	 */
	const IDC_VALIDATION_INITIAL_DELAY = 3600;

	/**
	 * Maximum delay for IDC validation in seconds (30 days).
	 */
	const IDC_VALIDATION_MAX_DELAY = 2592000;

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
	 * @var \WP_Screen
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
			: esc_html__( 'Jetpack Safe Mode', 'jetpack-connection' );

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
		if ( is_array( $response ) && isset( $response['error_code'] ) ) {
			$error_code              = $response['error_code'];
			$allowed_idc_error_codes = array(
				'jetpack_url_mismatch',
				'jetpack_home_url_mismatch',
				'jetpack_site_url_mismatch',
			);

			if ( in_array( $error_code, $allowed_idc_error_codes, true ) ) {
				// This is a defensive fallback.
				$new_idc_data = self::get_idc_option_with_preserved_timing( $response );
				Jetpack_Options::update_option( 'sync_error_idc', $new_idc_data );
			}

			return true;
		}

		return false;
	}

	/**
	 * Gets IDC option data with timing preserved from existing option if appropriate.
	 *
	 * This is a defensive fallback for edge cases where IDC errors are repeatedly detected
	 * even though the site should be in IDC mode. However, edge cases can cause the option
	 * to be deleted, triggering new IDC detections.
	 *
	 * @param array $response The IDC error response from WordPress.com.
	 *
	 * @return array The IDC option data, with timing preserved if the wpcom URLs match.
	 */
	private static function get_idc_option_with_preserved_timing( $response ) {
		// Get existing IDC option to check if this is the same error.
		$existing_idc = Jetpack_Options::get_option( 'sync_error_idc' );

		// Get the new error data with fresh timing values.
		$new_idc_data = self::get_sync_error_idc_option( $response );

		// If an existing IDC exists and the wpcom URLs match, preserve the backoff delay.
		if ( is_array( $existing_idc ) && self::has_same_wpcom_urls( $existing_idc, $new_idc_data ) ) {
			// Same wpcom URLs - preserve the backoff delay.
			// Note: last_checked is already set to time() by get_sync_error_idc_option(),
			// which is correct - we want to record that we just saw this error again.
			$preserved_delay = self::get_valid_delay_from_existing_idc( $existing_idc );
			if ( $preserved_delay !== null ) {
				$new_idc_data['next_check_delay'] = $preserved_delay;
			}
		}
		// else: Different wpcom URLs or first time - use fresh timing from get_sync_error_idc_option().

		return $new_idc_data;
	}

	/**
	 * Extracts and validates the next_check_delay from an existing IDC option.
	 *
	 * @param array $existing_idc The existing IDC option data.
	 *
	 * @return int|null The validated delay in seconds, or null if invalid.
	 */
	private static function get_valid_delay_from_existing_idc( $existing_idc ) {
		if ( ! isset( $existing_idc['next_check_delay'] ) ) {
			return null;
		}

		$delay = $existing_idc['next_check_delay'];

		// Validate the delay is numeric and within acceptable bounds.
		if (
			! is_numeric( $delay ) ||
			$delay < self::IDC_VALIDATION_INITIAL_DELAY ||
			$delay > self::IDC_VALIDATION_MAX_DELAY
		) {
			return null;
		}

		return (int) $delay;
	}

	/**
	 * Determines if two IDC error arrays have the same wpcom URLs.
	 *
	 * The wpcom URLs are stored in reversed form in the database, but the jetpack_options
	 * filter un-reverses them when retrieved. This method normalizes both sets of URLs
	 * to reversed form before comparing.
	 *
	 * @param array $idc1 First IDC error data (from get_option, may be un-reversed).
	 * @param array $idc2 Second IDC error data (from get_sync_error_idc_option, reversed).
	 *
	 * @return bool True if they have the same wpcom URLs.
	 */
	private static function has_same_wpcom_urls( $idc1, $idc2 ) {
		// Both must have wpcom_home and wpcom_siteurl to be comparable.
		if (
			! isset( $idc1['wpcom_home'] ) ||
			! isset( $idc1['wpcom_siteurl'] ) ||
			! isset( $idc2['wpcom_home'] ) ||
			! isset( $idc2['wpcom_siteurl'] ) ||
			! isset( $idc1['reversed_url'] ) ||
			! isset( $idc2['reversed_url'] )
		) {
			return false;
		}

		// The existing IDC data has been un-reversed by the jetpack_options filter when
		// retrieved via Jetpack_Options::get_option(), so the wpcom URLs are in normal format.
		// The new data from get_sync_error_idc_option() has reversed URLs.
		// Reverse the existing URLs to match the format of the new data for comparison.
		$existing_wpcom_home    = strrev( $idc1['wpcom_home'] );
		$existing_wpcom_siteurl = strrev( $idc1['wpcom_siteurl'] );

		// Compare the reversed URLs.
		return $existing_wpcom_home === $idc2['wpcom_home']
			&& $existing_wpcom_siteurl === $idc2['wpcom_siteurl'];
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
			// Ensure backward compatibility: add validation timing fields if missing.
			// Also ensure $sync_error is an array (could be a scalar from older code).
			if ( ! is_array( $sync_error ) ) {
				$sync_error = array();
			}
			if ( ! isset( $sync_error['last_checked'] ) ) {
				$sync_error['last_checked'] = 0;
			}
			if ( ! isset( $sync_error['next_check_delay'] ) ) {
				$sync_error['next_check_delay'] = self::IDC_VALIDATION_INITIAL_DELAY;
			}

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
					// Enable migrate_for_idc so that sync actions are accepted.
					Jetpack_Options::update_option( 'migrate_for_idc', true );
				} elseif ( $sync_error['home'] === $local_options['home'] && $sync_error['siteurl'] === $local_options['siteurl'] ) {
					$is_valid = true;

					// Check if it's time to validate the IDC with a remote call to WordPress.com.
					if ( self::should_remote_validate_idc( $sync_error ) ) {
						// Perform remote validation.
						if ( self::remote_validate_idc( $sync_error ) ) {
							// IDC was cleared remotely. The option is already deleted by
							// remote_validate_idc(), so return false immediately to
							// avoid double deletion and allow the filter to run.
							return (bool) apply_filters( 'jetpack_sync_error_idc_validation', false );
						}
					}
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
	 * Checks if enough time has passed to validate the IDC with a remote call.
	 *
	 * Uses progressive delay: starts at 1 hour, doubles each time (1h, 2h, 4h, 8h, 16h...),
	 * and stops checking once the maximum delay of 30 days is reached.
	 *
	 * @param array $sync_error The stored sync_error_idc option.
	 * @return bool True if validation should be performed, false otherwise.
	 */
	public static function should_remote_validate_idc( $sync_error ) {
		// Respect the user's decision to stay in safe mode.
		// If safe mode is confirmed, don't attempt validation.
		if ( self::safe_mode_is_confirmed() ) {
			return false;
		}

		// If a validation is already in progress or recently completed, don't trigger another.
		if ( get_transient( 'jetpack_idc_validation_lock' ) ) {
			return false;
		}

		// If delay is not set or invalid, validate immediately to bring into new system.
		if ( empty( $sync_error['next_check_delay'] ) ) {
			return true;
		}

		// If delay has reached or exceeded the maximum, stop validating.
		if ( $sync_error['next_check_delay'] >= self::IDC_VALIDATION_MAX_DELAY ) {
			return false;
		}

		// Check if enough time has passed since the last check.
		$time_since_last_check = time() - ( $sync_error['last_checked'] ?? 0 );
		return $time_since_last_check >= $sync_error['next_check_delay'];
	}

	/**
	 * Validates the stored IDC by making a remote call to WordPress.com.
	 *
	 * Makes a lightweight API call to check if WordPress.com still detects an IDC.
	 * If no IDC is detected in the response, the local IDC option is cleared.
	 * If an IDC is still detected, the option is refreshed with the latest URL data from
	 * WordPress.com and the validation timestamps are updated with progressive backoff.
	 * If the request fails (network error, timeout, etc.), timing is updated to prevent
	 * immediate retries but the delay interval is not increased.
	 *
	 * @param array $sync_error The stored sync_error_idc option with timing fields.
	 * @return bool True if IDC was cleared, false otherwise.
	 */
	public static function remote_validate_idc( $sync_error ) {
		// Prevent recursive calls that could cause infinite loops within the same request.
		static $is_validating = false;
		if ( $is_validating ) {
			return false;
		}

		$blog_id = Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			// Site not registered - IDC state is invalid without a connection to WordPress.com.
			// Clear the IDC since there's nothing to validate against, and the site can't
			// restore the blog_id while in IDC anyway (connection flow is blocked).
			Jetpack_Options::delete_option( 'sync_error_idc' );
			return true; // Return true to indicate IDC was cleared.
		}

		// Use a transient lock to prevent concurrent validations across multiple requests.
		// Lock for the full backoff duration to prevent retries during the delay window.
		$lock_key      = 'jetpack_idc_validation_lock';
		$lock_duration = $sync_error['next_check_delay'] ?? self::IDC_VALIDATION_INITIAL_DELAY;

		if ( get_transient( $lock_key ) ) {
			return false;
		}

		// Set the lock and verify it was set successfully.
		// If the write fails, bail immediately to prevent request floods.
		if ( ! set_transient( $lock_key, true, $lock_duration ) ) {
			return false; // Bail - can't prevent concurrent requests.
		}

		$is_validating = true;

		// Update last_checked before making the API call.
		// This prevents retries even if the API call hangs, times out, or response handling fails.
		$sync_error['last_checked'] = time();
		// Note: update_option may return false if value unchanged, which is OK.
		// We only bail if we can't verify the option exists with correct timestamp.
		Jetpack_Options::update_option( 'sync_error_idc', $sync_error );

		// Verify the critical timing field was persisted.
		// This protects against caching/DB issues that would cause request floods.
		$verified_option = Jetpack_Options::get_option( 'sync_error_idc' );
		if (
			! is_array( $verified_option ) ||
			empty( $verified_option['last_checked'] ) ||
			(int) $verified_option['last_checked'] !== (int) $sync_error['last_checked']
		) {
			// Option is missing, corrupted, or has incorrect timestamp - BAIL to prevent retries.
			delete_transient( $lock_key );
			$is_validating = false;
			return false;
		}

		// Build API path with current URLs as query params.
		// We must explicitly include URLs because add_idc_query_args_to_url() skips
		// adding them when the site is in IDC (to prevent sync). For revalidation,
		// we need WordPress.com to compare current URLs against what it has stored.
		// We use the jetpack-token-health/blog endpoint which performs IDC detection
		// and returns idc_detected in the response when URLs don't match.
		$api_path = sprintf(
			'sites/%d/jetpack-token-health/blog?home=%s&siteurl=%s&idc=1&idc_validation=1',
			$blog_id,
			rawurlencode( Urls::home_url() ),
			rawurlencode( Urls::site_url() )
		);

		// Make an API call to WordPress.com to check token health and IDC status.
		// The response will include 'idc_detected' if URLs still mismatch.
		$response = Client::wpcom_json_api_request_as_blog(
			$api_path,
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		// Parse response body - will be null/false if request failed or JSON is invalid.
		$body = null;
		if ( ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ) {
			$body = json_decode( wp_remote_retrieve_body( $response ), true );
		}

		// Check for success: valid response with no idc_detected means IDC is resolved.
		if ( is_array( $body ) && empty( $body['idc_detected'] ) ) {
			Jetpack_Options::delete_option( 'sync_error_idc' );
			delete_transient( $lock_key );
			$is_validating = false;
			return true;
		}

		// IDC still exists or request failed - update timing.
		$idc_detected = is_array( $body ) && ! empty( $body['idc_detected'] ) && is_array( $body['idc_detected'] );

		if ( $idc_detected ) {
			// Valid idc_detected response - refresh data and apply exponential backoff.
			// @phan-suppress-next-line PhanTypeArraySuspiciousNullable -- $body is verified as array in $idc_detected check
			$fresh_idc_data                     = self::get_sync_error_idc_option( $body['idc_detected'] );
			$fresh_idc_data['last_checked']     = time();
			$fresh_idc_data['next_check_delay'] = min(
				( $sync_error['next_check_delay'] ?? self::IDC_VALIDATION_INITIAL_DELAY ) * 2,
				self::IDC_VALIDATION_MAX_DELAY
			);
			Jetpack_Options::update_option( 'sync_error_idc', $fresh_idc_data );
			self::invalidate_idc_option_cache();
		} else {
			// Network error, invalid JSON, or non-200 - just update last_checked without backoff.
			$sync_error['last_checked'] = time();
			Jetpack_Options::update_option( 'sync_error_idc', $sync_error );
			self::invalidate_idc_option_cache();
		}

		delete_transient( $lock_key );
		$is_validating = false;
		return false;
	}

	/**
	 * Invalidate the cache for the sync_error_idc option.
	 *
	 * This ensures that subsequent requests read fresh data from the database
	 * rather than stale cached values, which is critical for preventing request floods.
	 *
	 * Note: This directly calls wp_cache_delete with the 'jetpack_options' cache group,
	 * which couples this code to the internal caching implementation of Jetpack_Options.
	 * If Jetpack_Options changes its caching strategy, this method will need to be updated.
	 *
	 * @return void
	 */
	private static function invalidate_idc_option_cache() {
		wp_cache_delete( 'sync_error_idc', 'jetpack_options' );
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
					esc_html__( 'Cannot parse URL %s', 'jetpack-connection' ),
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

		// Add validation timing fields.
		// Set last_checked to current time so remote validation doesn't trigger immediately.
		// This ensures the first validation happens after the initial delay period.
		$returned_values['last_checked']     = time();
		$returned_values['next_check_delay'] = self::IDC_VALIDATION_INITIAL_DELAY;

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
	 *
	 * phpcs:ignore Squiz.Commenting.FunctionCommentThrowTag -- The exception is being caught, false positive.
	 */
	public static function add_secret_to_url_validation_response( array $response ) {
		// Only checking the database option to limit the effect.
		if ( get_option( 'jetpack_offline_mode' ) ) {
			$response['offline_mode'] = '1';
			return $response;
		}

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
