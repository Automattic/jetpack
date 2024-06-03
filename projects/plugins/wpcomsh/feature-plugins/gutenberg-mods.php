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
 * Adds a polyfill for DOMRect in environments which do not support it.
 *
 * This can be removed when plugin support requires WordPress 5.4.0+.
 *
 * @see gutenberg_add_url_polyfill
 * @see https://core.trac.wordpress.org/ticket/49360
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMRect
 * @see https://developer.wordpress.org/reference/functions/wp_default_packages_vendor/
 *
 * @param WP_Scripts $scripts WP_Scripts object.
 */
function wpcomsh_add_dom_rect_polyfill( $scripts ) {
	// WP.com: Only register if viewing the block editor.
	global $pagenow;
	if ( ! ( 'post.php' === $pagenow || 'post-new.php' === $pagenow ) ) {
		return;
	}

	/*
	 * Only register polyfill if not already registered. This prevents handling
	 * in an environment where core has updated to manage the polyfill. This
	 * depends on the action being handled after default script registration.
	 */
	$is_polyfill_script_registered = (bool) $scripts->query( 'wp-polyfill-dom-rect', 'registered' );
	if ( $is_polyfill_script_registered ) {
		return;
	}

	$scripts->add(
		'wp-polyfill-dom-rect',
		plugins_url( 'assets/wp-polyfill-dom-rect.js', __DIR__ ),
		array(),
		'3.42.0'
	);

	did_action( 'init' ) && $scripts->add_inline_script(
		'wp-polyfill',
		wp_get_script_polyfill(
			$scripts,
			array(
				'window.DOMRect' => 'wp-polyfill-dom-rect',
			)
		)
	);
}
add_action( 'wp_default_scripts', 'wpcomsh_add_dom_rect_polyfill', 30 );

/**
 * Updates the site_logo option when the custom_logo theme-mod gets updated.
 *
 * Registered on the `pre_set_theme_mod_custom_logo` hook.
 *
 * @param  mixed $value Attachment ID of the custom logo or an empty value.
 * @return mixed
 */
function wpcomsh_sync_custom_logo_to_site_logo( $value ) {
	if ( empty( $value ) ) {
		delete_option( 'site_logo' );
	} else {
		update_option( 'site_logo', $value );
	}

	return $value;
}

/**
 * Hotfix a Gutenberg bug that prevents updating a logo from the Customizer.
 *
 * These fixes are from https://github.com/WordPress/gutenberg/pull/33179, and can be
 * removed when that change is released in Gutenberg and all Atomic sites are updated.
 *
 * Ported from wpcom hotfix: D63662-code
 */
function wpcomsh_hotfix_gutenberg_logo_bug() {
	// Only add the filter if Gutenberg is active and the current version is missing the filter.
	if (
		( defined( 'GUTENBERG_VERSION' ) || defined( 'GUTENBERG_DEVELOPMENT_MODE' ) ) &&
		false === has_action( 'pre_set_theme_mod_custom_logo', 'gutenberg__sync_custom_logo_to_site_logo' )
	) {
		add_filter( 'pre_set_theme_mod_custom_logo', 'wpcomsh_sync_custom_logo_to_site_logo' );
	}

	// Remove a function that can inadvertently delete your logo.
	remove_action( 'update_option_site_logo', 'gutenberg__sync_site_logo_to_custom_logo', 10 );
}
// Wait until after Gutenberg has registered the Site Logo block on the `init` action, priority 10.
add_action( 'init', 'wpcomsh_hotfix_gutenberg_logo_bug', 11 );

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

if ( version_compare( get_bloginfo( 'version' ), '5.8.2', '<' ) && 30 === has_action( 'enqueue_block_assets', 'enqueue_block_styles_assets' ) && false === has_action( 'enqueue_block_assets', 'gutenberg_enqueue_block_styles_assets' ) ) {
	remove_action( 'enqueue_block_assets', 'enqueue_block_styles_assets', 30 );
	add_action( 'enqueue_block_assets', 'gutenberg_enqueue_block_styles_assets', 30 );
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
