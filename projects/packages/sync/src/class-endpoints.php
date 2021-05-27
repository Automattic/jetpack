<?php
/**
 * Sync package.
 *
 * @package  automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use WP_Error;

/**
 * This class will handle Sync v4 REST Endpoints.
 *
 * @since 9.9.0
 */
class Endpoints {

	/**
	 * Initialize REST routes.
	 */
	public function initialize_rest_api() {

		// Request a Full Sync.
		register_rest_route(
			'jetpack/v4',
			'/sync/full-sync',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::full_sync_start',
				'permission_callback' => __CLASS__ . '::verify_default_permissions',
				'args'                => array(
					'modules'  => array(
						'description' => __( 'Data Modules that should be included in Full Sync', 'jetpack' ),
						'type'        => 'array',
						'required'    => false,
					),
					'users'    => array(
						'description' => __( 'User IDs to include in Full Sync or "initial"', 'jetpack' ),
						'required'    => false,
					),
					'posts'    => array(
						'description' => __( 'Post IDs to include in Full Sync', 'jetpack' ),
						'type'        => 'array',
						'required'    => false,
					),
					'comments' => array(
						'description' => __( 'Comment IDs to include in Full Sync', 'jetpack' ),
						'type'        => 'array',
						'required'    => false,
					),
				),
			)
		);

		// Obtain Sync status.
		register_rest_route(
			'jetpack/v4',
			'/sync/status',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::sync_status',
				'permission_callback' => __CLASS__ . '::verify_default_permissions',
				'args'                => array(
					'fields' => array(
						'description' => __( 'Fields that should be included in status.', 'jetpack' ),
						'type'        => 'array',
						'required'    => false,
					),
				),
			)
		);

		// Obtain Sync settings.
		register_rest_route(
			'jetpack/v4',
			'/sync/settings',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_sync_settings',
				'permission_callback' => __CLASS__ . '::verify_default_permissions',
			)
		);

		// Update Sync settings.
		register_rest_route(
			'jetpack/v4',
			'/sync/settings',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::get_sync_settings',
				'permission_callback' => __CLASS__ . '::verify_default_permissions',
			)
		);

		// Update Sync health status.
		register_rest_route(
			'jetpack/v4',
			'/sync/status',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::sync_health',
				'permission_callback' => __CLASS__ . '::verify_default_permissions',
				'args'                => array(
					'status' => array(
						'description' => __( 'New Sync health status', 'jetpack' ),
						'type'        => 'string',
						'required'    => false,
					),
				),
			)
		);

		// Obtain table checksums.
		register_rest_route(
			'jetpack/v4',
			'/sync/data-check',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::data_check',
				'permission_callback' => __CLASS__ . '::verify_default_permissions',
			)
		);

		// Obtain histogram.
		register_rest_route(
			'jetpack/v4',
			'/sync/data-histogram',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::data_histogram',
				'permission_callback' => __CLASS__ . '::verify_default_permissions',
				'args'                => array(
					'columns'            => array(
						'description' => __( 'Column mappings', 'jetpack' ),
						'type'        => 'array',
						'required'    => false,
					),
					'object_type'        => array(
						'description' => __( 'Object Type', 'jetpack' ),
						'type'        => 'string',
						'required'    => false,
					),
					'buckets'            => array(
						'description' => __( 'Number of histogram buckets.', 'jetpack' ),
						'type'        => 'int',
						'required'    => false,
					),
					'start_id'           => array(
						'description' => __( 'Start ID for the histogram', 'jetpack' ),
						'type'        => 'int',
						'required'    => false,
					),
					'end_id'             => array(
						'description' => __( 'End ID for the histogram', 'jetpack' ),
						'type'        => 'int',
						'required'    => false,
					),
					'strip_non_ascii'    => array(
						'description' => __( 'Strip non-ascii characters?', 'jetpack' ),
						'type'        => 'boolean',
						'required'    => false,
					),
					'shared_salt'        => array(
						'description' => __( 'Shared Salt to use when generating checksum', 'jetpack' ),
						'type'        => 'string',
						'required'    => false,
					),
					'only_range_edges'   => array(
						'description' => __( 'Should only range endges be returned', 'jetpack' ),
						'type'        => 'boolean',
						'required'    => false,
					),
					'detailed_drilldown' => array(
						'description' => __( 'Do we want the checksum or object ids.', 'jetpack' ),
						'type'        => 'boolean',
						'required'    => false,
					),
				),
			)
		);

	}

	/**
	 * Trigger a Full Sync of specified modules.
	 *
	 * @since 9.9.0
	 *
	 * @param \WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function full_sync_start( $request ) {

		$modules = $request->get_param( 'modules' );

		// convert list of modules into array format of "$modulename => true".
		if ( ! empty( $modules ) ) {
			$modules = array_map( '__return_true', array_flip( $modules ) );
		}

		// Process additional options.
		foreach ( array( 'posts', 'comments', 'users' ) as $module_name ) {
			if ( 'users' === $module_name && 'initial' === $request->get_param( 'users' ) ) {
				$modules['users'] = 'initial';
			} elseif ( is_array( $request->get_param( $module_name ) ) ) {
				$ids = $request->get_param( $module_name );
				if ( count( $ids ) > 0 ) {
					$modules[ $module_name ] = $ids;
				}
			}
		}

		if ( empty( $modules ) ) {
			$modules = null;
		}

		return rest_ensure_response(
			array(
				'scheduled' => Actions::do_full_sync( $modules ),
			)
		);
	}

	/**
	 * Return Sync's status.
	 *
	 * @since 9.9.0
	 *
	 * @param \WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return \WP_REST_Response
	 */
	public static function sync_status( $request ) {
		$fields = $request->get_param( 'fields' );
		return rest_ensure_response( Actions::get_sync_status( $fields ) );
	}

	/**
	 * Return table checksums.
	 *
	 * @since 9.9.0
	 *
	 * @return \WP_REST_Response
	 */
	public static function data_check() {
		// Disable Sync during this call, so we can resolve faster.
		Actions::mark_sync_read_only();
		$store = new Replicastore();
		return rest_ensure_response( $store->checksum_all() );
	}

	/**
	 * Return Histogram.
	 *
	 * @since 9.9.0
	 *
	 * @param \WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return \WP_REST_Response
	 */
	public static function data_histogram( $request ) {

		// Disable Sync during this call, so we can resolve faster.
		Actions::mark_sync_read_only();

		$args = $request->get_params();

		if ( empty( $args['columns'] ) ) {
			$args['columns'] = null; // go with defaults.
		}

		if ( false !== $args['strip_non_ascii'] ) {
			$args['strip_non_ascii'] = true;
		}

		/**
		 * Hack: nullify the values of `start_id` and `end_id` if we're only requesting ranges.
		 *
		 * The endpoint doesn't support nullable values :(
		 */
		if ( true === $args['only_range_edges'] ) {
			if ( 0 === $args['start_id'] ) {
				$args['start_id'] = null;
			}

			if ( 0 === $args['end_id'] ) {
				$args['end_id'] = null;
			}
		}

		$store     = new Replicastore();
		$histogram = $store->checksum_histogram( $args['object_type'], $args['buckets'], $args['start_id'], $args['end_id'], $args['columns'], $args['strip_non_ascii'], $args['shared_salt'], $args['only_range_edges'], $args['detailed_drilldown'] );

		return rest_ensure_response(
			array(
				'histogram' => $histogram,
				'type'      => $store->get_checksum_type(),
			)
		);
	}

	/**
	 * Update Sync health.
	 *
	 * @since 9.9.0
	 *
	 * @param \WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return \WP_REST_Response
	 */
	public static function sync_health( $request ) {

		switch ( $request->get_param( 'status' ) ) {
			case Health::STATUS_IN_SYNC:
			case Health::STATUS_OUT_OF_SYNC:
				Health::update_status( $request->get_param( 'status' ) );
				break;
			default:
				return new WP_Error( 'invalid_status', 'Invalid Sync Status Provided.' );
		}

		// re-fetch so we see what's really being stored.
		return rest_ensure_response(
			array(
				'success' => Health::get_status(),
			)
		);
	}

	/**
	 * Obtain Sync settings.
	 *
	 * @since 9.9.0
	 *
	 * @return \WP_REST_Response
	 */
	public static function get_sync_setings() {
		return rest_ensure_response( Settings::get_settings() );
	}

	/**
	 * Update Sync settings.
	 *
	 * @since 9.9.0
	 *
	 * @param \WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return \WP_REST_Response
	 */
	public static function update_sync_settings( $request ) {
		$args = $request->get_params();

		$sync_settings = Settings::get_settings();

		foreach ( $args as $key => $value ) {
			if ( false !== $value ) {
				if ( is_numeric( $value ) ) {
					$value = (int) $value;
				}

				// special case for sending empty arrays - a string with value 'empty'.
				if ( 'empty' === $value ) {
					$value = array();
				}

				$sync_settings[ $key ] = $value;
			}
		}

		Settings::update_settings( $sync_settings );

		// re-fetch so we see what's really being stored.
		return rest_ensure_response( Settings::get_settings() );
	}

	/**
	 * Verify that request has default permissions to perform sync actions.
	 *
	 * @since 9.9.0
	 *
	 * @return bool Whether user has capability 'manage_options' or a blog token is used.
	 */
	public static function verify_default_permissions() {
		if ( current_user_can( 'manage_options' ) ) { // TODO || check for valid blog token.
			return true;
		}

		$error_msg = esc_html__(
			'You do not have the correct user permissions to perform this action.
			Please contact your site admin if you think this is a mistake.',
			'jetpack'
		);

		return new WP_Error( 'invalid_user_permission_sync', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Validate Queue name.
	 *
	 * @param string $value Queue Name.
	 *
	 * @return WP_Error
	 */
	protected function validate_queue( $value ) {
		if ( ! isset( $value ) ) {
			return new WP_Error( 'invalid_queue', 'Queue name is required', 400 );
		}

		if ( ! in_array( $value, array( 'sync', 'full_sync', 'immediate' ), true ) ) {
			return new WP_Error( 'invalid_queue', 'Queue name should be sync, full_sync or immediate', 400 );
		}
		return $value;
	}

}
