<?php
/**
 * Module Name: Google Fonts (Beta)
 * Module Description: A selection of Google fonts for block enabled themes. This feature is still being developed.
 * Sort Order: 1
 * Recommendation Order: 2
 * First Introduced: 10.8.0
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Fonts, Recommended
 * Feature: Writing
 * Additional Search Queries: fonts, webfonts, typography
 *
 * @package automattic/jetpack
 */

/**
 * Curated list of Google Fonts
 * See https://wp.me/p9Jlb4-22P
 */
const JETPACK_GOOGLE_FONTS_LIST = array(
	'Arvo',
	'Bodoni Moda',
	'Cabin',
	'Chivo',
	'Courier Prime',
	'DM Sans',
	'Domine',
	'EB Garamond',
	'Fira Sans',
	'IBM Plex Sans',
	'IBM Plex Mono',
	'Inter',
	'Josefin Sans',
	'Jost',
	'Libre Baskerville',
	'Libre Franklin',
	'Literata',
	'Lora',
	'Merriweather',
	'Montserrat',
	'Newsreader',
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
	'Texturina',
	'Work Sans',
);

/**
 * Register a curated selection of Google Fonts.
 *
 * @return void
 */
function jetpack_add_google_fonts_provider() {
	if ( ! function_exists( 'wp_register_webfont_provider' ) || ! function_exists( 'wp_register_webfonts' ) ) {
		return;
	}

	wp_register_webfont_provider( 'jetpack-google-fonts', '\Automattic\Jetpack\Fonts\Google_Fonts_Provider' );

	/**
	 * Curated list of Google Fonts.
	 *
	 * @module google-fonts
	 *
	 * @since 10.8
	 *
	 * @param array $fonts_to_register Array of Google Font names to register.
	 */
	$fonts_to_register = apply_filters( 'jetpack_google_fonts_list', JETPACK_GOOGLE_FONTS_LIST );

	foreach ( $fonts_to_register as $font_family ) {
		wp_register_webfonts(
			array(
				array(
					'font-family'  => $font_family,
					'font-weight'  => '100 900',
					'font-style'   => 'normal',
					'font-display' => 'fallback',
					'provider'     => 'jetpack-google-fonts',
				),
				array(
					'font-family'  => $font_family,
					'font-weight'  => '100 900',
					'font-style'   => 'italic',
					'font-display' => 'fallback',
					'provider'     => 'jetpack-google-fonts',
				),
			)
		);
	}
}
add_action( 'after_setup_theme', 'jetpack_add_google_fonts_provider' );

/**
 * Determines whether or not custom fonts is supported in site editor global styles.
 *
 * @return bool
 */
function blockbase_supports_jetpack_google_fonts() {
	$jetpack_has_google_fonts_module            = false;
	$gutenberg_webfonts_api_supports_enqueueing = false;

	if ( defined( 'JETPACK__VERSION' ) ) {
		$jetpack_has_google_fonts_module = JETPACK__VERSION === 'wpcom' || version_compare( JETPACK__VERSION, '10.9', '>=' );
	}

	// TODO: This method isn't picking up the Gutenberg version in my dev environment for some reason...
	if ( defined( 'GUTENBERG_VERSION' ) ) {
		$gutenberg_webfonts_api_supports_enqueueing = version_compare( GUTENBERG_VERSION, '13.3', '>=' );
	}

	return $jetpack_has_google_fonts_module && $gutenberg_webfonts_api_supports_enqueueing && Jetpack::is_module_active( 'google-fonts' );
}

/**
 * Retrieves the global styles cpt.
 *
 * @param int    $user_custom_post_type_id ID of global styles CPT.
 * @param object $global_styles_controller Controller that handles REST requests for global styles.
 *
 * @return array
 */
function fetch_global_styles( $user_custom_post_type_id, $global_styles_controller ) {
	$get_request = new WP_REST_Request( 'GET', '/wp/v2/global-styles/' );
	$get_request->set_param( 'id', $user_custom_post_type_id );
	$global_styles = $global_styles_controller->get_item( $get_request );

	return $global_styles;
}

/**
 * Updates the global styles CPT.
 *
 * @param array  $new_settings New global styles to update.
 * @param array  $new_styles New global styles settings to update.
 * @param int    $user_custom_post_type_id ID of global styles CPT.
 * @param object $global_styles_controller Controller that handles REST requests for global styles.
 *
 * @return void
 */
function update_global_styles( $new_settings, $new_styles, $user_custom_post_type_id, $global_styles_controller ) {
	$update_request = new WP_REST_Request( 'PUT', '/wp/v2/global-styles/' );
	$update_request->set_param( 'id', $user_custom_post_type_id );
	$update_request->set_param( 'settings', $new_settings );
	$update_request->set_param( 'styles', $new_styles );

	$global_styles_controller->update_item( $update_request );
	delete_transient( 'global_styles' );
	delete_transient( 'global_styles_' . get_stylesheet() );
	delete_transient( 'gutenberg_global_styles' );
	delete_transient( 'gutenberg_global_styles_' . get_stylesheet() );
}

/**
 * Undoes changes made to custom fonts in the site editor global styles so that blockbase
 * custom fonts can behave as expected.
 *
 * @return void
 */
function revert_migrated_blockbase_custom_fonts() {
	$user_custom_post_type_id = WP_Theme_JSON_Resolver_Gutenberg::get_user_global_styles_post_id();
	$global_styles_controller = new Gutenberg_REST_Global_Styles_Controller();

	$global_styles = fetch_global_styles( $user_custom_post_type_id, $global_styles_controller );

	// converts data to array (in some cases settings and styles are objects insted of arrays)
	$new_settings = (array) $global_styles->data['settings'];
	$new_styles   = (array) $global_styles->data['styles'];

	if ( isset( $new_styles['typography']['fontFamily'] ) ) {
		unset( $new_styles['typography']['fontFamily'] );
	}

	// TODO: Unset post title and headings block typography

	$new_settings = array_merge(
		$new_settings,
		array(
			'typography' => array(
				'fontFamilies' => get_option( 'blockbase_legacy_font_settings' ),
			),
		)
	);

	update_global_styles( $new_settings, $new_styles, $user_custom_post_type_id, $global_styles_controller );
	delete_option( 'blockbase_legacy_font_settings' );
}

/**
 * Transforms data saved by the blockbase fonts customizer feature to make things
 * compatible with custom fonts for global styles in the site editor
 *
 * @return void
 */
function migrate_blockbase_custom_fonts() {
	// The data has already been transformed
	if ( get_option( 'blockbase_legacy_font_settings' ) ) {
		// Gutenberg or Jetpack versions have changed or the plugins have been uninstalled. If custom google
		// fonts are no longer supported in the site editor, revert our transformed data so that the original
		// blockbase fonts customizer feature can behave properly.
		if ( ! blockbase_supports_jetpack_google_fonts() ) {
			revert_migrated_blockbase_custom_fonts();
		}

		return;
	}

	// Data has not been transformed, but Gutenberg or Jetpack don't support custom fonts for global styles
	// in the site editor. Do not migrate.
	if ( ! blockbase_supports_jetpack_google_fonts() ) {
		return;
	}

	$font_settings = wp_get_global_settings( array( 'typography', 'fontFamilies' ) );

	// No Customizer font settings found. Mark as transformed and hide the Customizer UI for fonts.
	if ( ! isset( $font_settings['custom'] ) || ! is_array( $font_settings['custom'] ) ) {
		add_option( 'blockbase_legacy_font_settings', '[]' );
		return;
	}

	// Extract font slugs from legacy data structure
	$heading_font_slug = '';
	$body_font_slug    = '';
	foreach ( $font_settings['custom'] as $font_setting ) {
		if ( strpos( $font_setting['slug'], 'heading' ) !== false ) {
			$heading_font_slug = $font_setting['fontSlug'];
		}

		if ( strpos( $font_setting['slug'], 'body' ) !== false ) {
			$body_font_slug = $font_setting['fontSlug'];
		}
	}

	// Get the user's global styles CPT id
	$user_custom_post_type_id       = WP_Theme_JSON_Resolver_Gutenberg::get_user_global_styles_post_id();
	$global_styles_controller       = new Gutenberg_REST_Global_Styles_Controller();
	$global_styles                  = fetch_global_styles( $user_custom_post_type_id, $global_styles_controller );
	$blockbase_legacy_font_settings = $global_styles->data['settings']['typography']['fontFamilies']['custom'];

	// converts data to array (in some cases settings and styles are objects insted of arrays)
	$new_settings = (array) $global_styles->data['settings'];
	$new_styles   = (array) $global_styles->data['styles'];

	// Set new typography settings
	if ( isset( $new_settings['typography']['fontFamilies'] ) ) {
		unset( $new_settings['typography']['fontFamilies'] ); // TODO: Reconsider the depth of property we're unsetting
	}

	if ( $body_font_slug ) {
		$new_styles = array_merge(
			$new_styles,
			array(
				'typography' => array(
					'fontFamily' => "var:preset|font-family|$body_font_slug",
				),
			)
		);
	}

	if ( $heading_font_slug ) {
		$new_styles = array_merge(
			$new_styles,
			array(
				'blocks' => array(
					'core/post-title' => array(
						'typography' => array(
							'fontFamily' => "var:preset|font-family|$heading_font_slug",
						),
					),
					'core/heading'    => array(
						'typography' => array(
							'fontFamily' => "var:preset|font-family|$heading_font_slug",
						),
					),
				),
			)
		);
	}

	update_global_styles( $new_settings, $new_styles, $user_custom_post_type_id, $global_styles_controller );

	// TODO: Verify that we want to store an array
	add_option( 'blockbase_legacy_font_settings', $blockbase_legacy_font_settings );
}

add_action( 'init', 'migrate_blockbase_custom_fonts' );

add_filter( 'wp_resource_hints', '\Automattic\Jetpack\Fonts\Utils::font_source_resource_hint', 10, 2 );
add_filter( 'pre_render_block', '\Automattic\Jetpack\Fonts\Introspectors\Blocks::enqueue_block_fonts', 10, 2 );
add_action( 'init', '\Automattic\Jetpack\Fonts\Introspectors\Global_Styles::enqueue_global_styles_fonts' );
