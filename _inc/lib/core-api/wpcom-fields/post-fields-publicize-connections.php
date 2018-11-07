<?php

/*
 * TODO
 * Object (hash) or array (list) for connections? Currently object.
 * Always return connectionns? What about permissions?
 */

/**
 * Publicize: get connection list data for current user and post id.
 */
class WPCOM_REST_API_V2_Post_Publicize_Connections_Field extends WPCOM_REST_API_V2_Field_Controller {
	protected $object_type = 'post';
	protected $field_name = 'jetpack_publicize_connections';

	public function get_schema() {
		return array(
			'$schema' => 'http://json-schema.org/draft-04/schema#',
			'title' => 'jetpack-publicize-post-connections',
			'type' => 'object',
			'context' => array( 'view', 'edit' ),
			'patternProperties' => array(
				'^[a-z0-9]+$' => $this->post_connection_schema(),
			),
			'additionalProperties' => false,
		);
	}

	private function post_connection_schema() {
		return array(
			'$schema' => 'http://json-schema.org/draft-04/schema#',
			'title' => 'jetpack-publicize-post-connection',
			'type' => 'object',
			'context' => array( 'view', 'edit' ),
			'properties' => array(
				'service_name' => array(
					'description' => __( 'Alphanumeric identifier for the Publicize Service', 'jetpack' ),
					'type' => 'string',
					'context' => array( 'view', 'edit' ),
					'readonly' => true,
				),
				'display_name' => array(
					'description' => __( 'Username of the connected account', 'jetpack' ),
					'type' => 'string',
					'context' => array( 'view', 'edit' ),
					'readonly' => true,
				),
				'enabled' => array(
					'description' => __( 'Whether to share to this connection', 'jetpack' ),
					'type' => 'boolean',
					'context' => array( 'edit' ),
				),
				'done' => array(
					'description' => __( 'Whether Publicize has already finished sharing for this post', 'jetpack' ),
					'type' => 'boolean',
					'context' => array( 'edit' ),
					'readonly' => true,
				),
				'toggleable' => array(
					'description' => __( 'Whether `enable` can be changed for this post/connection', 'jetpack' ),
					'type' => 'boolean',
					'context' => array( 'edit' ),
					'readonly' => true,
				),
				'url' => array(
					'description' => __( 'The URL of the post as shared on the service', 'jetpack' ),
					'type' => 'boolean',
					'context' => array( 'view', 'edit' ),
					'readonly' => true,
				),
			),
		);
	}

	function get_permission_check( $request ) {
		// @todo?
		return true;
	}

	public function update_permission_check( $value, $request ) {
		if ( current_user_can( 'publish_posts' ) ) {
			return true;
		}

		return new WP_Error(
			'invalid_user_permission_publicize',
			Jetpack_Core_Json_Api_Endpoints::$user_permissions_error_msg,
			array( 'status' => Jetpack_Core_Json_Api_Endpoints::rest_authorization_required_code() )
		);
	}

	/**
	 * Retrieve current list of connected social accounts for a given post.
	 *
	 * @see Publicize::get_filtered_connection_data()
	 *
	 * @since 6.7.0
	 *
	 * @param array $post_array post data
	 * @param WP_REST_Request
	 *
	 * @return string JSON encoded connection list data.
	 */
	public function get( $post_array, $request ) {
		global $publicize;

		$schema = $this->post_connection_schema();
		$properties = array_keys( $schema['properties'] );

		$connections = $publicize->get_filtered_connection_data( $post_array['id'] );

		$output_connections = array();
		foreach ( $connections as $connection ) {
			$output_connection = array();
			foreach ( $properties as $property  ) {
				if ( isset( $connection[$property] ) ) {
					$output_connection[$property] = $connection[$property];
				}
			}

			$output_connections[(string) $connection['unique_id']] = $output_connection;
		}

		return $output_connections;
	}

	public function update( $connections, $post_array, $request ) {
		$permission_check = $this->permission_check();

		if ( is_wp_error( $permission_check ) ) {
			return $permission_check;
		}

		// @todo - implement :)
		// support { $unique_id: { enabled: true } } and { $service_name: { enabled: true } }?
		return 'ok';
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Post_Publicize_Connections_Field' );
