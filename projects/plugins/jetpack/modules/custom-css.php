<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Module Name: Custom CSS
 * Module Description: Adds options for CSS preprocessor use, disabling the theme's CSS, or custom image width.
 * Sort Order: 2
 * First Introduced: 1.7
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Appearance
 * Feature: Appearance
 * Additional Search Queries: css, customize, custom, style, editor, less, sass, preprocessor, font, mobile, appearance, theme, stylesheet
 */

/**
 * Load custom CSS
 */
function jetpack_load_custom_css() {
	// If WordPress has the core version of Custom CSS, load our new version.
	// @see https://core.trac.wordpress.org/changeset/38829
	if ( function_exists( 'wp_get_custom_css' ) ) {
		if ( ! function_exists( 'wp_update_custom_css_post' ) ) {
			wp_die( 'Please run a SVN up to get the latest version of trunk, or update to at least 4.7 RC1' );
		}
		if ( ! Jetpack_Options::get_option( 'custom_css_4.7_migration' ) ) {
			include_once __DIR__ . '/custom-css/migrate-to-core.php';
		} else { // TODO: DELETE THIS.
			if ( defined( 'WP_CLI' ) && WP_CLI ) {
				WP_CLI::add_command(
					'jetpack custom-css undo-migrate',
					function () {
						Jetpack_Options::delete_option( 'custom_css_4.7_migration' );
						WP_CLI::success( __( 'Option deleted, re-migrate via `wp jetpack custom-css migrate`.', 'jetpack' ) );
					}
				);
			}
		}
		// TODO: END DELETE THIS.

		include_once __DIR__ . '/custom-css/custom-css/preprocessors.php';
		include_once __DIR__ . '/custom-css/custom-css-4.7.php';
		return;
	}

	include_once __DIR__ . '/custom-css/custom-css.php';
	add_action( 'init', array( 'Jetpack_Custom_CSS', 'init' ) );
}

add_action( 'jetpack_modules_loaded', 'custom_css_loaded' );

/**
 * Enable CSS module.
 */
function custom_css_loaded() {
	Jetpack::enable_module_configurable( __FILE__ );
	add_filter( 'jetpack_module_configuration_url_custom-css', 'jetpack_custom_css_configuration_url' );

}

/**
 * Overrides default configuration url
 *
 * @uses admin_url
 *
 * @param string $default_url - the default URL.
 * @return string module settings URL
 */
function jetpack_custom_css_configuration_url( $default_url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	return Jetpack_Custom_CSS_Enhancements::customizer_link(
		array( 'return_url' => wp_get_referer() )
	);
}

jetpack_load_custom_css();
