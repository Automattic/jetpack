<?php

function wpcom_subs_get_blogs() {}
function enable_follow_buttons() {}
function stats_extra() {}
function get_blog_locale() {
	return 'en';
}
if ( ! function_exists( 'get_blog_option' ) ) :
function get_blog_option() {
	return 'ok';
}
endif;
function blavatar_domain() {}
function blavatar_exists() {}
function staticize_subdomain( $url ) {
	return $url;
}
function http() {
	return 'https';
}
