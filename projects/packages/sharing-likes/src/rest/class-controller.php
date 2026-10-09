<?php
/**
 * What every Sharing & Likes REST controller shares.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\REST;

use Automattic\Jetpack\Sharing_Likes\Settings\Environment;
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
	 * Site administrators only, and only where the screen exists.
	 *
	 * @return true|WP_Error
	 */
	public function permission_check() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to manage sharing settings on this site.', 'jetpack-sharing-likes' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		// Per request, not at registration: see `Endpoints::init()`.
		if ( ! Environment::settings_screen_supported() ) {
			return new WP_Error(
				'rest_sharing_likes_unavailable',
				__( 'Sharing settings are not available on this site until it is connected to WordPress.com.', 'jetpack-sharing-likes' ),
				array( 'status' => 409 )
			);
		}

		return true;
	}
}
