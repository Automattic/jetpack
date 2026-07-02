<?php
/**
 * REST API endpoint for managing VideoPress caption tracks.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_REST_Controller;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * VideoPress caption tracks wpcom api v2 endpoint. Registered under `wpcom/v2`
 * (rather than `jetpack/v4`) so the same routes serve WordPress.com Simple
 * sites, which don't load the Jetpack namespace.
 *
 * @phan-constructor-used-for-side-effects
 */
class WPCOM_REST_API_V2_Endpoint_VideoPress_Caption_Tracks extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'videopress/caption-tracks';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the routes.
	 */
	public function register_routes() {
		/*
		 * The routes store tracks in the caption-track CPT; make sure it and its
		 * meta sanitizers exist even where the package initializer didn't run
		 * (WordPress.com Simple loads only this endpoint file).
		 */
		if ( ! post_type_exists( Caption_Tracks::POST_TYPE ) ) {
			Caption_Tracks::register_post_type();
			Caption_Tracks::register_meta();
		}

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( Caption_Tracks::class, 'rest_list_tracks' ),
					'permission_callback' => array( Caption_Tracks::class, 'rest_permission_check' ),
					'args'                => array(
						'guid' => array(
							'description' => __( 'VideoPress GUID.', 'jetpack-videopress-pkg' ),
							'type'        => 'string',
							'required'    => true,
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( Caption_Tracks::class, 'rest_save_track' ),
					'permission_callback' => array( Caption_Tracks::class, 'rest_permission_check' ),
					'args'                => Caption_Tracks::save_track_args(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)',
			array(
				array(
					// @phan-suppress-next-line PhanPluginMixedKeyNoKey -- register_rest_route() supports a shared `args` key alongside endpoint arrays.
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( Caption_Tracks::class, 'rest_save_track' ),
					'permission_callback' => array( Caption_Tracks::class, 'rest_permission_check' ),
					'args'                => Caption_Tracks::save_track_args(),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( Caption_Tracks::class, 'rest_delete_track' ),
					'permission_callback' => array( Caption_Tracks::class, 'rest_permission_check' ),
				),
				'args' => array(
					'id' => array(
						'description' => __( 'Caption track ID.', 'jetpack-videopress-pkg' ),
						'type'        => 'integer',
						'required'    => true,
					),
				),
			)
		);
	}
}

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	wpcom_rest_api_v2_load_plugin( 'Automattic\Jetpack\VideoPress\WPCOM_REST_API_V2_Endpoint_VideoPress_Caption_Tracks' );
}
