<?php
/**
 * URL helper for the unified Newsletter screen.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter;

/**
 * A class responsible for generating Newsletter URLs.
 */
class Urls {

	/**
	 * Get the Newsletter URL (defaults to the Subscribers tab).
	 *
	 * @return string The Newsletter URL.
	 */
	public static function get_newsletter_settings_url() {
		return admin_url( 'admin.php?page=' . Settings::ADMIN_SLUG );
	}
}
