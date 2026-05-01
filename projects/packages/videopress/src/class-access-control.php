<?php
/**
 * VideoPress Access Control.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Abstract_Token_Subscription_Service;
use Automattic\Jetpack\Modules;
use VIDEOPRESS_PRIVACY;
use WP_Post;

/**
 * VideoPress video access control utilities.
 *
 * Note: this is also being used on WordPress.com.
 * Use IS_WPCOM checks for functionality that is specific to WPCOM/Jetpack.
 */
class Access_Control {

	/**
	 * Singleton Access_Control instance.
	 *
	 * @var Access_Control
	 **/
	private static $instance = null;

	/**
	 * Guid to subscription plan, store, for when used inline on a page.
	 *
	 * @var array
	 */
	private $guids_to_subscriptions = array();

	/**
	 * Set that this guid is controlled by a subscription.
	 *
	 * @param string     $guid            The guid to set.
	 * @param string|int $subscription_id The subscription to set.
	 *
	 * @return Access_Control
	 */
	public function set_guid_subscription( $guid, $subscription_id ) {
		$this->guids_to_subscriptions[ $guid ] = $subscription_id;
		return $this;
	}

	/**
	 * Get the subscription for a guid.
	 *
	 * @param string $guid The guid to get.
	 *
	 * @return string|int|false
	 */
	public function get_subscription_plan_id( $guid ) {
		return isset( $this->guids_to_subscriptions[ $guid ] ) ? $this->guids_to_subscriptions[ $guid ] : false;
	}

	/**
	 * Get the singleton instance.
	 *
	 * @return self
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
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
		$is_module_active = ( new Modules() )->is_active( 'subscriptions' );
		if ( ! $is_module_active ) {
			return false;
		}

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
	 * Check default user access. By default, subscribers or higher can view videos.
	 *
	 * @param WP_Post $post_to_check The post to check.
	 *
	 * @return bool
	 **/
	private function get_default_user_capability_for_post( $post_to_check ) {
		if ( ! isset( $post_to_check->ID ) ) {
			return false;
		}

		$default_auth = current_user_can( 'read_post', $post_to_check->ID );

		return $default_auth;
	}

	/**
	 * Determines if the current user can access restricted content and builds the restriction_details array.
	 *
	 * @param string $guid the video guid.
	 * @param int    $embedded_post_id the post id.
	 * @param int    $selected_plan_id the selected plan id if applicable.
	 *
	 * @return array
	 */
	private function build_restriction_details( $guid, $embedded_post_id, $selected_plan_id ) {
		$post_to_check = get_post( $embedded_post_id );

		if ( empty( $post_to_check ) ) {
			$restriction_details = $this->default_video_restriction_details( false );
			return $this->filter_video_restriction_details( $restriction_details, $guid, $embedded_post_id, $selected_plan_id );
		}

		$default_auth        = $this->get_default_user_capability_for_post( $post_to_check );
		$restriction_details = $this->default_video_restriction_details( $default_auth );

		if ( $this->jetpack_memberships_available() ) {
			$post_access_level = \Jetpack_Memberships::get_post_access_level( $embedded_post_id );
			if ( 'everybody' !== $post_access_level ) {
				$memberships_can_view_post         = \Jetpack_Memberships::user_can_view_post( $embedded_post_id );
				$restriction_details               = $this->get_subscriber_only_restriction_details( $default_auth );
				$restriction_details['can_access'] = $memberships_can_view_post;
			}
		}

		return $this->check_block_level_access(
			$restriction_details,
			$guid,
			$embedded_post_id,
			$selected_plan_id
		);
	}

	/**
	 * Determines if the current user can access restricted block content and updates the restriction_details array.
	 *
	 * @param array  $restriction_details the restriction details array.
	 * @param string $guid the video guid.
	 * @param int    $embedded_post_id the post id.
	 * @param int    $selected_plan_id the selected plan id if applicable.
	 *
	 * @return array
	 */
	private function check_block_level_access( $restriction_details, $guid, $embedded_post_id, $selected_plan_id ) {
		if ( $this->jetpack_subscriptions_available() && $selected_plan_id > 0 ) {
			$restriction_details = $this->get_subscriber_only_restriction_details( $restriction_details['can_access'] );
			$paywall             = \Automattic\Jetpack\Extensions\Premium_Content\subscription_service();

			// Only paid subscribers should be granted access to the premium content.
			$access_level = '';
			if ( class_exists( Abstract_Token_Subscription_Service::class ) ) {
				$access_level = Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS;
			}

			$can_view                          = $paywall->visitor_can_view_content( array( $selected_plan_id ), $access_level );
			$restriction_details['can_access'] = $can_view || current_user_can( 'edit_post', $embedded_post_id ); // Editors can always view the content.
		}

		return $this->filter_video_restriction_details(
			$restriction_details,
			$guid,
			$embedded_post_id,
			$selected_plan_id
		);
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
			'title'                => __( 'This video is subscriber-only', 'jetpack-videopress-pkg' ),
			'unauthorized_message' => __( 'You need to be subscribed to view this video', 'jetpack-videopress-pkg' ),
			'can_access'           => $default_can_access,
		);
	}

	/**
	 * Filters restriction details.
	 *
	 * @param array  $video_restriction_details The restriction details.
	 * @param string $guid The video guid.
	 * @param int    $embedded_post_id The post id.
	 * @param int    $selected_plan_id The selected plan id if applicable.
	 *
	 * @return array
	 */
	private function filter_video_restriction_details( $video_restriction_details, $guid, $embedded_post_id, $selected_plan_id ) {
		/**
		 * Filters the video restriction details.
		 *
		 * @param array  $video_restriction_details The restriction details.
		 * @param string $guid The video guid.
		 * @param int    $embedded_post_id The post id.
		 * @param int    $selected_plan_id The selected plan id if applicable.
		 *
		 * @return array
		 */
		return (array) apply_filters( 'videopress_video_restriction_details', $video_restriction_details, $guid, $embedded_post_id, $selected_plan_id );
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
			'title'                => __( 'Unauthorized', 'jetpack-videopress-pkg' ),
			'unauthorized_message' => __( 'Unauthorized', 'jetpack-videopress-pkg' ),
			'can_access'           => $default_can_access,
		);

		return $restriction_details;
	}

	/**
	 * Determines whether a given post actually embeds a given VideoPress GUID.
	 *
	 * Used to prevent the embedded post id — which arrives from request input — from being
	 * treated as an authorization context when it has no relationship to the requested video.
	 * Matching the attachment id itself is not treated as proof of embedding: attachment ids
	 * are enumerable via the media REST route and would otherwise provide a second path around
	 * this check whenever the attachment has no parent and falls back to the `read` capability.
	 *
	 * @param int    $embedded_post_id The post id claimed as the embedding context.
	 * @param string $guid             The video guid.
	 *
	 * @return bool
	 */
	private function post_embeds_videopress_guid( $embedded_post_id, $guid ) {
		$post = get_post( $embedded_post_id );
		if ( ! $post instanceof WP_Post || empty( $post->post_content ) ) {
			return false;
		}

		// If the guid is nowhere in the content, neither the block nor the shortcode scan can match.
		if ( false === strpos( $post->post_content, $guid ) ) {
			return false;
		}

		if ( $this->post_content_has_videopress_block( $post->post_content, $guid ) ) {
			return true;
		}

		if ( $this->post_content_has_videopress_shortcode( $post->post_content, $guid ) ) {
			return true;
		}

		return $this->post_content_has_videopress_url( $post->post_content, $guid );
	}

	/**
	 * Walk parsed blocks (including inner blocks) looking for a videopress/video block
	 * whose guid attribute matches.
	 *
	 * @param string $post_content The post content to scan.
	 * @param string $guid         The video guid to match.
	 *
	 * @return bool
	 */
	private function post_content_has_videopress_block( $post_content, $guid ) {
		if ( false === strpos( $post_content, 'wp:videopress/video' ) ) {
			return false;
		}

		return $this->blocks_contain_videopress_guid( parse_blocks( $post_content ), $guid );
	}

	/**
	 * Recursively scans a parsed block tree for a videopress/video block whose guid attribute matches.
	 *
	 * @param array  $blocks Parsed blocks (as returned by parse_blocks() or an innerBlocks array).
	 * @param string $guid   The video guid to match.
	 *
	 * @return bool
	 */
	private function blocks_contain_videopress_guid( $blocks, $guid ) {
		foreach ( $blocks as $block ) {
			if (
				isset( $block['blockName'] ) && 'videopress/video' === $block['blockName']
				&& isset( $block['attrs']['guid'] ) && $block['attrs']['guid'] === $guid
			) {
				return true;
			}

			if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] )
				&& $this->blocks_contain_videopress_guid( $block['innerBlocks'], $guid )
			) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Detect a [videopress GUID] or [wpvideo GUID] shortcode whose first positional
	 * argument matches the given guid.
	 *
	 * @param string $post_content The post content to scan.
	 * @param string $guid         The video guid to match.
	 *
	 * @return bool
	 */
	private function post_content_has_videopress_shortcode( $post_content, $guid ) {
		if ( false === stripos( $post_content, '[videopress' ) && false === stripos( $post_content, '[wpvideo' ) ) {
			return false;
		}

		$pattern = get_shortcode_regex( array( 'videopress', 'wpvideo' ) );
		$count   = preg_match_all( '/' . $pattern . '/', $post_content, $matches, PREG_SET_ORDER );
		if ( false === $count || 0 === $count ) {
			return false;
		}

		foreach ( $matches as $match ) {
			$atts = shortcode_parse_atts( $match[3] );
			if ( ! is_array( $atts ) ) {
				continue;
			}

			// Only the positional argument identifies the video; named attributes must not satisfy the binding check.
			if ( isset( $atts[0] ) && is_string( $atts[0] ) && $atts[0] === $guid ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Detect a canonical VideoPress URL referencing the given guid. Covers oEmbed
	 * inserts, core/embed blocks, core/video blocks, and core [video] shortcodes
	 * whose src/mp4 attributes resolve to a VideoPress URL.
	 *
	 * @param string $post_content The post content to scan.
	 * @param string $guid         The video guid to match.
	 *
	 * @return bool
	 */
	private function post_content_has_videopress_url( $post_content, $guid ) {
		if ( ! preg_match_all( '#https?://[^\s"\'<>)]+#i', $post_content, $matches ) ) {
			return false;
		}

		foreach ( $matches[0] as $url ) {
			if ( $guid === Utils::extract_videopress_guid_from_url( $url ) ) {
				return true;
			}
		}

		return false;
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
	public function is_current_user_authed_for_video( $guid, $embedded_post_id, $selected_plan_id = 0 ) {
		if ( current_user_can( 'upload_files' ) ) {
			return $this->filter_is_current_user_authed_for_video( true, $guid, $embedded_post_id );
		}

		$attachment = false;
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$video_info = video_get_info_by_guid( $guid );
			if ( ! empty( $video_info ) ) {
				$attachment = get_blog_post( $video_info->blog_id, $video_info->post_id );
			}
		} else {
			$attachment = videopress_get_post_by_guid( $guid );
		}

		if ( ! $attachment ) {
			return false;
		}

		$video_info = video_get_info_by_blogpostid( get_current_blog_id(), $attachment->ID );
		if ( null === $video_info->guid ) {
			return false;
		}

		/*
		 * Default missing privacy_setting to SITE_DEFAULT to avoid an
		 * undefined-property warning and make the site-level fallback explicit.
		 */
		$privacy_setting = $video_info->privacy_setting ?? VIDEOPRESS_PRIVACY::SITE_DEFAULT;

		$embedded_post_id = (int) $embedded_post_id;
		if (
			$embedded_post_id
			&& VIDEOPRESS_PRIVACY::IS_PUBLIC !== $privacy_setting
			&& ! $this->post_embeds_videopress_guid( $embedded_post_id, $guid )
		) {
			$embedded_post_id = 0;
		}

		$is_user_authed = false;

		// Determine if video is public, private or use site default.
		switch ( $privacy_setting ) {
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
		}

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
		return $this->filter_is_current_user_authed_for_video( $is_user_authed, $guid, $embedded_post_id );
	}

		/**
		 * Overrides video view authorization for current user.
		 *
		 * @param bool     $is_user_authed   The current user authorization state.
		 * @param string   $guid             The video's unique identifier.
		 * @param int|null $embedded_post_id The post the video is embedded..
		 *
		 * @return bool
		 */
	private function filter_is_current_user_authed_for_video( $is_user_authed, $guid, $embedded_post_id ) {
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
	 * Returns the proper blog id depending on Jetpack or WP.com
	 *
	 * @return int the blog id
	 */
	public function get_videopress_blog_id() {
		return \Jetpack_Options::get_option( 'id' );
	}
}
