<?php
/**
 * Google Fonts package Google_Font_Face class file.
 *
 * @package automattic/jetpack-google-fonts-provider
 * @since 0.1.0
 */

namespace Automattic\Jetpack\Fonts;

/**
 * Google Font Face
 */
class Google_Font_Face {
	/**
	 * The root URL for the google font face.
	 *
	 * @var string
	 */
	private static $root_url = 'https://fonts.googleapis.com/css2';

	/**
	 * Array of font-face style tag's attribute(s)
	 * where the key is the attribute name and the
	 * value is its value.
	 *
	 * @var string[]
	 */
	private $style_tag_attrs = array();

	/**
	 * Creates and initializes an instance of Google_Font_Face.
	 */
	public function __construct() {
		if (
			function_exists( 'is_admin' ) && ! is_admin()
			&&
			function_exists( 'current_theme_supports' ) && ! current_theme_supports( 'html5', 'style' )
		) {
			$this->style_tag_attrs = array( 'type' => 'text/css' );
		}
	}

	/**
	 * Generates and prints the `@font-face` styles for the given fonts.
	 *
	 * @since 6.4.0
	 *
	 * @param array[][] $fonts Optional. The font-families and their font variations.
	 *                         See {@see wp_print_font_faces()} for the supported fields.
	 *                         Default empty array.
	 */
	public function generate_and_print( array $fonts ) {
		$fonts = $this->validate_fonts( $fonts );

		// Bail out if there are no fonts are given to process.
		if ( empty( $fonts ) ) {
			return;
		}

		$css = $this->get_css( $fonts );

		/*
		 * The font-face CSS is contained within <style> tags and can only be interpreted
		 * as CSS in the browser. Using wp_strip_all_tags() is sufficient escaping
		 * to avoid malicious attempts to close </style> and open a <script>.
		 */
		$css = wp_strip_all_tags( $css );

		// Bail out if there is no CSS to print.
		if ( empty( $css ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		printf( $this->get_style_element(), $css );
	}

	/**
	 * Validates each of the font-face properties.
	 *
	 * @param array $fonts The fonts to valid.
	 * @return array Prepared font-faces.
	 */
	private function validate_fonts( array $fonts ) {
		$root_url        = self::get_root_url();
		$validated_fonts = array();

		foreach ( $fonts as $font_faces ) {
			foreach ( $font_faces as $font_face ) {
				$font_face['src'] = array_filter(
					(array) $font_face['src'],
					function ( $src ) use ( $root_url ) {
						return str_starts_with( $src, $root_url );
					}
				);

				// Skip if it's not a google font face.
				if ( empty( $font_face['src'] ) ) {
					continue;
				}

				$validated_fonts[] = $font_face;
			}
		}

		return $validated_fonts;
	}

	/**
	 * Gets the style element for wrapping the CSS.
	 *
	 * @return string The style element.
	 */
	private function get_style_element() {
		$attributes = $this->generate_style_element_attributes();

		return "<style id='jetpack-google-fonts'{$attributes}>\n%s\n</style>\n";
	}

	/**
	 * Gets the defined <style> element's attributes.
	 *
	 * @return string A string of attribute=value when defined, else, empty string.
	 */
	private function generate_style_element_attributes() {
		$attributes = '';
		foreach ( $this->style_tag_attrs as $name => $value ) {
			$attributes .= " {$name}='{$value}'";
		}
		return $attributes;
	}

	/**
	 * Gets the CSS styles for google font faces.
	 *
	 * @param array $font_faces The font-faces to generate the CSS styles.
	 * @return string The CSS styles.
	 */
	private function get_css( $font_faces ) {
		$css = '';

		foreach ( $font_faces as $font_face ) {
			foreach ( (array) $font_face['src'] as $src ) {
				$css .= '@import url(' . $src . ');' . "\n";
			}
		}

		// Don't print the last newline character.
		return rtrim( $css, "\n" );
	}

	/**
	 * Gets the root URL for the google font faces.
	 */
	public static function get_root_url() {
		/**
		 * Filters the Google Fonts API URL.
		 *
		 * @since 0.4.0
		 *
		 * @param string $url The Google Fonts API URL.
		 */
		return \esc_url( apply_filters( 'jetpack_google_fonts_api_url', self::$root_url ) );
	}

	/**
	 * Build the Google Fonts URL for the given font face.
	 *
	 * @param array $font_face The font face to process.
	 * @return string The url of the given font face.
	 */
	public static function get_font_url( $font_face ) {
		$defaults = array(
			'font-family'  => '',
			'font-style'   => 'normal',
			'font-weight'  => '400',
			'font-display' => 'fallback',
		);

		$font_face    = wp_parse_args( $font_face, $defaults );
		$font_family  = rawurlencode( $font_face['font-family'] );
		$font_display = $font_face['font-display'];
		$font_weight  = $font_face['font-weight'];
		if ( ! empty( $font_weight ) ) {
			if ( 'italic' === $font_face['font-style'] ) {
				$font_family .= ':ital,wght@1,' . $font_weight;
			} else {
				$font_family .= ':wght@' . $font_weight;
			}
		}

		return self::get_root_url() . '?family=' . $font_family . '&display=' . $font_display;
	}
}
