<?php
/**
 * What the comment form preview in Jetpack's Discussion settings needs to look like the site.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use Automattic\Jetpack\Assets;

/**
 * The form's stylesheet, the theme's tokens, and core's discussion options for the settings preview.
 */
class Form_Preview {

	/**
	 * Data for the preview.
	 *
	 * @return array
	 */
	public static function get_data() {
		$css = dirname( __DIR__ ) . '/build/comments.css';

		return array(
			'styleUrl'      => file_exists( $css ) ? add_query_arg( 'ver', (string) filemtime( $css ), Assets::normalize_path( plugins_url( '../build/comments.css', __FILE__ ) ) ) : '',
			'theme'         => self::theme_styles(),
			'defaultAvatar' => Avatars::default_url( 80 ),
			'discussion'    => array(
				'url'                 => admin_url( 'options-discussion.php' ),
				'requireNameEmail'    => (bool) get_option( 'require_name_email' ),
				'commentRegistration' => (bool) get_option( 'comment_registration' ),
				'showAvatars'         => (bool) get_option( 'show_avatars' ),
				'cookiesOptIn'        => (bool) get_option( 'show_comments_cookies_opt_in' ),
			),
		);
	}

	/**
	 * Print the theme's fonts and preset variables for the preview.
	 *
	 * The preview's shadow root inherits custom properties from here, but browsers ignore an @font-face declared inside one.
	 *
	 * @return void
	 */
	public static function print_theme_assets() {
		if ( ! wp_theme_has_theme_json() ) {
			return;
		}

		if ( function_exists( 'wp_print_font_faces' ) ) {
			wp_print_font_faces();
		}

		printf( "<style id=\"jetpack-comments-preview-variables\">\n%s\n</style>\n", wp_strip_all_tags( wp_get_global_stylesheet( array( 'variables' ) ) ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- CSS, stripped of tags.
	}

	/**
	 * The theme's type, colors, and buttons, as custom properties for the preview.
	 *
	 * @return array|null Null when the theme sets none of them, or has no theme.json and so only core's defaults.
	 */
	public static function theme_styles() {
		if ( ! wp_theme_has_theme_json() ) {
			return null;
		}

		$styles = wp_get_global_styles();
		$map    = array(
			'--jpc-font-family'           => array( 'typography', 'fontFamily' ),
			'--jpc-font-size'             => array( 'typography', 'fontSize' ),
			'--jpc-line-height'           => array( 'typography', 'lineHeight' ),
			'--jpc-color'                 => array( 'color', 'text' ),
			'--jpc-background'            => array( 'color', 'background' ),
			'--jpc-link'                  => array( 'elements', 'link', 'color', 'text' ),
			'--jpc-heading-font-family'   => array( array( 'elements', 'h3', 'typography', 'fontFamily' ), array( 'elements', 'heading', 'typography', 'fontFamily' ) ),
			'--jpc-heading-font-size'     => array( array( 'elements', 'h3', 'typography', 'fontSize' ), array( 'elements', 'heading', 'typography', 'fontSize' ) ),
			'--jpc-heading-font-weight'   => array( array( 'elements', 'h3', 'typography', 'fontWeight' ), array( 'elements', 'heading', 'typography', 'fontWeight' ) ),
			'--jpc-heading-line-height'   => array( array( 'elements', 'h3', 'typography', 'lineHeight' ), array( 'elements', 'heading', 'typography', 'lineHeight' ) ),
			'--jpc-heading-color'         => array( array( 'elements', 'h3', 'color', 'text' ), array( 'elements', 'heading', 'color', 'text' ) ),
			'--jpc-button-background'     => array( 'elements', 'button', 'color', 'background' ),
			'--jpc-button-color'          => array( 'elements', 'button', 'color', 'text' ),
			'--jpc-button-font-family'    => array( 'elements', 'button', 'typography', 'fontFamily' ),
			'--jpc-button-font-weight'    => array( 'elements', 'button', 'typography', 'fontWeight' ),
			'--jpc-button-text-transform' => array( 'elements', 'button', 'typography', 'textTransform' ),
			'--jpc-button-letter-spacing' => array( 'elements', 'button', 'typography', 'letterSpacing' ),
			'--jpc-button-radius'         => array( 'elements', 'button', 'border', 'radius' ),
			'--jpc-button-border-width'   => array( 'elements', 'button', 'border', 'width' ),
			'--jpc-button-border-style'   => array( 'elements', 'button', 'border', 'style' ),
			'--jpc-button-border-color'   => array( 'elements', 'button', 'border', 'color' ),
		);

		$tokens = array();
		foreach ( $map as $property => $paths ) {
			$paths = is_array( $paths[0] ) ? $paths : array( $paths );
			foreach ( $paths as $path ) {
				$value = self::style_value( $styles, $path );
				if ( '' !== $value ) {
					$tokens[ $property ] = $value;
					break;
				}
			}
		}

		return $tokens ? $tokens : null;
	}

	/**
	 * One global styles value as CSS, with theme.json's `var:preset|…` shorthand expanded as core expands it.
	 *
	 * @param array $styles Global styles.
	 * @param array $path   Keys to the value.
	 * @return string Empty when unset or not a plain value.
	 */
	private static function style_value( $styles, $path ) {
		$value = $styles;
		foreach ( $path as $key ) {
			if ( ! is_array( $value ) || ! isset( $value[ $key ] ) ) {
				return '';
			}
			$value = $value[ $key ];
		}

		if ( ! is_string( $value ) && ! is_numeric( $value ) ) {
			return '';
		}

		$value = trim( (string) $value );
		if ( str_starts_with( $value, 'var:' ) ) {
			$value = 'var(--wp--' . str_replace( '|', '--', substr( $value, 4 ) ) . ')';
		}

		// A value, never a way out of one.
		return preg_match( '/[;{}<>]/', $value ) ? '' : $value;
	}
}
