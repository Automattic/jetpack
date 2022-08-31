<?php

namespace Automattic\Jetpack\Packages\Async_Option;

class Authenticated_Nonce {

	/**
	 * @var string Nonce key
	 */
	private $key;

	public function __construct( $key ) {
		$this->key = $key;
	}

	public function create() {

		if ( defined( "WP_DEBUG" ) && WP_DEBUG && ! did_action( 'set_current_user' ) ) {
			throw new \Exception( "Debug: Attempting to create {$this->key} nonce before the user is set." );
		}
		return wp_create_nonce( $this->key );
	}

	public function verify( $nonce ) {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG && ! did_action( 'set_current_user' ) ) {
			throw new \Exception( "Debug: Attempting to validate {$this->key} nonce before the user is set." );
		}

		return wp_verify_nonce( $nonce, $this->key );
	}
}
