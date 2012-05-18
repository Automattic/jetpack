<?php

/**
 * Module Name: Shortcode Embeds
 * Module Description: Easily embed videos and more from sites like YouTube, Vimeo, and SlideShare.
 * First Introduced: 1.1
 * Major Changes In: 1.2
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
	if ( version_compare( PHP_VERSION, 5, '<' ) ) {
		$php5_only = array( 'videopress.php' => true );
	} else {
		$php5_only = array();
	}

	foreach ( Jetpack::glob_php( dirname( __FILE__ ) . '/shortcodes' ) as $file ) {
		if ( isset( $php5_only[basename( $file )] ) ) {
			continue;
		}
		include $file;
	}
}

jetpack_load_shortcodes();
