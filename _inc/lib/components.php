<?php
/**
 * Components Library
 *
 * Load and display a pre-rendered component
 */
class Jetpack_Components {
	/**
	 * Load and display a pre-rendered component
	 *
	 * @since 7.6.0
	 *
	 * @return string The component markup
	 */
	public static function render_component( $name, $props ) {
		wp_enqueue_style( 'wp-components' );

		$rtl = is_rtl() ? '.rtl' : '';
		wp_enqueue_style( 'jetpack-components', plugins_url( "_inc/blocks/components{$rtl}.css", JETPACK__PLUGIN_FILE ), array(), JETPACK__VERSION );

		ob_start();
		require JETPACK__PLUGIN_DIR . "_inc/blocks/$name.html";
		$markup = ob_get_clean();

		foreach ( $props as $key => $value ) {
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
	 * @since 7.6.0
	 *
	 * @return string The component markup
	 */
	public static function render_upgrade_nudge( $props ) {
		$plan_slug = $props['plan'];
		jetpack_require_lib( 'plans' );
		$plan = Jetpack_Plans::get_plan( $plan_slug );

		// WP.com plan objects have a dedicated `path_slug` field, Jetpack plan objects don't
		// For Jetpack, we thus use the plan slug with the 'jetpack_' prefix removed.
		$plan_path_slug = wp_startswith( $plan_slug, 'jetpack_' )
			? substr( $plan_slug, strlen( 'jetpack_' ) )
			: $plan->path_slug;

		$post_id = get_the_ID();
		$post_type = get_post_type();

		// The editor for CPTs has an `edit/` route fragment prefixed
		$post_type_editor_route_prefix = in_array( $post_type, array( 'page', 'post' ) ) ? '' : 'edit';

		$site_slug = Jetpack::build_raw_urls( get_home_url() );

		$upgrade_url =
			$plan_path_slug
			? add_query_arg( array(
				'redirect_to' =>
					'/' .
					implode( '/', array_filter( array( $post_type_editor_route_prefix, $post_type, $site_slug, $post_id ) ) )
			), "https://wordpress.com/checkout/${site_slug}/${plan_path_slug}" )
			: '';


		return self::render_component( 'upgrade-nudge', array(
			'planName' => $post_type,
			'upgradeUrl' => $upgrade_url
		) );
	}
}