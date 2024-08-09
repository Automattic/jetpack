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

		register_rest_route(
			'my-jetpack/v1',
			'/site/backup/count-items',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::count_things_that_can_be_backed_up',
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

	/**
	 * This will collect a count of all the items that could be backed up
	 * This is used to show what backup could be doing if it is not enabled
	 *
	 * @return WP_Error|\WP_REST_Response
	 */
	public static function count_things_that_can_be_backed_up() {
		$image_mime_type = 'image';
		$video_mime_type = 'video';
		$audio_mime_type = 'audio';

		$data = array();

		// Add all post types together to get the total post count
		$data['total_post_count'] = array_sum( (array) wp_count_posts( 'post' ) );

		// Add all page types together to get the total page count
		$data['total_page_count'] = array_sum( (array) wp_count_posts( 'page' ) );

		// Add all comments together to get the total comment count
		$comments                    = (array) wp_count_comments();
		$data['total_comment_count'] = $comments ? $comments['total_comments'] : 0;

		// Add all image attachments together to get the total image count
		$data['total_image_count'] = array_sum( (array) wp_count_attachments( $image_mime_type ) );

		// Add all video attachments together to get the total video count
		$data['total_video_count'] = array_sum( (array) wp_count_attachments( $video_mime_type ) );

		// Add all audio attachments together to get the total audio count
		$data['total_audio_count'] = array_sum( (array) wp_count_attachments( $audio_mime_type ) );

		return rest_ensure_response( $data );
	}
}
