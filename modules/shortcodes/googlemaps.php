<?php

/*
 * Google maps iframe - transforms code that looks like that:
 * <iframe width="600" height="450" frameborder="0" style="border:0" src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3153.2528685347816!2d-122.39720224999999!3d37.7841133!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085807c23cc4ebb%3A0x108059532273706!2sAutomattic!5e0!3m2!1sen!2sca!4v1392915004512"></iframe>
 * into the [googlemaps http://...] shortcode format
 */
function jetpack_googlemaps_embed_to_short_code( $content ) {
	if ( false === strpos( $content, 'www.google.' ) && false === preg_match( '@google\.[^/]+/maps@', $content ) )
		return $content;

	// IE and TinyMCE format things differently
	// &lt;iframe width="600" height="450" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="<a href="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3153.2528685347816!2d-122.39720224999999!3d37.7841133!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085807c23cc4ebb%3A0x108059532273706!2sAutomattic!5e0!3m2!1sen!2sca!4v1392915004512;&gt;&lt;/iframe&gt;
	if ( strpos( $content, 'src="<a href="' ) !== false ) {
		$content = preg_replace_callback( '#&lt;iframe\s[^&]*?(?:&(?!gt;)[^&]*?)*?src="<a href="https?://.*?\.google\.(.*?)/(.*?)\?(.+?)&quot;[^&]*?(?:&(?!gt;)[^&]*?)*?&gt;\s*&lt;/iframe&gt;&lt;br">[^"]*?"&gt;\s*&lt;/iframe&gt;?#i', 'jetpack_googlemaps_embed_to_short_code_callback', $content );
		return $content;
	}

	$content = preg_replace_callback( '!\<iframe\s[^>]*?src="https?://.*?\.google\.(.*?)/(.*?)\?(.+?)"[^>]*?\>\s*\</iframe\>?!i', 'jetpack_googlemaps_embed_to_short_code_callback', $content );

	$content = preg_replace_callback( '#&lt;iframe\s[^&]*?(?:&(?!gt;)[^&]*?)*?src="https?://.*?\.google\.(.*?)/(.*?)\?(.+?)"[^&]*?(?:&(?!gt;)[^&]*?)*?&gt;\s*&lt;/iframe&gt;?#i', 'jetpack_googlemaps_embed_to_short_code_callback', $content );

	return $content;
}

function jetpack_googlemaps_embed_to_short_code_callback( $match ) {
	if ( preg_match( '/\bwidth=[\'"](\d+)/', $match[0], $width ) ) {
		$width = (int) $width[1];
	} else {
		$width = 425;
	}

	if ( preg_match( '/\bheight=[\'"](\d+)/', $match[0], $height ) ) {
		$height = (int) $height[1];
	} else {
		$height = 350;
	}

	$url = "https://www.google.{$match[1]}/{$match[2]}?{$match[3]}&amp;w={$width}&amp;h={$height}";

	do_action( 'jetpack_embed_to_shortcode', 'googlemaps', $url );

	return "[googlemaps $url]";
}

add_filter( 'pre_kses', 'jetpack_googlemaps_embed_to_short_code' );

function jetpack_googlemaps_shortcode( $atts ) {
	if ( !isset($atts[0]) || apply_filters( 'jetpack_bail_on_shortcode', false, 'googlemaps' ) )
		return '';

	$params = ltrim( $atts[0], '=' );

	$width = 425;
	$height = 350;

	if ( preg_match( '!^https?://www\.google(\.co|\.com)?(\.[a-z]+)?/.*?(\?.+)!i', $params, $match ) ) {
		$params = str_replace( '&amp;amp;', '&amp;', $params );
		$params = str_replace( '&amp;', '&', $params );
		parse_str( $params, $arg );

		if ( isset( $arg['hq'] ) )
			unset( $arg['hq'] );

		$url = '';
		foreach ( (array) $arg as $key => $value ) {
			if ( 'w' == $key ) {
				$percent = ( '%' == substr( $value, -1 ) ) ? '%' : '';
				$width = (int) $value . $percent;
			} elseif ( 'h' == $key ) {
				$height = (int) $value;
			} else {
				$key = str_replace( '_', '.', $key );
				$url .= esc_attr( "$key=$value&amp;" );
			}
		}
		$url = substr( $url, 0, -5 );

		if( is_ssl() )
			$url = str_replace( 'http://', 'https://', $url );

		$link_url = preg_replace( '!output=embed!', 'source=embed', $url );

		return '<div class="googlemaps"><iframe width="' . $width . '" height="' . $height . '" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="' . $url . '"></iframe></div>';
	}
}
add_shortcode( 'googlemaps', 'jetpack_googlemaps_shortcode' );
