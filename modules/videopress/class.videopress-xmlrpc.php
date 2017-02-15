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

		$methods['jetpack.createMediaItem']           = array( $this, 'create_media_item' );
		$methods['jetpack.updateVideoPressMediaItem'] = array( $this, 'update_videopress_media_item' );
		$methods['jetpack.updateVideoPressPosterImage'] = array( $this, 'update_poster_image' );

		return $methods;
	}

	/**
	 * This is used by the WPCOM VideoPress uploader in order to create a media item with
	 * specific meta data about an uploaded file. After this, the transcoding session will
	 * update the meta information via the update_videopress_media_item() method.
	 *
	 * Note: This method technically handles the creation of multiple media objects, though
	 * in practice this is never done.
	 *
	 * @param array $media
	 * @return array
	 */
	public function create_media_item( $media ) {
		foreach ( $media as & $media_item ) {
			$title = sanitize_title( basename( $media_item['url'] ) );
			$guid  = isset( $media['guid'] ) ? $media['guid'] : null;

			$media_id = videopress_create_new_media_item( $title, $guid );

			wp_update_attachment_metadata( $media_id, array(
				'original' => array(
					'url' => $media_item['url'],
				),
			) );

			$media_item['post'] = get_post( $media_id );
		}

		return array( 'media' => $media );
	}

	/**
	 * @param array $request
	 *
	 * @return bool
	 */
	public function update_videopress_media_item( $request ) {

		$id     = $request['post_id'];
		$status = $request['status'];
		$format = $request['format'];
        $info   = $request['info'];

        if ( ! $attachment = get_post( $id ) )  {
            return false;
        }

		$attachment->guid = $info['original'];

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
		$valid_formats = array( 'hd', 'ogg', 'mp4', 'dvd' );
		if ( in_array( $format, $valid_formats ) ) {
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

		// Get the attached file and if there isn't one, then let's update it with the one from the server.
		$file = get_attached_file( $id );
		if ( ! $file && is_string( $info['original'] ) ) {
			videopress_download_video( $info['original'], $id );
		}

		return true;
	}

	/**
	 * @param array $request
	 * @return bool
	 */
	public function update_poster_image( $request ) {

		$post_id = $request['post_id'];
		$poster  = $request['poster'];

		if ( ! $attachment = get_post( $post_id ) )  {
			return false;
		}

		// Update the poster in the VideoPress info.
		$thumbnail_id = videopress_download_poster_image( $poster, $post_id );

		if ( !is_int( $thumbnail_id ) ) {
			return false;
		}

		update_post_meta( $post_id, '_thumbnail_id', $thumbnail_id );
		$meta = wp_get_attachment_metadata( $post_id );

		$meta['videopress']['poster'] = $poster;
		wp_update_attachment_metadata( $post_id, $meta );

		return true;
	}
}
