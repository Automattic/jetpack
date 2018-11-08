<?php

/*
 * TODO
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
			'type' => 'array',
			'context' => array( 'view', 'edit' ),
			'items' => $this->post_connection_schema(),
		);
	}

	private function post_connection_schema() {
		return array(
			'$schema' => 'http://json-schema.org/draft-04/schema#',
			'title' => 'jetpack-publicize-post-connection',
			'type' => 'object',
			'properties' => array(
				'id' => array(
					'description' => __( 'Unique identifier for the Publicize Connection', 'jetpack' ),
					'type' => 'string',
					'context' => array( 'view', 'edit' ),
					'readonly' => true,
				),
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

			$output_connection['id'] = (string) $connection['unique_id'];

			$output_connections[] = $output_connection;
		}

		return $output_connections;
	}

	public function update( $requested_connections, $post, $request ) {
		global $publicize;

		$available_connections = $publicize->get_filtered_connection_data( $post->ID );

		$changed_connections = array();

		$available_connections_by_unique_id = array();
		$available_connections_by_service_name = array();
		foreach ( $available_connections as $available_connection ) {
			$available_connections_by_unique_id[$available_connection['unique_id']] = $available_connection;

			if ( ! isset( $available_connections_by_service_name[$available_connection['service_name']] ) ) {
				$available_connections_by_service_name[$available_connection['service_name']] = array();
			}
			$available_connections_by_service_name[$available_connection['service_name']][] = $available_connection;
		}

		// { service_name: $service_name, enabled: (bool) }
		foreach ( $requested_connections as $requested_connection ) {
			if ( ! isset( $requested_connection['service_name'] ) ) {
				continue;
			}

			if ( ! isset( $available_connections_by_service_name[$requested_connection['service_name']] ) ) {
				continue;
			}

			foreach ( $available_connections_by_service_name[$requested_connection['service_name']] as $available_connection ) {
				$changed_connections[$available_connection['unique_id']] = $requested_connection['enabled'];
			}
		}

		// { id: $id, enabled: (bool) }
		// These override the service_name settings
		foreach ( $requested_connections as $requested_connection ) {
			if ( ! isset( $requested_connection['id'] ) ) {
				continue;
			}

			if ( ! isset( $available_connections_by_unique_id[$requested_connection['id']] ) ) {
				continue;
			}

			$changed_connections[$requested_connection['id']] = $requested_connection['enabled'];
		}

		foreach ( $changed_connections as $unique_id => $enabled ) {
			$connection = $available_connections_by_unique_id[$unique_id];

			if ( $connection['done'] || ! $connection['toggleable'] ) {
				continue;
			}

			$available_connections_by_unique_id[$unique_id]['enabled'] = $enabled;
		}

		foreach ( $available_connections_by_unique_id as $unique_id => $available_connection ) {
			if ( $available_connection['enabled'] ) {
				delete_post_meta( $post->ID, $publicize->POST_SKIP . $unique_id );
			} else {
				update_post_meta( $post->ID, $publicize->POST_SKIP . $unique_id, 1 );
			}
		}
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Post_Publicize_Connections_Field' );
