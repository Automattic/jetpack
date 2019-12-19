<?php
/**
 * Mixcloud embeds
 *
 * Examples:
 * [mixcloud MalibuRum/play-6-kissy-sellouts-winter-sun-house-party-mix/ /]
 * [mixcloud MalibuRum/play-6-kissy-sellouts-winter-sun-house-party-mix/ width=640 height=480 /]
 * [mixcloud http://www.mixcloud.com/MalibuRum/play-6-kissy-sellouts-winter-sun-house-party-mix/ /]
 * [mixcloud http://www.mixcloud.com/MalibuRum/play-6-kissy-sellouts-winter-sun-house-party-mix/ width=640 height=480 /]
 * [mixcloud]http://www.mixcloud.com/MalibuRum/play-6-kissy-sellouts-winter-sun-house-party-mix/[/mixcloud]
 * [mixcloud]MalibuRum/play-6-kissy-sellouts-winter-sun-house-party-mix/[/mixcloud]
 * [mixcloud http://www.mixcloud.com/mat/playlists/classics/ width=660 height=208 hide_cover=1 hide_tracklist=1]
 *
 * @package Jetpack
 */

/*
 * Register oEmbed provider
 * Example URL: http://www.mixcloud.com/oembed/?url=http://www.mixcloud.com/MalibuRum/play-6-kissy-sellouts-winter-sun-house-party-mix/
 */
wp_oembed_add_provider( '#https?://(?:www\.)?mixcloud\.com/\S*#i', 'https://www.mixcloud.com/oembed', true );

/**
 * Register mixcloud shortcode.
 *
 * @param array  $atts    Shortcode atttributes.
 * @param string $content Post content.
 */
function mixcloud_shortcode( $atts, $content = null ) {

	if ( empty( $atts[0] ) && empty( $content ) ) {
		return '<!-- mixcloud error: invalid mixcloud resource -->';
	}

	$regular_expression = '/((?<=mixcloud\.com\/)[\w\-\/]+$)|(^[\w\-\/]+$)/i';
	preg_match( $regular_expression, $content, $match );
	if ( ! empty( $match ) ) {
		$resource_id = trim( $match[0] );
	} else {
		preg_match( $regular_expression, $atts[0], $match );
		if ( ! empty( $match ) ) {
			$resource_id = trim( $match[0] );
		}
	}

	if ( empty( $resource_id ) ) {
		return '<!-- mixcloud error: invalid mixcloud resource -->';
	}

	$mixcloud_url = 'https://mixcloud.com/' . $resource_id;

	$atts = shortcode_atts(
		array(
			'width'          => false,
			'height'         => false,
			'color'          => false,
			'light'          => false,
			'dark'           => false,
			'hide_tracklist' => false,
			'hide_cover'     => false,
			'mini'           => false,
			'hide_followers' => false,
			'hide_artwork'   => false,
		),
		$atts
	);

	// remove falsey values.
	$atts = array_filter( $atts );

	$query_args = array( 'url' => $mixcloud_url );
	$query_args = array_merge( $query_args, $atts );

	$url               = add_query_arg( urlencode_deep( $query_args ), 'https://www.mixcloud.com/oembed/' );
	$mixcloud_response = wp_remote_get( $url, array( 'redirection' => 0 ) );
	if ( is_wp_error( $mixcloud_response ) || 200 !== $mixcloud_response['response']['code'] || empty( $mixcloud_response['body'] ) ) {
		return '<!-- mixcloud error: invalid mixcloud resource -->';
	}

	$response_body = json_decode( $mixcloud_response['body'] );

	return $response_body->html;
}
add_shortcode( 'mixcloud', 'mixcloud_shortcode' );
