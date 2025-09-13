<?php
/**
 * CodePen embed
 *
 * Example URL: http://codepen.io/css-tricks/pen/wFeaG
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Register oEmbed provider.
wp_oembed_add_provider( '#https?://codepen.io/([^/]+)/pen/([^/]+)/?#', 'https://codepen.io/api/oembed', true );
