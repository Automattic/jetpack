<?php

/*
 * CodePen embed
 *
 * example URL: http://codepen.io/css-tricks/pen/wFeaG
*/

// Register oEmbed provider
wp_oembed_add_provider( '#http[s]{0,1}://codepen.io/([^/]+)/pen/([^/]+)[/]{0,1}#', 'https://codepen.io/api/oembed', true );
