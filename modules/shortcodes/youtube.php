<?php
/**
 * youtube shortcode
 * 
 * Contains shortcode + some improvements over the Embeds syntax @  
 * http://codex.wordpress.org/Embeds
 * 
 * @example [youtube=http://www.youtube.com/watch?v=wq0rXGLs0YM&amp;fs=1&amp;hl=bg_BG]
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

function youtube_embed_to_short_code( $content ) {
	if ( false === strpos( $content, 'youtube.com' ) )
		return $content;

	//older codes
	$regexp = '!<object width="\d+" height="\d+"><param name="movie" value="http://www\.youtube\.com/v/([^"]+)"></param>(?:<param name="\w+" value="[^"]*"></param>)*<embed src="http://www\.youtube\.com/v/(.+)" type="application/x-shockwave-flash"(?: \w+="[^"]*")* width="\d+" height="\d+"></embed></object>!i';
	$regexp_ent = htmlspecialchars( $regexp, ENT_NOQUOTES );
	$old_regexp = '!<embed(?:\s+\w+="[^"]*")*\s+src="http(?:\:|&#0*58;)//www\.youtube\.com/v/([^"]+)"(?:\s+\w+="[^"]*")*\s*(?:/>|>\s*</embed>)!';
	$old_regexp_ent = str_replace( '&amp;#0*58;', '&amp;#0*58;|&#0*58;', htmlspecialchars( $old_regexp, ENT_NOQUOTES ) );

	//new code
	$ifr_regexp = '!<iframe((?:\s+\w+="[^"]*")*?)\s+src="http://(?:www\.)*youtube.com/embed/([^"]+)".*?</iframe>!i';
	$ifr_regexp_ent = str_replace( '&amp;#0*58;', '&amp;#0*58;|&#0*58;', htmlspecialchars( $ifr_regexp, ENT_NOQUOTES ) );

	foreach ( array( 'regexp', 'regexp_ent', 'old_regexp', 'old_regexp_ent', 'ifr_regexp', 'ifr_regexp_ent' ) as $reg ) {
		if ( !preg_match_all( $$reg, $content, $matches, PREG_SET_ORDER ) )
			continue;

		foreach ( $matches as $match ) {
			// Hack, but '?' should only ever appear once, and
			// it should be for the 1st field-value pair in query string,
			// if it is present
			// YouTube changed their embed code.
			// Example of how it is now:
//<object width="640" height="385"><param name="movie" value="http://www.youtube.com/v/aP9AaD4tgBY?fs=1&amp;hl=en_US"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/aP9AaD4tgBY?fs=1&amp;hl=en_US" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="640" height="385"></embed></object>
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
					
				$content = str_replace( $match[0], "[youtube http://www.youtube.com/watch?v=" . esc_attr( $match[2] ) . $wh . "]", $content );
			} else {
				$match[1] = str_replace( '?', '&', $match[1] );
	
				$content = str_replace( $match[0], "[youtube http://www.youtube.com/watch?v=" . html_entity_decode( $match[1] ) . "]", $content );
			}
		}
	}

	return $content;
}
add_filter('pre_kses', 'youtube_embed_to_short_code');

function youtube_markup( $content ) {
	return preg_replace( '|\[youtube[= ](.+?)]|ie', 'youtube_id("$1")', $content );
}

function youtube_link( $content ) {
	return preg_replace( '!(?:\n|\A)(http://www\.youtube\.com/(v|watch)[^\s]+?)(?:\n|\Z)!ie', '"\n" . youtube_id("$1") . "\n"', $content );
}

/*
 * url can be:
 *    http://www.youtube.com/watch#!v=H2Ncxw1xfck
 *    http://www.youtube.com/watch?v=H2Ncxw1xfck
 *    http://www.youtube.com/watch?v=H2Ncxw1xfck&w=320&h=240&fmt=1&rel=0&showsearch=1&hd=0
 *    http://www.youtube.com/v/jF-kELmmvgA
 *    http://www.youtube.com/v/9FhMMmqzbD8?fs=1&hl=en_US
 */
 
function get_youtube_id( $url ) {
	$url = trim( $url, ' "' );
	$url = trim( $url );
	$url = str_replace( array( '/v/', '#!v=', '&amp;' ), array( '/?v=', '?v=', '&' ), $url );
	$url = parse_url( $url );

	if ( !isset( $url['query'] ) )
		return false;

	$url['query'] = str_replace( '?', '&', $url['query'] );
	parse_str( $url['query'], $qargs );

	if ( !isset($qargs['v'] ) )
		return false;

	$id = preg_replace( '|[^_a-z0-9-]|i', '', $qargs['v'] );

	return $id;
}
 
function youtube_id( $url ) {
	if ( !$id = get_youtube_id( $url ) )
		return '<!--YouTube Error: bad URL entered-->';

	$url = str_replace( '&#038;', '&', $url );
	$url = trim( $url, ' "' );
	$url = trim( $url );
	$url = str_replace( array( '/v/', '#!v=', '&amp;' ), array( '/?v=', '?v=', '&' ), $url );
	$url = parse_url( $url );

	if ( !isset( $url['query'] ) )
		return false;

	$url['query'] = str_replace( '?', '&', $url['query'] );
	parse_str( $url['query'], $qargs );

	$agent = $_SERVER['HTTP_USER_AGENT'];
	// Bloglines & Google Reader handle YouTube well now, instead of
	// big blank space of yester year, so they can skip this treatment
	if ( is_feed() && !preg_match( '#Bloglines|FeedFetcher-Google#i', $agent ) )
		return '<span style="text-align:center; display: block;"><a href="' . get_permalink() . '"><img src="http://img.youtube.com/vi/' . $id . '/2.jpg" alt="" /></a></span>';

	// calculate the width and height, taken content_width into consideration
	global $content_width;

	$input_w = ( isset($qargs['w'] ) && intval( $qargs['w'] ) ) ? intval( $qargs['w'] ) : 0;
	$input_h = ( isset($qargs['h'] ) && intval( $qargs['h'] ) ) ? intval( $qargs['h'] ) : 0;

	$default_width = 640;

	if ( $input_w > 0 && $input_h > 0 ) {
		$w = $input_w;
		$h = $input_h;
	} elseif ( 0 == $input_w && 0 == $input_h ) {
		if ( isset( $qargs['fmt'] ) && intval( $qargs['fmt'] ) )
			$w = ( !empty( $content_width ) ? min( $content_width, 480 ) : 480 );
		else
			$w = ( !empty( $content_width ) ? min( $content_width, $default_width ) : $default_width );

		$h = ceil( ( $w / 16 ) * 9 ) + 30;
	} elseif ( $input_w > 0 ) {
		$w = $input_w;
		$h = ceil( ( $w / 16 ) * 9 ) + 30;
	} else {
		if ( isset( $qargs['fmt'] ) && intval( $qargs['fmt'] ) )
			$w = ( !empty( $content_width ) ? min( $content_width, 480) : 480 );
		else
			$w = ( !empty( $content_width ) ? min( $content_width, $default_width ) : $default_width );

		$h = $input_h;
	}

	$w = (int) apply_filters( 'youtube_width', $w );
	$h = (int) apply_filters( 'youtube_height', $h );

	$fmt = '';
	if ( isset( $qargs['fmt'] ) && intval( $qargs['fmt'] ) )
		$fmt = '&fmt=' . (int) $qargs['fmt'];

	if ( isset( $qargs['rel'] ) && 0 == $qargs['rel'] )
		$rel = 0;
	else
		$rel = 1;

	if ( isset( $qargs['showsearch'] ) && 1 == $qargs['showsearch'] )
		$search = 1;
	else
		$search = 0;

	if ( isset( $qargs['showinfo'] ) && 0 == $qargs['showinfo'] )
		$info = 0;
	else
		$info = 1;

	if ( isset( $qargs['iv_load_policy'] ) && 3 == $qargs['iv_load_policy'] )
		$iv = 3;
	else
		$iv = 1;

	$start = '';
	if ( isset( $qargs['start'] ) && intval( $qargs['start'] ) )
		$start = '&start=' . (int) $qargs['start'];

	$hd = '';
	if ( isset( $qargs['hd'] ) && intval( $qargs['hd'] ) )
		$hd = '&hd=' . (int) $qargs['hd'];

	return "<span style='text-align:center; display: block;'><object width='$w' height='$h'><param name='movie' value='http://www.youtube.com/v/$id?version=3&rel=$rel&fs=1$fmt&showsearch=$search&showinfo=$info&iv_load_policy=$iv$start$hd' /> <param name='allowfullscreen' value='true' /> <param name='wmode' value='opaque' /> <embed src='http://www.youtube.com/v/$id?version=3&rel=$rel&fs=1$fmt&showsearch=$search&showinfo=$info&iv_load_policy=$iv$start$hd' type='application/x-shockwave-flash' allowfullscreen='true' width='$w' height='$h' wmode='opaque'></embed> </object></span>";
}

function youtube_shortcode( $atts ) {
	if ( isset ( $atts[0] ) ) 
		$src = ltrim( $atts[0] , '=' );
	else
		$src = shortcode_new_to_old_params( $atts );

	return youtube_id( $src );
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
	wp_embed_register_handler( 'wpcom_youtube_embed_crazy_url', '#http://(www\.)?youtube.com/v/.*#i', 'wpcom_youtube_embed_crazy_url' );
}
add_action( 'init', 'wpcom_youtube_embed_crazy_url_init' );

add_filter( 'the_content', 'youtube_link', 1 );
add_filter( 'the_content_rss', 'youtube_link', 1 );
add_filter( 'comment_text', 'youtube_link', 1 );
