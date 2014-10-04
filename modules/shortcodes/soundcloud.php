<?php
/*
Plugin Name: SoundCloud Shortcode
Plugin URI: http://wordpress.org/extend/plugins/soundcloud-shortcode/
Description: Converts SoundCloud WordPress shortcodes to a SoundCloud widget. Example: [soundcloud]http://soundcloud.com/forss/flickermood[/soundcloud]
Version: 2.3
Author: SoundCloud Inc., simplified for Jetpack by Automattic, Inc.
Author URI: http://soundcloud.com
License: GPLv2

Original version: Johannes Wagener <johannes@soundcloud.com>
Options support: Tiffany Conroy <tiffany@soundcloud.com>
HTML5 & oEmbed support: Tim Bormans <tim@soundcloud.com>
*/

/*
A8C: Taken from http://plugins.svn.wordpress.org/soundcloud-shortcode/trunk/
at revision 664386.

Commenting out (instead of removing) and replacing code with custom modifs
so it's eqsy to see what differs from the standard DOTORG version.

All custom modifs are annoted with "A8C" keyword in comment.
*/

/**
 * Register oEmbed provider
 */

wp_oembed_add_provider('#https?://(?:api\.)?soundcloud\.com/.*#i', 'http://soundcloud.com/oembed', true);


/**
 * Register SoundCloud shortcode
 */

add_shortcode("soundcloud", "soundcloud_shortcode");


/**
 * SoundCloud shortcode handler
 * @param  {string|array}  $atts     The attributes passed to the shortcode like [soundcloud attr1="value" /].
 *                                   Is an empty string when no arguments are given.
 * @param  {string}        $content  The content between non-self closing [soundcloud]…[/soundcloud] tags.
 * @return {string}                  Widget embed code HTML
 */
function soundcloud_shortcode($atts, $content = null) {

	// Custom shortcode options
	$shortcode_options = array_merge(array('url' => trim($content)), is_array($atts) ? $atts : array());

	// Turn shortcode option "param" (param=value&param2=value) into array
	$shortcode_params = array();
	if (isset($shortcode_options['params'])) {
		parse_str(html_entity_decode($shortcode_options['params']), $shortcode_params);
	}
	$shortcode_options['params'] = $shortcode_params;

	// User preference options
	$plugin_options = array_filter(array(
		'iframe' => soundcloud_get_option('player_iframe', true),
		'width'  => soundcloud_get_option('player_width'),
		'height' =>  soundcloud_url_has_tracklist($shortcode_options['url']) ? soundcloud_get_option('player_height_multi') : soundcloud_get_option('player_height'),
		'params' => array_filter(array(
			'auto_play'     => soundcloud_get_option('auto_play'),
			'show_comments' => soundcloud_get_option('show_comments'),
			'color'         => soundcloud_get_option('color'),
			'theme_color'   => soundcloud_get_option('theme_color'),
		)),
	));

	// Needs to be an array
	if ( ! isset( $plugin_options['params'] ) ) {
		$plugin_options['params'] = array();
	}

	// plugin options < shortcode options
	$options = array_merge(
		$plugin_options,
		$shortcode_options
	);

	// plugin params < shortcode params
	$options['params'] = array_merge(
		$plugin_options['params'],
		$shortcode_options['params']
	);

	// The "url" option is required
	if ( ! isset( $options['url'] ) ) {
		return '';
	} else {
		$options['url'] = trim($options['url']);
	}

	// Both "width" and "height" need to be integers
	if (isset($options['width']) && !preg_match('/^\d+$/', $options['width'])) {
		// set to 0 so oEmbed will use the default 100% and WordPress themes will leave it alone
		$options['width'] = 0;
	}
	if (isset($options['height']) && !preg_match('/^\d+$/', $options['height'])) { unset($options['height']); }

	// The "iframe" option must be true to load the iframe widget
	if ( isset( $options[ 'iframe' ] ) ) {
		$iframe = soundcloud_booleanize($options['iframe'])
		// Default to flash widget for permalink urls (e.g. http://soundcloud.com/{username})
		// because HTML5 widget doesn’t support those yet
		? preg_match('/api.soundcloud.com/i', $options['url'])
		: false;

		if ( $iframe ) {
			return soundcloud_iframe_widget( $options );
		}
	}

	return soundcloud_flash_widget( $options );
}

/**
 * Plugin options getter
 * @param  {string|array}  $option   Option name
 * @param  {mixed}         $default  Default value
 * @return {mixed}                   Option value
 */
function soundcloud_get_option($option, $default = false) {
	$value = get_option('soundcloud_' . $option);
	return $value === '' ? $default : $value;
}

/**
 * Booleanize a value
 * @param  {boolean|string}  $value
 * @return {boolean}
 */
function soundcloud_booleanize($value) {
	return is_bool($value) ? $value : $value === 'true' ? true : false;
}

/**
 * Decide if a url has a tracklist
 * @param  {string}   $url
 * @return {boolean}
 */
function soundcloud_url_has_tracklist($url) {
	return preg_match( '/^(.+?)\/(sets|groups|playlists)\/(.+?)$/', $url );
}

/**
 * Parameterize url
 * @param  {array}  $match  Matched regex
 * @return {string}          Parameterized url
 */
function soundcloud_oembed_params_callback($match) {
	global $soundcloud_oembed_params;

	// Convert URL to array
	$url = parse_url(urldecode($match[1]));
	// Convert URL query to array
	parse_str($url['query'], $query_array);
	// Build new query string
	$query = http_build_query(array_merge($query_array, $soundcloud_oembed_params));

	return 'src="' . $url['scheme'] . '://' . $url['host'] . $url['path'] . '?' . $query;
}

/**
 * Iframe widget embed code
 * @param  {array}   $options  Parameters
 * @return {string}            Iframe embed code
 */
function soundcloud_iframe_widget($options) {

	// Merge in "url" value
	$options['params'] = array_merge(array(
		'url' => $options['url']
	), $options['params']);

	// Build URL
	$url = set_url_scheme( 'http://w.soundcloud.com/player/?' . http_build_query($options['params']) );
	// Set default width if not defined
	$width = isset($options['width']) && $options['width'] !== 0 ? $options['width'] : '100%';
	// Set default height if not defined
	$height = isset($options['height']) && $options['height'] !== 0 ? $options['height'] : (soundcloud_url_has_tracklist($options['url']) ? '450' : '166');

	return sprintf('<iframe width="%s" height="%s" scrolling="no" frameborder="no" src="%s"></iframe>', $width, $height, $url);
}

/**
 * Legacy Flash widget embed code
 * @param  {array}   $options  Parameters
 * @return {string}            Flash embed code
 */
function soundcloud_flash_widget($options) {

	// Merge in "url" value
	$options['params'] = array_merge(array(
		'url' => $options['url']
	), $options['params']);

	// Build URL
	$url = set_url_scheme( 'http://player.soundcloud.com/player.swf?' . http_build_query($options['params']) );
	// Set default width if not defined
	$width = isset($options['width']) && $options['width'] !== 0 ? $options['width'] : '100%';
	// Set default height if not defined
	$height = isset($options['height']) && $options['height'] !== 0 ? $options['height'] : (soundcloud_url_has_tracklist($options['url']) ? '255' : '81');

	return preg_replace('/\s\s+/', "", sprintf('<object width="%s" height="%s">
													<param name="movie" value="%s"></param>
													<param name="allowscriptaccess" value="always"></param>
													<embed width="%s" height="%s" src="%s" allowscriptaccess="always" type="application/x-shockwave-flash"></embed>
												</object>', $width, $height, $url, $width, $height, $url));
}


/**
 * SoundCloud Embed Reversal
 *
 * Converts a generic HTML embed code from SoundClound into a
 * WordPress.com-compatibly shortcode.
 */
function jetpack_soundcloud_embed_reversal( $content ) {
	if ( false === stripos( $content, 'w.soundcloud.com/player' ) )
		return $content;

	/* Sample embed code:

		<iframe width="100%" height="450" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/150745932&amp;auto_play=false&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true"></iframe>
	*/

	$regexes = array();

	$regexes[] = '#<iframe[^>]+?src="((?:https?:)?//w\.soundcloud\.com/player/[^"\']++)"[^>]*+>\s*?</iframe>#i';
	$regexes[] = '#&lt;iframe(?:[^&]|&(?!gt;))+?src="((?:https?:)?//w\.soundcloud\.com/player/[^"\']++)"(?:[^&]|&(?!gt;))*+&gt;\s*?&lt;/iframe&gt;#i';

	foreach ( $regexes as $regex ) {
		if ( ! preg_match_all( $regex, $content, $matches, PREG_SET_ORDER ) )
			continue;

		foreach ( $matches as $match ) {
			$args = parse_url( html_entity_decode( $match[1] ), PHP_URL_QUERY );
			$args = wp_parse_args( $args );

			if ( ! preg_match( '#^(?:https?:)?//api\.soundcloud\.com/.+$#i', $args['url'], $url_matches ) )
				continue;

			$shortcode = sprintf( '[soundcloud url="%s"]', esc_url( $url_matches[0] ) );
			$replace_regex = sprintf( '#\s*%s\s*#', preg_quote( $match[0], '#' ) );
			$content = preg_replace( $replace_regex, sprintf( "\n\n%s\n\n", $shortcode ), $content );
			do_action( 'jetpack_embed_to_shortcode', 'soundcloud', $url_matches[0] );
		}
	}

	return $content;
}


add_filter( 'pre_kses', 'jetpack_soundcloud_embed_reversal' );
