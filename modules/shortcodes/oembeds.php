<?php
/**
 * Extra oEmbed providers that we know about and use on WordPress.com for feature parity.
 *
 * @package Jetpack
 */

/*
 * Audiomack
 * Example: https://audiomack.com/album/shy-glizzy/covered-n-blood
 */
wp_oembed_add_provider( '#^https?://(www.)?audiomack.com/([^/]+)/([^/]+)/([^/]+)[/]{0,1}#', 'https://www.audiomack.com/oembed', true );

/*
 * Carto (formerly CartoDB)
 * Example: http://osm2.carto.com/viz/08aef918-94da-11e4-ad83-0e0c41326911/public_map
 */
wp_oembed_add_provider( '#https?://(?:www\.)?[^/^\.]+\.carto(db)?\.com/\S+#i', 'https://services.carto.com/oembed', true );

wp_oembed_add_provider( 'https://cloudup.com/*', 'https://cloudup.com/oembed' );

/*
 * Codepen
 * Example: http://codepen.io/css-tricks/pen/wFeaG
 */
wp_oembed_add_provider( '#https?://codepen.io/([^/]+)/pen/([^/]+)/?#', 'https://codepen.io/api/oembed', true );

/*
 * Flat.io
 * Example URL: https://flat.io/score/5a5268ed41396318cbd7772c-string-quartet-for-rainy-days
 */
wp_oembed_add_provider( 'https://flat.io/score/*', 'https://flat.io/services/oembed', false );
wp_oembed_add_provider( 'https://*.flat.io/score/*', 'https://flat.io/services/oembed', false );

wp_oembed_add_provider( '#https?://(www\.)?gfycat\.com/.*#i', 'https://api.gfycat.com/v1/oembed', true );
wp_oembed_add_provider( '#https?://(www\.)?icloud\.com/keynote/.*#i', 'https://iwmb.icloud.com/iwmb/oembed', true );
wp_oembed_add_provider( 'https://me.sh/*', 'https://me.sh/oembed?format=json' );
wp_oembed_add_provider( '#https?://sketchfab\.com/.*#i', 'https://sketchfab.com/oembed', true );

/**
 * ThingLink image example url: https://www.thinglink.com/scene/554766125892632576
 * ThingLink video example url: http://www.thinglink.com/video/568397707501109249
 *
 * OEmbed Docs: https://www.thinglink.com/help/Thinglink%20API
 */
wp_oembed_add_provider( '#https?://www\.thinglink.com/(scene|video)/\d+/?#i', 'https://www.thinglink.com/api/oembed', true );

wp_oembed_add_provider( '#https?://[^.]+\.(wistia\.com|wi\.st)/(medias|embed)/.*#', 'https://fast.wistia.com/oembed', true );
