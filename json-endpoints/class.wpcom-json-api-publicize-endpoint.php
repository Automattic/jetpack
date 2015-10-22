<?php

class WPCOM_JSON_API_Get_Connections_Endpoint extends WPCOM_JSON_API_Endpoint {
	// /sites/%s/connections
	function callback( $path = '', $blog_id = 0 ) {
		// Verify required Publicize Jetpack module is active
		if ( ! class_exists( 'Publicize' ) || ( method_exists( 'Jetpack', 'is_module_active' ) && ! Jetpack::is_module_active( 'publicize' ) ) ) {
			return new WP_Error( 'missing_jetpack_module', 'The Publicize module must be activated in order to use this endpoint.', 400 );
		}

		// Authenticate user
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ), false );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$current_user = wp_get_current_user();
		if ( ! $current_user->ID ) {
			return new WP_Error( 'authorization_required', 'An active access token must be used to query information about the current user.', 403 );
		}

		// Parse query arguments to determine if filtering is requested
		$args = $this->query_args();
		$service_filter = false;
		if ( ! empty( $args['service'] ) ) {
			$service_filter = $args['service'];
		}

		// Iterate over connected services
		$publicize = new Publicize();
		$connected_services = $publicize->get_services( 'connected' );
		$output = array();
		foreach( $connected_services as $service => $connections ) {
			if ( false != $service_filter && $service_filter != $service ) {
				continue;
			}

			foreach ( $connections as $connection_id => $connection ) {
				$output[] = WPCOM_JSON_API_Get_Connection_Endpoint::get_connection( $service, $connection );
			}
		}

		return array( 'connections' => $output );
	}
}

class WPCOM_JSON_API_Get_Connection_Endpoint extends WPCOM_JSON_API_Endpoint {
	function get_connection_by_id( $connection_id ) {
		$publicize = new Publicize();

		$connected_services = $publicize->get_services( 'connected' );
		foreach ( $connected_services as $service => $connections ) {
			foreach ( $connections as $c => $connection ) {
				if ( $connection_id == $publicize->get_connection_id( $connection ) ) {
					return WPCOM_JSON_API_Get_Connection_Endpoint::get_connection( $service, $connections[ $c ] );
				}
			}
		}

		return false;
	}

	function get_connection( $service, $connection ) {
		$publicize = new Publicize();

		$connection_id = $publicize->get_connection_id( $connection );
		if ( method_exists( $connection, 'get_meta' ) ) {
			$connection_meta = $connection->get_meta();
			$connection_data = (array) $connection->get_meta( 'connection_data' );
		} else {
			$connection_meta = $connection;
			$connection_data = $connection['connection_data'];
		}

		return array(
			'ID'               => (int) $connection_id,
			'token_ID'         => (int) $connection_data['token_id'],
			'conn_ID'          => (int) $connection_id,
			'site_ID'          => (int) $connection_data['blog_id'],
			'user_ID'          => (int) $connection_data['user_id'],
			'shared'           => ( 0 == (int) $connection_data['user_id'] ) ? true : false,
			'service'          => $service,
			'label'            => $publicize->get_service_label( $service ),
			'issued'           => $connection_meta['issued'],
			'expires'          => $connection_meta['expires'],
			'external_ID'      => $connection_meta['external_id'],
			'external_name'    => $connection_meta['external_name'],
			'external_display' => $publicize->get_display_name( $service, $connection ),
			'URL'              => $publicize->get_profile_link( $service, $connection ),
			'status'           => ( method_exists( $connection, 'is_expired' ) && $connection->is_expired( HOUR_IN_SECONDS ) ) ? 'broken' : 'ok',
			'refresh_url'      => $publicize->refresh_url( $service ),
			'meta'             => maybe_unserialize( $connection_data['meta'] ),
		);
	}

	// /sites/%s/connections/$connection_id
	function callback( $path = '', $blog_id = 0, $connection_id = 0 ) {
		// Verify required Publicize Jetpack module is active
		if ( ! class_exists( 'Publicize' ) || ( method_exists( 'Jetpack', 'is_module_active' ) && ! Jetpack::is_module_active( 'publicize' ) ) ) {
			return new WP_Error( 'missing_jetpack_module', 'The Publicize module must be activated in order to use this endpoint.', 400 );
		}

		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ), false );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$current_user = wp_get_current_user();
		if ( ! $current_user->ID ) {
			return new WP_Error( 'authorization_required', 'An active access token must be used to query information about the current user.', 403 );
		}

		// Attempt to find connection
		$connection = WPCOM_JSON_API_Get_Connection_Endpoint::get_connection_by_id( $connection_id );

		// Verify that user has permission to view this connection
		if ( $current_user->ID != $connection['user_ID'] && 0 != $connection['user_ID'] ) {
			return new WP_Error( 'authorization_required', 'You do not have permission to access this resource.', 403 );
		}

		if ( empty( $connection ) ) {
			return new WP_Error( 'unknown_connection', 'Connection not found.', 404 );
		}

		return $connection;
	}
}

class WPCOM_JSON_API_Delete_Connection_Endpoint extends WPCOM_JSON_API_Endpoint {
	// /sites/%s/connections/$connection_id/delete
	function callback( $path = '', $blog_id = 0 , $connection_id = 0 ) {
		// Verify required Publicize Jetpack module is active
		if ( ! class_exists( 'Publicize' ) || ( method_exists( 'Jetpack', 'is_module_active' ) && ! Jetpack::is_module_active( 'publicize' ) ) ) {
			return new WP_Error( 'missing_jetpack_module', 'The Publicize module must be activated in order to use this endpoint.', 400 );
		}

		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ), false );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$current_user = wp_get_current_user();
		if ( ! $current_user->ID ) {
			return new WP_Error( 'authorization_required', 'An active access token must be used to query information about the current user.', 403 );
		}

		// Attempt to find connection
		$connection = WPCOM_JSON_API_Get_Connection_Endpoint::get_connection_by_id( $connection_id );

		if ( empty( $connection ) ) {
			return new WP_Error( 'unknown_connection', 'Connection not found.', 404 );
		}

		// Verify that user has permission to view this connection
		if ( $current_user->ID != $connection['user_ID'] && 0 != $connection['user_ID'] ) {
			return new WP_Error( 'authorization_required', 'You do not have permission to access this resource.', 403 );
		}

		// Remove publicize connections related to the connection
		$publicize = new Publicize();
		$is_deleted = ( false !== $publicize->disconnect( $connection['service'], $connection_id ) );

		if ( $is_deleted ) {
			/**
			 * Fires when a Publicize connection is deleted.
			 *
			 * @module json-api
			 *
			 * @since 3.2.0
			 *
			 * @param int $connection_id Publicize connection ID.
			 */
			do_action( 'rest_api_delete_publicize_connection', $connection_id );
		}

		return array(
			'ID' => (int) $connection_id,
			'deleted' => $is_deleted
		);
	}
}
