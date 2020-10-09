<?php
/**
 * Extra oEmbed providers that we know about and use on wpcom for feature parity.
 *
 * This file will be loaded even when you don't use the Shortcodes feature,
 * as these embeds are considered safe to use on any site
 * (and may end up embedded in Core in the future).
 *
 * @package Jetpack
 */

wp_oembed_add_provider( 'https://me.sh/*', 'https://me.sh/oembed?format=json' );
wp_oembed_add_provider( '#https?://(www\.)?gfycat\.com/.*#i', 'https://api.gfycat.com/v1/oembed', true );
wp_oembed_add_provider( '#https?://[^.]+\.(wistia\.com|wi\.st)/(medias|embed)/.*#', 'https://fast.wistia.com/oembed', true );
wp_oembed_add_provider( '#https?://sketchfab\.com/.*#i', 'https://sketchfab.com/oembed', true );
wp_oembed_add_provider( '#https?://(www\.)?icloud\.com/keynote/.*#i', 'https://iwmb.icloud.com/iwmb/oembed', true );
wp_oembed_add_provider( '#https?://((song|album|artist|pods|playlist)\.link|odesli\.com?|mylink\.page)/.*#', 'https://odesli.co/oembed', true );
wp_oembed_add_provider( '#https?://(www\.)?loom\.com/share/.*#i', 'https://www.loom.com/v1/oembed', true );
