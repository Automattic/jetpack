<?php

require_once dirname( __FILE__ ) . '/class.json-api-platform.php';

class WPORG_Platform extends SAL_Platform {
	public function get_site( $blog_id ) {
		require_once dirname( __FILE__ ) . '/class.json-api-site-jetpack.php';
		return new Jetpack_Site( $blog_id, $this );
	}
}

function wpcom_get_sal_platform( $token ) {
	return new WPORG_Platform( $token );
}
