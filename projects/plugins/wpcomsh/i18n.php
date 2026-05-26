<?php
/**
 * WPCOMSH internationalization file.
 *
 * @package wpcomsh
 */

/**
 * Provides a fallback mofile that uses wpcom locale slugs instead of wporg locale slugs
 * This is needed for WP.COM themes that have their translations bundled with the theme.
 *
 * @see p8yzl4-4c-p2
 *
 * @param string $mofile  .mo language file being loaded by load_textdomain().
 * @param string $domain  Text domain.
 * @return string $mofile same or alternate mo file.
 */
function wpcomsh_wporg_to_wpcom_locale_mo_file( $mofile, $domain = '' ) {
	if ( file_exists( $mofile ) ) {
		return $mofile;
	}

	if ( ! class_exists( 'GP_Locales' ) ) {
		if ( ! defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) || ! file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
			return $mofile;
		}

		require JETPACK__GLOTPRESS_LOCALES_PATH;
	}

	$original_mo_basename = basename( $mofile, '.mo' );
	$locale_slug          = $original_mo_basename;

	$theme_root = function_exists( 'get_theme_root' )
		? wp_normalize_path( trailingslashit( get_theme_root() ) )
		: '';

	// On WP Cloud sites, get_template_directory() returns /wordpress/themes/pub...
	// which is the actual path to the theme, symlinked from wp-content/themes.
	// _load_textdomain_just_in_time sees that the folders don't match
	// and builds the mo file as "{$path}{$domain}-{$locale}.mo", so we need to
	// remove the domain prefix to get the locale.
	$remove_domain_prefix_for_theme = is_string( $domain ) && '' !== $domain
		&& '' !== $theme_root
		&& str_starts_with( wp_normalize_path( $mofile ), $theme_root )
		&& str_starts_with( $original_mo_basename, $domain . '-' );

	if ( $remove_domain_prefix_for_theme ) {
		$locale_slug = str_replace( $domain . '-', '', $original_mo_basename );
	}

	// These locales are not in our GP_Locales file, so rewrite them.
	$locale_mappings = array(
		'de_DE_formal' => 'de_DE', // formal German
	);

	if ( isset( $locale_mappings[ $locale_slug ] ) ) {
		$locale_slug = $locale_mappings[ $locale_slug ];
	}

	$locale_object = GP_Locales::by_field( 'wp_locale', $locale_slug );
	if ( ! $locale_object ) {
		return $mofile;
	}

	$locale_slug = $locale_object->slug;

	// For these languages we have a different slug than WordPress.org.
	$locale_mappings = array(
		'nb' => 'no', // Norwegian Bokmål.
	);

	if ( isset( $locale_mappings[ $locale_slug ] ) ) {
		$locale_slug = $locale_mappings[ $locale_slug ];
	}

	// phpcs:ignore WordPress.PHP.PregQuoteDelimiter.Missing
	$mofile = preg_replace( '/' . preg_quote( $original_mo_basename ) . '\.mo$/', $locale_slug . '.mo', $mofile );
	return $mofile;
}
add_filter( 'load_textdomain_mofile', 'wpcomsh_wporg_to_wpcom_locale_mo_file', 9999, 2 );

// Load translations for wpcomsh itself via MO file.
add_action(
	'after_setup_theme',
	function () {
		load_theme_textdomain( 'wpcomsh', WP_LANG_DIR . '/mu-plugins' );
		load_theme_textdomain( 'jetpack-mu-wpcom', WP_LANG_DIR . '/mu-plugins' );
	}
);

/*
 * Early deploy of this fix in Jetpack: https://github.com/Automattic/jetpack/pull/14797
 * To be removed after the release of 8.5 (but things won't break with the Jetpack fix shipped).
 */
add_filter(
	'load_script_textdomain_relative_path',
	function ( $relative, $src ) {
		if ( class_exists( 'Jetpack_Photon_Static_Assets_CDN' ) ) {
			// Get the local path from a URL which was CDN'ed by cdnize_plugin_assets().
			if ( preg_match( '#^' . preg_quote( Jetpack_Photon_Static_Assets_CDN::CDN, '#' ) . 'p/[^/]+/[^/]+/(.*)$#', $src, $m ) ) {
				return $m[1];
			}
		}

		return $relative;
	},
	10,
	2
);

// Ensure use of the correct local path when loading the JavaScript translation file for a CDN'ed asset.
add_filter(
	'load_script_translation_file',
	function ( $file, $handle, $domain ) {
		global $wp_scripts;

		if ( in_array( $domain, array( 'jetpack-mu-wpcom', 'wpcomsh' ), true ) ) {
			return WP_LANG_DIR . '/mu-plugins/' . basename( $file );
		}

		if ( class_exists( 'Jetpack_Photon_Static_Assets_CDN' ) ) {
			// This is a rewritten plugin URL, so load the language file from the plugins path.
			if ( isset( $wp_scripts->registered[ $handle ] ) && wp_startswith( $wp_scripts->registered[ $handle ]->src, Jetpack_Photon_Static_Assets_CDN::CDN . 'p' ) ) {
				return WP_LANG_DIR . '/plugins/' . basename( $file );
			}
		}
		return $file;
	},
	10,
	3
);

// end of https://github.com/Automattic/jetpack/pull/14797

/**
 * Always allow override of _locale to English by setting ?_locale=en_US in the URL.
 * All sites will have English translations available.
 *
 * This is used by class.wpcom-jetpack-mapper-get-admin-menu.php on WPCOM, which lets A8C users in support sessions view
 * Atomic sites in languages that might not be installed on that Atomic site. WPCOM requests menu items in English, then
 * retrieves them from the Atomic side, then translates them before display.
 *
 * @see D59986-code
 *
 * @param string $locale_in Default locale.
 *
 * @return string
 */
function wpcomsh_allow_en_locale_override( $locale_in ) {
	if ( ! empty( $_GET['_locale'] ) && 'en_US' === $_GET['_locale'] ) { // phpcs:ignore WordPress.Security
		return 'en_US';
	}
	return $locale_in;
}
add_filter( 'pre_determine_locale', 'wpcomsh_allow_en_locale_override' );

/**
 * Filter to hook into the `gettext` filter for requests against the `jetpack-mu-wpcom`
 * text domain, as those translations are loaded into the `wpcomsh` text domain.
 *
 * @see https://github.com/Automattic/wpcomsh/issues/1727
 *
 * @param string $translation The translated text.
 * @param string $singular    The text to translate.
 * @param string $domain      The text domain.
 * @return string
 */
function wpcomsh_use_wpcomsh_fallback_for_jetpack_mu_wpcom_text_domain( $translation, $singular, $domain = 'default' ) {
	if ( $domain !== 'jetpack-mu-wpcom' ) {
		return $translation;
	}

	if ( $translation !== $singular ) {
		return $translation;
	}

	// This is a low-level filter, and we trust that $singular is a string, so we can ignore these important warnings.
	// phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText, WordPress.WP.I18n.LowLevelTranslationFunction
	return translate( $singular, 'wpcomsh' );
}
add_filter( 'gettext', 'wpcomsh_use_wpcomsh_fallback_for_jetpack_mu_wpcom_text_domain', 10, 3 );
