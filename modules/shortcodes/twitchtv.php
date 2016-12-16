<?php
/**
 * twitch.tv shortcode
 * [twitchtv url='http://www.twitch.tv/paperbat' height='378' width='620' autoplay='false']
 * [twitchtv url='http://www.twitch.tv/paperbat/b/323486192' height='378' width='620' autoplay='false']
 **/

/**
 * Flash:
(Live URL) http://www.twitch.tv/paperbat

Video:
<object type="application/x-shockwave-flash" height="378" width="620" id="live_embed_player_flash" data="//www-cdn.jtvnw.net/swflibs/TwitchPlayer.swf?channel=paperbat" bgcolor="#000000">
<param name="allowFullScreen" value="true" />
<param name="allowScriptAccess" value="always" />
<param name="allowNetworking" value="all" />
<param name="movie" value="//www-cdn.jtvnw.net/swflibs/TwitchPlayer.swf" />
<param name="flashvars" value="hostname=www.twitch.tv&channel=paperbat&auto_play=true&start_volume=25" />
</object>

(Archive URL) http://www.twitch.tv/paperbat/v/323486192

<object bgcolor='#000000' data='//www-cdn.jtvnw.net/swflibs/TwitchPlayer.swf' height='378' id='clip_embed_player_flash' type='application/x-shockwave-flash' width='620'>
<param name='movie' value='//www-cdn.jtvnw.net/swflibs/TwitchPlayer.swf'>
<param name='allowScriptAccess' value='always'>
<param name='allowNetworking' value='all'>
<param name='allowFullScreen' value='true'>
<param name='flashvars' value='videoId=v323486192&hostname=www.twitch.tv&channel=paperbat&auto_play=false&title=PBat+Live+-+Playin%27+for+funnnnn+%287%2F1%2F2012%29&start_volume=25'>
</object>
 */
function wpcom_twitchtv_shortcode( $attr, $content = NULL ) {
	$attr = extract( shortcode_atts( array(
		'height'	 => 378,
		'width'	  => 620,
		'url'		=> '',
		'autoplay'   => false
	), $attr ) );

	if ( empty( $url ) )
		return;

	preg_match( '|^http://www.twitch.tv/([^/?]+)(/v/(\d+))?|i', $url, $match );

	$width = (int) $width;
	$height = (int) $height;
	$autoplay = var_export( filter_var( $autoplay, FILTER_VALIDATE_BOOLEAN ), true );

	$user_id = esc_attr( $match[1] );
	$video_id = 0;
	if ( !empty( $match[3] ) )
		$video_id = (int) $match[3];

	/** This action is documented in modules/widgets/social-media-icons.php */
	do_action( 'jetpack_bump_stats_extras', 'twitchtv', 'shortcode' );

	if ( $video_id > 0 ) {
		// Archive video
		return "<object bgcolor='#000000' data='//www-cdn.jtvnw.net/swflibs/TwitchPlayer.swf' height='$height' width='$width' id='clip_embed_player_flash' type='application/x-shockwave-flash'>
<param name='movie' value='//www-cdn.jtvnw.net/swflibs/TwitchPlayer.swf'>
<param name='allowScriptAccess' value='always'>
<param name='allowNetworking' value='all'>
<param name='allowFullScreen' value='true'>
<param name='flashvars' value='videoId=v$video_id&hostname=www.twitch.tv&channel=$user_id&auto_play=$autoplay'>
</object>";
	}

	$html = "<object type='application/x-shockwave-flash' height='$height' width='$width' id='live_embed_player_flash' data='//www-cdn.jtvnw.net/swflibs/TwitchPlayer.swf?channel=$user_id' bgcolor='#000000'>
<param name='allowFullScreen' value='true' />
<param name='allowScriptAccess' value='always' />
<param name='allowNetworking' value='all' />
<param name='movie' value='//www-cdn.jtvnw.net/swflibs/TwitchPlayer.swf' />
<param name='flashvars' value='hostname=www.twitch.tv&channel=$user_id&auto_play=$autoplay&start_volume=25' />
</object>";

	return $html;
}

add_shortcode( 'twitch', 'wpcom_twitchtv_shortcode' );
add_shortcode( 'twitchtv', 'wpcom_twitchtv_shortcode' );
