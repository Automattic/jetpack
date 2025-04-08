<?php
/**
 * Base Controller class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Publicize\Connections;
use Automattic\Jetpack\Publicize\Publicize_Utils;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Base controller for Publicize endpoints.
 */
abstract class Base_Controller extends WP_REST_Controller {

	/**
	 * Whether to allow requests as blog.
	 *
	 * @var bool
	 */
	protected $allow_requests_as_blog = false;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->wpcom_is_wpcom_only_endpoint = true;
	}

	/**
	 * Check if the request is authorized for the blog.
	 *
	 * @return bool
	 */
	protected static function is_authorized_blog_request() {
		if ( Publicize_Utils::is_wpcom() && is_jetpack_site( get_current_blog_id() ) ) {

			$jp_auth_endpoint = new \WPCOM_REST_API_V2_Endpoint_Jetpack_Auth();

			return $jp_auth_endpoint->is_jetpack_authorized_for_site() === true;
		}

		return false;
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
	protected function publicize_permissions_check() {

		global $publicize;

		if ( ! $publicize ) {
			return new WP_Error(
				'publicize_not_available',
				__( 'Sorry, Jetpack Social is not available on your site right now.', 'jetpack-publicize-pkg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( $this->allow_requests_as_blog && self::is_authorized_blog_request() ) {
			return true;
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

	/**
	 * Check whether the request is allowed to manage (update/delete) a connection.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool True if the request can manage connection, false otherwise.
	 */
	protected function manage_connection_permission_check( $request ) {
		// Editors and above can manage any connection.
		if ( current_user_can( 'edit_others_posts' ) ) {
			return true;
		}

		$connection_id = $request->get_param( 'connection_id' );

		$connection = Connections::get_by_id( $connection_id );

		return Connections::user_owns_connection( $connection );
	}
}
