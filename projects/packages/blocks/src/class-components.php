<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Jetpack_blocks package.
 *
 * @package  automattic/jetpack-blocks
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Status as Status;

/**
 * Components Library
 *
 * Load and display a pre-rendered component
 */
class Jetpack_Components {
	/**
	 * Load and display a pre-rendered component
	 *
	 * @since 7.7.0
	 *
	 * @param string $name  Component name.
	 * @param array  $props Component properties.
	 *
	 * @return string The component markup
	 */
	public static function render_component( $name, $props ) {

		$rtl = is_rtl() ? '.rtl' : '';
		wp_enqueue_style( 'jetpack-components', plugins_url( "_inc/blocks/components{$rtl}.css", JETPACK__PLUGIN_FILE ), array( 'wp-components' ), JETPACK__VERSION );

		/*
		 * When making changes to the markup here,
		 * you may want to make similar changes to the editor markup,
		 * generated in projects/plugins/jetpack/extensions/shared/components/upgrade-nudge/index.jsx
		 */
		$markup = '';
		if ( 'frontend-nudge' === $name ) {
			$markup = '<div class="jetpack-upgrade-plan-banner"><div class="jetpack-upgrade-plan-banner__wrapper"><span class="undefined__description banner-description">#description#</span><a href="#checkoutUrl#" target="_top" class="components-button is-primary">#buttonText#</a></div></div>';
		} elseif ( 'upgrade-nudge' === $name ) {
			$markup = sprintf(
				'<div class="jetpack-upgrade-plan-banner"><div class="jetpack-upgrade-plan-banner__wrapper"><span class="undefined__description banner-description"><span>%1$s</span></span><a href="#checkoutUrl#" target="_top" class="components-button is-primary"><span>%2$s</span></a></div></div>',
				esc_html__( 'Upgrade your plan to use this premium block', 'jetpack' ),
				esc_html__( 'Upgrade', 'jetpack' )
			);
		}

		if ( empty( $markup ) ) {
			return $markup;
		}

		foreach ( $props as $key => $value ) {
			$markup = str_replace(
				"#$key#",
				$value,
				$markup
			);

			// Workaround, required to replace strings in `sprintf`-expressions.
			// See extensions/i18n-to-php.js for more information.
			$markup = str_replace(
				"%($key)s",
				$value,
				$markup
			);
		}

		return $markup;
	}

	/**
	 * Renders the frontend-nudge with the provided props.
	 *
	 * @param array $props Component properties.
	 *
	 * @return string The component markup.
	 */
	public static function render_frontend_nudge( $props ) {
		return self::render_component(
			'frontend-nudge',
			$props
		);
	}

	/**
	 * Load and display a pre-rendered component
	 *
	 * @since 7.7.0
	 *
	 * @param array $props Component properties.
	 *
	 * @return string The component markup
	 */
	public static function render_upgrade_nudge( $props ) {
		$plan_slug = $props['plan'];
		$plan      = Jetpack_Plans::get_plan( $plan_slug );

		if ( ! $plan ) {
			return self::render_component(
				'upgrade-nudge',
				array(
					'checkoutUrl' => '',
				)
			);
		}

		// WP.com plan objects have a dedicated `path_slug` field, Jetpack plan objects don't.
		$plan_path_slug = wp_startswith( $plan_slug, 'jetpack_' )
			? $plan_slug
			: $plan->path_slug;

		$post_id = get_the_ID();

		$site_slug = ( new Status() )->get_site_suffix();

		// Post-checkout: redirect back to the editor.
		$redirect_to = add_query_arg(
			array(
				'plan_upgraded' => 1,
			),
			get_edit_post_link( $post_id )
		);

		$upgrade_url =
			$plan_path_slug
			? add_query_arg(
				'redirect_to',
				$redirect_to,
				"https://wordpress.com/checkout/${site_slug}/${plan_path_slug}"
			) : '';

		return self::render_component(
			'upgrade-nudge',
			array(
				'checkoutUrl' => $upgrade_url,
			)
		);
	}
}
