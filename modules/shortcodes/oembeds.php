<?php
/**
 * Extra oEmbed providers that we know about and use on WordPress.com for feature parity.
 *
 * @package Jetpack
 */

wp_oembed_add_provider( 'https://cloudup.com/*', 'https://cloudup.com/oembed' );
wp_oembed_add_provider( 'https://me.sh/*', 'https://me.sh/oembed?format=json' );
wp_oembed_add_provider( '#https?://(www\.)?gfycat\.com/.*#i', 'https://api.gfycat.com/v1/oembed', true );
wp_oembed_add_provider( '#https?://[^.]+\.(wistia\.com|wi\.st)/(medias|embed)/.*#', 'https://fast.wistia.com/oembed', true );
wp_oembed_add_provider( '#https?://sketchfab\.com/.*#i', 'https://sketchfab.com/oembed', true );
wp_oembed_add_provider( '#https?://(www\.)?icloud\.com/keynote/.*#i', 'https://iwmb.icloud.com/iwmb/oembed', true );
wp_oembed_add_provider( '#^https?://(www.)?audiomack.com/([^/]+)/([^/]+)/([^/]+)[/]{0,1}#', 'https://www.audiomack.com/oembed', true );
