<?php

/**
 * Embed WordAds 'ad' in post
 */
class Jetpack_WordAds_Shortcode {

	private $scripts_and_style_included = false;

	function __construct() {
		add_action( 'init', array( $this, 'action_init' ) );
	}

	/**
	 * Register our shortcode and enqueue necessary files.
	 */
	function action_init() {
		global $wordads;

		if ( empty( $wordads ) ) {
			return null;
		}
		add_shortcode( 'wordads', array( $this, 'wordads_shortcode' ) );

		jetpack_register_block( 'jetpack/wordads', array(
			'render_callback' => array( $this, 'gutenblock_render' ),
		) );
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
	static function wordads_shortcode( $atts, $content = '' ) {
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
	static function wordads_shortcode_html( $atts, $content = '' ) {
		global $wordads;

		if ( empty( $wordads ) ) {
			return '<div>' . __( 'The WordAds module is not active', 'jetpack' ) . '</div>';
		}

		$html = '<div class="jetpack-wordad" itemscope itemtype="https://schema.org/WPAdBlock"></div>';
		$html = $wordads->insert_inline_ad( $html );

		return $html;
	}

	public static function gutenblock_render( $attr ) {
		global $wordads;

		/** This filter is already documented in modules/wordads/wordads.php `insert_ad()` */
		if ( is_feed() || apply_filters( 'wordads_inpost_disable', false ) ) {
			return '';
		}

		if ( $wordads->option( 'wordads_house' ) ) {
			return $wordads->get_ad( 'inline', 'house' );
		}

		// section_id is mostly depricated at this point, but it helps us (devs) keep track of which ads end up where
		// 6 is to keep track of gutenblock ads
		$section_id = 0 === $wordads->params->blog_id ?
			WORDADS_API_TEST_ID :
			$wordads->params->blog_id . '6';

		$align = 'center';
		if ( isset( $attr['align'] ) && in_array( $attr['align'], array( 'left', 'center', 'right' ) ) ) {
			$align = $attr['align'];
		}
		$align = 'align' . $align;

		$format = 'mrec';
		if ( isset( $attr['format'] ) && in_array( $attr['format'], array_keys( WordAds::$ad_tag_ids ) ) ) {
			$format = $attr['format'];
		}

		$height  = WordAds::$ad_tag_ids[ $format ]['height'];
		$width   = WordAds::$ad_tag_ids[ $format ]['width'];
		$snippet = $wordads->get_ad_snippet( $section_id, $height, $width, 'inline', WordAds::$SOLO_UNIT_CSS );
		return $wordads->get_ad_div( 'inline', $snippet, array( $align ) );
	}
}

new Jetpack_WordAds_Shortcode();
