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
	 * This will fetch the last rewindable event from the Activity Log and
	 * the last rewind_id prior to that.
	 *
	 * @return array|WP_Error|null
	 */
	public static function get_site_backup_undo_event() {
		$blog_id = \Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			'/sites/' . $blog_id . '/activity/rewindable?force=wpcom',
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

		return rest_ensure_response( $undo_event );
	}
}
