<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;

/**
 * VideoPress AJAX action handlers and utilities.
 *
 * Note: this is also being used on WordPress.com.
 * Use IS_WPCOM checks for functionality that is specific to WPCOM/Jetpack.
 */
class AJAX {

	/**
	 * Singleton AJAX instance.
	 *
	 * @var AJAX
	 **/
	private static $instance = null;

	/**
	 * Private AJAX constructor.
	 *
	 * Use the AJAX::init() method to get an instance.
	 */
	private function __construct() {
		add_action( 'wp_ajax_videopress-get-upload-token', array( $this, 'wp_ajax_videopress_get_upload_token' ) );
		add_action( 'wp_ajax_videopress-get-upload-jwt', array( $this, 'wp_ajax_videopress_get_upload_jwt' ) );
		add_action( 'wp_ajax_nopriv_videopress-get-playback-jwt', array( $this, 'wp_ajax_videopress_get_playback_jwt' ) );
		add_action( 'wp_ajax_videopress-get-playback-jwt', array( $this, 'wp_ajax_videopress_get_playback_jwt' ) );

		add_action(
			'wp_ajax_videopress-update-transcoding-status',
			array(
				$this,
				'wp_ajax_update_transcoding_status',
			),
			-1
		);
	}

	/**
	 * Initialize the AJAX and get back a singleton instance.
	 *
	 * @return AJAX
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new AJAX();
		}

		return self::$instance;
	}

	/**
	 * Validate a guid.
	 *
	 * @param string $guid The guid to validate.
	 *
	 * @return bool
	 **/
	private function is_valid_guid( $guid ) {
		if ( empty( $guid ) ) {
			return false;
		}

		preg_match( '/^[a-z0-9]+$/i', $guid, $matches );

		if ( empty( $matches ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Ajax method that is used by the VideoPress player to get a token to play a video.
	 *
	 * This is used for both logged in and logged out users.
	 *
	 * @return void
	 */
	public function wp_ajax_videopress_get_playback_jwt() {
		$guid             = filter_input( INPUT_POST, 'guid' );
		$embedded_post_id = filter_input( INPUT_POST, 'post_id', FILTER_VALIDATE_INT );
		$selected_plan_id = filter_input( INPUT_POST, 'subscription_plan_id' );

		if ( empty( $embedded_post_id ) ) {
			$embedded_post_id = 0;
		}

		if ( empty( $guid ) || ! $this->is_valid_guid( $guid ) ) {
			wp_send_json_error( array( 'message' => __( 'need a guid', 'jetpack-videopress-pkg' ) ) );
			return;
		}

		if ( ! $this->is_current_user_authed_for_video( $guid, $embedded_post_id, $selected_plan_id ) ) {
			wp_send_json_error( array( 'message' => __( 'You cannot view this video.', 'jetpack-videopress-pkg' ) ) );
			return;
		}

		$token = $this->request_jwt_from_wpcom( $guid );

		if ( empty( $token ) ) {
			wp_send_json_error( array( 'message' => __( 'Could not obtain a VideoPress playback JWT. Please try again later. (empty upload token)', 'jetpack-videopress-pkg' ) ) );
			return;
		}

		if ( is_wp_error( $token ) ) {
			wp_send_json_error( array( 'message' => __( 'Could not obtain a VideoPress upload JWT. Please try again later.', 'jetpack-videopress-pkg' ) ) );
			return;
		}

		wp_send_json_success( array( 'jwt' => $token ) );
	}

	/**
	 * Determines if the current user can view the provided video. Only ever gets fired if site-wide private videos are enabled.
	 *
	 * Filterable for 3rd party plugins.
	 *
	 * @param string $guid             The video id being checked.
	 * @param int    $embedded_post_id The post id the video is embedded in or 0.
	 * @param int    $selected_plan_id The plan id the earn block this video is embedded in has.
	 */
	private function is_current_user_authed_for_video( $guid, $embedded_post_id, $selected_plan_id = 0 ) {
		return Access_Control::instance()->is_current_user_authed_for_video( $guid, $embedded_post_id, $selected_plan_id );
	}

	/**
	 * Requests JWT from wpcom.
	 *
	 * @param string $guid The video id being checked.
	 */
	private function request_jwt_from_wpcom( $guid ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM && function_exists( 'video_wpcom_get_playback_jwt_for_guid' ) ) {
			$jwt_data = video_wpcom_get_playback_jwt_for_guid( $guid );
			if ( is_wp_error( $jwt_data ) ) {
				return false;
			}
			return $jwt_data->metadata_token;
		}

		$video_blog_id = $this->get_videopress_blog_id();
		$args          = array(
			'method' => 'POST',
		);

		$endpoint = "sites/{$video_blog_id}/media/videopress-playback-jwt/{$guid}";
		$result   = Client::wpcom_json_api_request_as_blog( $endpoint, 'v2', $args, null, 'wpcom' );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$response = json_decode( $result['body'], true );

		if ( empty( $response['metadata_token'] ) ) {
			return false;
		}

		return $response['metadata_token'];
	}

	/**
	 * Ajax method that is used by the VideoPress uploader to get a token to upload a file to the wpcom api.
	 *
	 * @return void
	 */
	public function wp_ajax_videopress_get_upload_jwt() {
		$video_blog_id = $this->get_videopress_blog_id();
		$args          = array(
			'method' => 'POST',
		);

		$endpoint = "sites/{$video_blog_id}/media/videopress-upload-jwt";
		$result   = Client::wpcom_json_api_request_as_blog( $endpoint, 'v2', $args, null, 'wpcom' );
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => __( 'Could not obtain a VideoPress upload JWT. Please try again later.', 'jetpack-videopress-pkg' ) ) );
			return;
		}

		$response = json_decode( $result['body'], true );

		if ( empty( $response['upload_token'] ) ) {
			wp_send_json_error( array( 'message' => __( 'Could not obtain a VideoPress upload JWT. Please try again later. (empty upload token)', 'jetpack-videopress-pkg' ) ) );
			return;
		}

		$response['upload_action_url'] = videopress_make_resumable_upload_path( $video_blog_id );

		wp_send_json_success( $response );
	}

	/**
	 * Ajax method that is used by the VideoPress uploader to get a token to upload a file to the wpcom api.
	 *
	 * @return void
	 */
	public function wp_ajax_videopress_get_upload_token() {
		$video_blog_id = $this->get_videopress_blog_id();

		$args = array(
			'method' => 'POST',
		);

		$endpoint = "sites/{$video_blog_id}/media/token";
		$result   = Client::wpcom_json_api_request_as_blog( $endpoint, Client::WPCOM_JSON_API_VERSION, $args );

		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => __( 'Could not obtain a VideoPress upload token. Please try again later.', 'jetpack-videopress-pkg' ) ) );
			return;
		}

		$response = json_decode( $result['body'], true );

		if ( empty( $response['upload_token'] ) ) {
			wp_send_json_error( array( 'message' => __( 'Could not obtain a VideoPress upload token. Please try again later.', 'jetpack-videopress-pkg' ) ) );
			return;
		}

		$response['upload_action_url'] = videopress_make_media_upload_path( $video_blog_id );

		wp_send_json_success( $response );
	}

	/**
	 * Ajax action to update the video transcoding status from the WPCOM API.
	 *
	 * @return void
	 */
	public function wp_ajax_update_transcoding_status() {
		if ( ! isset( $_POST['post_id'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Informational AJAX response.
			wp_send_json_error( array( 'message' => __( 'A valid post_id is required.', 'jetpack-videopress-pkg' ) ) );
			return;
		}

		$post_id = (int) $_POST['post_id']; // phpcs:ignore WordPress.Security.NonceVerification.Missing

		if ( ! videopress_update_meta_data( $post_id ) ) {
			wp_send_json_error( array( 'message' => __( 'That post does not have a VideoPress video associated to it.', 'jetpack-videopress-pkg' ) ) );
			return;
		}

		wp_send_json_success(
			array(
				'message' => __( 'Status updated', 'jetpack-videopress-pkg' ),
				'status'  => videopress_get_transcoding_status( $post_id ),
			)
		);
	}

	/**
	 * Returns the proper blog id depending on Jetpack or WP.com
	 *
	 * @return int the blog id
	 */
	public function get_videopress_blog_id() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return get_current_blog_id();
		}

		$options = Options::get_options();
		return $options['shadow_blog_id'];
	}
}
