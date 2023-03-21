<?php
/**
 * Every Data Sync endpoint should be protected by nonce that belongs to an authenticated user.
 * and is generated and verified for that specific endpoint.
 *
 * @package automattic/jetpack-wp-js-data-sync
 */

namespace Automattic\Jetpack\WP_JS_Data_Sync\Endpoints;

class Authenticated_Nonce {

	/**
	 * @var string Which nonce action to verify?
	 */
	private $action;

	public function __construct( $name ) {
		$this->action = $name;
	}

	public function create() {

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG && ! did_action( 'set_current_user' ) ) {
			throw new \Exception( "Debug: Attempting to create {$this->action} nonce before the user is set." );
		}
		return wp_create_nonce( $this->action );
	}

	public function verify( $nonce ) {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG && ! did_action( 'set_current_user' ) ) {
			throw new \Exception( "Debug: Attempting to validate {$this->action} nonce before the user is set." );
		}

		return wp_verify_nonce( $nonce, $this->action );
	}
}
