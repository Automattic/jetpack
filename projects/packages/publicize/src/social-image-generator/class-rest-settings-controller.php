<?php
/**
 * Class used to register REST API settings endpoints used by Social Image Generator.
 *
 * Flagged to be removed after deprecation.
 *
 * @deprecated 0.38.3
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Social_Image_Generator;

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
			'/social-image-generator/settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_settings' ),
					'permission_callback' => array( $this, 'settings_permissions_callback' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update_settings' ),
					'permission_callback' => array( $this, 'settings_permissions_callback' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * GET `/jetpack/v4/social-image-generator/settings`
	 *
	 * @return WP_REST_Response
	 */
	public function get_settings() {
		$settings   = ( new Jetpack_Social_Settings() )->get_settings();
		$response   = array();
		$schema     = $this->get_item_schema();
		$properties = array_keys( $schema['properties'] );

		if ( in_array( 'enabled', $properties, true ) ) {
			$response['enabled'] = $settings['socialImageGeneratorSettings']['enabled'];
		}

		if ( in_array( 'default_image_id', $properties, true ) ) {
			$response['default_image_id'] = $settings['socialImageGeneratorSettings']['default_image_id'];
		}

		if ( in_array( 'defaults', $properties, true ) ) {
			$response['defaults'] = array( 'template' => $settings['socialImageGeneratorSettings']['template'] );
		}

		return rest_ensure_response( $response );
	}

	/**
	 * POST `/jetpack/v4/social-image-generator/settings`
	 *
	 * @param WP_REST_Request $request The API request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_settings( $request ) {
		$settings = new Jetpack_Social_Settings();

		if ( isset( $request['enabled'] ) ) {
			$settings->update_social_image_generator_settings( array( 'enabled' => $request['enabled'] ) );
		}

		if ( isset( $request['default_image_id'] ) ) {
			$settings->update_social_image_generator_settings( array( 'default_image_id' => $request['default_image_id'] ) );
		}

		if ( $request['defaults'] && $request['defaults']['template'] ) {
			$settings->update_social_image_generator_settings( array( 'template' => $request['defaults']['template'] ) );
		}

		return rest_ensure_response( $this->get_settings() );
	}

	/**
	 * Check the permissions for accessing and updating the settings endpoint.
	 *
	 * @return bool|WP_Error True if user can manage options.
	 */
	public function settings_permissions_callback() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden_context',
				__( 'Sorry, you are not allowed to access this endpoint.', 'jetpack-publicize-pkg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Retrieves the Social Image Generator's settings schema, conforming to JSON Schema.
	 *
	 * @return array Schema data.
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'social-image-generator-settings',
			'type'       => 'object',
			'properties' => array(
				'enabled'          => array(
					'description' => __( 'Whether or not Social Image Generator is enabled.', 'jetpack-publicize-pkg' ),
					'type'        => 'boolean',
					'context'     => array( 'view', 'edit' ),
				),
				'default_image_id' => array(
					'description' => __( 'The default image ID for the Social Image Generator.', 'jetpack-publicize-pkg' ),
					'type'        => 'number',
					'context'     => array( 'view', 'edit' ),
				),
				'defaults'         => array(
					'description' => __( 'The default settings for a new generated image.', 'jetpack-publicize-pkg' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit' ),
					'properties'  => array(
						'template' => array(
							'type' => 'string',
							'enum' => Templates::TEMPLATES,
						),
					),
				),
			),
		);

		return rest_default_additional_properties_to_false( $schema );
	}
}
