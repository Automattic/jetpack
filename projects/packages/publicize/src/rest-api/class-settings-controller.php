<?php
/**
 * The settings controller class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Publicize\Publicize_Utils;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Registers the REST routes for Social.
 */
class Settings_Controller extends WP_REST_Controller {
	const JETPACK_PUBLICIZE_MODULE_SLUG = 'publicize';

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Registers the REST routes.
	 *
	 * @access public
	 * @static
	 */
	public function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/social/settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'require_admin_privilege_callback' ),
					'args'                => $this->get_endpoint_args_for_item_schema(),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'require_admin_privilege_callback' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
				),
			)
		);
	}

	/**
	 * Only administrators can access the API.
	 *
	 * @return bool|WP_Error True if a blog token was used to sign the request, WP_Error otherwise.
	 */
	public function require_admin_privilege_callback() {
		if ( current_user_can( 'manage_options' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			esc_html__( 'You are not allowed to perform this action.', 'jetpack-publicize-pkg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Updates the settings.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return array|WP_Error Array on success, or error object on failure.
	 */
	public function get_item( $request ) {
		$fields = $this->get_fields_for_response( $request );
		$data   = array();

		if ( rest_is_field_included( 'publicize_active', $fields ) ) {
			$data['publicize_active'] = Publicize_Utils::is_publicize_active();
		}

		return $this->prepare_item_for_response( $data, $request );
	}

	/**
	 * POST `jetpack/v4/social/settings`
	 *
	 * @param WP_REST_Request $request - REST request.
	 */
	public function update_item( $request ) {
		$params   = $request->get_params();
		$settings = $this->get_endpoint_args_for_item_schema( $request->get_method() );

		foreach ( array_keys( $settings ) as $name ) {
			if ( ! array_key_exists( $name, $params ) ) {
				continue;
			}

			switch ( $name ) {
				case 'publicize_active':
					$updated = ( new Modules() )->update_status( self::JETPACK_PUBLICIZE_MODULE_SLUG, (bool) $params[ $name ], false, false );
					if ( is_wp_error( $updated ) ) {
						return $updated;
					}
					break;
			}
		}

		return $this->get_item( $request );
	}

	/**
	 * Prepares the settings data to return from the endpoint.
	 * Includes checking the values against the schema.
	 *
	 * @param array           $settings  The settings data to prepare.
	 * @param WP_REST_Request $request   REST request.
	 * @return array|WP_Error The prepared settings or a WP_Error on failure.
	 */
	public function prepare_item_for_response( $settings, $request ) {
		$args   = $this->get_endpoint_args_for_item_schema( $request->get_method() );
		$return = array();
		foreach ( $settings as $name => $value ) {
			if ( empty( $args[ $name ] ) ) {
				// This setting shouldn't be returned.
				continue;
			}
			$is_valid = rest_validate_value_from_schema( $value, $args[ $name ], $name );
			if ( is_wp_error( $is_valid ) ) {
				return $is_valid;
			}
			$sanitized = rest_sanitize_value_from_schema( $value, $args[ $name ] );
			if ( is_wp_error( $sanitized ) ) {
				return $sanitized;
			}
			$return[ $name ] = $sanitized;
		}
		return rest_ensure_response( $return );
	}

	/**
	 * Get the settings schema, conforming to JSON Schema.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'system_status',
			'type'       => 'object',
			'properties' => array(
				'publicize_active' => array(
					'description' => __( 'Is the publicize module enabled?', 'jetpack-publicize-pkg' ),
					'type'        => 'boolean',
					'context'     => array( 'view', 'edit' ),
				),
			),
		);
		return $this->add_additional_fields_schema( $schema );
	}
}
