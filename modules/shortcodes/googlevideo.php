<?php

/**
 * google video is replaced by youtube, but its embeds will probably continue working indefinitely.
 * [googlevideo=http://video.google.com/googleplayer.swf?docId=-6006084025483872237]    
 */

function googlevideo_shortcode( $atts ) {
	if ( !isset( $atts[0] ) )
		return '';

	$src = ltrim( $atts[0], '=' );
  
	if ( 0 !== strpos( $src, 'http://video.google.com/googleplayer.swf' ) ) {
		if ( !preg_match( '|^http://(video\.google\.[a-z]{2,3}(?:.[a-z]{2})?)/|', $src ) || !preg_match( '|.*docid=([0-9-]+).*|i', $src, $match ) || !is_numeric( $match[1] ) )
			return '<!--Google Video Error: bad URL entered-->';

		$src = 'http://video.google.com/googleplayer.swf?docId=' . $match[1];
	}

	// default width should be 400 unless the theme's content width is smaller than that
	global $content_width;
	$default_width = intval( !empty( $content_width ) ? min( $content_width, 400 ) : 400 );
	$height = intval( 0.825 * $default_width );
	$src = esc_attr( $src );

	return "<span style='text-align:center;display:block;'><object width='{$default_width}' height='{$height}' type='application/x-shockwave-flash' data='{$src}'><param name='allowScriptAccess' value='never' /><param name='movie' value='$src'/><param name='quality' value='best'/><param name='bgcolor' value='#ffffff' /><param name='scale' value='noScale' /><param name='wmode' value='opaque' /></object></span>";
}
add_shortcode( 'googlevideo', 'googlevideo_shortcode' );
