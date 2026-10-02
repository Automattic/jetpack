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
		return $this->guids_to_subscriptions[ $guid ] ?? false;
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
	 * How long the per-post GUID list stays cached.
	 *
	 * @var int
	 */
	const GUID_CACHE_EXPIRATION = 12 * HOUR_IN_SECONDS;

	/**
	 * Maximum number of synced-pattern (wp_block) refs resolved per scan.
	 *
	 * @var int
	 */
	const MAX_PATTERN_REFS = 20;

	/**
	 * Build and cache the list of VideoPress GUIDs present in a post.
	 *
	 * Scans the post content for VideoPress video and playlist blocks, shortcodes, and
	 * URLs, then caches the GUID list in a transient for fast lookup during authorization
	 * checks. Synced pattern (core/block) refs are resolved manually: parse_blocks() does
	 * NOT expand them — their content lives in the referenced wp_block post and is only
	 * expanded by WordPress at render time.
	 *
	 * @param int $post_id The post ID to scan.
	 * @return array Array of VideoPress GUIDs found in the post.
	 */
	public static function build_and_cache_post_guids( $post_id ) {
		if ( empty( $post_id ) ) {
			return array();
		}

		$post_id       = absint( $post_id );
		$transient_key = "videopress_guids_{$post_id}";

		// Check if already cached.
		$cached_guids = get_transient( $transient_key );
		if ( false !== $cached_guids ) {
			return (array) $cached_guids;
		}

		$post = get_post( $post_id );
		if ( ! $post instanceof WP_Post || empty( $post->post_content ) ) {
			set_transient( $transient_key, array(), self::GUID_CACHE_EXPIRATION );
			return array();
		}

		$visited_refs = array();
		$guids        = self::collect_guids_from_content( $post->post_content, $visited_refs );

		// Cache and return unique GUIDs.
		$unique_guids = array_values( array_unique( array_filter( $guids ) ) );
		set_transient( $transient_key, $unique_guids, self::GUID_CACHE_EXPIRATION );

		return $unique_guids;
	}

	/**
	 * Ensure the given rendered GUIDs are present in a post's cached GUID list.
	 *
	 * Called from block render callbacks, where the block has already been expanded by
	 * WordPress (synced patterns, templates, template parts, widget areas…): the render
	 * itself is proof the video is embedded in the page being served for this post, so
	 * the GUID can be added even when the static content scan cannot see it.
	 *
	 * @param int             $post_id The post ID the block is rendering on.
	 * @param string|string[] $guids   The GUID(s) being rendered.
	 */
	public static function ensure_post_guids_cached( $post_id, $guids ) {
		$post_id = absint( $post_id );
		$guids   = array_filter( (array) $guids, 'is_string' );
		if ( ! $post_id || ! $guids ) {
			return;
		}

		$cached  = self::build_and_cache_post_guids( $post_id );
		$missing = array_diff( $guids, $cached );
		if ( $missing ) {
			set_transient(
				"videopress_guids_{$post_id}",
				array_values( array_merge( $cached, $missing ) ),
				self::GUID_CACHE_EXPIRATION
			);
		}
	}

	/**
	 * Collect VideoPress GUIDs from a chunk of post content: blocks (with synced pattern
	 * refs resolved recursively), VideoPress URLs, and legacy shortcodes.
	 *
	 * @param string $content      The post content to scan.
	 * @param array  $visited_refs Accumulator of wp_block ref ids already resolved, keyed by id.
	 * @return array Array of VideoPress GUIDs found.
	 */
	private static function collect_guids_from_content( $content, &$visited_refs ) {
		$guids = self::collect_guids_from_blocks( parse_blocks( $content ), $visited_refs );

		// Scan for VideoPress URLs (oEmbed, core/embed, core/video sources).
		if ( preg_match_all( '#https?://[^\s"\'<>)]+#i', $content, $matches ) ) {
			foreach ( $matches[0] as $url ) {
				$guid = Utils::extract_videopress_guid_from_url( $url );
				if ( $guid ) {
					$guids[] = $guid;
				}
			}
		}

		// Scan for [videopress] and [wpvideo] shortcodes.
		$pattern = get_shortcode_regex( array( 'videopress', 'wpvideo' ) );
		$count   = preg_match_all( '/' . $pattern . '/', $content, $matches, PREG_SET_ORDER );
		if ( false !== $count && $count > 0 ) {
			foreach ( $matches as $match ) {
				$atts = shortcode_parse_atts( $match[3] );
				// Only the positional argument identifies the video; named attributes must not satisfy the binding check.
				if ( is_array( $atts ) && isset( $atts[0] ) && is_string( $atts[0] ) ) {
					$guids[] = $atts[0];
				}
			}
		}

		return $guids;
	}

	/**
	 * Recursively collect VideoPress GUIDs from parsed blocks.
	 *
	 * Handles videopress/video blocks, videopress/playlist entries, and synced patterns:
	 * a core/block ref is resolved by loading the referenced wp_block post and scanning
	 * its content, mirroring render_block_core_block()'s constraints (published, unlocked
	 * wp_block posts only) with a visited guard against cycles.
	 *
	 * @param array $blocks       Array of parsed blocks.
	 * @param array $visited_refs Accumulator of wp_block ref ids already resolved, keyed by id.
	 * @return array Array of VideoPress GUIDs found.
	 */
	private static function collect_guids_from_blocks( $blocks, &$visited_refs ) {
		$guids = array();

		foreach ( $blocks as $block ) {
			$block_name  = $block['blockName'] ?? null;
			$attrs       = isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : array();
			$attr_guid   = $attrs['guid'] ?? null;
			$attr_videos = $attrs['videos'] ?? null;
			$attr_ref    = $attrs['ref'] ?? null;

			// A VideoPress video block with a GUID.
			if ( 'videopress/video' === $block_name && is_string( $attr_guid ) ) {
				$guids[] = $attr_guid;
			}

			// A VideoPress playlist block: each entry carries its own GUID.
			if ( 'videopress/playlist' === $block_name && is_array( $attr_videos ) ) {
				foreach ( $attr_videos as $entry ) {
					if ( is_array( $entry ) && isset( $entry['guid'] ) && is_string( $entry['guid'] ) ) {
						$guids[] = $entry['guid'];
					}
				}
			}

			// A synced pattern: resolve the wp_block ref, which parse_blocks() leaves unexpanded.
			if ( 'core/block' === $block_name && ! empty( $attr_ref ) ) {
				$ref = absint( $attr_ref );
				if ( $ref && ! isset( $visited_refs[ $ref ] ) && count( $visited_refs ) < self::MAX_PATTERN_REFS ) {
					$visited_refs[ $ref ] = true;

					$pattern = get_post( $ref );
					if (
						$pattern instanceof WP_Post
						&& 'wp_block' === $pattern->post_type
						&& 'publish' === $pattern->post_status
						&& empty( $pattern->post_password )
						&& ! empty( $pattern->post_content )
					) {
						$guids = array_merge( $guids, self::collect_guids_from_content( $pattern->post_content, $visited_refs ) );
					}
				}
			}

			// Recursively check inner blocks.
			if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
				$guids = array_merge( $guids, self::collect_guids_from_blocks( $block['innerBlocks'], $visited_refs ) );
			}
		}

		return $guids;
	}

	/**
	 * Check if a post contains a VideoPress GUID, using the cached GUID list for fast lookup.
	 *
	 * Used to prevent the embedded post id — which arrives from request input — from being
	 * treated as an authorization context when it has no relationship to the requested video.
	 * Matching the attachment id itself is not treated as proof of embedding: attachment ids
	 * are enumerable via the media REST route and would otherwise provide a second path around
	 * this check whenever the attachment has no parent and falls back to the `read` capability.
	 *
	 * @param int    $embedded_post_id The post id to check.
	 * @param string $guid             The video guid to find.
	 *
	 * @return bool
	 */
	private function post_embeds_videopress_guid_cached( $embedded_post_id, $guid ) {
		if ( empty( $embedded_post_id ) || empty( $guid ) ) {
			return false;
		}

		// Try fast lookup from cache.
		$transient_key = "videopress_guids_{$embedded_post_id}";
		$cached_guids  = get_transient( $transient_key );

		if ( false !== $cached_guids ) {
			return in_array( $guid, (array) $cached_guids, true );
		}

		// Cache miss: build and cache the GUID list, then check.
		$guids = self::build_and_cache_post_guids( $embedded_post_id );
		return in_array( $guid, $guids, true );
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
			&& ! $this->post_embeds_videopress_guid_cached( $embedded_post_id, $guid )
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
