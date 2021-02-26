<?php

require_once dirname( __FILE__ ) . '/class.json-api-token.php';

abstract class SAL_Platform {
	public $token;

	function __construct( $token ) {
		if ( is_array( $token ) ) {
			$token = SAL_Token::from_rest_token( $token );
		} else {
			$token = SAL_Token::for_anonymous_user();
		}

		$this->token = $token;
	}

	abstract public function get_site( $blog_id );
}

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	require_once dirname( __FILE__ ) . '/class.json-api-platform-wpcom.php';
} else {
	require_once dirname( __FILE__ ) . '/class.json-api-platform-jetpack.php';
}
