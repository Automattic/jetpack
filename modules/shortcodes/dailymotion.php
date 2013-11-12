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
 * <object width="560" height="421"><param name="movie" value="http://www.dailymotion.com/swf/video/xaose5?width=560&theme=denim&foreground=%2392ADE0&highlight=%23A2ACBF&background=%23202226&start=&animatedTitle=&iframe=0&additionalInfos=0&autoPlay=0&hideInfos=0"></param><param name="allowFullScreen" value="true"></param><param name="allowScriptAccess" value="always"></param><embed type="application/x-shockwave-flash" src="http://www.dailymotion.com/swf/video/xaose5?width=560&theme=denim&foreground=%2392ADE0&highlight=%23A2ACBF&background=%23202226&start=&animatedTitle=&iframe=0&additionalInfos=0&autoPlay=0&hideInfos=0" width="560" height="421" allowfullscreen="true" allowscriptaccess="always"></embed></object><br /><b><a href="http://www.dailymotion.com/video/xaose5_sexy-surprise_na">Sexy Surprise</a></b><br /><i>Uploaded by <a href="http://www.dailymotion.com/GilLavie">GilLavie</a>. - <a target="_self" href="http://www.dailymotion.com/channel/sexy/featured/1">Find more steamy, sexy videos.</a></i>
 * movie param enforces anti-xss protection
 */

function dailymotion_embed_to_shortcode( $content ) {
	if ( false === stripos( $content, 'www.dailymotion.com/swf/' ) )
		return $content;

	$regexp = '!<object.*>\s*(<param.*></param>\s*)*<embed((?:\s+\w+="[^"]*")*)\s+src="http(?:\:|&#0*58;)//(www\.dailymotion\.com/swf/[^"]*)"((?:\s+\w+="[^"]*")*)\s*(?:/>|>\s*</embed>)\s*</object><br /><b><a .*>.*</a></b><br /><i>.*</i>!';
	$regexp_ent = str_replace( '&amp;#0*58;', '&amp;#0*58;|&#0*58;', htmlspecialchars( $regexp, ENT_NOQUOTES ) );

	foreach ( array( 'regexp', 'regexp_ent' ) as $reg ) {
		if ( ! preg_match_all( $$reg, $content, $matches, PREG_SET_ORDER ) )
			continue;

		foreach ( $matches as $match ) {
			$src = html_entity_decode( $match[3] );
			$params = $match[2] . $match[4];
			if ( 'regexp_ent' == $reg ) {
				$src = html_entity_decode( $src );
				$params = html_entity_decode( $params );
			}
			$params = wp_kses_hair( $params, array( 'http' ) );
			if ( !isset( $params['type'] ) || 'application/x-shockwave-flash' != $params['type']['value'] )
				continue;

			$id = basename( substr( $src, strlen( 'www.dailymotion.com/swf' ) ) );
			$id = preg_replace( '/[^a-z0-9].*$/i', '', $id );

			$content = str_replace( $match[0], "[dailymotion id=$id]", $content );
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
		parse_str( $params, $atts );
	}

	if ( isset( $atts['id'] ) )
		$id = $atts['id'];
	else
		return '<!--Dailymotion error: bad or missing ID-->';

	if ( !empty( $content_width ) )
		$width = min( 425, intval( $content_width ) );
	else
		$width = 425;

	$height = ( 425 == $width ) ? 334 : ( $width / 425 ) * 334;
	$id = urlencode( $id );

	if ( preg_match( '/^[A-Za-z0-9]+$/', $id ) ) {
		$output = '<iframe width="' . $width . '" height="' . $height . '" src="http://www.dailymotion.com/embed/video/' . $id . '" frameborder="0"></iframe>';
		$after = '';

		if ( array_key_exists( 'video', $atts ) && $video = preg_replace( '/[^-a-z0-9_]/i', '', $atts['video'] ) && array_key_exists( 'title', $atts ) && $title = wp_kses( $atts['title'], array() ) )
			$after .= '<br /><strong><a href="http://www.dailymotion.com/video/' . $video . '">' . $title . '</a></strong>';

		if ( array_key_exists( 'user', $atts ) && $user = preg_replace( '/[^-a-z0-9_]/i', '', $atts['user'] ) )
			$after .= '<br /><em>Uploaded by <a href="http://www.dailymotion.com/' . $user . '">' . $user . '</a></em>';
	}

	return $output . $after;
}

add_shortcode( 'dailymotion', 'dailymotion_shortcode' );
