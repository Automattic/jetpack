<?php
/**
 * Customizations for the Gutenberg plugin.
 *
 * Since we'll be trying to keep up with latest Gutenberg versions both on Simple and Atomic sites,
 * we need to ensure that some experimental functionality is not exposed yet.
 *
 * @package wpcomsh
 */

// Enable allowed experiments early so Gutenberg's load.php include-time check picks them up.
// This runs at MU plugin load time, before Gutenberg (a regular plugin) is loaded.
// Both filters are needed: default_option_ fires when the option doesn't exist in the DB,
// option_ fires when it does.
add_filter( 'default_option_gutenberg-experiments', 'wpcomsh_filter_gutenberg_experiments' );
add_filter( 'option_gutenberg-experiments', 'wpcomsh_filter_gutenberg_experiments' );

// Ignore the Gutenberg plugin when it is older than the version bundled in core.
add_filter( 'option_active_plugins', 'wpcomsh_ignore_outdated_gutenberg_plugin' );

/**
 * Minimum Gutenberg version bundled in each WordPress major release.
 *
 * @see https://developer.wordpress.org/block-editor/contributors/versions-in-wordpress/
 */
const WPCOMSH_CORE_BUNDLED_GUTENBERG_VERSIONS = array(
	'7.1' => '23.6',
);

/**
 * Returns the minimum Gutenberg version bundled in the running WordPress core, or null if unknown.
 *
 * @return string|null
 */
function wpcomsh_get_core_bundled_gutenberg_version() {
	global $wp_version;

	if ( ! is_string( $wp_version ) || ! preg_match( '/^(\d+\.\d+)/', $wp_version, $matches ) ) {
		return null;
	}

	return WPCOMSH_CORE_BUNDLED_GUTENBERG_VERSIONS[ $matches[1] ] ?? null;
}

/**
 * Returns the installed Gutenberg plugin version, or null if it can't be read.
 *
 * Reads the plugin header, as this runs before the plugin (and GUTENBERG_VERSION) loads.
 *
 * @return string|null
 */
function wpcomsh_get_installed_gutenberg_plugin_version() {
	$plugin_file = WP_PLUGIN_DIR . '/gutenberg/gutenberg.php';

	if ( ! is_readable( $plugin_file ) ) {
		return null;
	}

	$data = get_file_data( $plugin_file, array( 'Version' => 'Version' ) );

	return empty( $data['Version'] ) ? null : $data['Version'];
}

/**
 * Whether the plugin version is older than the version bundled in core (both must be known).
 *
 * @param string|null $plugin_version      Installed Gutenberg plugin version.
 * @param string|null $min_bundled_version Minimum Gutenberg version bundled in the running core.
 * @return bool
 */
function wpcomsh_should_ignore_gutenberg_plugin( $plugin_version, $min_bundled_version ) {
	if ( null === $plugin_version || null === $min_bundled_version ) {
		return false;
	}

	return version_compare( $plugin_version, $min_bundled_version, '<' );
}

/**
 * Whether the installed Gutenberg plugin is being ignored in favor of core's bundled Gutenberg.
 *
 * @return bool
 */
function wpcomsh_is_gutenberg_plugin_ignored() {
	return wpcomsh_should_ignore_gutenberg_plugin(
		wpcomsh_get_installed_gutenberg_plugin_version(),
		wpcomsh_get_core_bundled_gutenberg_version()
	);
}

/**
 * Drop the Gutenberg plugin from the active plugins list when it is older than core's bundle.
 *
 * The stored option is left untouched, so the plugin returns once it is updated past the bundle.
 *
 * @param mixed $plugins Value of the active_plugins option.
 * @return mixed
 */
function wpcomsh_ignore_outdated_gutenberg_plugin( $plugins ) {
	if ( ! is_array( $plugins ) ) {
		return $plugins;
	}

	$key = array_search( 'gutenberg/gutenberg.php', $plugins, true );
	if ( false === $key || ! wpcomsh_is_gutenberg_plugin_ignored() ) {
		return $plugins;
	}

	unset( $plugins[ $key ] );

	return array_values( $plugins );
}

/**
 * Disable all Gutenberg experiments except explicitly allowed ones.
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
		// Undo the early filters for allowed blogs so they can still manage Gutenberg experiments.
		remove_filter( 'default_option_gutenberg-experiments', 'wpcomsh_filter_gutenberg_experiments' );
		remove_filter( 'option_gutenberg-experiments', 'wpcomsh_filter_gutenberg_experiments' );
		return;
	}
	add_action( 'admin_menu', 'wpcomsh_remove_gutenberg_experimental_menu' );
}
add_action( 'init', 'wpcomsh_remove_gutenberg_experiments' );

/**
 * Disable all Gutenberg experiments except explicitly allowed ones.
 *
 * Allowed experiments are always enabled regardless of the option value in the database.
 *
 * @return array List of the enabled experiments.
 */
function wpcomsh_filter_gutenberg_experiments() {
	return array(
		'gutenberg-content-guidelines' => true,
		'gutenberg-guidelines'         => true,
	);
}

/**
 * Remove Gutenberg's Experiments submenu item.
 */
function wpcomsh_remove_gutenberg_experimental_menu() {
	remove_submenu_page( 'gutenberg', 'gutenberg-experiments' );
}

/**
 * Enable wp-admin JS error reporting on sites participating in the `gutenberg-react-19`
 * experiment, so that errors caused by the React 19 upgrade are captured.
 *
 * Reporting is enabled only for WP.com-connected users, who have accepted the WP.com
 * terms of service and privacy policy. Local users have made no such agreement.
 *
 * @param bool $is_enabled Whether error reporting is enabled.
 * @return bool
 */
function wpcomsh_enable_error_reporting_for_react_19( $is_enabled ) {
	if ( $is_enabled ) {
		return true;
	}

	if ( ! function_exists( 'is_user_connected' ) || ! is_user_connected( get_current_user_id() ) ) {
		return false;
	}

	return function_exists( 'wpcomsh_is_site_sticker_active' ) && wpcomsh_is_site_sticker_active( 'gutenberg-react-19' );
}
add_filter( 'a8c_enable_error_reporting', 'wpcomsh_enable_error_reporting_for_react_19' );

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

/**
 * Add guideline meta keys to the Jetpack sync post meta whitelist.
 *
 * @param array $whitelist Current post meta whitelist.
 * @return array
 */
function wpcomsh_add_guideline_sync_meta_whitelist( $whitelist ) {
	$guideline_meta_keys = array(
		'_guideline_copy',
		'_guideline_images',
		'_guideline_site',
		'_guideline_additional',
		'_guideline_block_core_paragraph',
		'_guideline_block_core_image',
		'_guideline_block_core_heading',
		'_guideline_block_core_list',
		'_guideline_block_core_list_item',
		'_guideline_block_core_quote',
		'_guideline_block_core_code',
		'_guideline_block_core_table',
		'_guideline_block_core_video',
		'_guideline_block_core_audio',
		'_guideline_block_core_gallery',
		'_guideline_block_core_cover',
		'_guideline_block_core_pullquote',
		'_guideline_block_core_preformatted',
		'_guideline_block_core_verse',
		'_guideline_block_core_button',
		'_guideline_block_core_media_text',
		'_guideline_block_core_freeform',
		'_guideline_block_core_html',
		'_guideline_block_core_embed',
	);
	return array_merge( $whitelist, $guideline_meta_keys );
}
add_filter( 'jetpack_sync_post_meta_whitelist', 'wpcomsh_add_guideline_sync_meta_whitelist' );
