<?php
/**
 * Contact REST controller.
 *
 * @package Automattic\Jetpack_CRM\REST_API
 */

namespace Automattic\Jetpack_CRM\REST_API\V4;

use Automattic\Jetpack_CRM\REST_API\Util\Authentication;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * Contact REST controller.
 *
 * @package Automattic\Jetpack_CRM\REST_API
 */
class Contact_Controller extends Base {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->rest_base = 'contact';

		parent::__construct();
	}

	/**
	 * Register endpoint routes.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}",
			array(
				array(
					'auth_method'       => Authentication::AUTH_USER,
					'user_capabilities' => array( 'administrator', 'jetpack_crm_manage_contacts' ),
					'methods'           => WP_REST_Server::READABLE,
					'callback'          => array( $this, 'get_contact' ),
					'args'              => array(
						'id' => array(
							'required'          => true,
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
			)
		);
	}

	/**
	 * Get a contact.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_Error|WP_REST_Response
	 */
	public function get_contact( WP_REST_Request $request ) {
		global $zbs;

		return rest_ensure_response(
			// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$zbs->DAL->contacts->getContacts(
				$request->get_param( 'id' ),
				array( 'withCustomFields' => true )
			)
		);
	}

}
