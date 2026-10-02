<?php
/**
 * What every Sharing & Likes REST controller shares.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\REST;

use WP_Error;
use WP_REST_Controller;

/**
 * Namespace and authorization for the routes behind Settings > Sharing.
 */
abstract class Controller extends WP_REST_Controller {

	/**
	 * Set the namespace every route shares.
	 */
	public function __construct() {
		$this->namespace = Endpoints::REST_NAMESPACE;
	}

	/**
	 * Site administrators only, as for the screen.
	 *
	 * @return true|WP_Error
	 */
	public function permission_check() {
		if ( current_user_can( 'manage_options' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			__( 'Sorry, you are not allowed to manage sharing settings on this site.', 'jetpack-sharing-likes' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}
}
