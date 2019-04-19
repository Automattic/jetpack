<?php
/**
 * Extra oEmbed providers that we know about and use on WordPress.com for feature parity.
 * See http://codex.wordpress.org/Embeds
 *
 * Some of these services support embed discovery,
 * though at this time it is disabled on WordPress.com.
 * In the future we should consider removing some or all of these services
 * if discovery is sufficient to embed.
 *
 * @package Jetpack
 */

// This function is not always defined (SHORTINIT, exports, Batcache, etc).
if ( function_exists( 'wp_oembed_add_provider' ) ) {
	/*
	 * Amazon Kindle embeds.
	 */
	wp_oembed_add_provider( '#https?://([a-z0-9-]+\.)?amazon\.(com|co\.uk|de|fr|it|es|co\.jp|cn|com\.au|in|com\.mx|com\.br|ca|nl)/.*#i', 'https://read.amazon.com/kp/api/oembed', true );

	/*
	 * video214 is animoto but a domain they use for their whitelabel service.
	 */
	wp_oembed_add_provider( '#http://(www\.)?animoto.com/play/.*#i', 'http://animoto.com/oembeds/create?format=json', true );
	wp_oembed_add_provider( '#http://(www\.)?video214.com/play/.*#i', 'http://animoto.com/oembeds/create?format=json', true );

	wp_oembed_add_provider( '#https?://(www\.)?audioboom\.com/.*#i', 'https://audioboom.com/publishing/oembed.json', true );

	/*
	 * Audiomack
	 * Example: https://audiomack.com/album/shy-glizzy/covered-n-blood
	 */
	wp_oembed_add_provider( '#^https?://(www.)?audiomack.com/([^/]+)/([^/]+)/([^/]+)[/]{0,1}#', 'https://www.audiomack.com/oembed', true );

	wp_oembed_add_provider( '#http://(www\.)?blurb\.com/.*#i', 'http://www.blurb.com/oembed', true );

	/*
	 * Carto (formerly CartoDB)
	 * Example: http://osm2.carto.com/viz/08aef918-94da-11e4-ad83-0e0c41326911/public_map
	 */
	wp_oembed_add_provider( '#https?://(?:www\.)?[^/^\.]+\.carto(db)?\.com/\S+#i', 'https://services.carto.com/oembed', true );

	/*
	 * Codepen
	 * Example: http://codepen.io/css-tricks/pen/wFeaG
	 */
	wp_oembed_add_provider( '#https?://codepen.io/([^/]+)/pen/([^/]+)/?#', 'https://codepen.io/api/oembed', true );

	wp_oembed_add_provider( '#https?://(www\.)?crowdrise\.com/.*#i', 'https://www.crowdrise.com/api/oembed', true );
	wp_oembed_add_provider( '#https?://docs\.com/.*#i', 'https://docs.com/api/oembed', true );
	wp_oembed_add_provider( '#https?://(www\.)?educreations\.com/lesson/view/.*#i', 'http://www.educreations.com/api/v1/lesson/oembed/', true );
	wp_oembed_add_provider( '#http://(www\.)?entertonement\.com/.*#i', 'http://www.entertonement.com/api/oembed', true );
	wp_oembed_add_provider( '#http://(www\.)?fairtilizer\.com/(track|playlist)/.*#i', 'http://fairtilizer.com/services/oembed', true );

	/*
	 * Flat.io
	 * Example URL: https://flat.io/score/5a5268ed41396318cbd7772c-string-quartet-for-rainy-days
	 */
	wp_oembed_add_provider( 'https://flat.io/score/*', 'https://flat.io/services/oembed', false );
	wp_oembed_add_provider( 'https://*.flat.io/score/*', 'https://flat.io/services/oembed', false );

	wp_oembed_add_provider( '#https?://(view\.|www\.)?genial\.ly/.*#i', 'https://www.genial.ly/services/oembed', true );
	wp_oembed_add_provider( '#https?://w(?:ww)?.graphiq.com/w(?:lp)?/.*#i', 'https://oembed.graphiq.com/services/oembed', true );
	wp_oembed_add_provider( '#https?://(www\.)?gfycat\.com/.*#i', 'https://api.gfycat.com/v1/oembed', true );
	wp_oembed_add_provider( '#https?://(www\.)?hellopretty\.co\.za/.*#i', 'https://hellopretty.co.za/oembed', true );
	wp_oembed_add_provider( '#https?://(www\.)?icloud\.com/keynote/.*#i', 'https://iwmb.icloud.com/iwmb/oembed', true );
	wp_oembed_add_provider( '#https?://(www\.)?infogr\.am/.*#i', 'https://infogr.am/oembed', true );
	wp_oembed_add_provider( '#https?://(secure\.|www\.|form\.)?(my)?jotform(pro|eu|z)?\.(com|net|us|ca|me|co)/form/[0-9]*#i', 'https://www.jotform.com/oembed/', true );
	wp_oembed_add_provider( '#http://www.kitchenbowl.com/recipe/.*#i', 'http://www.kitchenbowl.com/oembed?format=json', true );
	wp_oembed_add_provider( '#https?://(story|stories)\.mapme\.com/.*#i', 'https://stories.mapme.com/services/oembed', true );
	wp_oembed_add_provider( 'https://me.sh/*', 'https://me.sh/oembed?format=json' );
	wp_oembed_add_provider( '#https?://(www\.)?noteflight\.com/.*#i', 'https://noteflight.com/services/oembed.json', true );
	wp_oembed_add_provider( '#https?://(www\.)?(nytimes\.com|nyti\.ms)/.*#i', 'https://www.nytimes.com/svc/oembed/json/', true );
	wp_oembed_add_provider( '#https?://mix\.office\.com/.*#i', 'https://mix.office.com/oembed', true );
	wp_oembed_add_provider( '#http://(www\.|new\.)?official\.fm/(track|playlist|tracks|playlists)/.*#i', 'http://official.fm/services/oembed', true );
	wp_oembed_add_provider( '#^https?://([a-z0-9-]+\.)?padlet\.(com|org)/.*#i', 'https://padlet.com/oembed', true );
	wp_oembed_add_provider( '#https?://(play\.)?radiopublic\.com/.*#i', 'https://oembed.radiopublic.com/oembed', true );

	/*
	 * Reverbnation.
	 * soniclemur is a staging environment.
	 */
	wp_oembed_add_provider( '#https?://(www\.)?reverbnation.com/.*#i', 'https://www.reverbnation.com/oembed', true );
	wp_oembed_add_provider( '#https?://(www\.)?soniclemur.com/.*#i', 'https://www.soniclemur.com/oembed', true );

	wp_oembed_add_provider( '#https?://(www\.)?screencast\.com/.*#i', 'http://www.screencast.com/api/external/oembed', true );
	wp_oembed_add_provider( '#https?://simplecast\.com/s/.*#i', 'https://simplecast.com/oembed', true );
	wp_oembed_add_provider( '#https?://sketchfab\.com/.*#i', 'https://sketchfab.com/oembed', true );
	wp_oembed_add_provider( 'http://slf.ie/*', 'http://slf.ie/oembed?format=json' );
	wp_oembed_add_provider( '#https?://(www\.)?spreaker\.com/.*#i', 'https://api.spreaker.com/oembed', true );
	wp_oembed_add_provider( '#https?://[^.]+\.vids\.io/videos/.*#i', 'http://sproutvideo.com/oembed.json', true );
	wp_oembed_add_provider( '#https?://sway\.com/.*#i', 'https://sway.com/api/v1.0/oembed', true );

	/**
	 * ThingLink image example url: https://www.thinglink.com/scene/554766125892632576
	 * ThingLink video example url: http://www.thinglink.com/video/568397707501109249
	 *
	 * OEmbed Docs: https://www.thinglink.com/help/Thinglink%20API
	 */
	wp_oembed_add_provider( '#https?://www\.thinglink.com/(scene|video)/\d+/?#i', 'https://www.thinglink.com/api/oembed', true );

	wp_oembed_add_provider( '#https?://(web)?player\.whooshkaa\.com/.*#i', 'https://api.whooshkaa.com/oembed', true );
	wp_oembed_add_provider( '#https?://[^.]+\.(wistia\.com|wi\.st)/(medias|embed)/.*#', 'https://fast.wistia.com/oembed', true );
}
