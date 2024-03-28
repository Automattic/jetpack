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
		$this->handle_subscribe_block_post_end_placement();
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
	 * Returns post end placement hooked block attributes.
	 *
	 * @param array $default_attrs Deafult attributes.
	 * @param array $anchor_block The anchor block, in parsed block array format.
	 *
	 * @return array
	 */
	protected function get_post_end_placement_block_attributes( $default_attrs, $anchor_block ) {
		if ( ! empty( $anchor_block['attrs']['layout']['type'] ) ) {
			return array_merge(
				$default_attrs,
				array(
					'layout' => array(
						'type' => $anchor_block['attrs']['layout']['type'],
					),
				)
			);
		}

		if ( ! empty( $anchor_block['attrs']['layout']['inherit'] ) ) {
			return array_merge(
				$default_attrs,
				array(
					'layout' => array(
						'inherit' => $anchor_block['attrs']['layout']['inherit'],
					),
				)
			);
		}

		return $default_attrs;
	}

	/**
	 * Handles Subscribe block placement at the end of each post.
	 *
	 * @return void
	 */
	protected function handle_subscribe_block_post_end_placement() {
		global $wp_version;

		$subscribe_post_end_enabled = get_option( 'jetpack_subscriptions_subscribe_post_end_enabled', false );
		if ( ! $subscribe_post_end_enabled ) {
			return;
		}

		if ( ! wp_is_block_theme() || version_compare( $wp_version, '6.5-beta2', '<' ) ) { // Fallback for classic themes and wp core < 6.5-beta2.
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
						// translators: %s is the name of the site.
						$discover_more_from_text = sprintf( __( 'Discover more from %s', 'jetpack' ), get_bloginfo( 'name' ) );
						$subscribe_text          = __( 'Subscribe to get the latest posts to your email.', 'jetpack' );

						return $content . do_blocks(
							<<<HTML
<!-- wp:group {"style":{"spacing":{"padding":{"top":"0px","bottom":"0px","left":"0px","right":"0px"},"margin":{"top":"32px","bottom":"32px"}},"border":{"width":"0px","style":"none"}},"className":"has-border-color","layout":{"type":"default"}} -->
<div class="wp-block-group has-border-color" style="border-style:none;border-width:0px;margin-top:32px;margin-bottom:32px;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px">
	<!-- wp:separator {"style":{"spacing":{"margin":{"bottom":"24px"}}},"className":"is-style-wide"} -->
	<hr class="wp-block-separator has-alpha-channel-opacity is-style-wide" style="margin-bottom:24px"/>
	<!-- /wp:separator -->

	<!-- wp:heading {"textAlign":"center","level":3,"style":{"layout":{"selfStretch":"fit","flexSize":null},"spacing":{"margin":{"top":"4px","bottom":"10px"}}}} -->
	<h3 class="wp-block-heading has-text-align-center" style="margin-top:4px;margin-bottom:10px">$discover_more_from_text</h3>
	<!-- /wp:heading -->

	<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"15px"},"spacing":{"margin":{"top":"10px","bottom":"10px"}}}} -->
	<p class="has-text-align-center" style="margin-top:10px;margin-bottom:10px;font-size:15px">$subscribe_text</p>
	<!-- /wp:paragraph -->

	<!-- wp:group {"layout":{"type":"constrained","contentSize":"480px"}} -->
	<div class="wp-block-group">
		<!-- wp:jetpack/subscriptions /-->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
HTML
						);
					}

					return $content;
				},
				100, // To insert it after the sharing blocks.
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
					$attrs = $this->get_post_end_placement_block_attributes(
						array(
							'style' => array(
								'spacing' => array(
									'margin'  => array(
										'top'    => '48px',
										'bottom' => '48px',
									),
									'padding' => array(
										'top'    => '5px',
										'bottom' => '5px',
									),
								),
							),
						),
						$anchor_block
					);

					// translators: %s is the name of the site.
					$discover_more_from_text = sprintf( __( 'Discover more from %s', 'jetpack' ), get_bloginfo( 'name' ) );
					$subscribe_text          = __( 'Subscribe to get the latest posts to your email.', 'jetpack' );
					$inner_content_begin     = <<<HTML
<div class="wp-block-group" style="margin-top:48px;margin-bottom:48px;padding-top:5px;padding-bottom:5px">
	<!-- wp:separator {"style":{"spacing":{"margin":{"bottom":"36px"}}},"className":"is-style-wide"} -->
	<hr class="wp-block-separator has-alpha-channel-opacity is-style-wide" style="margin-bottom:36px"/>
	<!-- /wp:separator -->

	<!-- wp:heading {"textAlign":"center","level":3,"style":{"layout":{"selfStretch":"fit","flexSize":null},"spacing":{"margin":{"top":"4px","bottom":"10px"}}}} -->
	<h3 class="wp-block-heading has-text-align-center" style="margin-top:4px;margin-bottom:10px">$discover_more_from_text</h3>
	<!-- /wp:heading -->

	<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"15px"},"spacing":{"margin":{"top":"4px","bottom":"0px"}}}} -->
	<p class="has-text-align-center" style="margin-top:4px;margin-bottom:0px;font-size:15px">$subscribe_text</p>
	<!-- /wp:paragraph -->

	<!-- wp:group {"layout":{"type":"constrained","contentSize":"480px"}} -->
	<div class="wp-block-group">
HTML;
					$inner_content_end       = <<<HTML
	</div>
	<!-- /wp:group -->
</div>
HTML;

					return array(
						'blockName'    => 'core/group',
						'attrs'        => $attrs,
						'innerBlocks'  => array( $hooked_block ),
						'innerContent' => array(
							$inner_content_begin,
							null,
							$inner_content_end,
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
