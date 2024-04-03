<?php
/**
 * Adds support for Jetpack Subscription Site feature.
 *
 * @package automattic/jetpack
 * @since $$next_version$$
 */

namespace Automattic\Jetpack\Extensions\Subscriber_Login;

/**
 * Jetpack_Subscription_Site class.
 */
class Jetpack_Subscription_Site {
	/**
	 * Jetpack_Subscription_Site singleton instance.
	 *
	 * @var Jetpack_Subscription_Site|null
	 */
	private static $instance;

	/**
	 * Jetpack_Subscription_Site instance init.
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new Jetpack_Subscription_Site();
		}

		return self::$instance;
	}

	/**
	 * Handles Subscriber Login block placements.
	 *
	 * @return void
	 */
	public function handle_subscriber_login_block_placements() {
		$this->handle_subscriber_login_block_navigation_placement();
	}

	/**
	 * Handles Subscriber Login block navigation placement.
	 *
	 * @return void
	 */
	protected function handle_subscriber_login_block_navigation_placement() {
		$subscriber_login_navigation_enabled = get_option( 'jetpack_subscriptions_login_navigation_enabled', false );
		if ( ! $subscriber_login_navigation_enabled ) {
			return;
		}

		if ( ! wp_is_block_theme() ) { // TODO Fallback for classic themes.
			return;
		}

		add_filter(
			'hooked_block_types',
			function ( $hooked_blocks, $relative_position, $anchor_block ) {
				if ( $anchor_block === 'core/navigation' && $relative_position === 'last_child' ) {
					$hooked_blocks[] = 'jetpack/subscriber-login';
				}

				return $hooked_blocks;
			},
			10,
			3
		);
	}
}
