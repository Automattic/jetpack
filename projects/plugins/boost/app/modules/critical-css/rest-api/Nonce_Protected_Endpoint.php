<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;

class Nonce_Protected_Endpoint {

	protected $endpoint;

	public function __construct( Boost_Endpoint $endpoint ) {
		$this->endpoint = $endpoint;
	}

	public function permission_callback( $request ) {
		$nonce_key    = $this->endpoint->name();
		$nonce_status = wp_verify_nonce( $request['nonce'], $nonce_key );

		if ( false === $nonce_status ) {
			return false;
		}

		return $this->endpoint->permission_callback( $request );
	}


}