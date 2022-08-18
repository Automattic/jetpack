<?php
/**
 * VideoPress Attachment_Handler
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Current_Plan;

/**
 * VideoPress Attachment_Handler class.
 */
class Attachment_Handler {

	/**
	 * Initializer
	 *
	 * This method should be called only once by the Initializer class. Do not call this method again.
	 */
	public static function init() {

		if ( ! Status::is_active() ) {
			return;
		}

		add_filter( 'wp_get_attachment_url', array( __CLASS__, 'maybe_get_attached_url_for_videopress' ), 10, 2 );
		add_filter( 'get_attached_file', array( __CLASS__, 'maybe_get_attached_url_for_videopress' ), 10, 2 );

		if ( Current_Plan::supports( 'videopress' ) ) {
			add_filter( 'upload_mimes', array( __CLASS__, 'add_video_upload_mimes' ), 999 );
		}

		add_filter( 'pre_delete_attachment', array( __CLASS__, 'delete_video_wpcom' ), 10, 2 );
		add_filter( 'wp_mime_type_icon', array( __CLASS__, 'wp_mime_type_icon' ), 10, 3 );
		add_filter( 'wp_video_extensions', array( __CLASS__, 'add_videopress_extenstion' ) );

	}

	/**
	 * Returns the VideoPress URL for the give post id, otherwise returns the provided default.
	 *
	 * This is an attachment-based filter handler.
	 *
	 * @param string $default The default return value if post id is not a VideoPress video.
	 * @param int    $post_id The post id for the current attachment.
	 */
	public static function maybe_get_attached_url_for_videopress( $default, $post_id ) {
		$videopress_url = videopress_get_attachment_url( $post_id );

		if ( null !== $videopress_url ) {
			return $videopress_url;
		}

		return $default;
	}

	/**
	 * Makes sure that all video mimes are added in, as multi site installs can remove them.
	 *
	 * @param array $existing_mimes Mime types to extend/filter.
	 * @return array
	 */
	public static function add_video_upload_mimes( $existing_mimes = array() ) {
		$mime_types  = wp_get_mime_types();
		$video_types = array_filter( $mime_types, array( __CLASS__, 'filter_video_mimes' ) );

		foreach ( $video_types as $key => $value ) {
			$existing_mimes[ $key ] = $value;
		}

		// Make sure that videopress mimes are considered videos.
		$existing_mimes['videopress'] = 'video/videopress';

		return $existing_mimes;
	}

	/**
	 * Filter designed to get rid of non video mime types.
	 *
	 * @param string $value Mime type to filter.
	 * @return int
	 */
	public static function filter_video_mimes( $value ) {
		return preg_match( '@^video/@', $value );
	}

	/**
	 * Attempts to delete a VideoPress video from wp.com.
	 * Will block the deletion from continuing if certain errors return from the wp.com API.
	 *
	 * @param Boolean $delete if the deletion should occur or not (unused).
	 * @param WP_Post $post the post object.
	 *
	 * @return null|WP_Error|Boolean null if deletion should continue.
	 */
	public static function delete_video_wpcom( $delete, $post ) {
		if ( ! is_videopress_attachment( $post->ID ) ) {
			return null;
		}

		$guid = get_post_meta( $post->ID, 'videopress_guid', true );
		if ( empty( $guid ) ) {
			self::delete_video_poster_attachment( $post->ID );
			return null;
		}

		// Phone home and have wp.com delete the VideoPress entry and files.
		$wpcom_response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/videos/%s/delete', $guid ),
			'1.1',
			array( 'method' => 'POST' )
		);

		if ( is_wp_error( $wpcom_response ) ) {
			return $wpcom_response;
		}

		// Upon success or a 404 (video already deleted on wp.com), return null to allow the deletion to continue.
		if ( 200 === $wpcom_response['response']['code'] || 404 === $wpcom_response['response']['code'] ) {
			self::delete_video_poster_attachment( $post->ID );
			return null;
		}

		// Otherwise we stop the deletion from proceeding.
		return false;
	}

	/**
	 * Deletes a video poster attachment if it exists.
	 *
	 * @param int $attachment_id the WP attachment id.
	 */
	private static function delete_video_poster_attachment( $attachment_id ) {
		$thumbnail_id = get_post_meta( $attachment_id, '_thumbnail_id', true );
		if ( ! empty( $thumbnail_id ) ) {
			// Let's ensure this is a VP poster image before we delete it.
			if ( '1' === get_post_meta( $thumbnail_id, 'videopress_poster_image', true ) ) {
				// This call triggers the `delete_video_wpcom` filter again but it bails early at the is_videopress_attachment() check.
				wp_delete_attachment( $thumbnail_id );
			}
		}
	}

	/**
	 * Filter the mime type icon.
	 *
	 * @param string $icon Icon path.
	 * @param string $mime Mime type.
	 * @param int    $post_id Post ID.
	 *
	 * @return string
	 */
	public static function wp_mime_type_icon( $icon, $mime, $post_id ) {

		if ( $mime !== 'video/videopress' ) {
			return $icon;
		}

		$status = get_post_meta( $post_id, 'videopress_status', true );

		if ( $status === 'complete' ) {
			return $icon;
		}

		return 'https://wordpress.com/wp-content/mu-plugins/videopress/images/media-video-processing-icon.png';
	}

	/**
	 * Filter the list of supported video formats.
	 *
	 * @param array $extensions Supported video formats.
	 *
	 * @return array
	 */
	public static function add_videopress_extenstion( $extensions ) {
		$extensions[] = 'videopress';
		return $extensions;
	}

}
