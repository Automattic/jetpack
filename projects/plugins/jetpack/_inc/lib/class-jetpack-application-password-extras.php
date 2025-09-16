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
		// Allow Application Password access to admin-ajax.php
		if ( is_admin() && wp_doing_ajax() ) {
			return true;
		}

		// Allow access to post/page previews
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['p'] ) || isset( $_GET['page_id'] ) ) {
			return true;
		}

		return $original_value;
	}

	/**
	 * Get the abilities that this extension provides.
	 *
	 * @return array Array of abilities with their status.
	 */
	public static function get_abilities() {
		return array(
			'admin-ajax'    => true,
			'post-previews' => true,
		);
	}
}
