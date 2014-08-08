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

	$abspath = dirname( __FILE__ ) . '/shortcodes';
	$shortcodes_option = Jetpack_Options::get_option( 'available_shortcodes' );
	if ( !is_admin() && !empty( $shortcodes_option[ JETPACK__VERSION ] ) ) {
		$relative_shortcodes = $shortcodes_option[ JETPACK__VERSION ];
		$shortcode_includes = array();
		foreach ( $relative_shortcodes as $shortcode ) {
			$shortcode_includes[] = path_join( $abspath, $shortcode );
		}
	} else {
		$shortcode_includes = array();
		$relative_shortcodes = array();
		
		foreach ( Jetpack::glob_php( $abspath ) as $file ) {
			$relative_file = str_replace( "$abspath/", '', $file);
			$shortcode_includes[] = $file;
			$relative_shortcodes[] = $relative_file;
		}
		Jetpack_Options::update_option( 'available_shortcodes', array( JETPACK__VERSION => $relative_shortcodes) );
	}

	$shortcode_includes = apply_filters( 'jetpack_shortcodes_to_include', $shortcode_includes );

	foreach ( $shortcode_includes as $include ) {
                if ( version_compare( $wp_version, '3.6-z', '>=' ) && stristr( $include, 'audio.php' ) )
			continue;

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
}

jetpack_load_shortcodes();
