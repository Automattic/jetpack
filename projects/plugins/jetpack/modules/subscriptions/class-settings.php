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
	 * Exposes the subscribe placement settings through /wp/v2/settings so the editor can read them.
	 *
	 * Only site administrators can access them, since that endpoint requires the manage_options capability.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function register_placement_settings() {
		$placement_options = array(
			'jetpack_subscribe_floating_button_enabled', // Floating subscribe button.
			'jetpack_subscribe_overlay_enabled', // Subscribe overlay.
			'sm_enabled', // Subscribe pop-up (modal).
		);

		foreach ( $placement_options as $option ) {
			register_setting(
				'general',
				$option,
				array(
					'type'              => 'boolean',
					'default'           => false,
					'show_in_rest'      => true,
					'sanitize_callback' => 'absint', // Keep 0/1 storage so a disabled option remains valid against the REST boolean schema.
				)
			);
		}
	}

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
}
