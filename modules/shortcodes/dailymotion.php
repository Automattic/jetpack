<?php

/**
 * Dailymotion code
 * */

/**
 * Original codes:
 *
 * <embed height="270" type="application/x-shockwave-flash" width="480" src="http&#58;//www.dailymotion.com/swf/video/xekmrq?additionalInfos=0" wmode="opaque" pluginspage="http&#58;//www.macromedia.com/go/getflashplayer" allowscriptaccess="never" allownetworking="internal" />
 *
 * <object width="480" height="240"><param name="movie" value="http://www.dailymotion.com/swf/video/xen4ms_ghinzu-cold-love-mirror-mirror_music?additionalInfos=0"></param><param name="allowFullScreen" value="true"></param><param name="allowScriptAccess" value="always"></param>
 * 	<embed type="application/x-shockwave-flash" src="http://www.dailymotion.com/swf/video/xen4ms_ghinzu-cold-love-mirror-mirror_music?additionalInfos=0" width="480" height="240" allowfullscreen="true" allowscriptaccess="always"></embed>
 * </object><br /><b><a href="http://www.dailymotion.com/video/xen4ms_ghinzu-cold-love-mirror-mirror_music">Ghinzu - Cold Love (Mirror Mirror)</a></b><br /><i>Uploaded by <a href="http://www.dailymotion.com/GhinzuTV">GhinzuTV</a>. - <a href="http://www.dailymotion.com/us/channel/music">Watch more music videos, in HD!</a></i>
 *
 * Code as of 01.01.11:
 * <object width="560" height="421"><param name="movie" value="http://www.dailymotion.com/swf/video/xaose5?width=560&theme=denim&foreground=%2392ADE0&highlight=%23A2ACBF&background=%23202226&start=&animatedTitle=&iframe=0&additionalInfos=0&autoPlay=0&hideInfos=0"></param><param name="allowFullScreen" value="true"></param><param name="allowScriptAccess" value="always"></param><embed type="application/x-shockwave-flash" src="http://www.dailymotion.com/swf/video/xaose5?width=560&theme=denim&foreground=%2392ADE0&highlight=%23A2ACBF&background=%23202226&start=&animatedTitle=&iframe=0&additionalInfos=0&autoPlay=0&hideInfos=0" width="560" height="421" allowfullscreen="true" allowscriptaccess="always"></embed></object><br /><b><a href="http://www.dailymotion.com/video/x29zm17_funny-videos-of-cats-and-babies-compilation-2015_fun">Funny cats and babies!</a></b><br /><i>Uploaded by <a href="http://www.dailymotion.com/GilLavie">GilLavie</a>. - <a target="_self" href="http://www.dailymotion.com/channel/funny/featured/1">Find more funny videos.</a></i>
 * movie param enforces anti-xss protection
 *
 * Scroll down for the new <iframe> embed code handler.
 */

function dailymotion_embed_to_shortcode( $content ) {
	if ( false === stripos( $content, 'www.dailymotion.com/swf/' ) ) {
		return $content;
	}

	$regexp     = '!<object.*>\s*(<param.*></param>\s*)*<embed((?:\s+\w+="[^"]*")*)\s+src="http(?:\:|&#0*58;)//(www\.dailymotion\.com/swf/[^"]*)"((?:\s+\w+="[^"]*")*)\s*(?:/>|>\s*</embed>)\s*</object><br /><b><a .*>.*</a></b><br /><i>.*</i>!';
	$regexp_ent = str_replace( '&amp;#0*58;', '&amp;#0*58;|&#0*58;', htmlspecialchars( $regexp, ENT_NOQUOTES ) );

	foreach ( array( 'regexp', 'regexp_ent' ) as $reg ) {
		if ( ! preg_match_all( $$reg, $content, $matches, PREG_SET_ORDER ) ) {
			continue;
		}

		foreach ( $matches as $match ) {
			$src    = html_entity_decode( $match[3] );
			$params = $match[2] . $match[4];

			if ( 'regexp_ent' == $reg ) {
				$src    = html_entity_decode( $src );
				$params = html_entity_decode( $params );
			}

			$params = wp_kses_hair( $params, array( 'http' ) );

			if ( ! isset( $params['type'] ) || 'application/x-shockwave-flash' != $params['type']['value'] ) {
				continue;
			}

			$id = basename( substr( $src, strlen( 'www.dailymotion.com/swf' ) ) );
			$id = preg_replace( '/[^a-z0-9].*$/i', '', $id );

			$content = str_replace( $match[0], "[dailymotion id=$id]", $content );
			/** This action is documented in modules/shortcodes/youtube.php */
			do_action( 'jetpack_embed_to_shortcode', 'dailymotion', $id );
		}
	}
	return $content;
}
add_filter( 'pre_kses', 'dailymotion_embed_to_shortcode' );

/**
 * DailyMotion shortcode
 *
 * The documented shortcode is:
 * [dailymotion id=x8oma9]
 *
 * Possibilities, according to the old parsing regexp:
 * [dailymotion x8oma9]
 * [dailymotion=x8oma9]
 *
 * Hypothetical option, according to the old shortcode function is
 * [dailymotion id=1&title=2&user=3&video=4]
 *
 * The new style is now:
 * [dailymotion id=x8oma9 title=2 user=3 video=4]
 * @todo: Update code to sniff for iframe embeds and convert those to shortcodes.
 *
 * @param array $atts
 * @return string html
 *
 */

function dailymotion_shortcode( $atts ) {
	global $content_width;

	if ( isset( $atts[0] ) ) {
		$id = ltrim( $atts[0], '=' );
		$atts['id'] = $id;

	} else {
		$params = shortcode_new_to_old_params( $atts );
		parse_str( $params, $atts_new );

		foreach( $atts_new as $k => $v ) {
			$atts[ $k ] = $v;
		}
	}

	if ( isset( $atts['id'] ) ) {
		$id = $atts['id'];
	} else {
		return '<!--Dailymotion error: bad or missing ID-->';
	}

	if ( ! empty( $content_width ) ) {
		$width = min( 425, intval( $content_width ) );
	} else {
		$width = 425;
	}

	$height = ( 425 == $width ) ? 334 : ( $width / 425 ) * 334;
	$id     = urlencode( $id );

	if ( preg_match( '/^[A-Za-z0-9]+$/', $id ) ) {
		$output = '<iframe width="' . $width . '" height="' . $height . '" src="' . esc_url( '//www.dailymotion.com/embed/video/' . $id ) . '" frameborder="0"></iframe>';
		$after  = '';

		if ( array_key_exists( 'video', $atts ) && $video = preg_replace( '/[^-a-z0-9_]/i', '', $atts['video'] ) && array_key_exists( 'title', $atts ) && $title = wp_kses( $atts['title'], array() ) ) {
			$after .= '<br /><strong><a href="' . esc_url( 'http://www.dailymotion.com/video/' . $video ) . '" target="_blank">' . esc_html( $title ) . '</a></strong>';
		}

		if ( array_key_exists( 'user', $atts ) && $user = preg_replace( '/[^-a-z0-9_]/i', '', $atts['user'] ) ) {
			$after .= '<br /><em>Uploaded by <a href="' . esc_url( 'http://www.dailymotion.com/' . $user ) . '" target="_blank">' . esc_html( $user ) . '</a></em>';
		}
	}

	return $output . $after;
}

add_shortcode( 'dailymotion', 'dailymotion_shortcode' );

/**
 * DailyMotion Channel Shortcode
 *
 * Examples:
 * [dailymotion-channel user=MatthewDominick]
 * [dailymotion-channel user=MatthewDominick type=grid] (supports grid, carousel, badge/default)
 */
function dailymotion_channel_shortcode( $atts ) {
	$username = $atts['user'];

	switch( $atts['type'] ) {
		case 'grid':
			return '<iframe width="300px" height="264px" scrolling="no" frameborder="0" src="' . esc_url( '//www.dailymotion.com/badge/user/' . $username . '?type=grid' ) . '"></iframe>';
			break;
		case 'carousel':
			return '<iframe width="300px" height="360px" scrolling="no" frameborder="0" src="' . esc_url( '//www.dailymotion.com/badge/user/' . $username . '?type=carousel' ) . '"></iframe>';
			break;
		default:
			return '<iframe width="300px" height="78px" scrolling="no" frameborder="0" src="' . esc_url( '//www.dailymotion.com/badge/user/' . $username ) . '"></iframe>';
	}
}

add_shortcode( 'dailymotion-channel', 'dailymotion_channel_shortcode' );

/**
 * Embed Reversal for Badge/Channel
 */
function dailymotion_channel_reversal( $content ) {
	if ( false === stripos( $content, 'dailymotion.com/badge/' ) ) {
		return $content;
	}

	/* Sample embed code:
		<iframe width="300px" height="360px" scrolling="no" frameborder="0" src="http://www.dailymotion.com/badge/user/Dailymotion?type=carousel"></iframe>
	*/

	$regexes = array();

	$regexes[] = '#<iframe[^>]+?src=" (?:https?:)?//(?:www\.)?dailymotion\.com/badge/user/([^"\'/]++) "[^>]*+></iframe>#ix';

	// Let's play nice with the visual editor too.
	$regexes[] = '#&lt;iframe(?:[^&]|&(?!gt;))+?src=" (?:https?:)?//(?:www\.)?dailymotion\.com/badge/user/([^"\'/]++) "(?:[^&]|&(?!gt;))*+&gt;&lt;/iframe&gt;#ix';

	foreach ( $regexes as $regex ) {
		if ( ! preg_match_all( $regex, $content, $matches, PREG_SET_ORDER ) ) {
	 		continue;
		}

		foreach ( $matches as $match ) {
			$url_pieces = parse_url( $match[1] );

			if ( 'type=carousel' === $url_pieces['query'] ) {
				$type = 'carousel';
			} else if ( 'type=grid' === $url_pieces['query'] ) {
				$type = 'grid';
			} else {
				$type = 'badge';
			}

			$shortcode = '[dailymotion-channel user=' . esc_attr( $url_pieces['path'] ) . ' type=' . esc_attr( $type ) . ']';
			$replace_regex = sprintf( '#\s*%s\s*#', preg_quote( $match[0], '#' ) );
			$content       = preg_replace( $replace_regex, sprintf( "\n\n%s\n\n", $shortcode ), $content );
		}
	}

	return $content;
}

add_filter( 'pre_kses', 'dailymotion_channel_reversal' );

/**
 * Dailymotion Embed Reversal (with new iframe code as of 17.09.2014)
 *
 * Converts a generic HTML embed code from Dailymotion into an
 * oEmbeddable URL.
 */

function jetpack_dailymotion_embed_reversal( $content ) {
	if ( false === stripos( $content, 'dailymotion.com/embed' ) ) {
		return $content;
	}

	/* Sample embed code as of Sep 17th 2014:

		<iframe frameborder="0" width="480" height="270" src="//www.dailymotion.com/embed/video/x25x71x" allowfullscreen></iframe><br /><a href="http://www.dailymotion.com/video/x25x71x_dog-with-legs-in-casts-learns-how-to-enter-the-front-door_animals" target="_blank">Dog with legs in casts learns how to enter the...</a> <i>by <a href="http://www.dailymotion.com/videobash" target="_blank">videobash</a></i>
	*/
	$regexes = array();

	// I'm Konstantin and I love regex.
	$regexes[] = '#<iframe[^>]+?src=" (?:https?:)?//(?:www\.)?dailymotion\.com/embed/video/([^"\'/]++) "[^>]*+>\s*+</iframe>\s*+(?:<br\s*+/>)?\s*+
	(?: <a[^>]+?href=" (?:https?:)?//(?:www\.)?dailymotion\.com/[^"\']++ "[^>]*+>.+?</a>\s*+ )?
	(?: <i>.*?<a[^>]+?href=" (?:https?:)?//(?:www\.)?dailymotion\.com/[^"\']++ "[^>]*+>.+?</a>\s*+</i> )?#ix';

	$regexes[] = '#&lt;iframe(?:[^&]|&(?!gt;))+?src=" (?:https?:)?//(?:www\.)?dailymotion\.com/embed/video/([^"\'/]++) "(?:[^&]|&(?!gt;))*+&gt;\s*+&lt;/iframe&gt;\s*+(?:&lt;br\s*+/&gt;)?\s*+
	(?: &lt;a(?:[^&]|&(?!gt;))+?href=" (?:https?:)?//(?:www\.)?dailymotion\.com/[^"\']++ "(?:[^&]|&(?!gt;))*+&gt;.+?&lt;/a&gt;\s*+ )?
	(?: &lt;i&gt;.*?&lt;a(?:[^&]|&(?!gt;))+?href=" (?:https?:)?//(?:www\.)?dailymotion\.com/[^"\']++ "(?:[^&]|&(?!gt;))*+&gt;.+?&lt;/a&gt;\s*+&lt;/i&gt; )?#ix';

	foreach ( $regexes as $regex ) {
		if ( ! preg_match_all( $regex, $content, $matches, PREG_SET_ORDER ) ) {
			continue;
		}

		foreach ( $matches as $match ) {
			$url           = esc_url( sprintf( 'https://dailymotion.com/video/%s', $match[1] ) );
			$replace_regex = sprintf( '#\s*%s\s*#', preg_quote( $match[0], '#' ) );
			$content       = preg_replace( $replace_regex, sprintf( "\n\n%s\n\n", $url ), $content );

			/** This action is documented in modules/shortcodes/youtube.php */
			do_action( 'jetpack_embed_to_shortcode', 'dailymotion', $url );
		}
	}

	return $content;
}

add_filter( 'pre_kses', 'jetpack_dailymotion_embed_reversal' );
