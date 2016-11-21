<?php

class VideoPress_AJAX {

	/**
	 * @var VideoPress_AJAX
	 **/
	private static $instance = null;

	/**
	 * Private VideoPress_AJAX constructor.
	 *
	 * Use the VideoPress_AJAX::init() method to get an instance.
	 */
	private function __construct() {
		add_action( 'wp_ajax_videopress-get-upload-token', array( $this, 'wp_ajax_videopress_get_upload_token' ) );

		add_action( 'wp_ajax_videopress-update-transcoding-status', array(
			$this,
			'wp_ajax_update_transcoding_status'
		), -1 );
	}

	/**
	 * Initialize the VideoPress_AJAX and get back a singleton instance.
	 *
	 * @return VideoPress_AJAX
	 */
	public static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new VideoPress_AJAX;
		}

		return self::$instance;
	}

	/**
	 * Ajax method that is used by the VideoPress uploader to get a token to upload a file to the wpcom api.
	 *
	 * @return void
	 */
	public function wp_ajax_videopress_get_upload_token() {

		$options = VideoPress_Options::get_options();

		$args = array(
			'method' => 'POST',
		);

		$endpoint = "sites/{$options['shadow_blog_id']}/media/token";
		$result   = Jetpack_Client::wpcom_json_api_request_as_blog( $endpoint, Jetpack_Client::WPCOM_JSON_API_VERSION, $args );

		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => __( 'Could not obtain a VideoPress upload token. Please try again later.', 'jetpack' ) ) );
			return;
		}

		$response = json_decode( $result['body'], true );

		if ( empty( $response['upload_token'] ) ) {
			wp_send_json_error( array( 'message' => __( 'Could not obtain a VideoPress upload token. Please try again later.', 'jetpack' ) ) );
			return;
		}

		$title = sanitize_title( basename( $_POST['filename'] ) );

		$response['upload_action_url'] = videopress_make_media_upload_path( $options['shadow_blog_id'] );
		$response['upload_media_id']   = videopress_create_new_media_item( $title );

		wp_send_json_success( $response );
	}

	/**
	 * Ajax action to update the video transcoding status from the WPCOM API.
	 *
	 * @return void
	 */
	public function wp_ajax_update_transcoding_status() {
		if ( ! isset( $_POST['post_id'] ) ) {
			wp_send_json_error( array( 'message' => __( 'A valid post_id is required.', 'jetpack' ) ) );
			return;
		}

		$post_id = (int) $_POST['post_id'];

		if ( ! videopress_update_meta_data( $post_id ) ) {
			wp_send_json_error( array( 'message' => __( 'That post does not have a VideoPress video associated to it..', 'jetpack' ) ) );
			return;
		}

		wp_send_json_success( array(
			'message' => __( 'Status updated', 'jetpack' ),
			'status'  => videopress_get_transcoding_status( $post_id )
		) );
	}
}

// Let's start this thing up.
VideoPress_AJAX::init();