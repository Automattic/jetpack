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
}
