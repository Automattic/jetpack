<?php

/*
 * Google maps iframe - transforms code that looks like that:
 * <iframe width="425" height="350" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="http://maps.google.com/maps?f=q&amp;source=s_q&amp;hl=bg&amp;geocode=&amp;q=%D0%9C%D0%BB%D0%B0%D0%B4%D0%BE%D1%81%D1%82+1,+%D0%A1%D0%BE%D1%84%D0%B8%D1%8F,+%D0%91%D1%8A%D0%BB%D0%B3%D0%B0%D1%80%D0%B8%D1%8F&amp;sll=37.0625,-95.677068&amp;sspn=40.545434,79.013672&amp;ie=UTF8&amp;hq=&amp;hnear=%D0%9C%D0%BB%D0%B0%D0%B4%D0%BE%D1%81%D1%82+1&amp;ll=42.654446,23.372061&amp;spn=0.036864,0.077162&amp;t=h&amp;z=14&amp;output=embed"></iframe><br /><small><a href="http://maps.google.com/maps?f=q&amp;source=embed&amp;hl=bg&amp;geocode=&amp;q=%D0%9C%D0%BB%D0%B0%D0%B4%D0%BE%D1%81%D1%82+1,+%D0%A1%D0%BE%D1%84%D0%B8%D1%8F,+%D0%91%D1%8A%D0%BB%D0%B3%D0%B0%D1%80%D0%B8%D1%8F&amp;sll=37.0625,-95.677068&amp;sspn=40.545434,79.013672&amp;ie=UTF8&amp;hq=&amp;hnear=%D0%9C%D0%BB%D0%B0%D0%B4%D0%BE%D1%81%D1%82+1&amp;ll=42.654446,23.372061&amp;spn=0.036864,0.077162&amp;t=h&amp;z=14" style="color:#0000FF;text-align:left">Вижте по-голяма карта</a></small>
 * into the [googlemaps http://...] shortcode format 
 */
function jetpack_googlemaps_embed_to_short_code( $content ) {
	if ( false === strpos( $content, 'maps.google.' ) && false === strpos( $content, 'google.com/maps' ) )
		return $content;

	// IE and TinyMCE format things differently
	if ( strpos( $content, 'src="<a href="' ) !== false ) {
		$content = preg_replace_callback( '!&lt;iframe width="(\d+)" height="(\d+)" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="<a href="http://.*\.google\.(.*)/(.*)\?(.+)&quot;&gt;&lt;/iframe&gt;&lt;br">http://.*\.google\..*/(.*)\?(.+)"&gt;&lt;/iframe&gt;&lt;br</a> /&gt;&lt;small&gt;(.*)&lt;/small&gt;!i', 'jetpack_googlemaps_embed_to_short_code_callback', $content );
		return $content;
	}

	$content = preg_replace_callback( '!\<iframe width="(\d+)" height="(\d+)" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="http://.*\.google\.(.*)/(.*)\?(.+)"\>\</iframe\>\<br /\>\<small\>(.*)\</small\>!i', 'jetpack_googlemaps_embed_to_short_code_callback', $content );

	$content = preg_replace_callback( '!&lt;iframe width="(\d+)" height="(\d+)" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="http://.*\.google\.(.*)/(.*)\?(.+)"&gt;&lt;/iframe&gt;&lt;br /&gt;&lt;small&gt;(.*)&lt;/small&gt;!i', 'jetpack_googlemaps_embed_to_short_code_callback', $content );

	return $content;
}

function jetpack_googlemaps_embed_to_short_code_callback( $match ) {
	$url = "http://maps.google.{$match[3]}/{$match[4]}?{$match[5]}&amp;w={$match[1]}&amp;h={$match[2]}";

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

	if ( preg_match( '!^http://maps\.google(\.co|\.com)?(\.[a-z]+)?/.*?(\?.+)!i', $params, $match ) ) {
		$params = str_replace( '&amp;amp;', '&amp;', $params );
		$params = str_replace( '&amp;', '&', $params );
		parse_str( $params, $arg );

		if ( isset( $arg['hq'] ) )
			unset( $arg['hq'] );

		$url = '';
		foreach ( (array) $arg as $key => $value ) {
			if ( 'w' == $key ) {
				$width = (int) $value;
			} elseif ( 'h' == $key ) {
				$height = (int) $value;
			} else {
				$key = str_replace( '_', '.', $key );
				$url .= esc_attr( "$key=$value&amp;" );
			}
		}
		$url = substr( $url, 0, -5 );
		$link_url = preg_replace( '!output=embed!', 'source=embed', $url );

		return '<iframe width="' . $width . '" height="' . $height . '" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="' . $url . '"></iframe><br /><small><a href="' . $link_url . '" style="text-align:left">View Larger Map</a></small>';
	}
}
add_shortcode( 'googlemaps', 'jetpack_googlemaps_shortcode' );
