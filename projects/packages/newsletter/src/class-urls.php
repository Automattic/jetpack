<?php
/**
 * URL helper for newsletter settings.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter;

/**
 * A class responsible for generating newsletter settings URLs.
 */
class Urls {

	/**
	 * Get the newsletter settings URL.
	 *
	 * @return string The newsletter settings URL.
	 */
	public static function get_newsletter_settings_url() {
		return admin_url( 'admin.php?page=jetpack-newsletter' );
	}
}
