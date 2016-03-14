<?php

class WPORG_Platform extends SAL_Platform {
	static function get_site( $blog_id ) {
		require_once dirname( __FILE__ ) . '/class.json-api-site-jetpack.php';
		return new Jetpack_Site( $blog_id );
	}
}