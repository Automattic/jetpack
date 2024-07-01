<?php
/**
 * The Subscriptions settings.
 *
 * This is a class that contains helper functions for the Subscriptions settings module.
 *
 * @package automattic/jetpack-subscriptions
 */

namespace Automattic\Jetpack\Modules\Subscriptions;

use Automattic\Jetpack\Status\Host;

/**
 * Class Settings
 */
class Settings {

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
	 * Get the default reply-to option.
	 *
	 * @return string The default reply-to option.
	 */
	public static function get_default_reply_to() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return 'comment';
		}

		return 'no-reply';
	}
}
