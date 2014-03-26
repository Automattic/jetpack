<?php

/**
 * youtube shortcode
 *
 * Contains shortcode + some improvements over the Embeds syntax @
 * http://codex.wordpress.org/Embeds
 *
 * @example [youtube=http://www.youtube.com/watch?v=wq0rXGLs0YM&amp;fs=1&amp;hl=bg_BG]
 */

/**
 * Replaces YouTube embeds with YouTube shortcodes.
 *
 * @param string $content HTML content.
 * @return string The content with YouTube embeds replaced with YouTube shortcodes.
 */
// 2008-07-15:
//<object width="425" height="344"><param name="movie" value="http://www.youtube.com/v/bZBHZT3a-FA&hl=en&fs=1"></param><param name="allowFullScreen" value="true"></param><embed src="http://www.youtube.com/v/bZBHZT3a-FA&hl=en&fs=1" type="application/x-shockwave-flash" allowfullscreen="true" width="425" height="344"></embed></object>
// around 2008-06-06 youtube changed their old embed code to this:
//<object width="425" height="344"><param name="movie" value="http://www.youtube.com/v/M1D30gS7Z8U&hl=en"></param><embed src="http://www.youtube.com/v/M1D30gS7Z8U&hl=en" type="application/x-shockwave-flash" width="425" height="344"></embed></object>
// old style was:
// <object width="425" height="344"><param name="movie" value="http://www.youtube.com/v/dGY28Qbj76A&rel=0"></param><param name="wmode" value="transparent"></param><embed src="http://www.youtube.com/v/dGY28Qbj76A&rel=0" type="application/x-shockwave-flash" wmode="transparent" width="425" height="344"></embed></object>
// 12-2010:
// <object width="640" height="385"><param name="movie" value="http://www.youtube.com/v/3H8bnKdf654?fs=1&amp;hl=en_GB"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/3H8bnKdf654?fs=1&amp;hl=en_GB" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="640" height="385"></embed></object>
// 01-2011:
// <iframe title="YouTube video player" class="youtube-player" type="text/html" width="640" height="390" src="http://www.youtube.com/embed/Qq9El3ki0_g" frameborder="0" allowFullScreen></iframe>
// <iframe class="youtube-player" type="text/html" width="640" height="385" src="http://www.youtube.com/embed/VIDEO_ID" frameborder="0"></iframe>

function youtube_embed_to_short_code( $content ) {
	if ( false === strpos( $content, 'youtube.com' ) )
		return $content;

	//older codes
	$regexp = '!<object width="\d+" height="\d+"><param name="movie" value="https?://www\.youtube\.com/v/([^"]+)"></param>(?:<param name="\w+" value="[^"]*"></param>)*<embed src="https?://www\.youtube\.com/v/(.+)" type="application/x-shockwave-flash"(?: \w+="[^"]*")* width="\d+" height="\d+"></embed></object>!i';
	$regexp_ent = htmlspecialchars( $regexp, ENT_NOQUOTES );
	$old_regexp = '!<embed(?:\s+\w+="[^"]*")*\s+src="https?(?:\:|&#0*58;)//www\.youtube\.com/v/([^"]+)"(?:\s+\w+="[^"]*")*\s*(?:/>|>\s*</embed>)!';
	$old_regexp_ent = str_replace( '&amp;#0*58;', '&amp;#0*58;|&#0*58;', htmlspecialchars( $old_regexp, ENT_NOQUOTES ) );

	//new code
	$ifr_regexp = '!<iframe((?:\s+\w+="[^"]*")*?)\s+src="(https?:)?//(?:www\.)*youtube.com/embed/([^"]+)".*?</iframe>!i';
	$ifr_regexp_ent = str_replace( '&amp;#0*58;', '&amp;#0*58;|&#0*58;', htmlspecialchars( $ifr_regexp, ENT_NOQUOTES ) );

	if ( is_ssl() )
		$protocol = 'https';
	else
		$protocol = 'http';

	foreach ( array( 'regexp', 'regexp_ent', 'old_regexp', 'old_regexp_ent', 'ifr_regexp', 'ifr_regexp_ent' ) as $reg ) {
		if ( ! preg_match_all( $$reg, $content, $matches, PREG_SET_ORDER ) )
			continue;

		foreach ( $matches as $match ) {
			// Hack, but '?' should only ever appear once, and
			// it should be for the 1st field-value pair in query string,
			// if it is present
			// YouTube changed their embed code.
			// Example of how it is now:
			//     <object width="640" height="385"><param name="movie" value="http://www.youtube.com/v/aP9AaD4tgBY?fs=1&amp;hl=en_US"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/aP9AaD4tgBY?fs=1&amp;hl=en_US" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="640" height="385"></embed></object>
			// As shown at the start of function, previous YouTube didn't '?'
			// the 1st field-value pair.
			if ( in_array ( $reg, array( 'ifr_regexp', 'ifr_regexp_ent' ) ) ) {
				$params = $match[1];

				if ( 'ifr_regexp_ent' == $reg )
					$params = html_entity_decode( $params );

				$params = wp_kses_hair( $params, array( 'http' ) );

				$width = isset( $params['width'] ) ? (int) $params['width']['value'] : 0;
				$height = isset( $params['height'] ) ? (int) $params['height']['value'] : 0;
				$wh = '';

				if ( $width && $height )
					$wh = "&w=$width&h=$height";

				$url = esc_url_raw( "$protocol://www.youtube.com/watch?v={$match[3]}{$wh}" );
			} else {
				$match[1] = str_replace( '?', '&', $match[1] );

				$url = esc_url_raw( "$protocol://www.youtube.com/watch?v=" . html_entity_decode( $match[1] ) );
			}

			$content = str_replace( $match[0], "[youtube $url]", $content );

			do_action( 'jetpack_embed_to_shortcode', 'youtube', $url );
		}
	}

	return $content;
}

add_filter('pre_kses', 'youtube_embed_to_short_code');

/**
 * Replaces plain-text links to YouTube videos with YouTube embeds.
 *
 * @param string $content HTML content
 * @return string The content with embeds instead of URLs
 */
function youtube_link( $content ) {
	return preg_replace_callback( '!(?:\n|\A)https?://(?:www\.)?(?:youtube.com/(?:v/|playlist|watch[/\#?])|youtu\.be/)[^\s]+?(?:\n|\Z)!i', 'youtube_link_callback', $content );
}

/**
 * Callback function for the regex that replaces YouTube URLs with
 * YouTube embeds.
 */
function youtube_link_callback( $matches ) {
	return "\n" . youtube_id( $matches[0] ) . "\n";
}

/**
 * Normalizes a YouTube URL to include a v= parameter and a query string free of encoded ampersands.
 *
 * @param string $url
 * @return string The normalized URL
 */
if ( !function_exists( 'youtube_sanitize_url' ) ) :
function youtube_sanitize_url( $url ) {
	$url = trim( $url, ' "' );
	$url = trim( $url );
	$url = str_replace( array( 'youtu.be/', '/v/', '#!v=', '&amp;', '&#038;', 'playlist' ), array( 'youtu.be/?v=', '/?v=', '?v=', '&', '&', 'videoseries' ), $url );

	// Replace any extra question marks with ampersands - the result of a URL like "http://www.youtube.com/v/9FhMMmqzbD8?fs=1&hl=en_US" being passed in.
	$query_string_start = strpos( $url, "?" );

	if ( false !== $query_string_start ) {
		$url = substr( $url, 0, $query_string_start + 1 ) . str_replace( "?", "&", substr( $url, $query_string_start + 1 ) );
	}

	return $url;
}
endif;

/*
 * url can be:
 *    http://www.youtube.com/embed/videoseries?list=PL94269DA08231042B&amp;hl=en_US
 *    http://www.youtube.com/watch#!v=H2Ncxw1xfck
 *    http://www.youtube.com/watch?v=H2Ncxw1xfck
 *    http://www.youtube.com/watch?v=H2Ncxw1xfck&w=320&h=240&fmt=1&rel=0&showsearch=1&hd=0
 *    http://www.youtube.com/v/jF-kELmmvgA
 *    http://www.youtube.com/v/9FhMMmqzbD8?fs=1&hl=en_US
 *    http://youtu.be/Rrohlqeir5E
 */

/**
 * Same as get_youtube_id(), but with the prefix that function should've had.
 */
function jetpack_shortcode_get_youtube_id( $url ) {
	return get_youtube_id( $url );
}

/**
 * @param $url Can be just the $url or the whole $atts array
 * @return bool|mixed The Youtube video ID
 */
if ( !function_exists( 'get_youtube_id' ) ) :
function get_youtube_id( $url ) {

	// Do we have an $atts array?  Get first att
	if ( is_array( $url ) )
		$url = $url[0];

	$url = youtube_sanitize_url( $url );
	$url = parse_url( $url );
	$id  = false;

	if ( ! isset( $url['query'] ) )
		return false;

	parse_str( $url['query'], $qargs );

	if ( ! isset( $qargs['v'] ) && ! isset( $qargs['list'] ) )
		return false;

	if ( isset( $qargs['list'] ) )
		$id = preg_replace( '|[^_a-z0-9-]|i', '', $qargs['list'] );

	if ( empty( $id ) )
		$id = preg_replace( '|[^_a-z0-9-]|i', '', $qargs['v'] );

	return $id;
}
endif;

/**
 * Converts a YouTube URL into an embedded YouTube video.
 */
function youtube_id( $url ) {
	if ( apply_filters( 'jetpack_bail_on_shortcode', false, 'youtube' ) )
		return '';

	if ( ! $id = get_youtube_id( $url ) )
		return '<!--YouTube Error: bad URL entered-->';

	$url = youtube_sanitize_url( $url );
	$url = parse_url( $url );

	if ( ! isset( $url['query'] ) )
		return false;

	parse_str( $url['query'], $qargs );

	// calculate the width and height, taking content_width into consideration
	global $content_width;

	$input_w = ( isset( $qargs['w'] ) && intval( $qargs['w'] ) ) ? intval( $qargs['w'] ) : 0;
	$input_h = ( isset( $qargs['h'] ) && intval( $qargs['h'] ) ) ? intval( $qargs['h'] ) : 0;

	$default_width = get_option('embed_size_w');

	if ( empty( $default_width ) ) {
		if ( ! empty( $content_width ) ) {
			$default_width = $content_width;
		} else {
			$default_width = 640;
		}
	}

	if ( $input_w > 0 && $input_h > 0 ) {
		$w = $input_w;
		$h = $input_h;
	} elseif ( 0 == $input_w && 0 == $input_h ) {
		if ( isset( $qargs['fmt'] ) && intval( $qargs['fmt'] ) ) {
			$w = ( ! empty( $content_width ) ? min( $content_width, 480 ) : 480 );
		} else {
			$w = ( ! empty( $content_width ) ? min( $content_width, $default_width ) : $default_width );
			$h = ceil( ( $w / 16 ) * 9 ) + 30;
		}
	} elseif ( $input_w > 0 ) {
		$w = $input_w;
		$h = ceil( ( $w / 16 ) * 9 ) + 30;
	} else {
		if ( isset( $qargs['fmt'] ) && intval( $qargs['fmt'] ) ) {
			$w = ( ! empty( $content_width ) ? min( $content_width, 480 ) : 480 );
		} else {
			$w = ( ! empty( $content_width ) ? min( $content_width, $default_width ) : $default_width );
			$h = $input_h;
		}
	}

	$w = (int) apply_filters( 'youtube_width', $w );
	$h = (int) apply_filters( 'youtube_height', $h );

	$rel =    ( isset( $qargs['rel'] )            && 0 == $qargs['rel']            ) ? 0 : 1;
	$search = ( isset( $qargs['showsearch'] )     && 1 == $qargs['showsearch']     ) ? 1 : 0;
	$info =   ( isset( $qargs['showinfo'] )       && 0 == $qargs['showinfo']       ) ? 0 : 1;
	$iv =     ( isset( $qargs['iv_load_policy'] ) && 3 == $qargs['iv_load_policy'] ) ? 3 : 1;

	$fmt =    ( isset( $qargs['fmt'] )            && intval( $qargs['fmt'] )       ) ? '&fmt=' . (int) $qargs['fmt']     : '';
	$start =  ( isset( $qargs['start'] )          && intval( $qargs['start'] )     ) ? '&start=' . (int) $qargs['start'] : '';
	$end =    ( isset( $qargs['end'] )            && intval( $qargs['end'] )       ) ? '&end=' . (int) $qargs['end']     : '';
	$hd =     ( isset( $qargs['hd'] )             && intval( $qargs['hd'] )        ) ? '&hd=' . (int) $qargs['hd']       : '';
	
	$vq =     ( isset( $gargs['vq'] )             && in_array( $gargs['vq'], array('hd720','hd1080') ) ) ? '&vq=' . $gargs['vq'] : '';
	
	$cc = ( isset( $qargs['cc_load_policy'] ) ) ? '&cc_load_policy=1' : '';
	$cc_lang = ( isset( $qargs['cc_lang_pref'] )   ) ? '&cc_lang_pref=' . preg_replace( '/[^_a-z0-9-]/i', '', $qargs['cc_lang_pref'] ) : '';

	$wmode =  ( isset( $qargs['wmode'] ) && in_array( strtolower( $qargs['wmode'] ), array( 'opaque', 'window', 'transparent' ) ) ) ? $qargs['wmode'] : 'transparent';

	$autoplay = '';
	if ( apply_filters( 'jetpack_youtube_allow_autoplay', false ) && isset( $qargs['autoplay'] ) )
		$autoplay = '&autoplay=' . (int)$qargs['autoplay'];

	$alignmentcss = 'text-align:center;';
	if ( isset( $qargs['align'] ) ) {
		switch ( $qargs['align'] ) {
			case 'left':
				$alignmentcss = "float:left; width:{$w}px; height:{$h}px; margin-right:10px; margin-bottom: 10px;";
				break;
			case 'right':
				$alignmentcss = "float:right; width:{$w}px; height:{$h}px; margin-left:10px; margin-bottom: 10px;";
				break;
		}
	}

	if ( is_ssl() )
		$protocol = 'https';
	else
		$protocol = 'http';

	if ( ( isset( $url['path'] ) && '/videoseries' == $url['path'] ) || isset( $qargs['list'] ) ) {
		$html = "<span class='embed-youtube' style='$alignmentcss display: block;'><iframe class='youtube-player' type='text/html' width='$w' height='$h' src='" . esc_url( "$protocol://www.youtube.com/embed/videoseries?list=$id&hl=en_US" ) . "' frameborder='0'></iframe></span>";
	} else {
		$html = "<span class='embed-youtube' style='$alignmentcss display: block;'><iframe class='youtube-player' type='text/html' width='$w' height='$h' src='" . esc_url( "$protocol://www.youtube.com/embed/$id?version=3&rel=$rel&fs=1$fmt&showsearch=$search&showinfo=$info&iv_load_policy=$iv$start$end$hd&wmode=$wmode$autoplay$vq{$cc}{$cc_lang}" ) . "' frameborder='0'></iframe></span>";
	}

	$html = apply_filters( 'video_embed_html', $html );

	return $html;
}

function youtube_shortcode( $atts ) {
	return youtube_id( ( isset ( $atts[0] ) ) ? ltrim( $atts[0] , '=' ) : shortcode_new_to_old_params( $atts ) );
}

add_shortcode( 'youtube', 'youtube_shortcode' );

/**
 * For bare URLs on their own line of the form
 * http://www.youtube.com/v/9FhMMmqzbD8?fs=1&hl=en_US
 */
function wpcom_youtube_embed_crazy_url( $matches, $attr, $url ) {
	return youtube_id( $url );
}

function wpcom_youtube_embed_crazy_url_init() {
	wp_embed_register_handler( 'wpcom_youtube_embed_crazy_url', '#https?://(?:www\.)?(?:youtube.com/(?:v/|playlist|watch[/\#?])|youtu\.be/).*#i', 'wpcom_youtube_embed_crazy_url' );
}

add_action( 'init', 'wpcom_youtube_embed_crazy_url_init' );

// higher priority because we need it before auto-link and autop get to it
if ( apply_filters( 'jetpack_comments_allow_oembed', get_option('embed_autourls') ) ) {
	add_filter( 'comment_text', 'youtube_link', 1 );
}
