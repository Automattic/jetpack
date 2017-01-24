<?php
// TODO: After everything is encapsulated by the WPCOM/Jetpack interface,
// this file can be safely deleted. None of the undefined functions should
// be invoked so long as the Jetpack plugin never believes it is WPCOM.
function wpcom_subs_get_blogs() {}
function enable_follow_buttons() {}
function get_blog_locale() {}
if ( ! function_exists( 'get_blog_option' ) ) :
function get_blog_option() {
	return 'ok';
}
endif;
function blavatar_domain() {}
function blavatar_exists() {}
