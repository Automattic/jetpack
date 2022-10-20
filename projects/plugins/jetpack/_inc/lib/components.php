<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

use Automattic\Jetpack\Status;

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

		ob_start();
		// `include` fails gracefully and throws a warning, but doesn't halt execution.
		include JETPACK__PLUGIN_DIR . "_inc/blocks/$name.html";
		$markup = ob_get_clean();

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
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/plans.php';
		$plan = Jetpack_Plans::get_plan( $plan_slug );

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
