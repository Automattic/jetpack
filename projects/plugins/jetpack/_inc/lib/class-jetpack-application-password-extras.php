<?php
/**
 * Jetpack Application Password Extras
 *
 * Extends WordPress Application Passwords to work with additional abilities
 * beyond the REST API.
 *
 * @package jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Extends Application Password functionality beyond the REST API.
 */
class Jetpack_Application_Password_Extras {
	/**
	 * Allowed CORS origins for AJAX requests
	 */
	const ALLOWED_AJAX_CORS_ORIGINS = array(
		'https://android-app-assets.jetpack.com', // Jetpack Android mobile app WebView
	);

	/**
	 * The AJAX action prefix for VideoPress actions.
	 *
	 * @var string
	 */
	private const VIDEOPRESS_AJAX_PREFIX = 'videopress-';

	/**
	 * Initialize the main hooks.
	 */
	public static function init() {
		add_filter( 'application_password_is_api_request', array( __CLASS__, 'application_password_extras' ) );
		// Use a hook that runs early, before send_origin_headers, which exits before
		// the `send_origin_headers` function is called.
		// https://github.com/WordPress/wordpress-develop/blob/3c3852e8a2a70c4f09233ffe5bce03576a687130/src/wp-includes/http.php#L525-L527
		add_action( 'wp_loaded', array( __CLASS__, 'add_ajax_preflight_headers' ), 5 );
		add_filter( 'allowed_http_origins', array( __CLASS__, 'allow_ajax_cors_origins' ) );
	}

	/**
	 * Allow Application Password access to additional abilities.
	 *
	 * NOTE: If expanding this to include more abilities, consider updating the
	 * `get_abilities` method to include new abilities.
	 *
	 * @param bool $original_value The original value of the filter.
	 * @return bool The new value of the filter.
	 */
	public static function application_password_extras( $original_value ) {
		if ( $original_value ) {
			return true;
		}

		return is_admin() && wp_doing_ajax() && self::is_ajax_action_allowed();
	}

	/**
	 * Check if the current AJAX action is allowed for Application Password authentication.
	 *
	 * @return bool True if the action is allowed, false otherwise.
	 */
	private static function is_ajax_action_allowed() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- We're only checking the action name, not processing the request.
		$action = isset( $_REQUEST['action'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['action'] ) ) : '';

		if ( empty( $action ) ) {
			return false;
		}

		return str_starts_with( $action, self::VIDEOPRESS_AJAX_PREFIX );
	}

	/**
	 * Get the abilities that this extension provides.
	 *
	 * @return array Array of abilities with their status.
	 */
	public static function get_abilities() {
		return array(
			'admin-ajax' => true,
		);
	}

	/**
	 * Add CORS headers for OPTIONS preflight requests
	 */
	public static function add_ajax_preflight_headers() {
		$origin = get_http_origin();
		if ( ! self::is_ajax_preflight_request_allowed( $origin ) ) {
			return;
		}

		header( 'Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce' );
		header( 'Access-Control-Allow-Methods: GET, POST, OPTIONS' );
		header( 'Access-Control-Max-Age: 86400' );
	}

	/**
	 * Allow CORS origins for authorized admin-ajax requests
	 *
	 * @param array $allowed_origins Array of allowed origin URLs.
	 * @return array Array of allowed origin URLs.
	 */
	public static function allow_ajax_cors_origins( $allowed_origins ) {
		$has_auth_header   = ! empty( $_SERVER['HTTP_AUTHORIZATION'] );
		$is_auth_preflight = self::is_auth_preflight_request();
		$is_admin_ajax     = self::is_admin_ajax_request();

		// Only allow CORS for admin-ajax.php requests that have authorization or are authorization preflights
		if ( $is_admin_ajax && ( $has_auth_header || $is_auth_preflight ) ) {
			$origin = get_http_origin();
			// Only allow whitelisted origins
			if ( $origin && self::is_origin_in_ajax_allowed_list( $origin ) && ! in_array( $origin, $allowed_origins, true ) ) {
				$allowed_origins[] = $origin;
			}
		}

		return $allowed_origins;
	}

	/**
	 * Check if AJAX preflight request should be allowed for the given origin
	 *
	 * @param string $origin The origin to check.
	 * @return bool Whether the preflight request should be allowed.
	 */
	private static function is_ajax_preflight_request_allowed( $origin ) {
		$is_origin_in_allowed_list = self::is_origin_in_ajax_allowed_list( $origin );
		$is_auth_preflight         = self::is_auth_preflight_request();
		$is_admin_ajax             = self::is_admin_ajax_request();

		return $is_origin_in_allowed_list && $is_auth_preflight && $is_admin_ajax;
	}

	/**
	 * Check if an origin is in the AJAX CORS allowed list
	 *
	 * @param string $origin The origin to check.
	 * @return bool Whether the origin should be allowed.
	 */
	private static function is_origin_in_ajax_allowed_list( $origin ) {
		/**
		 * Filter the allowed AJAX CORS origins
		 *
		 * @param array $allowed_origins Array of allowed origin URLs
		 */
		$allowed_origins = apply_filters( 'ajax_allowed_cors_origins', self::ALLOWED_AJAX_CORS_ORIGINS );

		return in_array( $origin, $allowed_origins, true );
	}

	/**
	 * Check if the request is an authorization preflight request
	 *
	 * @return bool Whether the request is an authorization preflight request.
	 */
	private static function is_auth_preflight_request() {
		$request_method  = isset( $_SERVER['REQUEST_METHOD'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) : '';
		$request_headers = isset( $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] ) ) : '';

		return 'OPTIONS' === $request_method && false !== stripos( $request_headers, 'authorization' );
	}

	/**
	 * Check if the current request is an admin AJAX request
	 *
	 * @return bool Whether this is an admin-ajax.php request
	 */
	private static function is_admin_ajax_request() {
		return is_admin() && wp_doing_ajax();
	}
}
