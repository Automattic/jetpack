<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
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
		jetpack_require_lib( 'plans' );
		$plan = Jetpack_Plans::get_plan( $plan_slug );

		if ( ! $plan ) {
			return self::render_component(
				'upgrade-nudge',
				array(
					'planName'   => __( 'a paid plan', 'jetpack' ),
					'upgradeUrl' => '',
				)
			);
		}

		// WP.com plan objects have a dedicated `path_slug` field, Jetpack plan objects don't
		// For Jetpack, we thus use the plan slug with the 'jetpack_' prefix removed.
		$plan_path_slug = wp_startswith( $plan_slug, 'jetpack_' )
			? substr( $plan_slug, strlen( 'jetpack_' ) )
			: $plan->path_slug;

		$post_id   = get_the_ID();
		$post_type = get_post_type();

		// The editor for CPTs has an `edit/` route fragment prefixed.
		$post_type_editor_route_prefix = in_array( $post_type, array( 'page', 'post' ), true ) ? '' : 'edit';

		if ( method_exists( 'Jetpack', 'build_raw_urls' ) ) {
			$site_slug = Jetpack::build_raw_urls( home_url() );
		} elseif ( class_exists( 'WPCOM_Masterbar' ) && method_exists( 'WPCOM_Masterbar', 'get_calypso_site_slug' ) ) {
			$site_slug = WPCOM_Masterbar::get_calypso_site_slug( get_current_blog_id() );
		}

		// Post-checkout: redirect back to the editor.
		$redirect_to = ( defined( 'IS_WPCOM' ) && IS_WPCOM )
			? '/' . implode( '/', array_filter( array( $post_type_editor_route_prefix, $post_type, $site_slug, $post_id ) ) )
			: add_query_arg(
				array(
					'action' => 'edit',
					'post'   => $post_id,
				),
				admin_url( 'post.php' )
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
				'planName'   => $plan->product_name,
				'upgradeUrl' => $upgrade_url,
			)
		);
	}
}
