<?php


// Nicer Mesh email subscription output
function subscription_email_mesh( $existing ) {
	$existing[] = array(
		'regex' => '@<div style=".*?" class="mesh-embed">\s*<div style="padding-top: 100%"></div>\s*(?:<p>)<iframe src="(https://me\.sh.*?)".*?</iframe>\s*</div>@',
		'endpoint' => 'https://me.sh/oembed'
	);

	return $existing;
}

add_filter( 'subscription_email_oembeds', 'subscription_email_mesh' );

wp_oembed_add_provider( '#https?://me.sh/.*#i', 'https://me.sh/oembed?format=json', true );
