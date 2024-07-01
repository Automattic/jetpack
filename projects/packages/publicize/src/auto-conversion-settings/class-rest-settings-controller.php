<?php
/**
 * Class used to register REST API auto-conversion settings endpoints.
 *
 * Flagged to be removed after deprecation.
 *
 * @deprecated $$next_version$$
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Auto_Conversion;

use Automattic\Jetpack\Publicize\Jetpack_Social_Settings\Settings as Jetpack_Social_Settings;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Defines our endpoints.
 */
class REST_Settings_Controller extends WP_REST_Controller {
	/**
	 * Register REST API endpoints.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/auto-conversion/settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_auto_coversion_settings' ),
					'permission_callback' => array( $this, 'settings_permissions_callback' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update_auto_coversion_settings' ),
					'permission_callback' => array( $this, 'settings_permissions_callback' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * GET `/jetpack/v4/auto-conversion/settings`
	 *
	 * @return WP_REST_Response
	 */
	public function get_auto_coversion_settings() {
		$settings   = ( new Jetpack_Social_Settings() )->get_settings();
		$response   = array();
		$schema     = $this->get_item_schema();
		$properties = array_keys( $schema['properties'] );

		if ( in_array( 'image', $properties, true ) ) {
			$response['image'] = $settings['autoConversionSettings']['enabled'];
		}

		if ( in_array( 'auto-conversion', $properties, true ) ) {
			$response['auto-conversion'] = $settings['autoConversionSettings']['enabled'];
		}

		return rest_ensure_response( $response );
	}

	/**
	 * POST `/jetpack/v4/auto-conversion/settings`
	 *
	 * @param WP_REST_Request $request The API request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_auto_coversion_settings( $request ) {
		$settings = new Jetpack_Social_Settings();

		if ( isset( $request['image'] ) ) {
			$settings->update_auto_conversion_setting( array( 'enabled' => $request['image'] ) );
		}

		return rest_ensure_response( $this->get_auto_coversion_settings() );
	}

	/**
	 * Check the permissions for accessing and updating the settings endpoint.
	 *
	 * @return bool|WP_Error True if user can manage options.
	 */
	public function settings_permissions_callback() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error(
				'rest_forbidden_context',
				__( 'Sorry, you are not allowed to access this endpoint.', 'jetpack-publicize-pkg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Retrieves the settings schema, conforming to JSON Schema.
	 *
	 * @return array Schema data.
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'auto-conversion-settings',
			'type'       => 'object',
			'properties' => array(
				'image'           => array(
					'description' => __( 'Whether or not auto-conversion for images is enabled.', 'jetpack-publicize-pkg' ),
					'type'        => 'boolean',
					'context'     => array( 'view', 'edit' ),
				),
				'video'           => array(
					'description' => __( 'Whether or not auto-conversion for videos is enabled.', 'jetpack-publicize-pkg' ),
					'type'        => 'boolean',
					'context'     => array( 'view', 'edit' ),
				),
				'auto-conversion' => array(
					'description' => __( 'Whether or not auto-conversion is enabled.', 'jetpack-publicize-pkg' ),
					'type'        => 'boolean',
					'context'     => array( 'view', 'edit' ),
				),
			),
		);

		return rest_default_additional_properties_to_false( $schema );
	}
}
