<?php

namespace Automattic\Jetpack_Boost\REST_API\Permissions;

use Automattic\Jetpack_Boost\REST_API\Contracts\Permission;

/**
 * Nonces are tricky in REST.
 *
 * `rest_api_init` action is only tirgered when visiting an URL that looks like a REST Endopint.
 * This means that if nonces are generated there, they won't be available in regular
 * `init` or `admin_init` parts of the app. But that's exactly where we need them.
 *
 * So we need a way to both generate named nonces, but also know what nonces
 * we have generated and pass them to the front-end of the application.
 *
 * To do this without scattering nonce names across the application,
 * this class is using static properties while complying to with
 * the Permission contract and keeping track of the nonces
 * that have been generated, that way they can be
 * retrieved later using:
 *
 * Nonce::get_generated_nonces()
 */
class Nonce implements Permission {

	/**
	 * WordPress calls nonce keys "actions"
	 *
	 * @var string The nonce key to validate
	 */
	private $action;

	/**
	 * @var string Key used by `verify` method to validate \WP_Request
	 */
	private $request_key;

	/**
	 * Whenever this class is invoked, it will statically save the generated nonce
	 * So that they can be retrieved and passed to the admin UI
	 *
	 * @var array Associate array of nonces
	 */
	private static $saved_nonces = array();

	public function __construct( $action, $request_key = 'nonce' ) {
		$this->action      = $action;
		$this->request_key = $request_key;
		$this->generate_nonce();
	}

	public function verify( $request ) {
		if ( ! isset( $request[ $this->request_key ] ) ) {
			return false;
		}
		return false !== wp_verify_nonce( $request[ $this->request_key ], $this->action );
	}

	public function generate_nonce() {
		$nonce = wp_create_nonce( $this->action );
		static::save_generated_nonce( $this->action, $nonce );

		return $nonce;
	}

	/**
	 * Keep track of the nonces created using this class.
	 *
	 * @param string $action - The action where this nonce is used.
	 * @param string $nonce  - The nonce value.
	 *
	 * @return void
	 */
	private static function save_generated_nonce( $action, $nonce ) {
		static::$saved_nonces[ $action ] = $nonce;
	}

	/**
	 * @return array Array of saved [action => nonce] pairs.
	 */
	public static function get_generated_nonces() {
		return static::$saved_nonces;
	}
}
