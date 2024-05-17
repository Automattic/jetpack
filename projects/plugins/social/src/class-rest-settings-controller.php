<?php
/**
 * The Social Rest Controller class.
 * Registers the REST routes for Social.
 *
 * @package automattic/jetpack-social-plugin
 */

namespace Automattic\Jetpack\Social;

use Automattic\Jetpack\Modules;
use Jetpack_Social;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Registers the REST routes for Social.
 */
class REST_Settings_Controller extends WP_REST_Controller {
	/**
	 * Registers the REST routes for Social.
	 *
	 * @access public
	 * @static
	 */
	public function register_rest_routes() {
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
		register_rest_route(
			'jetpack/v4',
			'/social/review-dismiss',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_review_dismissed' ),
					'permission_callback' => array( $this, 'require_publish_posts_permission_callback' ),
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
			esc_html__( 'You are not allowed to perform this action.', 'jetpack-social' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Check to see if a user is able to publish posts
	 *
	 * @return bool|WP_Error
	 */
	public function require_publish_posts_permission_callback() {
		if ( current_user_can( 'publish_posts' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			esc_html__( 'You are not allowed to perform this action.', 'jetpack-social' ),
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
			$data['publicize_active'] = Jetpack_Social::is_publicize_active();
		}

		if ( rest_is_field_included( 'show_pricing_page', $fields ) ) {
			$data['show_pricing_page'] = Jetpack_Social::should_show_pricing_page();
		}

		$note = new Note();

		if ( rest_is_field_included( 'social_notes_enabled', $fields ) ) {
			$data['social_notes_enabled'] = $note->enabled();
		}

		if ( rest_is_field_included( 'social_notes_config', $fields ) ) {
			$data['social_notes_config'] = $note->get_config();
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

		$note = new Note();

		foreach ( array_keys( $settings ) as $name ) {
			if ( ! array_key_exists( $name, $params ) ) {
				continue;
			}

			switch ( $name ) {
				case 'publicize_active':
					$updated = ( new Modules() )->update_status( \Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG, (bool) $params[ $name ], false, false );
					if ( is_wp_error( $updated ) ) {
						return $updated;
					}
					break;
				case 'show_pricing_page':
					update_option( Jetpack_Social::JETPACK_SOCIAL_SHOW_PRICING_PAGE_OPTION, (int) $params[ $name ] );
					break;
				case 'social_notes_enabled':
					$note->set_enabled( (bool) $params[ $name ] );
					break;
				case 'social_notes_config':
					$note->update_config( $params[ $name ] );
					break;
			}
		}

		return $this->get_item( $request );
	}

	/**
	 * Updates the boolean value that dismisses the request to review the plugin
	 *
	 * @param WP_REST_Request $request - REST Request.
	 * @return WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function update_review_dismissed( $request ) {
		$params    = $request->get_params();
		$dismissed = $params['dismissed'];

		if ( ! update_option( Jetpack_Social::JETPACK_SOCIAL_REVIEW_DISMISSED_OPTION, (bool) $dismissed ) ) {
			return new WP_Error(
				'rest_cannot_edit',
				__( 'Failed to update the review_request_dismiss', 'jetpack-social' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response( true );
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
				'publicize_active'     => array(
					'description' => __( 'Is the publicize module enabled?', 'jetpack-social' ),
					'type'        => 'boolean',
					'context'     => array( 'view', 'edit' ),
				),
				'show_pricing_page'    => array(
					'description' => __( 'Should we show the pricing page?', 'jetpack-social' ),
					'type'        => 'boolean',
					'context'     => array( 'view', 'edit' ),
				),
				'social_notes_enabled' => array(
					'description' => __( 'Is the social notes feature enabled?', 'jetpack-social' ),
					'type'        => 'boolean',
					'context'     => array( 'view', 'edit' ),
				),
				'social_notes_config'  => array(
					'description' => __( 'The social notes configuration', 'jetpack-social' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit' ),
					'properties'  => array(
						'append_link' => array(
							'description' => __( 'Whether to append the post link when sharing the note.', 'jetpack-social' ),
							'type'        => 'boolean',
							'context'     => array( 'view', 'edit' ),
						),
						'link_format' => array(
							'description' => __( 'Link format', 'jetpack-social' ),
							'type'        => 'string',
							'enum'        => array( 'full_url', 'shortlink', 'permashortcitation' ),
							'context'     => array( 'view', 'edit' ),
						),
					),
				),
			),
		);
		return $this->add_additional_fields_schema( $schema );
	}
}
