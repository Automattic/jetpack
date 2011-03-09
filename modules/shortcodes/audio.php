<?php

/**
 * Shortcode for audio
 * [audio http://wpcom.files.wordpress.com/2007/01/mattmullenweg-interview.mp3|width=180|titles=1|artists=2]
 * 
 * The important question here is whether the shortcode applies to widget_text:
 * add_filter('widget_text', 'do_shortcode');   
 * */

function audio_shortcode( $atts ) {
	global $ap_playerID;
	
	if ( ! isset( $atts[0] ) )
		return '';

	if ( count( $atts ) )
		$atts[0] = join( ' ', $atts );

	$src = rtrim( $atts[0], '=' );
	
	$ap_options = apply_filters( 'audio_player_default_colors', array( "bg" => "0xf8f8f8", "leftbg" => "0xeeeeee", "lefticon" => "0x666666", "rightbg" => "0xcccccc", "rightbghover" => "0x999999", "righticon" => "0x666666", "righticonhover" => "0xffffff", "text" => "0x666666", "slider" => "0x666666", "track" => "0xFFFFFF", "border" => "0x666666", "loader" => "0x9FFFB8" ) );

	if ( isset( $ap_playerID ) == false )
		$ap_playerID = 1;
	else
		$ap_playerID++;

	$src = trim( $src, ' "' );

	if ( strpos( '|', $src ) )
		$options = explode( '|', $src );
	else
		$options = array();

	$data = preg_split( "/[\|]/", $src );
	$flashvars = "playerID={$ap_playerID}";

	for ( $i = 1; $i < count( $data ); $i++ ) {
		$pair = explode( "=", $data[$i] );
		if( strtolower( $pair[0] ) != 'autostart' )
			$options[$pair[0]] = $pair[1];
	}

	// Merge runtime options to default colour options (runtime options overwrite default options)
	$options = array_merge( $ap_options, $options );
	$options['soundFile'] = $data[0];
	foreach ( $options as $key => $value ) {
		$flash_vars .= '&amp;' . $key . '=' . rawurlencode( $value );
	}
	$flash_vars = esc_attr( $flash_vars );

	if ( isset( $options['bgcolor'] ) )
		$bgcolor = esc_attr( $options['bgcolor'] );
	else
		$bgcolor = '#FFFFFF';

	if ( isset( $options['width'] ) )
		$width = intval( $options['width'] );
	else
		$width = 290;

	$swfurl = ( is_ssl() ? 'https://s-ssl.' : 'http://s.' ) . 'wordpress.com/wp-content/plugins/audio-player/player.swf';

	$obj = "<p><object type='application/x-shockwave-flash' data='$swfurl' width='$width' height='24' id='audioplayer1'><param name='movie' value='$swfurl' /><param name='FlashVars' value='{$flash_vars}' /><param name='quality' value='high' /><param name='menu' value='false' /><param name='bgcolor' value='$bgcolor' /><param name='wmode' value='opaque' /></object></p>";

	return "<span style='text-align:left;display:block;'>$obj</span>";
}

add_shortcode( 'audio', 'audio_shortcode' );