<?php

require_once( __DIR__ . '/class.wp-super-cache-rest-get-settings.php' );
require_once( __DIR__ . '/class.wp-super-cache-rest-update-settings.php' );
require_once( __DIR__ . '/class.wp-super-cache-rest-get-stats.php' );
require_once( __DIR__ . '/class.wp-super-cache-rest-get-cache.php' );
require_once( __DIR__ . '/class.wp-super-cache-rest-get-status.php' );
require_once( __DIR__ . '/class.wp-super-cache-rest-test-cache.php' );
require_once( __DIR__ . '/class.wp-super-cache-rest-delete-cache.php' );
require_once( __DIR__ . '/class.wp-super-cache-rest-preload.php' );
require_once( __DIR__ . '/class.wp-super-cache-rest-get-plugins.php' );
require_once( __DIR__. '/class.wp-super-cache-rest-update-plugins.php' );

class WP_Super_Cache_Router {

	/**
	 * Register the routes for the objects of the controller.
	 *
	 * GET /wp-super-cache/v1/settings
	 * POST /wp-super-cache/v1/settings
	 * GET /wp-super-cache/v1/stats
	 * GET /wp-super-cache/v1/cache
	 * POST /wp-super-cache/v1/cache
	 */
	public static function register_routes() {
		$version = '1';
		$namespace = 'wp-super-cache/v' . $version;

		$get_settings    = new WP_Super_Cache_Rest_Get_Settings();
		$update_settings = new WP_Super_Cache_Rest_Update_Settings();
		$get_stats       = new WP_Super_Cache_Rest_Get_Stats();
		$get_cache       = new WP_Super_Cache_Rest_Get_Cache();
		$test_cache 	 = new WP_Super_Cache_Rest_Test_Cache();
		$delete_cache 	 = new WP_Super_Cache_Rest_Delete_Cache();
		$preload_cache   = new WP_Super_Cache_Rest_Preload();
		$get_status 	 = new WP_Super_Cache_Rest_Get_Status();
		$get_plugins     = new WP_Super_Cache_Rest_Get_Plugins();
		$update_plugins  = new WP_Super_Cache_Rest_Update_Plugins();

		register_rest_route( $namespace, '/settings', array(
			array(
				'methods'        	  => WP_REST_Server::READABLE,
				'callback'       	  => array( $get_settings, 'callback' ),
				'permission_callback' => __CLASS__ . '::get_item_permissions_check',
				'args'            	  => array(),
			),
			array(
				'methods'         	  => WP_REST_Server::CREATABLE,
				'callback'        	  => array( $update_settings, 'callback' ),
				'permission_callback' => __CLASS__ . '::update_item_permissions_check',
				'args'           	  => array(),
			),
		) );

		register_rest_route( $namespace, '/status', array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'        	  => array( $get_status, 'callback' ),
			'permission_callback' => __CLASS__ . '::get_item_permissions_check',
		) );

		register_rest_route( $namespace, '/stats', array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'        	  => array( $get_stats, 'callback' ),
			'permission_callback' => __CLASS__ . '::get_item_permissions_check',
		) );

		register_rest_route( $namespace, '/cache', array(
			array(
				'methods'         	  => WP_REST_Server::READABLE,
				'callback'        	  => array( $get_cache, 'callback' ),
				'permission_callback' => __CLASS__ . '::get_item_permissions_check',
				'args'            	  => array(),
			),
			array(
				'methods'         	  => WP_REST_Server::CREATABLE,
				'callback'        	  => array( $delete_cache, 'callback' ),
				'permission_callback' => __CLASS__ . '::delete_item_permissions_check',
				'args'           	  => array(),
			),
		) );

		register_rest_route( $namespace, '/preload', array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => array( $preload_cache, 'callback' ),
			'permission_callback' => __CLASS__ . '::update_item_permissions_check',
		) );

		register_rest_route( $namespace, '/cache/test', array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'        	  => array( $test_cache, 'callback' ),
			'permission_callback' => __CLASS__ . '::create_item_permissions_check',
		) );

		register_rest_route( $namespace, '/plugins', array(
			array(
				'methods'        	  => WP_REST_Server::READABLE,
				'callback'       	  => array( $get_plugins, 'callback' ),
				'permission_callback' => __CLASS__ . '::get_item_permissions_check',
				'args'            	  => array(),
			),
			array(
				'methods'         	  => WP_REST_Server::CREATABLE,
				'callback'        	  => array( $update_plugins, 'callback' ),
				'permission_callback' => __CLASS__ . '::update_item_permissions_check',
				'args'           	  => array(),
			),
		) );
	}

	/**
	 * Check if a given request has access to get items
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|bool
	 */
	public static function get_items_permissions_check( $request ) {
		return wpsupercache_site_admin();
	}

	/**
	 * Check if a given request has access to get a specific item
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|bool
	 */
	public static function get_item_permissions_check( $request ) {
		return self::get_items_permissions_check( $request );
	}

	/**
	 * Check if a given request has access to create items
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|bool
	 */
	public static function create_item_permissions_check( $request ) {
		return self::get_items_permissions_check( $request );
	}

	/**
	 * Check if a given request has access to update a specific item
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|bool
	 */
	public static function update_item_permissions_check( $request ) {
		return self::create_item_permissions_check( $request );
	}

	/**
	 * Check if a given request has access to update a specific item
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|bool
	 */
	public static function delete_item_permissions_check( $request ) {
		return self::update_item_permissions_check( $request );
	}

}

function wpsc_load_rest_api() {
	$wpsupercache_route = new WP_Super_Cache_Router();
	$wpsupercache_route->register_routes();
};

add_action( 'rest_api_init', 'wpsc_load_rest_api' );
