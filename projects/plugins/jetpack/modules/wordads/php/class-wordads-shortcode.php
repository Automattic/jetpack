<?php
/**
 * Wordads shortcode.
 *
 * Examples:
 * [wordads]
 *
 * @package automattic/jetpack
 */

/**
 * Class WordAds_Shortcode
 *
 * Handles the [wordads] shortcode.
 */
class WordAds_Shortcode {

	/**
	 * Register our shortcode and enqueue necessary files.
	 */
	public static function init() {
		global $wordads;

		if ( empty( $wordads ) ) {
			return null;
		}

		add_shortcode( 'wordads', array( self::class, 'handle_wordads_shortcode' ) );
	}

	/**
	 * Our [wordads] shortcode.
	 * Prints a WordAds Ad.
	 *
	 * @param array  $atts    Array of shortcode attributes.
	 * @param string $content Post content.
	 *
	 * @return string HTML for WordAds shortcode.
	 */
	public static function handle_wordads_shortcode( $atts, $content = '' ) {
		$atts = shortcode_atts( array(), $atts, 'wordads' );

		return self::wordads_shortcode_html( $atts, $content );
	}

	/**
	 * The shortcode output
	 *
	 * @param array  $atts    Array of shortcode attributes.
	 * @param string $content Post content.
	 *
	 * @return string HTML output
	 */
	private static function wordads_shortcode_html( $atts, $content = '' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		global $wordads;

		if ( empty( $wordads ) ) {
			return '<div>' . __( 'The WordAds module is not active', 'jetpack' ) . '</div>';
		}

		$html = $wordads->insert_inline_ad( '' );

		return $html;
	}
}
