<?php
/*
 * Mixcloud embeds
 *
 * examples:
 * [mixcloud MalibuRum/play-6-kissy-sellouts-winter-sun-house-party-mix/ /]
 * [mixcloud MalibuRum/play-6-kissy-sellouts-winter-sun-house-party-mix/ width=640 height=480 /]
 * [mixcloud http://www.mixcloud.com/MalibuRum/play-6-kissy-sellouts-winter-sun-house-party-mix/ /]
 * [mixcloud http://www.mixcloud.com/MalibuRum/play-6-kissy-sellouts-winter-sun-house-party-mix/ width=640 height=480 /]
 * [mixcloud]http://www.mixcloud.com/MalibuRum/play-6-kissy-sellouts-winter-sun-house-party-mix/[/mixcloud]
 * [mixcloud]MalibuRum/play-6-kissy-sellouts-winter-sun-house-party-mix/[/mixcloud]
*/

// Register oEmbed provider
// Example URL: http://www.mixcloud.com/oembed/?url=http://www.mixcloud.com/MalibuRum/play-6-kissy-sellouts-winter-sun-house-party-mix/
wp_oembed_add_provider('#https?://(?:www\.)?mixcloud\.com/\S*#i', 'http://www.mixcloud.com/oembed', true);

// Register mixcloud shortcode
add_shortcode( 'mixcloud', 'mixcloud_shortcode' );
function mixcloud_shortcode( $atts, $content = null ) {

	if ( empty( $atts[0] ) && empty( $content ) )
		return "<!-- mixcloud error: invalid mixcloud resource -->";

	$regular_expression = "#((?<=mixcloud.com/)([A-Za-z0-9_-]+/[A-Za-z0-9_-]+))|^([A-Za-z0-9_-]+/[A-Za-z0-9_-]+)#i";
	preg_match( $regular_expression, $content, $match );
	if ( ! empty( $match ) ) {
		$resource_id = trim( $match[0] );
	} else {
		preg_match( $regular_expression, $atts[0], $match );
		if ( ! empty( $match ) )
			$resource_id = trim( $match[0] );
	}

	if ( empty( $resource_id ) )
		return "<!-- mixcloud error: invalid mixcloud resource -->";

	$atts = shortcode_atts( array(
		'width'    => 300,
		'height'   => 300,
	), $atts, 'mixcloud' );


	// Build URL
	$url = add_query_arg( $atts, "http://api.mixcloud.com/$resource_id/embed-html/" );
	$head = wp_remote_head( $url );
	if ( is_wp_error( $head ) || 200 != $head['response']['code'] )
		return "<!-- mixcloud error: invalid mixcloud resource -->";

	return sprintf( '<iframe width="%d" height="%d" scrolling="no" frameborder="no" src="%s"></iframe>', $atts['width'], $atts['height'], esc_url( $url ) );

}
