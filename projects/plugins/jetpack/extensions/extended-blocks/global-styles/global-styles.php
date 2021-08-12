<?php

/**
 * List of all google fonts that are supported for the site editor global styles feature
 **/
function valid_google_fonts() {
	return array(
		'Bodoni Moda',
		'Cabin',
		'Chivo',
		'Courier Prime',
		'EB Garamond',
		'Fira Sans',
		'Josefin Sans',
		'Libre Baskerville',
		'Libre Franklin',
		'Lora',
		'Merriweather',
		'Montserrat',
		'Nunito',
		'Open Sans',
		'Overpass',
		'Playfair Display',
		'Poppins',
		'Raleway',
		'Roboto',
		'Roboto Slab',
		'Rubik',
		'Source Sans Pro',
		'Source Serif Pro',
		'Space Mono',
		'Work Sans',
	);
}

/**
 * Add a server-side filter that makes google fonts selectable in the global styles site
 * edtor sidebar.
 *
 * This function can be updated or removed when core Gutenberg provides more specific hooks
 * for global styles.
 * @see https://github.com/WordPress/gutenberg/issues/27504
 *
 * @return object $settings      Object with server side data injected into Gutenberg client
 */
function gutenberg_wpcom_add_google_fonts_to_site_editor( $settings ) {
	$should_use_site_editor_context = is_callable( 'get_current_screen' ) &&
		function_exists( 'gutenberg_is_edit_site_page' ) &&
		gutenberg_is_edit_site_page( get_current_screen()->id ) &&
		WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() &&
		gutenberg_supports_block_templates();

	if ( $should_use_site_editor_context ) {
		// Add google fonts as selectable options to the global styles font family picker.
		$google_font_options = array_map(
			function ( $font_name ) {
				return array(
					'fontFamily' => $font_name,
					'slug'       => str_replace( ' ', '-', strtolower( $font_name ) ),
					'name'       => $font_name,
				);
			},
			valid_google_fonts()
		);

		if ( isset( $settings['__experimentalGlobalStylesBaseStyles']['settings']['typography']['fontFamilies'] ) ) {
			$settings['__experimentalGlobalStylesBaseStyles']['settings']['typography']['fontFamilies']['theme'] = array_merge(
				$settings['__experimentalGlobalStylesBaseStyles']['settings']['typography']['fontFamilies']['theme'],
				$google_font_options
			);
		}
	}

	return $settings;
}

if ( function_exists( 'get_block_editor_settings' ) ) {
	add_filter( 'block_editor_settings_all', 'gutenberg_wpcom_add_google_fonts_to_site_editor', PHP_INT_MAX );
} else {
	add_filter( 'block_editor_settings', 'gutenberg_wpcom_add_google_fonts_to_site_editor', PHP_INT_MAX );
}
