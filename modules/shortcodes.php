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

/**
 * Runs preg_replace so that replacements don't happen within open tags.  
 * Parameters are the same as preg_replace, with an added optional search param for improved performance
 *
 * @param String $pattern
 * @param String $replacement
 * @param String $content
 * @param String $search
 * @return String $content
 */
function jetpack_preg_replace_outside_tags( $pattern, $replacement, $content, $search = null ) {
	if( ! function_exists( 'wp_html_split' ) ) {
		return $content;
	}

	if ( $search && false === strpos( $content, $search ) ) {
		return $content;
	}
	
	$textarr = wp_html_split( $content );
	unset( $content );
	foreach( $textarr as &$element ) {
	    if ( '' === $element || '<' === $element{0} )
	        continue;
	    $element = preg_replace( $pattern, $replacement, $element );
	}
	
	return join( $textarr );
}

/**
 * Runs preg_replace_callback so that replacements don't happen within open tags.  
 * Parameters are the same as preg_replace, with an added optional search param for improved performance
 *
 * @param String $pattern
 * @param String $replacement
 * @param String $content
 * @param String $search
 * @return String $content
 */
function jetpack_preg_replace_callback_outside_tags( $pattern, $callback, $content, $search = null ) {
	if ( ! function_exists( 'wp_html_split' ) ) {
		return $content;
	}

	if ( $search && false === strpos( $content, $search ) ) {
		return $content;
	}
	
	$textarr = wp_html_split( $content );
	unset( $content );

	// Flag to check we're inside an HTML tag.
	$surrounding_tag = '';

	foreach( $textarr as &$element ) {

		// If it's an empty element, continue.
		if ( '' === $element ) {
	        continue;
		}

		// If this is an opening HTML tag, save it and move to the next element.
		if ( '<' === $element[0] && '/>' !== substr( $element, -2 ) && ! jetpack_is_html_self_closing_tag( $element ) ) {
			$surrounding_tag = $element;
			continue;
		}

		// If this is a closing HTML tag, erase the previously saved element.
		if ( '</' === substr( $element, 0, 2 ) ) {
			$surrounding_tag = '';
			continue;
		}

		// If we're inside a link, don't embed the video.
		// Covers cases like "Here's a link to the video: <a href="https://vimeo.com/123456">https://vimeo.com/123456</a>".
		if ( 'vimeo_link_callback' === $callback && jetpack_is_html_tag( 'a', $surrounding_tag ) ) {
			continue;
		}

		$element = preg_replace_callback( $pattern, $callback, $element );
	}
	return join( '', $textarr );
}

/**
 * True if the passed text is a self-closing HTML tag. False otherwise.
 *
 * @since 4.0.4
 *
 * @param string $text Text that might be an HTML tag.
 *
 * @return bool
 */
function jetpack_is_html_self_closing_tag( $text ) {
	// http://w3c.github.io/html/single-page.html#void-elements
	$self_closing_tags = array(
		'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
		'keygen', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'
	);
	foreach ( $self_closing_tags as $tag ) {
		if ( 1 === preg_match( sprintf( '#^<%s.*/?>$#i', $tag ), $text ) ) {
			return true;
		}
	}
	return false;
}

/**
 * Check if the text passed is an HTML tag.
 *
 * @since 4.0.4
 *
 * @param string $tag  A Valid HTML tag like 'a'.
 * @param string $text Text to check and see if it's the HTML tag we expect it to be.
 *
 * @return bool True if the passed text is an HTML tag. False otherwise.
 */
function jetpack_is_html_tag( $tag = '', $text ) {
	return (
		! empty( $tag ) &&
		( 1 === preg_match( sprintf( '/^<%s[^>]*>$/i', $tag ), $text ) )
	);
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
