<?php

class WPORG_Platform {
	static function get_site( $blog_id, SAL_Token $token ) {
		require_once dirname( __FILE__ ) . '/class.json-api-site-jetpack.php';
		return new Jetpack_Site( $blog_id, $token );
	}
}

function wpcom_get_sal_site( $blog_id, $token ) {
	if ( is_array( $token ) ) {
		$token = SAL_Token::from_rest_token( $token );
	} else {
		$token = SAL_Token::for_anonymous_user();
	}

	return WPORG_Platform::get_site( $blog_id, $token );
}
