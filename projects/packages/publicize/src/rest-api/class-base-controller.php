<?php
/**
 * Base Controller class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Status\Host;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Base controller for Publicize endpoints.
 */
abstract class Base_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->wpcom_is_wpcom_only_endpoint = true;
	}

	/**
	 * Check if we are on WPCOM.
	 *
	 * @return bool
	 */
	public static function is_wpcom() {
		return ( new Host() )->is_wpcom_simple();
	}

	/**
	 * Filters out data based on ?_fields= request parameter
	 *
	 * @param array           $item    Item to prepare.
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response filtered item
	 */
	public function prepare_item_for_response( $item, $request ) {

		$fields = $this->get_fields_for_response( $request );

		$response_data = array();
		foreach ( $item as $field => $value ) {
			if ( rest_is_field_included( $field, $fields ) ) {
				$response_data[ $field ] = $value;
			}
		}

		return rest_ensure_response( $response_data );
	}

	/**
	 * Verify that user can access Publicize data
	 *
	 * @return true|WP_Error
	 */
	public function get_items_permission_check() {
		global $publicize;

		if ( ! $publicize ) {
			return new WP_Error(
				'publicize_not_available',
				__( 'Sorry, Jetpack Social is not available on your site right now.', 'jetpack-publicize-pkg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( $publicize->current_user_can_access_publicize_data() ) {
			return true;
		}

		return new WP_Error(
			'invalid_user_permission_publicize',
			__( 'Sorry, you are not allowed to access Jetpack Social data on this site.', 'jetpack-publicize-pkg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}
}
