<?php

/*
 * CodePen embed
 *
 * example URL: http://codepen.io/css-tricks/pen/wFeaG
*/

// Register oEmbed provider
wp_oembed_add_provider( '#https?://codepen.io/([^/]+)/pen/([^/]+)/?#', 'https://codepen.io/api/oembed', true );
