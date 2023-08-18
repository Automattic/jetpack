<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;
use \VIDEOPRESS_PRIVACY;

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
	 * Returns the default restriction_details for a video.
	 *
	 * @param bool $default_can_access The default auth.
	 *
	 * @return array
	 **/
	private function default_video_restriction_details( $default_can_access = false ) {
		$restriction_details = array(
			'version'              => '1',
			'provider'             => 'auth',
			'unauthorized_message' => __( 'Unauthorized', 'jetpack-videopress-pkg' ),
			'can_access'           => $default_can_access,
		);

		return $restriction_details;
	}

	/**
	 * Filers restriction details.
	 *
	 * @param array $video_restriction_details The restriction details.
	 *
	 * @return array
	 */
	private function filter_video_restriction_details( array $video_restriction_details ) {
		return (array) apply_filters( 'videopress_video_restriction_details', $video_restriction_details );
	}

	/**
	 * Returns the default restriction_details for a video.
	 *
	 * @param bool $default_can_access The default auth.
	 *
	 * @return array
	 **/
	private function get_subscriber_only_restriction_details( $default_can_access = false ) {
		return array(
			'provider'             => 'jetpack_memberships',
			'unauthorized_message' => __( 'You need to be subscribed to view this video', 'jetpack-videopress-pkg' ),
			'can_access'           => $default_can_access,
		);
	}

	/**
	 * Determines if Jetpack Memberships are available.
	 *
	 * @return bool
	 */
	private function jetpack_memberships_available() {
		return class_exists( '\Jetpack_Memberships' );
	}

	/**
	 * Determines if Jetpack Subscriptions are available.
	 *
	 * @return bool
	 */
	private function jetpack_subscriptions_available() {
		if ( function_exists( '\Automattic\Jetpack\Extensions\Premium_Content\subscription_service' ) ) {
			return true;
		}

		if ( ! defined( 'JETPACK__PLUGIN_DIR' ) ) {
			return false;
		}

		$subscription_service_file_path = JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/subscription-service/include.php';
		if ( ! file_exists( $subscription_service_file_path ) ) {
			return false;
		}

		require_once $subscription_service_file_path;

		return function_exists( '\Automattic\Jetpack\Extensions\Premium_Content\subscription_service' );
	}

	/**
	 * Determines if the current user can access restricted content and builds the restriction_details array.
	 *
	 * @param string $guid the video guid.
	 * @param int    $embedded_post_id the post id.
	 * @param int    $selected_plan_id the selected plan id.
	 *
	 * @return array
	 */
	private function build_restriction_details( $guid, $embedded_post_id, $selected_plan_id ) {
		global $post;
		$post_to_check = get_post( $embedded_post_id );

		if ( empty( $post_to_check ) ) {
			$restriction_details = $this->default_video_restriction_details( false );
			return $this->filter_video_restriction_details( $restriction_details );
		}

		// phpcs:disable WordPress.WP.GlobalVariablesOverride.Prohibited
		$post = $post_to_check;

		$default_auth        = current_user_can( 'read' );
		$restriction_details = $this->default_video_restriction_details( $default_auth );

		if ( $this->jetpack_memberships_available() ) {
			$memberships_can_view_post = \Jetpack_Memberships::user_can_view_post( $embedded_post_id );
			$restriction_details       = $this->get_subscriber_only_restriction_details( $default_auth );
			if ( ! $memberships_can_view_post ) {
				$restriction_details['can_access'] = $memberships_can_view_post;
				return $this->filter_video_restriction_details( $restriction_details );
			}
		}

		if ( $this->jetpack_subscriptions_available() && $selected_plan_id > 0 ) {
			$restriction_details = $this->get_subscriber_only_restriction_details( $default_auth );
			$paywall             = \Automattic\Jetpack\Extensions\Premium_Content\subscription_service();
			// Only paid subscribers should be granted access to the premium content.
			$access_level = \Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Token_Subscription_Service::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS;
			$can_view     = $paywall->visitor_can_view_content( array( $selected_plan_id ), $access_level );

			if ( ! $can_view ) {
				$restriction_details['can_access'] = $can_view;
				return $this->filter_video_restriction_details( $restriction_details );
			}
		}

		return $this->filter_video_restriction_details( $restriction_details );
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
		$attachment = videopress_get_post_by_guid( $guid );
		if ( ! $attachment ) {
			return false;
		}

		$video_info = video_get_info_by_blogpostid( get_current_blog_id(), $attachment->ID );
		if ( null === $video_info->guid ) {
			return false;
		}

		$is_user_authed = false;

		// Determine if video is public, private or use site default.
		switch ( $video_info->privacy_setting ) {
			case VIDEOPRESS_PRIVACY::IS_PUBLIC:
				$is_user_authed = true;
				break;
			case VIDEOPRESS_PRIVACY::IS_PRIVATE:
				$restriction_details = $this->build_restriction_details( $guid, $embedded_post_id, $selected_plan_id );
				$is_user_authed      = $restriction_details['can_access'];
				break;
			case VIDEOPRESS_PRIVACY::SITE_DEFAULT:
			default:
				$is_videopress_private_for_site = Data::get_videopress_videos_private_for_site();
				$is_user_authed                 = true;
				if ( $is_videopress_private_for_site ) {
					$restriction_details = $this->build_restriction_details( $guid, $embedded_post_id, $selected_plan_id );
					$is_user_authed      = $restriction_details['can_access'];
				}
				break;
		}

		$this->update_video_restriction_details_on_wpcom( $guid, $restriction_details );

		/**
		 * Overrides video view authorization for current user.
		 *
		 * Example of making all videos public:
		 *
		 * function jp_example_override_video_auth( $is_user_authed, $guid ) {
		 *  return true
		 * };
		 * add_filter( 'videopress_is_current_user_authed_for_video', 'jp_example_override_video_auth', 10, 2 );
		 *
		 * @param bool     $is_user_authed   The current user authorization state.
		 * @param string   $guid             The video's unique identifier.
		 * @param int|null $embedded_post_id The post the video is embedded..
		 *
		 * @return bool
		 */
		return (bool) apply_filters( 'videopress_is_current_user_authed_for_video', $is_user_authed, $guid, $embedded_post_id );
	}

	/**
	 * Updates a video's privacy details on wpcom.
	 *
	 * @param string $guid    The video guid that needs updated privacy details.
	 * @param array  $details The details.
	 */
	private function update_video_restriction_details_on_wpcom( $guid, $details = array() ) {
		$video_blog_id   = $this->get_videopress_blog_id();
		$args            = array(
			'headers' => array( 'content-type' => 'application/json' ),
			'method'  => 'POST',
		);
		$default_details = array(
			'version'              => '1',
			'provider'             => 'auth',
			'unauthorized_message' => 'Unauthorized',
		);

		$body = array_merge( $default_details, $details );

		$endpoint = "sites/{$video_blog_id}/media/videopress-restriction-details/{$guid}";
		$result   = Client::wpcom_json_api_request_as_blog( $endpoint, 'v2', $args, wp_json_encode( $body ), 'wpcom' );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$response = json_decode( $result['body'], true );

		return $response;
	}

	/**
	 * Requests JWT from wpcom.
	 *
	 * @param string $guid The video id being checked.
	 */
	private function request_jwt_from_wpcom( $guid ) {
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
