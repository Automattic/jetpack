<?php


abstract class SAL_Platform {
	abstract static function get_site( $blog_id );
}

require_once dirname( __FILE__ ) . '/class.json-api-platform-jetpack.php';
require_once dirname( __FILE__ ) . '/class.json-api-platform-wpcom.php';

// function get_jetpack_api_site( $blog_id ) {
// 	return WPORG_Platform::get_site( $blog_id );
// }

// add_filter( 'get_wpcom_api_site', 'get_jetpack_api_site' );