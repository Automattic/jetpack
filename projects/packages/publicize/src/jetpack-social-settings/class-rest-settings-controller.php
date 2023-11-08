<?php
/**
 * Class used to register REST API auto-conversion settings endpoints.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Jetpack_Social_Settings;

use Automattic\Jetpack\Publicize\Social_Image_Generator\Templates;
use WP_Error;
use WP_REST_Controller;
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
			'/jetpack-social/settings',
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
	 * GET `/jetpack/v4/jetpack-social/settings`
	 *
	 * @return WP_REST_Response
	 */
	public function get_settings() {
		$settings = new Settings();
		$response = $settings->get_settings();

		return rest_ensure_response( $response );
	}

	/**
	 * POST `/jetpack/v4/jetpack-social/settings`
	 *
	 * @param WP_REST_Request $request The API request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_settings( $request ) {
		$settings = new Settings();

		if ( isset( $request['autoConversionSettings'] ) ) {
			$settings->update_auto_conversion_settings( $request['autoConversionSettings'] );
		}

		if ( isset( $request['socialImageGeneratorSettings'] ) ) {
			$settings->update_social_image_generator_settings( $request['socialImageGeneratorSettings'] );
		}

		return rest_ensure_response( $this->get_settings() );
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
			'title'      => 'jetpack-social-settings',
			'type'       => 'object',
			'properties' => array(
				'autoConversionSettings'       => array(
					'description' => __( 'The auto-conversion settings for Jetpack Social', 'jetpack-publicize-pkg' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit' ),
					'properties'  => array(
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
				),
				'socialImageGeneratorSettings' => array(
					'description' => __( 'The Social Image Generator settings for Jetpack Social', 'jetpack-publicize-pkg' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit' ),
					'properties'  => array(
						'enabled'  => array(
							'description' => __( 'Whether or not Social Image Generator is enabled.', 'jetpack-publicize-pkg' ),
							'type'        => 'boolean',
							'context'     => array( 'view', 'edit' ),
						),
						'defaults' => array(
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
				),
			),
		);

		return rest_default_additional_properties_to_false( $schema );
	}
}
