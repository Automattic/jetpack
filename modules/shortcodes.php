<?php

/**
 * Module Name: Shortcode Embeds
 * Module Description: Embed content from YouTube, Vimeo, SlideShare, and more, no coding necessary.
 * Sort Order: 3
 * First Introduced: 1.1
 * Major Changes In: 1.2
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Photos and Videos, Social, Writing, Appearance
 * Additional Search Queries: shortcodes, shortcode, embeds, media, bandcamp, blip.tv, dailymotion, digg, facebook, flickr, google calendars, google maps, google+, polldaddy, recipe, recipes, scribd, slideshare, slideshow, slideshows, soundcloud, ted, twitter, vimeo, vine, youtube
 */

/**
 * Transforms the $atts array into a string that the old functions expected
 *
 * The old way was:
 * [shortcode a=1&b=2&c=3] or [shortcode=1]
 * This is parsed as array( a => '1&b=2&c=3' ) and array( 0 => '=1' ), which is useless
 *
 * @param Array $params
 * @param Bool $old_format_support true if [shortcode=foo] format is possible.
 * @return String $params
 */
function shortcode_new_to_old_params( $params, $old_format_support = false ) {
	$str = '';

	if ( $old_format_support && isset( $params[0] ) ) {
		$str = ltrim( $params[0], '=' );
	} elseif ( is_array( $params ) ) {
		foreach ( array_keys( $params ) as $key ) {
			if ( ! is_numeric( $key ) )
				$str = $key . '=' . $params[$key];
		}
	}

	return str_replace( array( '&amp;', '&#038;' ), '&', $str );
}

function jetpack_load_shortcodes() {
	global $wp_version;

	$shortcode_includes = array();

	foreach ( Jetpack::glob_php( dirname( __FILE__ ) . '/shortcodes' ) as $file ) {
		$shortcode_includes[] = $file;
	}

/**
 * This filter allows other plugins to override which shortcodes Jetpack loads.
 *
 * @module shortcodes
 *
 * @since 2.2.1
 *
 * @param array $shortcode_includes An array of which shortcodes to include.
 */
	$shortcode_includes = apply_filters( 'jetpack_shortcodes_to_include', $shortcode_includes );

	foreach ( $shortcode_includes as $include ) {
		if ( version_compare( $wp_version, '3.6-z', '>=' ) && stristr( $include, 'audio.php' ) ) {
			continue;
		}

		include $include;
	}
}

global $wp_version;

if ( version_compare( $wp_version, '3.6-z', '>=' ) ) {
	add_filter( 'shortcode_atts_audio', 'jetpack_audio_atts_handler', 10, 3 );

	function jetpack_audio_atts_handler( $out, $pairs, $atts ) {
		if( isset( $atts[0] ) )
			$out['src'] = $atts[0];

		return $out;
	}

	function jetpack_shortcode_get_audio_id( $atts ) {
		if ( isset( $atts[ 0 ] ) )
			return $atts[ 0 ];
		else
			return 0;
	}
}

if ( ! function_exists( 'jetpack_shortcode_get_wpvideo_id' ) ) {
	function jetpack_shortcode_get_wpvideo_id( $atts ) {
		if ( isset( $atts[ 0 ] ) )
			return $atts[ 0 ];
		else
			return 0;
	}
}

jetpack_load_shortcodes();
