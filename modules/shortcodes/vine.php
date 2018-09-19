<?php
/**
 * Vine shortcode
 */

/**
 * Vine embed code:
 * <iframe class="vine-embed" src="https://vine.co/v/bjHh0zHdgZT" width="600" height="600" frameborder="0"></iframe>
 * <script async src="//platform.vine.co/static/scripts/embed.js" charset="utf-8"></script>
 *
 * URL example:
 * https://vine.co/v/bjHh0zHdgZT/
 *
 * Embed shortcode examples:
 * [embed]https://vine.co/v/bjHh0zHdgZT[/embed]
 * [embed width="300"]https://vine.co/v/bjHh0zHdgZT[/embed]
 * [embed type="postcard" width="300"]https://vine.co/v/bjHh0zHdgZT[/embed]
 **/

function vine_embed_video( $matches, $attr, $url, $rawattr ) {
	static $vine_flag_embedded_script;

	$max_height = 300;
	$type       = 'simple';

	// Only allow 'postcard' or 'simple' types
	if ( isset( $rawattr['type'] ) && $rawattr['type'] === 'postcard' ) {
		$type = 'postcard';
	}

	$vine_size = Jetpack::get_content_width();

	// If the user enters a value for width or height, we ignore the Jetpack::get_content_width()
	if ( isset( $rawattr['width'] ) || isset( $rawattr['height'] ) ) {
		// 300 is the minimum size that Vine provides for embeds. Lower than that, the postcard embeds looks weird.
		$vine_size = max( $max_height, min( $attr['width'], $attr['height'] ) );
	}

	if ( empty( $vine_size ) ) {
		$vine_size = $max_height;
	}

	$url       = 'https://vine.co/v/' . $matches[1] . '/embed/' . $type;
	$vine_html = sprintf( '<span class="embed-vine" style="display: block;"><iframe class="vine-embed" src="%s" width="%s" height="%s" frameborder="0"></iframe></span>', esc_url( $url ), (int) $vine_size, (int) $vine_size );

	if ( $vine_flag_embedded_script !== true ) {
		$vine_html                .= '<script async src="//platform.vine.co/static/scripts/embed.js" charset="utf-8"></script>';
		$vine_flag_embedded_script = true;
	}

	return $vine_html;
}
wp_embed_register_handler( 'jetpack_vine', '#https?://vine.co/v/([a-z0-9]+).*#i', 'vine_embed_video' );

function vine_shortcode( $atts ) {
	global $wp_embed;

	if ( empty( $atts['url'] ) ) {
		return '';
	}

	if ( ! preg_match( '#https?://vine.co/v/([a-z0-9]+).*#i', $atts['url'] ) ) {
		return '';
	}

	return $wp_embed->shortcode( $atts, $atts['url'] );
}
add_shortcode( 'vine', 'vine_shortcode' );
