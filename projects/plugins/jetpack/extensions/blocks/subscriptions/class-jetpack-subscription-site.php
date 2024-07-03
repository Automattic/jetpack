<?php
/**
 * Adds support for Jetpack Subscription Site feature.
 *
 * @package automattic/jetpack
 * @since 13.2
 */

namespace Automattic\Jetpack\Extensions\Subscriptions;

use Jetpack_Memberships;
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
	 * Handles Subscribe block placements.
	 *
	 * @return void
	 */
	public function handle_subscribe_block_placements() {
		$this->handle_subscribe_block_post_end_placement();
		$this->handle_subscribe_block_navigation_placement();
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
	 * Handles Subscription block navigation placement.
	 *
	 * @return void
	 */
	protected function handle_subscribe_block_navigation_placement() {
		global $wp_version;

		$is_enabled = get_option( 'jetpack_subscriptions_subscribe_navigation_enabled', false );
		if ( ! $is_enabled ) {
			return;
		}

		if ( ! wp_is_block_theme() || version_compare( $wp_version, '6.5-beta2', '<' ) ) { // TODO Fallback for classic themes and wp core < 6.5-beta2.
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
					$hooked_blocks[] = 'jetpack/subscriptions';
				}

				return $hooked_blocks;
			},
			10,
			4
		);

		add_filter(
			'hooked_block_jetpack/subscriptions',
			function ( $hooked_block, $hooked_block_type, $relative_position, $anchor_block ) {
				$is_navigation_anchor_block = isset( $anchor_block['blockName'] ) && $anchor_block['blockName'] === 'core/navigation';

				if ( $is_navigation_anchor_block ) {
					$class_name = ( ! empty( $hooked_block['attrs'] ) && ! empty( $hooked_block['attrs']['className'] ) )
						? $hooked_block['attrs']['className'] . ' is-style-button'
						: 'is-style-button';

					$hooked_block['attrs']['className'] = $class_name;
				}

				return $hooked_block;
			},
			10,
			4
		);
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
						$subscribe_text          = __( 'Subscribe to get the latest posts sent to your email.', 'jetpack' );

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
		<!-- wp:jetpack/subscriptions {"appSource":"subscribe-block-post-end"} /-->
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
					$subscribe_text          = __( 'Subscribe to get the latest posts sent to your email.', 'jetpack' );
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

					$hooked_block['attrs']['appSource'] = 'subscribe-block-post-end';

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
