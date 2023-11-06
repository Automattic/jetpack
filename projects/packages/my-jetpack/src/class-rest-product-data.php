<?php
/**
 * Sets up the Product Data REST API endpoints.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Client;
use WP_Error;

/**
 * Registers the REST routes for Product Data
 */
class REST_Product_Data {
	/**
	 * Constructor.
	 */
	public function __construct() {
		register_rest_route(
			'my-jetpack/v1',
			'site/product-data',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_all_product_data',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);

		// Get backup undo event
		register_rest_route(
			'my-jetpack/v1',
			'/site/backup/undo-event',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_backup_undo_event',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);
	}

	/**
	 * Checks if the user has the correct permissions
	 */
	public static function permissions_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Gets the product data for all products
	 *
	 * @return array|WP_Error
	 */
	public static function get_all_product_data() {
		$site_id        = \Jetpack_Options::get_option( 'id' );
		$wpcom_endpoint = sprintf( 'sites/%d/jetpack-product-data?locale=%2$s&force=wpcom', $site_id, get_user_locale() );
		$api_version    = '2';
		$response       = Client::wpcom_json_api_request_as_blog( $wpcom_endpoint, $api_version, array(), null, 'wpcom' );
		$response_code  = wp_remote_retrieve_response_code( $response );
		$body           = json_decode( wp_remote_retrieve_body( $response ) );

		$capabilities = self::get_backup_capabilities();

		// If site has backups and the realtime backup capability, add latest undo event
		if (
			$body->backups->last_finished_backup_time &&
			in_array( 'backup-realtime', $capabilities->data['capabilities'], true )
		) {
			$body->backups->last_undoable_event = self::get_site_backup_undo_event();
		}

		if ( is_wp_error( $response ) || empty( $response['body'] ) || 200 !== $response_code ) {
			return new WP_Error( 'site_products_data_fetch_failed', 'Site products data fetch failed', array( 'status' => $response_code ? $response_code : 400 ) );
		}

		return rest_ensure_response( $body, 200 );
	}

	/**
	 * Get an array of backup/scan/anti-spam site capabilities
	 *
	 * @access public
	 * @static
	 *
	 * @return WP_Error|\WP_REST_Response|null An array of capabilities
	 */
	public static function get_backup_capabilities() {
		$blog_id = \Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			'/sites/' . $blog_id . '/rewind/capabilities',
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return null;
		}

		if ( 200 !== $response['response']['code'] ) {
			return null;
		}

		return rest_ensure_response(
			json_decode( $response['body'], true )
		);
	}

	/**
	 * This will fetch the last rewindable event from the Activity Log and
	 * the last rewind_id prior to that.
	 *
	 * @param int $page - numbered page of activity logs to fetch.
	 *
	 * @return array|WP_Error|null
	 */
	public static function get_site_backup_undo_event( $page = null ) {
		if ( ! $page ) {
			$page = 1;
		}

		// Cap out at checking 10 pages of activity log
		if ( $page >= 10 ) {
			return null;
		}

		$blog_id = \Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			'/sites/' . $blog_id . '/activity?force=wpcom&page=' . $page,
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		$body = json_decode( $response['body'], true );

		if ( ! isset( $body['current'] ) ) {
			return null;
		}

		// If page has no item, we have reached the end of the activity log.
		if ( ! isset( $body['current']['orderedItems'] ) || count( $body['current']['orderedItems'] ) === 0 ) {
			return null;
		}

		// Preparing the response structure
		$undo_event = array(
			'last_rewindable_event' => null,
			'undo_backup_id'        => null,
		);

		// List of events that will not be considered to be undo.
		// Basically we should not `undo` a full backup event, but we could
		// use them to undo any other action like plugin updates.
		$last_event_exceptions = array(
			'rewind__backup_only_complete_full',
			'rewind__backup_only_complete_initial',
			'rewind__backup_only_complete',
			'rewind__backup_complete_full',
			'rewind__backup_complete_initial',
			'rewind__backup_complete',
		);

		// Looping through the events to find the last rewindable event and the last backup_id.
		// The idea is to find the last rewindable event and then the last rewind_id before that.
		$found_last_event = false;
		foreach ( $body['current']['orderedItems'] as $event ) {
			if ( $event['is_rewindable'] ) {
				if ( ! $found_last_event && ! in_array( $event['name'], $last_event_exceptions, true ) ) {
					$undo_event['last_rewindable_event'] = $event;
					$found_last_event                    = true;
				} elseif ( $found_last_event ) {
					$undo_event['undo_backup_id'] = $event['rewind_id'];
					break;
				}
			}
		}

		// Keep checking for rewindable event until one is found.
		if ( $undo_event['last_rewindable_event'] === null || $undo_event['undo_backup_id'] === null ) {
			$new_page = $page + 1;
			return self::get_site_backup_undo_event( $new_page );
		}

		return rest_ensure_response( $undo_event, 200 );
	}
}
