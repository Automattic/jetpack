<?php


/*
 * CartoDB
 *
 * example URL: http://osm2.cartodb.com/viz/08aef918-94da-11e4-ad83-0e0c41326911/public_map
 *
 * possible patterns:
 * [username].cartodb.com/viz/[map-id]/public_map
 * [username].cartodb.com/viz/[map-id]/embed_map
 * [username].cartodb.com/viz/[map-id]/map
 * [organization].cartodb.com/u/[username]/viz/[map-id]/public_map
 * [organization].cartodb.com/u/[username]/viz/[map-id]/embed_map
 * [organization].cartodb.com/u/[username]/viz/[map-id]/map
*/

wp_oembed_add_provider( '#https?://(?:www\.)?[^/^\.]+\.cartodb\.com/\S+#i', 'https://services.cartodb.com/oembed', true );