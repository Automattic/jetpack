<?php

/**
 * VideoPress Shortcode Handler
 *
 * This file may or may not be included from the Jetpack VideoPress module.
 */

/**
 * We won't have any videos less than sixty pixels wide. That would be silly.
 */
define( 'VIDEOPRESS_MIN_WIDTH', 60 );

/**
 * Translate a 'videopress' or 'wpvideo' shortcode and arguments into a video player display.
 *
 * Expected input formats:
 *
 * [videopress OcobLTqC]
 * [wpvideo OcobLTqC]
 *
 * @link http://codex.wordpress.org/Shortcode_API Shortcode API
 * @param array $attr shortcode attributes
 * @return string HTML markup or blank string on fail
 */
public function videopress_shortcode_callback( $attr, $content = '' ) {
	global $content_width;

	/**
	 * We only accept GUIDs as a first unnamed argument.
	 */
	$guid = $attr[0];

	/**
	 * Make sure the GUID passed in matches how actual GUIDs are formatted.
	 */
	if ( ! videopress_is_valid_guid( $guid ) ) {
		return '';
	}

	/**
	 * Set the defaults
	 */
	$defaults = array(
		'w'               => 0,     // Width of the video player, in pixels
		'h'               => 0,     // Height of the video player, in pixels
		'at'              => 0,     // Point at which to begin the video
		'hd'              => false, // Whether to display a high definition version
		'loop'            => false, // Whether to loop the video repeatedly
		'freedom'         => false, // Whether to use only free/libre codecs
		'autoplay'        => false, // Whether to autoplay the video on load
		'permalink'       => true,  //
		'flashonly'       => false, // Whether to support the Flash player exclusively
		'defaultlangcode' => false, // Default language code
	);

	$attr = shortcode_atts( $defaults, $attr, 'videopress' );

	/**
	 * Cast the attributes, post-input.
	 */
	$attr['freedom'] = (bool) $attr['freedom'];
	$attr['hd']      = (bool) $attr['hd'];
	$attr['width']   = absint( $attr['w'] );

	/**
	 * If the provided width is less than the minimum allowed
	 * width, or greater than `$content_width` ignore.
	 */
	if ( $attr['width'] < VIDEOPRESS_MIN_WIDTH ) {
		$attr['width'] = 0;
	} elseif ( isset( $content_width ) && $content_width > VIDEOPRESS_MIN_WIDTH && $attr['width'] > $content_width ) {
		$attr['width'] = 0;
	}

	/**
	 * If there was an invalid or unspecified width, set the width equal to the theme's `$content_width`.
	 */
	if ( $attr['width'] === 0 && isset( $content_width ) && $content_width > VIDEOPRESS_MIN_WIDTH ) {
		$attr['width'] = $content_width;
	}

	/**
	 * If the width isn't an even number, reduce it by one (making it even).
	 */
	if ( ( $attr['width'] % 2 ) === 1 ) {
		$attr['width'] --;
	}

	/**
	 * Filter the default VideoPress shortcode options.
	 *
	 * @module videopress
	 *
	 * @since 2.5.0
	 *
	 * @param array $args Array of VideoPress shortcode options.
	 */
	$options = apply_filters( 'videopress_shortcode_options', array(
		'freedom'         => $attr['freedom'],
		'force_flash'     => (bool) $attr['flashonly'],
		'forcestatic'     => false, // This used to be an option, but now is only accessible via filter.
		'autoplay'        => $attr['autoplay'],
		'hd'              => $attr['hd'],
		'permalink'       => $attr['permalink'],
		'loop'            => $attr['autoplay'],
		'at'              => (int) $attr['at'],
		'defaultlangcode' => $attr['defaultlangcode']
	) );

	// Register VideoPress scripts
	wp_register_script( 'videopress', 'https://v0.wordpress.com/js/videopress.js', array( 'jquery', 'swfobject' ), '1.09' );

	require_once( dirname( __FILE__ ) . '/class.videopress-video.php' );
	require_once( dirname( __FILE__ ) . '/class.videopress-player.php' );

	$player = new VideoPress_Player( $guid, $attr['width'], $options );

	if ( is_feed() ) {
		return $player->asXML();
	} else {
		return $player->asHTML();
	}
}
add_shortcode( 'videopress', 'videopress_shortcode_callback' );
add_shortcode( 'wpvideo',    'videopress_shortcode_callback' );

/**
 * By explicitly declaring the provider here, we can speed things up by not relying on oEmbed discovery.
 */
wp_oembed_add_provider( '#^https?://videopress.com/v/.*#', 'http://public-api.wordpress.com/oembed/1.0/', true );

/**
 * Adds a `for` query parameter to the oembed provider request URL.
 * @param String $oembed_provider
 * @return String $ehnanced_oembed_provider
 */
function videopress_add_oembed_for_parameter( $oembed_provider ) {
	if ( false === stripos( $oembed_provider, 'videopress.com' ) ) {
		return $oembed_provider;
	}
	return add_query_arg( 'for', parse_url( home_url(), PHP_URL_HOST ), $oembed_provider );
}
add_filter( 'oembed_fetch_url', 'videopress_add_oembed_for_parameter' );
