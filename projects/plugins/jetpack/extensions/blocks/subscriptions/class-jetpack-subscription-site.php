<?php
/**
 * Adds support for Jetpack Subscription Site feature.
 *
 * @package automattic/jetpack
 * @since 13.2
 */

namespace Automattic\Jetpack\Extensions\Subscriptions;

use Jetpack_Memberships;

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
		// It's temporary. Allows to enable the Subscription Site feature.
		$subscription_site_enabled = (bool) apply_filters( 'jetpack_subscription_site_enabled', false );

		global $wp_version;
		return $subscription_site_enabled && version_compare( $wp_version, '6.5-beta2', '>=' );
	}

	/**
	 * Returns true if current user can view the post.
	 *
	 * @return bool
	 */
	protected function user_can_view_post() {
		if ( ! class_exists( 'Jetpack_Memberships' ) ) {
			return true;
		}

		return Jetpack_Memberships::user_can_view_post();
	}

	/**
	 * Handles Subscribe block placement at the end of each post.
	 *
	 * @return viod
	 */
	protected function handle_subscribe_block_post_end_placement() {
		$subscribe_post_end_enabled = get_option( 'jetpack_subscriptions_subscribe_post_end_enabled', false );
		if ( ! $subscribe_post_end_enabled ) {
			return;
		}

		if ( ! wp_is_block_theme() ) { // Fallback for classic themes.
			add_filter(
				'the_content',
				function ( $content ) {
					// Check if we're inside the main loop in a single Post.
					if (
						is_singular() &&
						in_the_loop() &&
						is_main_query() &&
						$this->user_can_view_post()
					) {
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
				if (
					$anchor_block === 'core/post-content' &&
					$relative_position === 'after' &&
					$this->user_can_view_post()
				) {
					$hooked_blocks[] = 'jetpack/subscriptions';
				}

				return $hooked_blocks;
			},
			10,
			3
		);

		add_filter(
			'hooked_block_jetpack/subscriptions',
			function ( $hooked_block, $hooked_block_type, $relative_position, $anchor_block ) {
				$is_post_content_anchor_block = isset( $anchor_block['blockName'] ) && $anchor_block['blockName'] === 'core/post-content';
				if ( $is_post_content_anchor_block && ( $relative_position === 'after' || $relative_position === 'before' ) ) {
					$attrs = array(
						'layout' => array(
							'type'           => 'flex',
							'orientation'    => 'vertical',
							'justifyContent' => 'stretch',
						),
					);
					if ( ! empty( $anchor_block['attrs']['layout']['type'] ) ) {
						$attrs['layout']['type'] = $anchor_block['attrs']['layout']['type'];
					}

					return array(
						'blockName'    => 'core/group',
						'attrs'        => $attrs,
						'innerBlocks'  => array( $hooked_block ),
						'innerContent' => array(
							'<div class="wp-block-group">
								<!-- wp:paragraph {"style":{"typography":{"fontStyle":"normal","fontWeight":"300"}},"className":"has-text-align-center"} -->
								<p class="has-text-align-center" style="font-style:normal;font-weight:300">
									<em>Aliquam a ullamcorper lorem<br>Integer at tempus nibh</em>
								</p>
								<!-- /wp:paragraph -->',
							null,
							'</div>',
						),
					);
				}

				return $hooked_block;
			},
			10,
			4
		);
	}
}
