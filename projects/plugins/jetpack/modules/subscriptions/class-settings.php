<?php
/**
 * The Subscriptions settings.
 *
 * This is a class that contains helper functions for the Subscriptions settings module.
 *
 * @package automattic/jetpack-subscriptions
 */

namespace Automattic\Jetpack\Modules\Subscriptions;

/**
 * Class Settings
 */
class Settings {
	/**
	 * The default reply-to option.
	 *
	 * @var string
	 */
	public static $default_reply_to = 'comment';

	/**
	 * Validate the reply-to option.
	 *
	 * @param string $reply_to The reply-to option to validate.
	 * @return bool Whether the reply-to option is valid or not.
	 */
	public static function is_valid_reply_to( $reply_to ) {
		$valid_values = array( 'author', 'no-reply', 'comment' );
		if ( in_array( $reply_to, $valid_values, true ) ) {
			return true;
		}
		return false;
	}

	/**
	 * Get the default value for the wpcom_featured_image_in_email option.
	 * This function updates the default value to "enabled" for sites created after $new_default_after_date.
	 * This is an attempt to make the new default backwards compatible.
	 * Otherwise, existing sites implicitly relying on the "unset" (disabled) value would have their setting enabled.
	 *
	 * @return int 1 for sites created on or after cuttoff date, 0 for existing sites
	 */
	public static function get_wpcom_featured_image_in_email_default() {
		$new_default_after_date = '2025-03-27';

		$creation_date = '';
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$blog_id       = get_current_blog_id();
			$details       = get_blog_details( $blog_id );
			$creation_date = $details->registered;
		} else {
			$manager       = new \Automattic\Jetpack\Connection\Manager();
			$creation_date = $manager->get_assumed_site_creation_date();
		}

		if ( strtotime( $creation_date ) >= strtotime( $new_default_after_date ) ) {
			return 1;
		}

		return 0;
	}
}
