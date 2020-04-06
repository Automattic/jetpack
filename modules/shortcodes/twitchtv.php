<?php
/**
 * Twitch.tv shortcode
 *
 * Examples:
 * [twitchtv url='https://www.twitch.tv/paperbat' height='378' width='620' autoplay='false']
 * [twitchtv url='https://www.twitch.tv/paperbat/b/323486192' height='378' width='620' autoplay='false']
 *
 * @package Jetpack
 */

/**
 * (Live URL) https://www.twitch.tv/paperbat
 *
 * <iframe src="https://player.twitch.tv/?autoplay=false&#038;muted=false&#038;channel=paperbat" width="620" height="378" frameborder="0" scrolling="no" allowfullscreen></iframe>
 *
 * (Archive URL) https://www.twitch.tv/paperbat/v/323486192
 *
 * <iframe src="https://player.twitch.tv/?autoplay=false&#038;muted=false&#038;video=v323486192" width="620" height="378" frameborder="0" scrolling="no" allowfullscreen></iframe>
 *
 * @param array $atts User supplied shortcode arguments.
 *
 * @return string HTML output of the shortcode.
 */
function wpcom_twitchtv_shortcode( $atts ) {
	$attr = shortcode_atts(
		array(
			'height'   => 378,
			'width'    => 620,
			'url'      => '',
			'autoplay' => 'false',
			'muted'    => 'false',
			'time'     => null,
		),
		$atts
	);

	if ( empty( $attr['url'] ) ) {
		return '<!-- Invalid twitchtv URL -->';
	}

	preg_match( '|^https?://www.twitch.tv/([^/?]+)(/v/(\d+))?|i', $attr['url'], $match );

	$url_args = array(
		'autoplay' => ( false !== $attr['autoplay'] && 'false' !== $attr['autoplay'] ) ? 'true' : 'false',
		'muted'    => ( false !== $attr['muted'] && 'false' !== $attr['muted'] ) ? 'true' : 'false',
		'time'     => $attr['time'],
	);

	$width  = intval( $attr['width'] );
	$height = intval( $attr['height'] );

	$user_id  = $match[1];
	$video_id = 0;
	if ( ! empty( $match[3] ) ) {
		$video_id = (int) $match[3];
	}

	do_action( 'jetpack_bump_stats_extras', 'twitchtv', 'shortcode' );

	if ( $video_id > 0 ) {
		$url_args['video'] = 'v' . $video_id;
	} else {
		$url_args['channel'] = $user_id;
	}

	$url = add_query_arg( $url_args, 'https://player.twitch.tv/' );

	return sprintf(
		'<iframe src="%s" width="%d" height="%d" frameborder="0" scrolling="no" allowfullscreen></iframe>',
		esc_url( $url ),
		esc_attr( $width ),
		esc_attr( $height )
	);
}
add_shortcode( 'twitch', 'wpcom_twitchtv_shortcode' );
add_shortcode( 'twitchtv', 'wpcom_twitchtv_shortcode' );
