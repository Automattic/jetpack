<?php
/**
 * Adds support for Jetpack Subscription Site feature.
 *
 * @package automattic/jetpack
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\Extensions\Subscriptions;

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
	 * Handles Subscribe block placements.
	 *
	 * @return void
	 */
	public function handle_subscribe_block_placements() {
		if ( ! $this->is_subscription_site_feature_enabled() ) {
			return;
		}

		$this->handle_subscribe_block_post_end_placement();
	}

	/**
	 * Returns true if Subscription Site feature is enabled.
	 *
	 * @return bool
	 */
	protected function is_subscription_site_feature_enabled() {
		return (bool) apply_filters( 'jetpack_subscription_site_enabled', false );
	}

	/**
	 * Handles Subscribe block placement at the end of each post.
	 *
	 * @return viod
	 */
	protected function handle_subscribe_block_post_end_placement() {
		$subscribe_post_end_enabled = get_option( 'jetpack_subscribe_post_end_enabled', false );
		if ( ! $subscribe_post_end_enabled ) {
			return;
		}

		if ( ! wp_is_block_theme() ) {
			add_filter(
				'the_content',
				function ( $content ) {
					// Check if we're inside the main loop in a single Post
					if ( is_singular() && in_the_loop() && is_main_query() ) {
						return $content . '
	<!-- wp:group {"className":"wp-block-jetpack-subscriptions__subscribe_post_end","layout":{"type":"flex","orientation":"vertical","justifyContent":"stretch"}} -->
	<div class="wp-block-group wp-block-jetpack-subscriptions__subscribe_post_end">
		<!-- wp:paragraph {"style":{"typography":{"fontStyle":"normal","fontWeight":"300"}},"className":"has-text-align-center"} -->
		<p class="has-text-align-center" style="font-style:normal;font-weight:300">
			<em>Aliquam a ullamcorper lorem<br>Integer at tempus nibh</em>
		</p>
		<!-- /wp:paragraph -->
		<!-- wp:jetpack/subscriptions /-->
	</div>
	<!-- /wp:group -->';
					}

					return $content;
				},
				8, // TODO use 10 and do_blocks instead?
				1
			);

			return;
		}

		add_filter(
			'hooked_block_types',
			function ( $hooked_blocks, $relative_position, $anchor_block ) {
				if ( $anchor_block === 'core/post-content' && $relative_position === 'after' ) {
					$hooked_blocks[] = 'jetpack/subscriptions';
				}

				return $hooked_blocks;
			},
			10,
			3
		);

		add_filter(
			'hooked_block_jetpack/subscriptions',
			function ( $hooked_block, $relative_position, $anchor_block ) {
				l( $hooked_block );

				if ( $anchor_block === 'core/post-content' && $relative_position === 'after' && isset( $anchor_block['attrs']['layout'] ) ) {
					$hooked_block['attrs']['layout'] = $anchor_block['attrs']['layout'];
				}

				return $hooked_block;
			},
			10,
			3
		);
	}
}
