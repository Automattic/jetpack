<?php
/**
 * Load the google fonts by the new Font Library. See pNEWy-hhx-p2.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( ! class_exists( 'Jetpack_Google_Font_Face' ) ) {
	/**
	 * Load Jetpack Google Font Face
	 */
	require_once __DIR__ . '/class-jetpack-google-font-face.php';
}

/**
 * Gets the Google Fonts data
 *
 * @return array|null The collection data of the Google Fonts.
 */
function jetpack_get_google_fonts_data() {
	/**
	 * Filters the Google Fonts data before the default retrieval process.
	 *
	 * This filter allows short-circuiting the default Google Fonts data retrieval process.
	 * Returning a non-null value from this filter will bypass the default retrieval
	 * and return the filtered value instead.
	 *
	 * @module google-fonts
	 *
	 * @since 13.7
	 *
	 * @param null|array $pre The pre-filtered Google Fonts data, default null.
	 */
	$pre = apply_filters( 'pre_jetpack_get_google_fonts_data', null );
	if ( null !== $pre ) {
		return $pre;
	}

	$default_google_fonts_api_url        = 'https://fonts.gstatic.com';
	$jetpack_google_fonts_collection_url = 'https://s0.wp.com/i/font-collections/jetpack-google-fonts.json';
	$cache_key                           = 'jetpack_google_fonts_' . md5( $jetpack_google_fonts_collection_url );
	$data                                = get_transient( $cache_key );
	if ( $data === false ) {
		$response = wp_remote_get( $jetpack_google_fonts_collection_url );
		if ( is_wp_error( $response ) || wp_remote_retrieve_response_code( $response ) !== 200 ) {
			return null;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( $data === null ) {
			return null;
		}

		set_transient( $cache_key, $data, DAY_IN_SECONDS );
	}

	// Replace the google fonts api url if the custom one is provided.
	$custom_google_fonts_api_url = \esc_url(
		/**
		 * Filters the Google Fonts API URL.
		 *
		 * @module google-fonts
		 *
		 * @since 12.8
		 *
		 * @param string $url The Google Fonts API URL.
		 */
		apply_filters( 'jetpack_google_fonts_api_url', $default_google_fonts_api_url )
	);
	if ( $custom_google_fonts_api_url !== $default_google_fonts_api_url ) {
		foreach ( $data['fontFamilies'] as &$font_family ) {
			foreach ( $font_family['fontFace'] as &$font_face ) {
				$font_face['src'] = str_replace(
					$default_google_fonts_api_url,
					$custom_google_fonts_api_url,
					$font_face['src']
				);
			}
		}
	}

	if ( is_array( $data ) && is_array( $data['fontFamilies'] ) ) {
		return $data;
	}
}

/**
 * Gets the map of the available Google Fonts
 *
 * @param array $google_fonts_data The collection data of the Google Fonts.
 * @return array The map of the the available Google Fonts.
 */
function jetpack_get_available_google_fonts_map( $google_fonts_data ) {
	$jetpack_google_fonts_list = array_map(
		function ( $font_family ) {
			return $font_family['name'];
		},
		$google_fonts_data['fontFamilies']
	);

	/**
	 * Curated list of Google Fonts.
	 *
	 * @module google-fonts
	 *
	 * @since 10.8
	 *
	 * @param array $fonts_to_register Array of Google Font names to register.
	 */
	$google_font_list           = apply_filters( 'jetpack_google_fonts_list', $jetpack_google_fonts_list );
	$available_google_fonts_map = array();

	foreach ( $google_font_list as $google_font ) {
		$available_google_fonts_map[ $google_font ] = true;
	}

	return $available_google_fonts_map;
}

/**
 * Register google fonts to the theme json data
 *
 * @param WP_Theme_JSON_Data $theme_json The theme json data of core.
 * @return WP_Theme_JSON_Data The theme json data with registered google fonts.
 */
function jetpack_register_google_fonts_to_theme_json( $theme_json ) {
	$google_fonts_data = jetpack_get_google_fonts_data();
	if ( ! $google_fonts_data ) {
		return $theme_json;
	}

	$available_google_fonts_map = jetpack_get_available_google_fonts_map( $google_fonts_data );
	$google_fonts_families      = array_values(
		array_filter(
			$google_fonts_data['fontFamilies'],
			function ( $google_fonts_family ) use ( $available_google_fonts_map ) {
				$name = $google_fonts_family['name'];
				return $available_google_fonts_map[ $name ] ?? false;
			}
		)
	);

	$raw_data = $theme_json->get_data();
	$origin   = 'default';
	if ( empty( $raw_data['settings']['typography']['fontFamilies'][ $origin ] ) ) {
		$raw_data['settings']['typography']['fontFamilies'][ $origin ] = array();
	}

	foreach ( $google_fonts_families as $font_family ) {
		$raw_data['settings']['typography']['fontFamilies'][ $origin ][] = $font_family;
	}

	$theme_json_class = get_class( $theme_json );
	return new $theme_json_class( $raw_data, $origin );
}

add_filter( 'wp_theme_json_data_default', 'jetpack_register_google_fonts_to_theme_json' );

/**
 * Filter out the deprecated font families that are from the jetpack-google-fonts provider.
 *
 * @param object[] $font_families The font families.
 * @return object[] The filtered font families.
 */
function jetpack_google_fonts_filter_out_deprecated_font_data( $font_families ) {
	return array_values(
		array_filter(
			$font_families,
			function ( $font_family ) {
				$has_deprecated_google_fonts_data = false;

				if ( isset( $font_family['fontFace'] ) ) {
					foreach ( $font_family['fontFace'] as $font_face ) {
						$provider = $font_face['provider'] ?? '';
						if ( $provider === 'jetpack-google-fonts' ) {
							$has_deprecated_google_fonts_data = true;
							break;
						}
					}
				}

				return ! $has_deprecated_google_fonts_data;
			}
		)
	);
}

/**
 * Unregister the deprecated jetpack-google-fonts provider from theme json data that were stored
 * before we moved to the Font Library.
 *
 * @param WP_Theme_JSON_Data $theme_json The theme json data.
 * @return WP_Theme_JSON_Data The filtered theme json data.
 */
function jetpack_unregister_deprecated_google_fonts_from_theme_json_data( $theme_json ) {
	$raw_data = $theme_json->get_data();
	$origin   = 'theme';
	if ( empty( $raw_data['settings']['typography']['fontFamilies'][ $origin ] ) ) {
		return $theme_json;
	}

	// Filter out the font definitions that are from the jetpack-google-fonts provider.
	$raw_data['settings']['typography']['fontFamilies'][ $origin ] = jetpack_google_fonts_filter_out_deprecated_font_data(
		$raw_data['settings']['typography']['fontFamilies'][ $origin ]
	);

	$theme_json_class = get_class( $theme_json );
	return new $theme_json_class( $raw_data, 'custom' );
}

add_filter( 'wp_theme_json_data_theme', 'jetpack_unregister_deprecated_google_fonts_from_theme_json_data' );
add_filter( 'wp_theme_json_data_user', 'jetpack_unregister_deprecated_google_fonts_from_theme_json_data' );

/**
 * Build the list of Google Font family definitions that the site actually uses,
 * ready to be persisted so the typography keeps rendering once the module is gone.
 *
 * The module registers the whole collection in the 'default' origin at runtime,
 * but a font selection only stores a slug reference — the @font-face definition
 * lives in that runtime origin and disappears with the module. To preserve the
 * fonts in use we copy their full definitions out of the collection so they can
 * be saved into the site's own global styles.
 *
 * Block-level font usage (set on individual blocks rather than global styles) is
 * not enumerable site-wide and is therefore out of scope here.
 *
 * @return array<int, array> Font family definitions from the Google Fonts collection.
 */
function jetpack_get_in_use_google_font_families() {
	$google_fonts_data = jetpack_get_google_fonts_data();
	if ( ! $google_fonts_data || empty( $google_fonts_data['fontFamilies'] ) ) {
		return array();
	}

	$font_face    = new Jetpack_Google_Font_Face();
	$fonts_in_use = $font_face->get_global_styles_fonts_in_use();
	if ( empty( $fonts_in_use ) ) {
		return array();
	}

	$families = array();
	foreach ( $google_fonts_data['fontFamilies'] as $font_family ) {
		if ( empty( $font_family['fontFace'] ) ) {
			continue;
		}

		$name = Jetpack_Google_Font_Face::get_font_family_name( $font_family );
		if ( in_array( $font_face->format_font( $name ), $fonts_in_use, true ) ) {
			$families[] = $font_family;
		}
	}

	return $families;
}

/**
 * Merge preserved font family definitions into an existing list, de-duplicating by slug.
 *
 * @param array $existing  Existing font family definitions.
 * @param array $preserved Font family definitions to add when not already present.
 * @return array The merged, de-duplicated list.
 */
function jetpack_merge_preserved_font_families( $existing, $preserved ) {
	$slug_of = function ( $font_family ) {
		if ( ! empty( $font_family['slug'] ) ) {
			return $font_family['slug'];
		}
		$name = Jetpack_Google_Font_Face::get_font_family_name( $font_family );
		return _wp_to_kebab_case( strtolower( $name ) );
	};

	$by_slug = array();
	foreach ( (array) $existing as $font_family ) {
		$by_slug[ $slug_of( $font_family ) ] = $font_family;
	}
	foreach ( $preserved as $font_family ) {
		$slug = $slug_of( $font_family );
		if ( ! isset( $by_slug[ $slug ] ) ) {
			$by_slug[ $slug ] = $font_family;
		}
	}

	return array_values( $by_slug );
}

/**
 * Preserve in-use Google Fonts, then clean up the module's runtime font data,
 * when the google-fonts module is disabled or Jetpack is disabled.
 *
 * Persisting the in-use families into the site's own global styles lets the
 * fonts keep rendering natively (via core's wp_print_font_faces) after the
 * module — and its runtime 'default' origin registration — is gone.
 */
function jetpack_unregister_google_fonts() {
	// Resolving global styles requires the theme to be set up. If we're called
	// during bootstrap (e.g. while handling deprecated modules), defer until the
	// theme is ready so the in-use fonts are detected correctly.
	if ( ! did_action( 'after_setup_theme' ) ) {
		add_action( 'after_setup_theme', __FUNCTION__, 99 );
		return;
	}

	// Capture the fonts in use before we touch any of the stored data.
	$preserved_families = jetpack_get_in_use_google_font_families();

	$post_id = WP_Theme_JSON_Resolver::get_user_global_styles_post_id();

	// Get user config
	$user_config          = WP_Theme_JSON_Resolver::get_user_data();
	$user_config_raw_data = $user_config->get_raw_data();
	$user_config_raw_data['isGlobalStylesUserThemeJSON'] = true;

	// The module populated the 'default' origin at runtime; drop any persisted copy.
	if ( ! empty( $user_config_raw_data['settings']['typography']['fontFamilies']['default'] ) ) {
		$user_config_raw_data['settings']['typography']['fontFamilies']['default'] = array();
	}

	$theme_fonts = $user_config_raw_data['settings']['typography']['fontFamilies']['theme'] ?? array();

	// Drop the legacy jetpack-google-fonts provider entries that predate the Font Library.
	$theme_fonts = jetpack_google_fonts_filter_out_deprecated_font_data( $theme_fonts );

	// Persist the in-use families so core prints them without the module.
	$theme_fonts = jetpack_merge_preserved_font_families( $theme_fonts, $preserved_families );

	if ( ! empty( $theme_fonts ) ) {
		$user_config_raw_data['settings']['typography']['fontFamilies']['theme'] = $theme_fonts;
	}

	// Prepare changes
	$changes               = new stdClass();
	$changes->ID           = $post_id;
	$changes->post_content = wp_json_encode( $user_config_raw_data, JSON_UNESCAPED_SLASHES );

	// Update user config
	wp_update_post( wp_slash( (array) $changes ), true );

	// Drop cached global styles so the rest of the request sees the saved fonts.
	WP_Theme_JSON_Resolver::clean_cached_data();
}
add_action( 'jetpack_deactivate_module_google-fonts', 'jetpack_unregister_google_fonts' );

// Initialize Jetpack Google Font Face to avoid printing **ALL** google fonts provided by this module.
// See p1700040028362329-slack-C4GAQ900P and p7DVsv-jib-p2
new Jetpack_Google_Font_Face();
