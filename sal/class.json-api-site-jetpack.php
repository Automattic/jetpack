<?php

class WPORG_Platform {
	static function get_site( $blog_id ) {
		require_once dirname( __FILE__ ) . '/class.json-api-site-jetpack.php';
		return new Jetpack_Site( $blog_id );
	}
}

function wpcom_get_sal_site( $blog_id ) {
	return WPORG_Platform::get_site( $blog_id );
}
