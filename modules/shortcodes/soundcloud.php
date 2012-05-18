<?php

/*
Plugin Name: SoundCloud Shortcode
Plugin URI: http://www.soundcloud.com
Description: SoundCloud Shortcode. Usage in your posts: [soundcloud]http://soundcloud.com/TRACK_PERMALINK[/soundcloud] . Works also with set or group instead of track. You can provide optional parameters height/width/params like that [soundcloud height="82" params="auto_play=true"]http....
Version: 1.1.5
Author: Johannes Wagener <johannes@soundcloud.com> added to wpcom by tott
Author URI: http://johannes.wagener.cc

[soundcloud url="http://api.soundcloud.com/tracks/9408008"]
<object height="81" width="100%"> <param name="movie" value="http://player.soundcloud.com/player.swf?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F8781356"></param> <param name="allowscriptaccess" value="always"></param> <embed allowscriptaccess="always" height="81" src="http://player.soundcloud.com/player.swf?url=http%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F8781356" type="application/x-shockwave-flash" width="100%"></embed> </object>  <span><a href="http://soundcloud.com/robokopbeats/robokop-we-move-at-midnight-preview-forthcoming-on-mwm-recordings">Robokop - We move at midnight preview ( FORTHCOMING ON MWM recordings)</a> by <a href="http://soundcloud.com/robokopbeats">Robokop</a></span> 
*/

add_filter( "pre_kses", "soundcloud_reverse_shortcode" );

function soundcloud_reverse_shortcode_preg_replace_callback( $a ) {
	$pattern = '/([a-zA-Z0-9\-_%=&]*)&?url=([^&]+)&?([a-zA-Z0-9\-_%&=]*)/';
	preg_match( $pattern, str_replace( "&amp;", "&", $a[3] ), $params );

	return '[soundcloud width="' . esc_attr( $a[2] ) . '" height="' . esc_attr( $a[1] ) . '" params="' . esc_attr( $params[1] . $params[3] ) . '" url="' . urldecode( $params[2] ) . '"]';
}

function soundcloud_reverse_shortcode( $content ){
	if ( false === stripos( $content, 'http://player.soundcloud.com/player.swf' ) )
		return $content;

	$pattern = '!<object\s*height="(\d+%?)"\s*width="(\d+%?)".*?src="http://.*?soundcloud\.com/player.swf\?([^"]+)".*?</object>.*?</span>!';
	$pattern_ent = str_replace( '&amp;#0*58;', '&amp;#0*58;|&#0*58;', htmlspecialchars( $pattern, ENT_NOQUOTES ) ); 

	if ( preg_match( $pattern_ent, $content ) )
		return( preg_replace_callback( $pattern_ent, 'soundcloud_reverse_shortcode_preg_replace_callback', $content ) );
	else
		return( preg_replace_callback( $pattern, 'soundcloud_reverse_shortcode_preg_replace_callback', $content ) );
}

add_shortcode( "soundcloud", "soundcloud_shortcode" );

function soundcloud_shortcode( $atts, $url = '' ) {
	if ( empty( $url ) )
		extract( shortcode_atts( array( 'url' => '', 'params' => '', 'height' => '', 'width' => '100%' ), $atts ) );
	else
		extract( shortcode_atts( array( 'params' => '', 'height' => '', 'width' => '100%' ), $atts ) );

	$encoded_url = urlencode( $url );
	if ( $url = parse_url( $url ) ) {
		$splitted_url = split( "/", $url['path'] );
		$media_type = $splitted_url[ count( $splitted_url ) - 2 ];

		if ( '' == $height ){
			if ( in_array( $media_type, array( 'groups', 'sets' ) ) )
				$height = 225;
			else
				$height = 81;
		}
		$player_params = "url=$encoded_url&g=1&$params";

		return '<object height="' . esc_attr( $height ) . '" width="' . esc_attr( $width ) . '"><param name="movie" value="' . esc_url( "http://player.soundcloud.com/player.swf?$player_params" ) . '"></param><embed height="' . esc_attr( $height ) . '" src="' . esc_url( "http://player.soundcloud.com/player.swf?$player_params" ) . '" type="application/x-shockwave-flash" width="' . esc_attr( $width ) . '"> </embed> </object>';
	}
}
