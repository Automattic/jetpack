<?php

/*
 Flickr Short Code
 Author: kellan
 License: BSD/GPL/public domain (take your pick)

[flickr video=http://flickr.com/photos/revdancatt/2345938910/]
[flickr video=2345938910]
[flickr video=2345938910 show_info=true w=400 h=300]
[flickr video=2345938910 show_info=true w=400 h=300 secret=846d9c1be9]

*/

/*
 * <object type="application/x-shockwave-flash" width="400" height="300" data="http://www.flickr.com/apps/video/stewart.swf?v=71377" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"> <param name="flashvars" value="intl_lang=en-us&photo_secret=846d9c1be9&photo_id=2345938910"></param> <param name="movie" value="http://www.flickr.com/apps/video/stewart.swf?v=71377"></param> <param name="bgcolor" value="#000000"></param> <param name="allowFullScreen" value="true"></param><embed type="application/x-shockwave-flash" src="http://www.flickr.com/apps/video/stewart.swf?v=71377" bgcolor="#000000" allowfullscreen="true" flashvars="intl_lang=en-us&photo_secret=846d9c1be9&photo_id=2345938910" height="300" width="400"></embed></object>
 */

function flickr_embed_to_shortcode( $content ) {
	if ( false === stripos( $content, '/www.flickr.com/apps/video/stewart.swf' ) )
		return $content;

	$regexp = '%(<object.*?(?:<(?!/?(?:object|embed)\s+).*?)*?)?<embed((?:\s+\w+="[^"]*")*)\s+src="http(?:\:|&#0*58;)//www.flickr.com/apps/video/stewart.swf[^"]*"((?:\s+\w+="[^"]*")*)\s*(?:/>|>\s*</embed>)(?(1)\s*</object>)%';
	$regexp_ent = str_replace(
		array(
			'&amp;#0*58;',
			'[^&gt;]*',
			'[^&lt;]*',
		),
		array(
			'&amp;#0*58;|&#0*58;',
			'[^&]*(?:&(?!gt;)[^&]*)*',
			'[^&]*(?:&(?!lt;)[^&]*)*',
		),
		htmlspecialchars( $regexp, ENT_NOQUOTES )
	);

	foreach ( array( 'regexp', 'regexp_ent' ) as $reg ) {
		if ( !preg_match_all( $$reg, $content, $matches, PREG_SET_ORDER ) )
			continue;
		foreach ( $matches as $match ) {
			$params = $match[2] . $match[3];

			if ( 'regexp_ent' == $reg )
				$params = html_entity_decode( $params );

			$params = wp_kses_hair( $params, array( 'http' ) );
			if ( ! isset( $params['type'] ) || 'application/x-shockwave-flash' != $params['type']['value'] || ! isset( $params['flashvars'] ) )
				continue;

			wp_parse_str( html_entity_decode( $params['flashvars']['value'] ), $flashvars );

			if ( ! isset( $flashvars['photo_id'] ) )
				continue;

			$code_atts = array( 'video' => $flashvars['photo_id'], );

			if ( isset( $flashvars['flickr_show_info_box'] ) && 'true' == $flashvars['flickr_show_info_box'] )
				$code_atts['show_info'] = 'true';

			if ( ! empty( $flashvars['photo_secret'] ) )
				$code_atts['secret'] = $flashvars['photo_secret'] ;

			if ( ! empty( $params['width']['value'] ) )
				$code_atts['w'] = (int) $params['width']['value'];

			if ( ! empty( $params['height']['value'] ) )
				$code_atts['h'] = (int) $params['height']['value'];

			$code = '[flickr';
			foreach ( $code_atts as $k => $v )
				$code .= " $k=$v";
			$code .= ']';

			$content = str_replace( $match[0], $code, $content );
			do_action( 'jetpack_embed_to_shortcode', 'flickr_video', $flashvars['photo_id'] );
		}
	}

	return $content;
}
add_filter( 'pre_kses', 'flickr_embed_to_shortcode' );

function flickr_shortcode_handler( $atts ) {
	$atts = shortcode_atts( array(
		'video'     => 0,
		'photo'     => 0,
		'show_info' => 0,
		'w'         => 400,
		'h'         => 300,
		'secret'    => 0,
		'size'      => 0,
	), $atts );

	if ( ! empty( $atts['video'] ) ) {
		$showing = 'video';
		$src = $atts['video'];
	} elseif ( ! empty( $atts['photo'] ) ) {
		$showing = 'photo';
		$src = $atts['photo'];
	} else {
		return '';
	}

	if ( $showing == 'video' ) {

		if ( preg_match( "!photos/(([0-9a-zA-Z-_]+)|([0-9]+@N[0-9]+))/([0-9]+)/?$!", $src, $m ) )
			$atts['photo_id'] = $m[4];
		else
			$atts['photo_id'] = $atts['video'];

		if ( ! isset( $atts['show_info'] ) || in_array( $atts['show_info'], array('yes', 'true') ) )
			$atts['show_info'] = 'true';
		elseif ( in_array( $atts['show_info'], array( 'false', 'no' ) ) )
			$atts['show_info'] = 'false';

    	if ( isset( $atts['secret'] ) )
			$atts['secret'] = preg_replace( '![^\w]+!i', '', $atts['secret'] );

		return flickr_shortcode_video_markup( $atts );
	} elseif ( 'photo' == $showing ) {
		$src = sprintf( '%s/player/', untrailingslashit( $src ) );
	
		return sprintf( '<iframe src="%s" height="%s" width="%s"  frameborder="0" allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>', esc_url( $src ), esc_attr( $atts['h'] ), esc_attr( $atts['w'] ) );
	}

}

function flickr_shortcode_video_markup( $atts ) {
	$atts = array_map( 'esc_attr', $atts );

	$photo_vars = "photo_id=$atts[photo_id]";
	if ( isset( $atts['secret'] ) )
		$photo_vars .= "&amp;photo_secret=$atts[secret]";

	return <<<EOD
<object type="application/x-shockwave-flash" width="$atts[w]" height="$atts[h]" data="http://www.flickr.com/apps/video/stewart.swf?v=1.161" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"> <param name="flashvars" value="$photo_vars&amp;flickr_show_info_box=$atts[show_info]"></param><param name="movie" value="http://www.flickr.com/apps/video/stewart.swf?v=1.161"></param><param name="bgcolor" value="#000000"></param><param name="allowFullScreen" value="true"></param><param name="wmode" value="opaque"></param><embed type="application/x-shockwave-flash" src="http://www.flickr.com/apps/video/stewart.swf?v=1.161" bgcolor="#000000" allowfullscreen="true" flashvars="$photo_vars&amp;flickr_show_info_box=$atts[show_info]" wmode="opaque" height="$atts[h]" width="$atts[w]"></embed></object>
EOD;
}

add_shortcode( 'flickr', 'flickr_shortcode_handler' );

// Override core's Flickr support because Flickr oEmbed doesn't support web embeds
wp_embed_register_handler( 'flickr', '#https?://(www\.)?flickr\.com/.*#i', 'jetpack_flickr_oembed_handler' );

function jetpack_flickr_oembed_handler( $matches, $attr, $url ) {
	// Legacy slideshow embeds end with /show/
	// e.g. http://www.flickr.com/photos/yarnaholic/sets/72157615194738969/show/
	if ( '/show/' !== substr( $src, -strlen( '/show/' ) ) ) {			
		return _wp_oembed_get_object()->get_html( $url, $attr );
	}

	return flickr_shortcode_handler( array( 'photo' => $url ) );
}	
