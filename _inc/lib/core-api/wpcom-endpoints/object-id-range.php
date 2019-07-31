<?php

use Automattic\Jetpack\Sync\Modules;

class WPCOM_REST_API_V2_Endpoint_Object_Id_Range {
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes() {
		register_rest_route( 'wpcom/v2', '/object-id-range', array(
			array(
				'methods'     => WP_REST_Server::READABLE,
				'callback'    => array( $this, 'get_range' ),
				'description' => 'An endpoint to retrieve the minimum and maximum ID from the database table corresponding to the given object type.',
				'args'        => array(
					'module_name' => array(
						'type'    => 'string',
						'default' => 'posts',
						'enum'    => array(
							'posts',
							'comments',
							'users',
							'terms',
							'term_relationships',
						)
					),
					'batch_size'  => array(
						'type'    => 'integer',
						'default' => 1000
					)
				),
			),
		) );
	}

	public function get_range( $request ) {
		$module_name = $request->get_param( 'module_name' );
		$batch_size  = $request->get_param( 'batch_size' );
		$module      = Modules::get_module( $module_name );

		return $module->get_min_max_object_ids_for_batches( $batch_size );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Object_Id_Range' );
