<?php
/**
 * The Subscriptions settings.
 *
 * @package automattic/jetpack-subscriptions
 */

namespace Automattic\Jetpack\Modules\Subscriptions;

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
		$valid_values = array( 'author', 'no-reply', 'custom' );
		if ( in_array( $reply_to, $valid_values, true ) ) {
			return true;
		}
		return false;
	}
}
