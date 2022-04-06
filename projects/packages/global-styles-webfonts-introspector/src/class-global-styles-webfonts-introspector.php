<?php
/**
 * Global styles webfonts introspector
 *
 * @package automattic/global-styles-webfonts-introspector
 * @since 0.1.0
 */

namespace Automattic\Jetpack\Fonts;

/**
 * Global styles webfonts introspector.
 */
class Global_Styles_Webfonts_Introspector {
	/**
	 * Extract the font family slug from a settings object.
	 *
	 * @param object $setting The setting object.
	 *
	 * @return string|void
	 */
	private static function extract_font_slug_from_setting( $setting ) {
		if ( isset( $setting['typography'] ) && isset( $setting['typography']['fontFamily'] ) ) {
			$font_family = $setting['typography']['fontFamily'];

			// Full string: var(--wp--preset--font-family--slug).
			// We do not care about the origin of the font, only its slug.
			preg_match( '/font-family--(?P<slug>.+)\)$/', $font_family, $matches );

			if ( isset( $matches['slug'] ) ) {
				return $matches['slug'];
			}

			// Full string: var:preset|font-family|slug
			// We do not care about the origin of the font, only its slug.
			preg_match( '/font-family\|(?P<slug>.+)$/', $font_family, $matches );

			if ( isset( $matches['slug'] ) ) {
				return $matches['slug'];
			}

			return $font_family;
		}
	}

	/**
	 * Introspect global styles for webfonts.
	 */
	public static function introspect_global_styles_webfonts() {
		if ( ! function_exists( 'gutenberg_get_global_styles' ) ) {
			return;
		}

		$global_styles = gutenberg_get_global_styles();

		$found_webfonts = array();

		// Look for fonts in block presets...
		if ( isset( $global_styles['blocks'] ) ) {
			foreach ( $global_styles['blocks'] as $setting ) {
				$font_slug = self::extract_font_slug_from_setting( $setting );

				if ( $font_slug ) {
					$found_webfonts[ $font_slug ] = 1;
				}
			}
		}

		// Look for fonts in HTML element presets...
		if ( isset( $global_styles['elements'] ) ) {
			foreach ( $global_styles['elements'] as $setting ) {
				$font_slug = self::extract_font_slug_from_setting( $setting );

				if ( $font_slug ) {
					$found_webfonts[ $font_slug ] = 1;
				}
			}
		}

		// Check if a global typography setting was defined.
		$font_slug = self::extract_font_slug_from_setting( $global_styles );

		if ( $font_slug ) {
			$found_webfonts[ $font_slug ] = 1;
		}

		return array_keys( $found_webfonts );
	}

}
