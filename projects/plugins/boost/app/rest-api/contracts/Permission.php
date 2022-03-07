<?php

namespace Automattic\Jetpack_Boost\REST_API\Contracts;

/**
 * API Endpoints have permissions that are checked by WordPress on `permission_callback`.
 *
 * These permissions repeat themselves, for example:
 *  * current_user_can
 *  * wp_verify_nonce
 *
 * And in the case of nonces - they also need to interact with the rest of the application.
 * Permission contract helps make the permission callbacks more predictable.
 * This is especially necessary to deal with nonces
 * (or more on that, read `permissions/Nonce.php`
 */
interface Permission {
	/**
	 * A method to verify whether this request
	 * can be run in the current environment.
	 *
	 * @param \WP_REST_Request $request
	 *
	 * @return bool
	 */
	public function verify( $request );
}
