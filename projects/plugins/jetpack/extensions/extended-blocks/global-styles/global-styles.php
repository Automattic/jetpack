<?php
/**
 * Adds support for google fonts in global styles in the site editor and fronten
 *
 * @package automattic/jetpack
 **/

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
 *
 * @see https://github.com/WordPress/gutenberg/issues/27504
 *
 * @param array $settings Object with server side data injected into Gutenberg client.
 *
 * @return object $settings Object with server side data injected into Gutenberg client
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

		if (
			! isset( $settings['__experimentalGlobalStylesBaseStyles'] ) ||
			! isset( $settings['__experimentalGlobalStylesBaseStyles']['settings'] ) ||
			! isset( $settings['__experimentalGlobalStylesBaseStyles']['settings']['typography'] ) ||
			! isset( $settings['__experimentalGlobalStylesBaseStyles']['settings']['typography']['fontFamilies'] )
		) {
			return;
		}

		$settings['__experimentalGlobalStylesBaseStyles']['settings']['typography']['fontFamilies']['theme'] = array_merge(
			$settings['__experimentalGlobalStylesBaseStyles']['settings']['typography']['fontFamilies']['theme'],
			$google_font_options
		);
	}

	return $settings;
}

if ( function_exists( 'get_block_editor_settings' ) ) {
	add_filter( 'block_editor_settings_all', 'gutenberg_wpcom_add_google_fonts_to_site_editor', PHP_INT_MAX );
} else {
	add_filter( 'block_editor_settings', 'gutenberg_wpcom_add_google_fonts_to_site_editor', PHP_INT_MAX );
}

/**
 * Add a server-side action that applies google fonts selected in the global styles site
 * edtor sidebar to frontend styles.
 *
 * This function can be updated or removed when core Gutenberg provides more specific hooks
 * for global styles.
 *
 * @see https://github.com/WordPress/gutenberg/issues/27504
 *
 * @return void
 */
function gutenberg_wpcom_google_fonts_enqueue_assets() {
	$global_styles_user_data = WP_Theme_JSON_Resolver_Gutenberg::get_user_data()->get_raw_data();

	if (
		! isset( $global_styles_user_data ) ||
		! isset( $global_styles_user_data['styles'] ) ||
		! isset( $global_styles_user_data['styles']['typography'] ) ||
		! isset( $global_styles_user_data['styles']['typography']['fontFamily'] )
	) {
		return;
	}

	// 1. Determine if a google font was selected for site editor global styles
	$user_selected_font_family = $global_styles_user_data['styles']['typography']['fontFamily'];
	foreach ( valid_google_fonts() as $font_name ) {
		$font_slug = str_replace( ' ', '-', strtolower( $font_name ) );
		if ( strpos( $user_selected_font_family, $font_slug ) ) {
			$google_font_name = $font_name;
			$google_font_slug = $font_slug;
			break;
		}
	}

	if ( $google_font_name && $google_font_slug ) {
		// 2. Generate formatted style declarations for the selected google font
		$google_font_settings_theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => 1,
				'settings' => array(
					'typography' => array(
						'fontFamilies' => array(
							'theme' => array(
								'name'       => $google_font_name,
								'slug'       => $google_font_slug,
								'fontFamily' => $google_font_name,
							),
						),
					),
				),
			)
		);
		$css_variable_declaration        = $google_font_settings_theme_json->get_stylesheet( 'css_variables' );

		// 3. Inject the google font style declarations into the global styles embedded stylesheet
		if ( isset( wp_styles()->registered['global-styles'] ) && $css_variable_declaration ) {
			$import_statement = "@import url('https://fonts.googleapis.com/css?family="
				. str_replace( ' ', '+', $google_font_name )
				. ':regular,bold,italic,bolditalic|' . "');";

			wp_styles()->registered['global-styles']->extra['after'][0] = $import_statement
			. "\n" . $css_variable_declaration
			. "\n" . wp_styles()->registered['global-styles']->extra['after'][0];
		}
	}
}

add_action( 'wp_enqueue_scripts', 'gutenberg_wpcom_google_fonts_enqueue_assets' );
