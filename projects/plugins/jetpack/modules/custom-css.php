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

if ( ! function_exists( 'jetpack_load_custom_css' ) ) {
	/**
	 * Load custom CSS
	 */
	function jetpack_load_custom_css() {
		include_once __DIR__ . '/custom-css/custom-css/preprocessors.php';
		include_once __DIR__ . '/custom-css/custom-css.php';
	}
}

if ( ! function_exists( 'custom_css_loaded' ) ) {
	/**
	 * Enable CSS module.
	 */
	function custom_css_loaded() {
		$message = sprintf(
			// translators: %s is a link to the WordPress.org documentation.
			__( 'Jetpack no longer supports Custom CSS. Read the WordPress.org documentation to learn how to apply custom styles to your site: %s', 'jetpack' ),
			'https://wordpress.org/documentation/article/styles-overview/#applying-custom-css'
		);

		_deprecated_hook( 'custom_css_loaded', 'jetpack-13.5', 'WordPress Custom CSS', esc_html( $message ) );

		Jetpack::enable_module_configurable( __FILE__ );
		add_filter( 'jetpack_module_configuration_url_custom-css', 'jetpack_custom_css_configuration_url' );
	}
}

if ( ! function_exists( 'jetpack_custom_css_configuration_url' ) ) {
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
}

// phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores
if ( ! apply_filters( 'jetpack_module_configurable_custom-css', null ) ) {
	add_action( 'jetpack_modules_loaded', 'custom_css_loaded' );

	jetpack_load_custom_css();
}
