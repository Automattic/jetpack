<?php
/**
 * The VIdeoPress XMLRPC class
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_Error;
use WP_User;

/**
 * VideoPress playback module markup generator.
 *
 * @since 0.1.1
 */
class XMLRPC {

	/**
	 * Singleton XMLRPC instance.
	 *
	 * @var XMLRPC
	 **/
	private static $instance = null;

	/**
	 * The current user object.
	 *
	 * @var WP_User
	 */
	private $current_user;

	/**
	 * Private VideoPress_XMLRPC constructor.
	 *
	 * Use the VideoPress_XMLRPC::init() method to get an instance.
	 */
	private function __construct() {
		add_filter( 'jetpack_xmlrpc_methods', array( $this, 'xmlrpc_methods' ), 10, 3 );
	}

	/**
	 * Initialize the VideoPress_XMLRPC and get back a singleton instance.
	 *
	 * @return XMLRPC
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new XMLRPC();
		}

		return self::$instance;
	}

	/**
	 * Adds additional methods the WordPress xmlrpc API for handling VideoPress specific features
	 *
	 * @param array   $methods The Jetpack API methods.
	 * @param array   $core_methods The WordPress Core API methods (ignored).
	 * @param WP_User $user The user object the API request is signed by.
	 *
	 * @return array
	 */
	public function xmlrpc_methods( $methods, $core_methods, $user ) {
		if ( $user && $user instanceof WP_User ) {
			$this->current_user = $user;
		}

		$methods['jetpack.createMediaItem']             = array( $this, 'create_media_item' );
		$methods['jetpack.createVideoPressCopy']        = array( $this, 'create_videopress_copy' );
		$methods['jetpack.updateVideoPressMediaItem']   = array( $this, 'update_videopress_media_item' );
		$methods['jetpack.updateVideoPressPosterImage'] = array( $this, 'update_poster_image' );

		return $methods;
	}

	/**
	 * Create one idempotent copy attachment; older clients reject this method before inserting a row.
	 *
	 * @since $$next-version$$
	 * @param array $media A single media item carrying its copy request identifier.
	 * @return array The attachment or an error response.
	 */
	public function create_videopress_copy( $media ) {
		if ( ! is_array( $media ) || count( $media ) !== 1 || ! isset( $media[0] ) || ! is_array( $media[0] ) || ! array_key_exists( 'videopress_copy_request_id', $media[0] ) ) {
			return array( 'errors' => array( 'videopress_copy_invalid_request' => __( 'Invalid video copy request.', 'jetpack-videopress-pkg' ) ) );
		}
		return $this->create_media_item( $media );
	}

	/**
	 * This is used by the WPCOM VideoPress uploader in order to create a media item with
	 * specific meta data about an uploaded file. After this, the transcoding session will
	 * update the meta information via the update_videopress_media_item() method.
	 *
	 * Note: This method technically handles the creation of multiple media objects, though
	 * in practice this is never done.
	 *
	 * @param array $media Media items being uploaded.
	 * @return array
	 */
	public function create_media_item( $media ) {
		$this->authenticate_user();

		foreach ( $media as & $media_item ) {
			$url   = is_string( $media_item['url'] ?? null ) ? $media_item['url'] : '';
			$title = isset( $media_item['title'] ) && '' !== $media_item['title']
				? sanitize_text_field( $media_item['title'] )
				: sanitize_title( basename( $url ) );
			$guid  = $media['guid'] ?? null;

			if ( array_key_exists( 'videopress_copy_request_id', $media_item ) ) {
				$media_id = $this->create_copy_attachment( $title, $media_item['videopress_copy_request_id'] );
				if ( is_wp_error( $media_id ) ) {
					return array( 'errors' => array( $media_id->get_error_code() => $media_id->get_error_message() ) );
				}
				$media_item['post']                           = get_post( $media_id );
				$media_item['videopress_copy_request_id_ack'] = $media_item['videopress_copy_request_id'];
				continue;
			}

			$media_id = videopress_create_new_media_item( $title, $guid );

			$post_update = array();
			if ( isset( $media_item['description'] ) && '' !== $media_item['description'] ) {
				$post_update['post_content'] = sanitize_textarea_field( $media_item['description'] );
			}
			if ( isset( $media_item['caption'] ) && '' !== $media_item['caption'] ) {
				$post_update['post_excerpt'] = sanitize_textarea_field( $media_item['caption'] );
			}
			if ( $post_update ) {
				$post_update['ID'] = $media_id;
				wp_update_post( $post_update );
			}

			wp_update_attachment_metadata(
				$media_id,
				array(
					'original' => array(
						'url' => $media_item['url'],
					),
				)
			);

			$media_item['post'] = get_post( $media_id );
		}

		return array( 'media' => $media );
	}

	/**
	 * Reserve a copy request before inserting its attachment so retries cannot create duplicates.
	 *
	 * @param string $title Attachment title.
	 * @param mixed  $request_id Source GUID and copy request UUID.
	 * @return int|WP_Error The existing or newly created attachment ID.
	 */
	private function create_copy_attachment( $title, $request_id ) {
		if ( ! is_string( $request_id ) || ! preg_match( '/^[A-Za-z0-9]{8}:[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/D', $request_id ) ) {
			return new WP_Error( 'videopress_copy_invalid_request', __( 'Invalid video copy request identifier.', 'jetpack-videopress-pkg' ) );
		}
		if ( ! $this->current_user || ! $this->current_user->exists() || ! current_user_can( 'upload_files' ) ) {
			return new WP_Error( 'videopress_copy_forbidden', __( 'You cannot create a video copy.', 'jetpack-videopress-pkg' ) );
		}

		$option = 'videopress_copy_attachment_' . hash( 'sha256', $request_id );
		if ( ! add_option( $option, 0, '', false ) ) {
			$attachment_id = (int) get_option( $option, 0 );
			if ( ! $attachment_id ) {
				return new WP_Error( 'videopress_copy_attachment_pending', __( 'The video copy attachment is still being created.', 'jetpack-videopress-pkg' ) );
			}
			if ( 'attachment' !== get_post_type( $attachment_id ) || get_post_meta( $attachment_id, '_videopress_copy_request_id', true ) !== $request_id ) {
				return new WP_Error( 'videopress_copy_attachment_unavailable', __( 'The video copy attachment is unavailable.', 'jetpack-videopress-pkg' ) );
			}
			return $attachment_id;
		}

		// A pending reservation never expires: a timed-out insert may already have created the attachment.
		$attachment_id = videopress_create_new_media_item( $title );
		if ( is_wp_error( $attachment_id ) || ! $attachment_id ) {
			return new WP_Error( 'videopress_copy_attachment_failed', __( 'The video copy attachment could not be created.', 'jetpack-videopress-pkg' ) );
		}
		wp_update_attachment_metadata( $attachment_id, array( 'original' => array( 'url' => '' ) ) );
		if ( ! add_post_meta( $attachment_id, '_videopress_copy_request_id', $request_id, true ) || ! update_option( $option, $attachment_id, false ) ) {
			return new WP_Error( 'videopress_copy_attachment_failed', __( 'The video copy attachment could not be recorded.', 'jetpack-videopress-pkg' ) );
		}
		return $attachment_id;
	}

	/**
	 * Update VideoPress metadata for a media item.
	 *
	 * @param array $request Media item to update.
	 *
	 * @return bool
	 */
	public function update_videopress_media_item( $request ) {
		$this->authenticate_user();

		$id     = $request['post_id'];
		$status = $request['status'];
		$format = $request['format'];
		$info   = $request['info'];

		$attachment = get_post( $id );
		if ( ! $attachment ) {
			return false;
		}

		$attachment->guid           = $info['original'];
		$attachment->post_mime_type = 'video/videopress';

		wp_update_post( $attachment );

		// Update the vp guid and set it to a direct meta property.
		update_post_meta( $id, 'videopress_guid', $info['guid'] );

		$meta = wp_get_attachment_metadata( $id );

		$meta['width']             = $info['width'];
		$meta['height']            = $info['height'];
		$meta['original']['url']   = $info['original'];
		$meta['videopress']        = $info;
		$meta['videopress']['url'] = 'https://videopress.com/v/' . $info['guid'];

		// Update file statuses
		if ( ! empty( $format ) ) {
			$meta['file_statuses'][ $format ] = $status;
		}

		if ( ! get_post_meta( $id, '_thumbnail_id', true ) ) {
			// Update the poster in the VideoPress info.
			$thumbnail_id = videopress_download_poster_image( $info['poster'], $id );

			if ( is_int( $thumbnail_id ) ) {
				update_post_meta( $id, '_thumbnail_id', $thumbnail_id );
			}
		}

		wp_update_attachment_metadata( $id, $meta );

		videopress_update_meta_data( $id );

		// update the meta to tell us that we're processing or complete
		update_post_meta( $id, 'videopress_status', videopress_is_finished_processing( $id ) ? 'complete' : 'processing' );

		return true;
	}

	/**
	 * Update poster image for a VideoPress media item.
	 *
	 * @param array $request The media item to update.
	 * @return bool
	 */
	public function update_poster_image( $request ) {
		$this->authenticate_user();

		$post_id = $request['post_id'];
		$poster  = $request['poster'];

		$attachment = get_post( $post_id );
		if ( ! $attachment ) {
			return false;
		}

		$poster = apply_filters( 'jetpack_photon_url', $poster );

		$meta                         = wp_get_attachment_metadata( $post_id );
		$meta['videopress']['poster'] = $poster;
		wp_update_attachment_metadata( $post_id, $meta );

		// Update the poster in the VideoPress info.
		$thumbnail_id = videopress_download_poster_image( $poster, $post_id );

		if ( ! is_int( $thumbnail_id ) ) {
			return false;
		}

		update_post_meta( $post_id, '_thumbnail_id', $thumbnail_id );

		return true;
	}

	/**
	 * Check if the XML-RPC request is signed by a user token, and authenticate the user in WordPress.
	 *
	 * @return bool
	 */
	private function authenticate_user() {
		if ( $this->current_user ) {
			wp_set_current_user( $this->current_user->ID );

			return true;
		}

		return false;
	}
}
