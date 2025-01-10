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
	 * @return string HTML for WordAds shortcode.
	 */
	public static function handle_wordads_shortcode() {
		global $wordads;

		if ( empty( $wordads ) ) {
			return '<div>' . __( 'The WordAds module is not active', 'jetpack' ) . '</div>';
		}

		$html = '<div class="jetpack-wordad" itemscope itemtype="https://schema.org/WPAdBlock"></div>';

		return $wordads->insert_inline_ad( $html );
	}
}
