<?php
/**
 * Adds support for Jetpack Subscription Site feature.
 *
 * @package automattic/jetpack
 * @since 13.3
 */

namespace Automattic\Jetpack\Extensions\Subscriber_Login;

use WP_Block_Template;
use WP_Post;

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
	 * Returns true if context is recognized as a header element.
	 *
	 * @param WP_Block_Template|WP_Post|array $context The block template, template part, or pattern the anchor block belongs to.
	 *
	 * @return bool
	 */
	protected function is_header_context( $context ) {
		if ( $context instanceof WP_Post && $context->post_type === 'wp_navigation' ) {
			return true;
		}

		if ( $context instanceof WP_Block_Template && $context->area === 'header' ) {
			return true;
		}

		return false;
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
			function ( $hooked_blocks, $relative_position, $anchor_block, $context ) {
				if (
					$anchor_block === 'core/navigation' &&
					$relative_position === 'last_child' &&
					self::is_header_context( $context )
				) {
					$hooked_blocks[] = 'jetpack/subscriber-login';
				}

				return $hooked_blocks;
			},
			10,
			4
		);
	}
}
