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

	/**
	 * Get the URL of the Subscribers tab of the Newsletter page.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null The URL, or null when the current user cannot open the tab, which includes any call before `admin_menu` has run.
	 */
	public static function get_subscribers_url() {
		if ( ! Settings::is_subscribers_tab_available() ) {
			return null;
		}

		// The page's router reads its route and search only from `p`; a top-level `tab` is ignored.
		return admin_url( 'admin.php?page=' . Settings::ADMIN_PAGE_SLUG . '&p=' . rawurlencode( '/?tab=subscribers' ) );
	}
}
