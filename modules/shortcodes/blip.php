<?php

/**
 * Blip.tv embed code:
 * <embed src="http://blip.tv/play/g8sVgpfaCgI%2Em4v" type="application/x-shockwave-flash" width="480" height="255" allowscriptaccess="always" allowfullscreen="true"></embed>
 * Blip.tv shortcode is: [blip.tv url-or-something-else]
 * */

function blip_embed_to_shortcode( $content ) {
	if ( ! is_string( $content ) || false === stripos( $content, '/blip.tv/play/' ) ) {
		return $content;
	}

	$regexp = '!<embed((?:\s+\w+="[^"]*")*)\s+src="http(?:\:|&#0*58;)//(blip\.tv/play/[^"]*)"((?:\s+\w+="[^"]*")*)\s*(?:/>|>\s*</embed>)!';
	$regexp_ent = str_replace( '&amp;#0*58;', '&amp;#0*58;|&#0*58;', htmlspecialchars( $regexp, ENT_NOQUOTES ) );

	foreach ( array( 'regexp', 'regexp_ent' ) as $reg ) {
		if ( ! preg_match_all( $$reg, $content, $matches, PREG_SET_ORDER ) ) {
			continue;
		}

		foreach ( $matches as $match ) {
			$src = 'http://' . html_entity_decode( $match[2] );
			$params = $match[1] . $match[3];
			if ( 'regexp_ent' == $reg ) {
				$src = html_entity_decode( $src );
				$params = html_entity_decode( $params );
			}
			$params = wp_kses_hair( $params, array( 'http' ) );
			if ( ! isset( $params['type'] ) || 'application/x-shockwave-flash' != $params['type']['value'] )
				continue;

			$content = str_replace( $match[0], "[blip.tv $src]", $content );
		}
	}
	return $content;
}
add_filter( 'pre_kses', 'blip_embed_to_shortcode' );

// [blip.tv ?posts_id=4060324&dest=-1]
// [blip.tv http://blip.tv/play/hpZTgffqCAI%2Em4v] // WLS

function blip_shortcode( $atts ) {
	if ( ! isset( $atts[0] ) )
		return '';
	$src = $atts[0];

	if ( preg_match( '/^\?posts_id=(\d+)&[^d]*dest=(-?\d+)$/', $src, $matches ) )
		return "<script type='text/javascript' src='http://blip.tv/syndication/write_player?skin=js&posts_id={$matches[1]}&cross_post_destination={$matches[2]}&view=full_js'></script>";
	elseif ( preg_match( '|^http://blip.tv/play/[.\w]+$|', urldecode( $src ) ) ) // WLS
		return "<embed src='$src' type='application/x-shockwave-flash' width='480' height='300' allowscriptaccess='never' allowfullscreen='true'></embed>";


	return "<!--blip.tv pattern not matched -->";
}

add_shortcode( 'blip.tv', 'blip_shortcode' );
