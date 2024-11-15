<?php
/**
 * Customizations for the Gutenberg plugin.
 *
 * Since we'll be trying to keep up with latest Gutenberg versions both on Simple and Atomic sites,
 * we need to ensure that some experimental functionality is not exposed yet.
 *
 * @package wpcomsh
 */

/**
 * Disable all Gutenberg experiments.
 *
 * @see https://github.com/WordPress/gutenberg/blob/e6d8284b03799136915495654e821ca6212ae6d8/lib/load.php#L22
 */
function wpcomsh_remove_gutenberg_experiments() {
	$jetpack_options = get_option( 'jetpack_options' );
	if ( is_array( $jetpack_options ) && isset( $jetpack_options['id'] ) ) {
		$blog_id = (int) $jetpack_options['id'];
	} else {
		$blog_id = get_current_blog_id();
	}

	$allowed_blogs = array(
		211453162, // wpmovies.dev
	);

	if ( in_array( $blog_id, $allowed_blogs, true ) ) {
		return;
	}

	add_filter( 'option_gutenberg-experiments', '__return_false' );
	add_action( 'admin_menu', 'wpcomsh_remove_gutenberg_experimental_menu' );
}
add_action( 'init', 'wpcomsh_remove_gutenberg_experiments' );

/**
 * Remove Gutenberg's Experiments submenu item.
 */
function wpcomsh_remove_gutenberg_experimental_menu() {
	remove_submenu_page( 'gutenberg', 'gutenberg-experiments' );
}

/**
 * Hotfix a Gutenberg bug that inadvertently loads wp-reset-editor-syles stylesheet in the
 * iframed site editor.
 *
 * We are attempting to merge the same changes into core Gutenberg. If successful, these
 * changes can be removed. https://github.com/WordPress/gutenberg/pull/33522
 */
function wpcomsh_remove_site_editor_reset_styles() {
	$current_screen = get_current_screen();

	if ( ! $current_screen || $current_screen->base !== 'toplevel_page_gutenberg-edit-site' ) {
		return;
	}

	/*
	 * Remove wp-reset-editor-styles css in the Site Editor, as it's not needed with an iframed editor,
	 * and can interfere with Global Styles if concatenated with other scripts.
	 */
	if ( isset( wp_styles()->registered['wp-edit-blocks'] ) ) {
		$wp_edit_blocks_dependencies                    = array_diff( wp_styles()->registered['wp-edit-blocks']->deps, array( 'wp-reset-editor-styles' ) );
		wp_styles()->registered['wp-edit-blocks']->deps = $wp_edit_blocks_dependencies;
	}
}
add_action( 'admin_enqueue_scripts', 'wpcomsh_remove_site_editor_reset_styles' );

/**
 * Overrides the WordPress enqueue_block_styles_assets function, which contains
 * a bug eventually leading to a fatal error for full site editing enabled themes
 * which do register custom block styles and don't have a template for requested
 * template (eg.: 404)
 *
 * More details on the bug can be found in: https://core.trac.wordpress.org/ticket/54323
 *
 * @see enqueue_block_styles_assets
 */
function gutenberg_enqueue_block_styles_assets() {
	$block_styles = WP_Block_Styles_Registry::get_instance()->get_all_registered();

	foreach ( $block_styles as $block_name => $styles ) {
		foreach ( $styles as $style_properties ) {
			if ( isset( $style_properties['style_handle'] ) ) {

				// If the site loads separate styles per-block, enqueue the stylesheet on render.
				if ( wp_should_load_separate_core_block_assets() ) {
					add_filter(
						'render_block',
						function ( $html ) use ( $style_properties ) {
							wp_enqueue_style( $style_properties['style_handle'] );
							return $html;
						}
					);
				} else {
					wp_enqueue_style( $style_properties['style_handle'] );
				}
			}
			if ( isset( $style_properties['inline_style'] ) ) {

				// Default to "wp-block-library".
				$handle = 'wp-block-library';

				// If the site loads separate styles per-block, check if the block has a stylesheet registered.
				if ( wp_should_load_separate_core_block_assets() ) {
					$block_stylesheet_handle = generate_block_asset_handle( $block_name, 'style' );
					global $wp_styles;
					if ( isset( $wp_styles->registered[ $block_stylesheet_handle ] ) ) {
						$handle = $block_stylesheet_handle;
					}
				}

				// Add inline styles to the calculated handle.
				wp_add_inline_style( $handle, $style_properties['inline_style'] );
			}
		}
	}
}

/**
 * Disable the Widgets Block Editor screen feature.
 *
 * @see D48850-code
 * @see https://github.com/WordPress/gutenberg/pull/24843
 */
add_filter( 'gutenberg_use_widgets_block_editor', '__return_false', 100 );

/**
 * WPCOM Hack to allow rgba() as CSS property's values, which would otherwise be filtered by
 * `safecss_filter_attr` in `wp-includes/kses.php`.
 *
 * For more context, see: p1670179266219969-slack-C02FMH4G8
 * and p1670086796757129-slack-CBTN58FTJ.
 *
 * @param bool   $allow_css whether the current CSS property is allowed.
 * @param string $css_test_string contains the actual CSS property to be tested.
 * @return bool whether or not the given CSS property is allowed.
 */
function wpcom_safecss_filter_attr_allow_css_rgba( $allow_css, $css_test_string ) {
	if ( false === $allow_css ) {
		// Allow rgb and rgba values with numbers, commas, percents, dividers and decimal numbers in the following parenthesis only.
		$css_test_string = preg_replace(
			'/\b(?:rgb[a]?)\((?:[\.]?\d+[\.\s\,\%\/]*\d*){0,4}\)/',
			'',
			$css_test_string
		);

		$allow_css = ! preg_match( '%[\\\(&=}]|/\*%', $css_test_string );
	}

	return $allow_css;
}
add_filter( 'safecss_filter_attr_allow_css', 'wpcom_safecss_filter_attr_allow_css_rgba', 10, 2 );

/**
 * WPCOM Hack to allow additional inline CSS that would otherwise be filtered by `safecss_filter_attr` in
 * `wp-includes/kses.php`.
 *
 * For more context, see: p1670179266219969-slack-C02FMH4G8
 * and p1670086796757129-slack-CBTN58FTJ.
 *
 * @param array<string> $css_properties an array of allowed CSS properties.
 * @return array<string> the array of allowed CSS properties.
 */
function wpcom_safecss_allow_additional_css_properties( $css_properties ) {
	$css_properties[] = 'display';
	$css_properties[] = 'transform';
	$css_properties[] = 'position';

	return $css_properties;
}
add_filter( 'safe_style_css', 'wpcom_safecss_allow_additional_css_properties', 10, 1 );
