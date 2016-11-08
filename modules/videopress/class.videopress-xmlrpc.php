<?php
/**
 * VideoPress playback module markup generator.
 *
 * @since 1.3
 */
class VideoPress_XMLRPC {

	/**
	 * @var VideoPress_XMLRPC
	 **/
	private static $instance = null;


	/**
	 * Private VideoPress_XMLRPC constructor.
	 *
	 * Use the VideoPress_XMLRPC::init() method to get an instance.
	 */
	private function __construct() {
		add_filter( 'jetpack_xmlrpc_methods', array( $this, 'xmlrpc_methods' ) );
	}

	/**
	 * Initialize the VideoPress_XMLRPC and get back a singleton instance.
	 *
	 * @return VideoPress_XMLRPC
	 */
	public static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new VideoPress_XMLRPC;
		}

		return self::$instance;
	}



	/**
	 * Adds additional methods the WordPress xmlrpc API for handling VideoPress specific features
	 *
	 * @param array $methods
	 *
	 * @return array
	 */
	public function xmlrpc_methods( $methods ) {

		$methods['jetpack.createMediaItem']      = array( $this, 'create_media_item' );
		$methods['jetpack.updateVideoPressInfo'] = array( $this, 'update_videopress_info' );

		return $methods;
	}

	/**
	 * Endpoint to allow the transcoding session to send updated information about the VideoPress video when it completes a stage of transcoding.
	 *
	 * @param array $vp_info
	 *
	 * @return array|bool
	 */
	public function update_videopress_info( $vp_info ) {
		$errors = null;
		foreach ( $vp_info as $vp_item ) {
			$id   = $vp_item['post_id'];
			$guid = $vp_item['guid'];

			$attachment = get_post( $id );

			if ( ! $attachment ) {
				$errors[] = array(
					'id'    => $id,
					'error' => 'Post not found',
				);

				continue;
			}

			$attachment->guid = $vp_item['original'];
			$attachment->file = $vp_item['original'];

			wp_update_post( $attachment );

			// Update the vp guid and set it to a direct meta property.
			update_post_meta( $id, 'videopress_guid', $guid );

			$meta = wp_get_attachment_metadata( $attachment->ID );

			$current_poster = get_post_meta( $id, '_thumbnail_id' );

			$meta['width']             = $vp_item['width'];
			$meta['height']            = $vp_item['height'];
			$meta['original']['url']   = $vp_item['original'];
			$meta['videopress']        = $vp_item;
			$meta['videopress']['url'] = 'https://videopress.com/v/' . $guid;

			if ( ! $current_poster && isset( $vp_item['poster'] ) && ! empty( $vp_item['poster'] ) ) {
				$thumbnail_id = videopress_download_poster_image( $vp_item['poster'], $id );
				update_post_meta( $id, '_thumbnail_id', $thumbnail_id );
			}

			wp_update_attachment_metadata( $attachment->ID, $meta );

			// update the meta to tell us that we're processing or complete
			update_post_meta( $id, 'videopress_status', videopress_is_finished_processing( $attachment->ID ) ? 'complete' : 'processing' );
		}

		if ( count( $errors ) > 0 ) {
			return array( 'errors' => $errors );

		} else {
			return true;
		}
	}

	/**
	 * This is used by the WPCOM VideoPress uploader in order to create a media item with
	 * specific meta data about an uploaded file. After this, the transcoding session will
	 * update the meta information via the xmlrpc_update_videopress_info() method.
	 *
	 * Note: This method technically handles the creation of multiple media objects, though
	 * in practice this is never done.
	 *
	 * @param array $media
	 *
	 * @return array
	 */
	public function create_media_item( $media ) {
		$created_items = array();

		foreach ( $media as $media_item ) {

			$media_id = videopress_create_new_media_item( sanitize_title( basename( $media_item['url'] ) ) );

			wp_update_attachment_metadata( $media_id, array(
				'original' => array(
					'url' => $media_item['url'],
				),
			) );

			$created_items[] = array(
				'id'   => $media_id,
				'post' => get_post( $media_id ),
			);
		}

		return array( 'media' => $created_items );
	}

}
