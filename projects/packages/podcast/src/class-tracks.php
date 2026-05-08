<?php
/**
 * Tracks instrumentation for Jetpack Podcast.
 *
 * @package automattic/jetpack-podcast
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Podcast\Feed\Customize_Feed;
use Throwable;
use WP_Post;
use WP_Query;
use WP_REST_Request;
use WP_REST_Response;
use WP_User;

/**
 * Records the lifecycle events that drive podcast funnel reporting:
 * episode publishes, the per-site first-episode milestone, audio/video
 * uploads, podcatcher show-URL submissions, podcasting on/off transitions,
 * and `/wp/v2/settings` writes that touch any `podcasting_*` option.
 *
 * Mirrors the wpcom mu-plugin's `Automattic_Podcasting_Tracks`. Event names
 * stay `wpcom_*` so analytics queries cover Simple, Atomic, and Jetpack feeds
 * without a rewrite. Dispatch tries the wpcom-loadable `tracks_record_event`
 * first and falls back to `\Automattic\Jetpack\Tracking::tracks_record_event`
 * — neither is a hard dep, so the package degrades to silent no-op when
 * neither is reachable.
 */
class Tracks {

	/**
	 * Whether `init()` has wired its hooks.
	 *
	 * @var bool
	 */
	private static $registered = false;

	/**
	 * Cached Jetpack Tracking instance, lazily created on first Atomic dispatch.
	 *
	 * @var \Automattic\Jetpack\Tracking|null
	 */
	private static $jetpack_tracking = null;

	/**
	 * Snapshot of `podcasting_*` option values captured at the start of a
	 * `/wp/v2/settings` REST write, keyed by request object hash. Read back
	 * after the write completes so the emitted event can include both new
	 * and `previous_*` values per the wpcom shape.
	 *
	 * @var array<string, array<string, mixed>>
	 */
	private static $settings_snapshots = array();

	/**
	 * Wire the tracks hooks. Idempotent.
	 */
	public static function init(): void {
		if ( self::$registered ) {
			return;
		}
		self::$registered = true;

		// `wp_after_insert_post` fires after post + terms + meta are saved. Required for
		// Gutenberg/REST publishes where `transition_post_status` runs before terms are set.
		add_action( 'wp_after_insert_post', array( __CLASS__, 'record_episode_published' ), 10, 4 );

		add_action( 'add_attachment', array( __CLASS__, 'record_media_uploaded' ) );

		// Catch every `podcasting_category_id` write — REST, WP-CLI, direct `update_option()`.
		// `add_option` fires when no row exists yet; `update_option` covers subsequent writes.
		add_action( 'add_option_podcasting_category_id', array( __CLASS__, 'record_category_added' ), 10, 2 );
		add_action( 'update_option_podcasting_category_id', array( __CLASS__, 'record_category_updated' ), 10, 3 );

		// Catch every `podcasting_show_urls` write. Both hooks point at the same method;
		// it detects which fired by the first arg type (string on add, array on update).
		add_action( 'add_option_podcasting_show_urls', array( __CLASS__, 'record_show_url_addition' ), 10, 2 );
		add_action( 'update_option_podcasting_show_urls', array( __CLASS__, 'record_show_url_addition' ), 10, 2 );

		// `/wp/v2/settings` PATCH — snapshot before, emit after, mirroring wpcom's
		// `rest_api_update_site_settings`-driven `wpcom_podcasting_settings_saved`.
		add_filter( 'rest_request_before_callbacks', array( __CLASS__, 'snapshot_settings_before_write' ), 10, 3 );
		add_filter( 'rest_request_after_callbacks', array( __CLASS__, 'record_settings_saved' ), 10, 3 );
	}

	/**
	 * Reset internal state. Test-only — production never re-initializes.
	 */
	public static function reset_for_tests(): void {
		self::$registered         = false;
		self::$jetpack_tracking   = null;
		self::$settings_snapshots = array();
	}

	/**
	 * Emit `wpcom_podcast_episode_published` (and, on the very first episode
	 * for the site, `wpcom_podcast_show_launched`) when a podcast-category
	 * post enters `publish` for the first time.
	 *
	 * @param int          $post_id     Post ID.
	 * @param WP_Post|null $post        Post object.
	 * @param bool         $update      Whether this is an update.
	 * @param WP_Post|null $post_before Previous post state (or null on insert).
	 */
	public static function record_episode_published( $post_id, $post, $update, $post_before ): void {
		unset( $post_id, $update );

		try {
			if ( ! $post instanceof WP_Post ) {
				return;
			}

			if ( 'publish' !== $post->post_status ) {
				return;
			}

			if ( $post_before instanceof WP_Post && 'publish' === $post_before->post_status ) {
				return;
			}

			if ( defined( 'WP_IMPORTING' ) && WP_IMPORTING ) {
				return;
			}

			// `is_headstart_post` is a wpcom Simple helper that flags pre-populated
			// demo content; on Atomic the function is absent and the guard short-circuits.
			if ( function_exists( 'is_headstart_post' ) && is_headstart_post( $post ) ) {
				return;
			}

			if ( in_array( $post->post_type, array( 'attachment', 'revision', 'nav_menu_item' ), true ) ) {
				return;
			}

			$category_id = Customize_Feed::resolve_category_id();
			if ( 0 === $category_id ) {
				return;
			}

			if ( ! in_category( $category_id, $post ) ) {
				return;
			}

			// Match the RSS feed's definition of an episode: must carry a site-hosted
			// audio or video enclosure. Without this, a post merely categorized into
			// the podcasting category would fire even when it has no media — top
			// offenders pre-filter were posting 50+/day of non-podcast content.
			if ( ! self::has_podcast_media( $post ) ) {
				return;
			}

			$is_first = self::is_first_episode_for_site( $category_id, (int) $post->ID );
			$identity = self::identity_for_post( $post );

			self::record_event(
				$identity,
				'wpcom_podcast_episode_published',
				array(
					'blog_id'                   => (int) get_current_blog_id(),
					'post_id'                   => (int) $post->ID,
					'is_first_episode_for_site' => (bool) $is_first,
				)
			);

			// `add_option()` is atomic — only one concurrent caller per site wins the INSERT,
			// so `wpcom_podcast_show_launched` fires exactly once per site.
			if ( $is_first && add_option( 'podcast_show_launched_tracked', time(), '', false ) ) {
				self::record_event(
					$identity,
					'wpcom_podcast_show_launched',
					array(
						'blog_id' => (int) get_current_blog_id(),
						'post_id' => (int) $post->ID,
					)
				);
			}
		} catch ( Throwable $e ) {
			self::log_failure( 'episode-published-failed', $e );
		}
	}

	/**
	 * Emit `wpcom_podcast_media_uploaded` when an audio/video attachment is
	 * uploaded on a podcasting-enabled site.
	 *
	 * @param int $attachment_id Attachment post ID.
	 */
	public static function record_media_uploaded( $attachment_id ): void {
		try {
			if ( defined( 'WP_IMPORTING' ) && WP_IMPORTING ) {
				return;
			}

			// Skip Headstart demo-content uploads — wpcom Simple-only helper.
			$attachment = get_post( (int) $attachment_id );
			if ( $attachment && function_exists( 'is_headstart_post' ) && is_headstart_post( $attachment ) ) {
				return;
			}

			if ( 0 === Customize_Feed::resolve_category_id() ) {
				return;
			}

			$mime_type = (string) get_post_mime_type( (int) $attachment_id );
			if ( '' === $mime_type ) {
				return;
			}
			if ( 0 !== strpos( $mime_type, 'audio/' ) && 0 !== strpos( $mime_type, 'video/' ) ) {
				return;
			}

			self::record_event(
				wp_get_current_user(),
				'wpcom_podcast_media_uploaded',
				array(
					'blog_id'       => (int) get_current_blog_id(),
					'attachment_id' => (int) $attachment_id,
					'mime_type'     => $mime_type,
				)
			);
		} catch ( Throwable $e ) {
			self::log_failure( 'media-uploaded-failed', $e );
		}
	}

	/**
	 * `add_option_podcasting_category_id` callback — first-ever write of the
	 * option. Treats the previous value as 0 (option absent == disabled).
	 *
	 * @param string $option Option name.
	 * @param mixed  $value  Newly stored value.
	 */
	public static function record_category_added( $option, $value ): void {
		unset( $option );

		try {
			self::maybe_record_status_change( 0, (int) $value );
		} catch ( Throwable $e ) {
			self::log_failure( 'category-added-failed', $e );
		}
	}

	/**
	 * `update_option_podcasting_category_id` callback — every change to an
	 * existing row. WP short-circuits identical writes upstream, so
	 * `$old_value !== $value` is guaranteed here.
	 *
	 * @param mixed  $old_value Previous stored value.
	 * @param mixed  $value     Newly stored value.
	 * @param string $option    Option name.
	 */
	public static function record_category_updated( $old_value, $value, $option ): void {
		unset( $option );

		try {
			self::maybe_record_status_change( (int) $old_value, (int) $value );
		} catch ( Throwable $e ) {
			self::log_failure( 'category-updated-failed', $e );
		}
	}

	/**
	 * Emit `wpcom_podcasting_show_url_saved` for the first podcatcher key
	 * that transitions from absent/empty to a non-empty string. Each save
	 * patches one URL by design, so we emit at most one event per write.
	 *
	 * Bound to both `add_option_podcasting_show_urls` (signature: option,
	 * value) and `update_option_podcasting_show_urls` (signature: old_value,
	 * value, option). The first arg is either the option name (string, on
	 * add) or the previous stored value (array, on update); `is_array()`
	 * picks them apart.
	 *
	 * @param mixed $first_arg Option name or previous value.
	 * @param mixed $new_value Newly stored value.
	 */
	public static function record_show_url_addition( $first_arg, $new_value ): void {
		try {
			$old_value = is_array( $first_arg ) ? $first_arg : array();

			if ( ! is_array( $new_value ) ) {
				return;
			}

			foreach ( $new_value as $app => $url ) {
				if ( ! is_string( $url ) || '' === $url ) {
					continue;
				}

				$previous = isset( $old_value[ $app ] ) && is_string( $old_value[ $app ] ) ? $old_value[ $app ] : '';
				if ( '' !== $previous ) {
					continue;
				}

				self::record_event(
					wp_get_current_user(),
					'wpcom_podcasting_show_url_saved',
					array(
						'blog_id' => (int) get_current_blog_id(),
						'app'     => (string) $app,
					)
				);
				return;
			}
		} catch ( Throwable $e ) {
			self::log_failure( 'show-url-record-failed', $e );
		}
	}

	/**
	 * Capture a snapshot of all `podcasting_*` option values before a
	 * `/wp/v2/settings` write completes — only when the request body
	 * actually touches at least one of those options. Pass-through filter.
	 *
	 * @param mixed                 $response Response (passed through unchanged).
	 * @param array                 $handler  Route handler.
	 * @param WP_REST_Request|mixed $request  Request object.
	 * @return mixed
	 */
	public static function snapshot_settings_before_write( $response, $handler, $request ) {
		unset( $handler );

		try {
			if ( ! self::is_settings_write( $request ) ) {
				return $response;
			}

			$params = $request->get_params();
			if ( ! is_array( $params ) ) {
				return $response;
			}

			$touched = array_intersect_key( $params, array_flip( Settings::OPTION_NAMES ) );
			if ( empty( $touched ) ) {
				return $response;
			}

			self::$settings_snapshots[ spl_object_hash( $request ) ] = self::read_settings_state();
		} catch ( Throwable $e ) {
			self::log_failure( 'settings-snapshot-failed', $e );
		}

		return $response;
	}

	/**
	 * Emit `wpcom_podcasting_settings_saved` once per `/wp/v2/settings`
	 * write that touched any podcasting option, with `previous_*` keys for
	 * every podcasting field the GET response would normally expose.
	 *
	 * @param mixed                 $response Response (passed through unchanged).
	 * @param array                 $handler  Route handler.
	 * @param WP_REST_Request|mixed $request  Request object.
	 * @return mixed
	 */
	public static function record_settings_saved( $response, $handler, $request ) {
		unset( $handler );

		try {
			if ( ! $request instanceof WP_REST_Request ) {
				return $response;
			}

			$key = spl_object_hash( $request );
			if ( ! isset( self::$settings_snapshots[ $key ] ) ) {
				return $response;
			}

			$previous = self::$settings_snapshots[ $key ];
			unset( self::$settings_snapshots[ $key ] );

			// Don't emit if the write errored — the response would carry an error
			// status and the option values wouldn't have changed.
			if ( $response instanceof WP_REST_Response && $response->is_error() ) {
				return $response;
			}

			$current   = self::read_settings_state();
			$event_props = $current;
			foreach ( $previous as $field => $value ) {
				$event_props[ 'previous_' . $field ] = $value;
			}

			self::record_event(
				wp_get_current_user(),
				'wpcom_podcasting_settings_saved',
				$event_props
			);
		} catch ( Throwable $e ) {
			self::log_failure( 'settings-saved-failed', $e );
		}

		return $response;
	}

	/**
	 * Emit `wpcom_podcasting_status_changed` when the on/off state or
	 * assigned category transitions.
	 *
	 * @param int $old_value Previous category ID (0 == disabled).
	 * @param int $new_value New category ID (0 == disabled).
	 */
	private static function maybe_record_status_change( int $old_value, int $new_value ): void {
		if ( $old_value === $new_value ) {
			return;
		}

		if ( 0 === $old_value && 0 !== $new_value ) {
			$status = 'enabled';
		} elseif ( 0 !== $old_value && 0 === $new_value ) {
			$status = 'disabled';
		} else {
			$status = 'changed';
		}

		// Resolve the plan slug from whichever plan API is loaded. WPCOM_Store_API
		// on Simple, Jetpack's Current_Plan on Atomic; either may be absent in
		// unusual contexts, in which case we record an empty slug rather than fatal.
		$plan_slug = '';
		if ( class_exists( '\WPCOM_Store_API' ) ) {
			$current_plan = \WPCOM_Store_API::get_current_plan( (int) get_current_blog_id() );
			if ( ! empty( $current_plan['product_slug'] ) ) {
				$plan_slug = (string) $current_plan['product_slug'];
			}
		} elseif ( class_exists( '\Automattic\Jetpack\Current_Plan' ) ) {
			$current_plan = \Automattic\Jetpack\Current_Plan::get();
			if ( ! empty( $current_plan['product_slug'] ) ) {
				$plan_slug = (string) $current_plan['product_slug'];
			}
		}

		self::record_event(
			wp_get_current_user(),
			'wpcom_podcasting_status_changed',
			array(
				'blog_id'              => (int) get_current_blog_id(),
				'status'               => $status,
				'surface'              => 'option_write',
				'previous_category_id' => (int) $old_value,
				'new_category_id'      => (int) $new_value,
				'user_id'              => (int) get_current_user_id(),
				'product_slug'         => $plan_slug,
			)
		);

		// Preserve the legacy mc.a8c.com counter the previous REST-side helper
		// bumped. Wrapped because `bump_stats_extras()` is wpcom Simple-only.
		if ( function_exists( 'bump_stats_extras' ) ) {
			// @phan-suppress-next-line PhanUndeclaredFunction -- Provided by wpcom Simple at runtime; guarded by `function_exists` above.
			bump_stats_extras( 'wpcom-podcasting-status', $status );
		}
	}

	/**
	 * True if the request looks like a write to the `/wp/v2/settings` route.
	 *
	 * @param mixed $request Request object.
	 * @return bool
	 */
	private static function is_settings_write( $request ): bool {
		if ( ! $request instanceof WP_REST_Request ) {
			return false;
		}
		if ( '/wp/v2/settings' !== $request->get_route() ) {
			return false;
		}
		return in_array( $request->get_method(), array( 'POST', 'PUT', 'PATCH' ), true );
	}

	/**
	 * Read the full set of podcasting-related option values that the wpcom
	 * settings GET previously exposed. Mirrors that response shape so the
	 * emitted event keeps schema parity with the wpcom version.
	 *
	 * @return array<string, mixed>
	 */
	private static function read_settings_state(): array {
		return array(
			'podcasting_category_id' => Customize_Feed::resolve_category_id(),
			'podcasting_title'       => (string) get_option( 'podcasting_title', '' ),
			'podcasting_talent_name' => (string) get_option( 'podcasting_talent_name', '' ),
			'podcasting_summary'     => (string) get_option( 'podcasting_summary', '' ),
			'podcasting_copyright'   => (string) get_option( 'podcasting_copyright', '' ),
			'podcasting_explicit'    => Settings::sanitize_explicit( get_option( 'podcasting_explicit', false ) ) ? 'yes' : 'no',
			'podcasting_image'       => (string) get_option( 'podcasting_image', '' ),
			'podcasting_image_id'    => (int) get_option( 'podcasting_image_id', 0 ),
			'podcasting_category_1'  => (string) get_option( 'podcasting_category_1', '' ),
			'podcasting_category_2'  => (string) get_option( 'podcasting_category_2', '' ),
			'podcasting_category_3'  => (string) get_option( 'podcasting_category_3', '' ),
			'podcasting_email'       => (string) get_option( 'podcasting_email', '' ),
			'podcasting_show_urls'   => (array) get_option( 'podcasting_show_urls', array() ),
			'podcasting_show_states' => (array) get_option( 'podcasting_show_states', array() ),
		);
	}

	/**
	 * Identity to attribute the publish event to. Scheduled/cron publishes
	 * have no logged-in user — fall back to the post author.
	 *
	 * @param WP_Post $post Post being published.
	 * @return WP_User
	 */
	private static function identity_for_post( WP_Post $post ): WP_User {
		if ( ! empty( $post->post_author ) ) {
			$user = get_userdata( (int) $post->post_author );
			if ( $user instanceof WP_User ) {
				return $user;
			}
		}
		return wp_get_current_user();
	}

	/**
	 * True if the post embeds site-hosted audio. The host check filters out
	 * posts that merely embed third-party players (SoundCloud, Spotify,
	 * RSS-imported audio links) — those flooded analytics pre-filter on
	 * wpcom. Classic-editor attachments are site-hosted by definition and
	 * skip the host check via the `WP_Query` lookup below.
	 *
	 * @param WP_Post $post Post being checked.
	 * @return bool
	 */
	private static function has_podcast_media( WP_Post $post ): bool {
		$content      = (string) $post->post_content;
		$baseurl      = (string) ( wp_upload_dir()['baseurl'] ?? '' );
		$home_host    = (string) wp_parse_url( home_url(), PHP_URL_HOST );
		$baseurl_host = (string) wp_parse_url( $baseurl, PHP_URL_HOST );
		$hosts        = array_values( array_unique( array_filter( array( $home_host, $baseurl_host ) ) ) );

		if (
			has_block( 'core/audio', $post )
			&& self::has_site_hosted_audio_block( parse_blocks( $content ), $baseurl, $hosts )
		) {
			return true;
		}

		$extensions = implode( '|', array_map( 'preg_quote', wp_get_audio_extensions() ) );
		if ( '' !== $extensions && preg_match_all( '#https?://\S+?\.(' . $extensions . ')\b#i', $content, $matches ) ) {
			foreach ( $matches[0] as $url ) {
				if ( self::is_site_hosted_url( $url, $baseurl, $hosts ) ) {
					return true;
				}
			}
		}

		$attached = new WP_Query(
			array(
				'post_parent'            => (int) $post->ID,
				'post_type'              => 'attachment',
				'post_mime_type'         => 'audio',
				'posts_per_page'         => 1,
				'fields'                 => 'ids',
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
				'suppress_filters'       => true,
			)
		);
		return ! empty( $attached->posts );
	}

	/**
	 * Walk parsed blocks recursively looking for a `core/audio` block whose
	 * `src` attribute points at site-hosted media.
	 *
	 * @param array  $blocks  Parsed blocks.
	 * @param string $baseurl Site uploads baseurl.
	 * @param array  $hosts   Allowed hostnames.
	 * @return bool
	 */
	private static function has_site_hosted_audio_block( array $blocks, string $baseurl, array $hosts ): bool {
		foreach ( $blocks as $block ) {
			if ( 'core/audio' === ( $block['blockName'] ?? '' ) ) {
				$src = (string) ( $block['attrs']['src'] ?? '' );
				if ( '' !== $src && self::is_site_hosted_url( $src, $baseurl, $hosts ) ) {
					return true;
				}
			}
			if (
				! empty( $block['innerBlocks'] )
				&& self::has_site_hosted_audio_block( $block['innerBlocks'], $baseurl, $hosts )
			) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Baseurl prefix is the precise check. The host fallbacks cover (a) the
	 * site's primary URL host and (b) the uploads host itself — on wpcom
	 * multisite, `*.files.wordpress.com` subdomains are 1:1 per site, so
	 * older uploads outside the current month's baseurl path still match
	 * safely.
	 *
	 * @param string $url     Candidate URL.
	 * @param string $baseurl Site uploads baseurl.
	 * @param array  $hosts   Allowed hostnames.
	 * @return bool
	 */
	private static function is_site_hosted_url( string $url, string $baseurl, array $hosts ): bool {
		if ( '' !== $baseurl && 0 === strpos( $url, $baseurl ) ) {
			return true;
		}
		$url_host = (string) wp_parse_url( $url, PHP_URL_HOST );
		if ( '' === $url_host ) {
			return false;
		}
		foreach ( $hosts as $allowed_host ) {
			if ( 0 === strcasecmp( $url_host, $allowed_host ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * True when no other published post exists in the podcast category.
	 *
	 * @param int $category_id     Configured podcast category ID.
	 * @param int $current_post_id Post being published (excluded from the check).
	 * @return bool
	 */
	private static function is_first_episode_for_site( int $category_id, int $current_post_id ): bool {
		$existing = new WP_Query(
			array(
				'post_status'      => 'publish',
				'post_type'        => 'post',
				'cat'              => $category_id,
				'post__not_in'     => array( $current_post_id ),
				'posts_per_page'   => 1,
				'fields'           => 'ids',
				'no_found_rows'    => true,
				'suppress_filters' => true,
			)
		);

		return empty( $existing->posts );
	}

	/**
	 * Dispatch a tracks event. Prefers wpcom's `tracks_record_event` (Simple)
	 * and falls back to Jetpack's `Tracking::tracks_record_event` (Atomic).
	 * Returns silently when neither is reachable, or when the dispatcher
	 * itself throws.
	 *
	 * @param mixed  $user       Username, user ID, or `WP_User` object.
	 * @param string $event_name Tracks event name.
	 * @param array  $properties Event properties.
	 * @return mixed Dispatcher return value, or null on failure / no-op.
	 */
	private static function record_event( $user, string $event_name, array $properties ) {
		try {
			if ( is_numeric( $user ) ) {
				$user = get_userdata( (int) $user );
			}

			if ( ! $user instanceof WP_User ) {
				$user = wp_get_current_user();
			}

			if ( ! function_exists( 'tracks_record_event' ) && function_exists( 'require_lib' ) ) {
				// @phan-suppress-next-line PhanUndeclaredFunction -- Provided by wpcom Simple at runtime; guarded by `function_exists` above.
				require_lib( 'tracks/client' );
			}

			if ( function_exists( 'tracks_record_event' ) ) {
				// @phan-suppress-next-line PhanUndeclaredFunction -- Provided by wpcom Simple at runtime; guarded by `function_exists` above.
				return tracks_record_event( $user, $event_name, $properties );
			}

			if ( class_exists( '\Automattic\Jetpack\Tracking' ) ) {
				if ( null === self::$jetpack_tracking ) {
					self::$jetpack_tracking = new \Automattic\Jetpack\Tracking();
				}
				return self::$jetpack_tracking->tracks_record_event( $user, $event_name, $properties );
			}
		} catch ( Throwable $e ) {
			self::log_failure( 'dispatcher-failed', $e, array( 'event_name' => $event_name ) );
		}

		return null;
	}

	/**
	 * Best-effort error logging via `log2logstash` when available. Keeps the
	 * package free of a hard logging dep — Atomic environments without the
	 * lib silently skip.
	 *
	 * @param string    $message    Short failure tag.
	 * @param Throwable $error      Throwable that triggered the log call.
	 * @param array     $properties Extra context.
	 */
	private static function log_failure( string $message, Throwable $error, array $properties = array() ): void {
		if ( ! function_exists( 'log2logstash' ) ) {
			return;
		}

		// @phan-suppress-next-line PhanUndeclaredFunction -- Guarded by `function_exists` above.
		log2logstash(
			array(
				'feature'    => 'jetpack-podcast-tracks',
				'message'    => $message,
				'severity'   => 'error',
				'blog_id'    => (int) get_current_blog_id(),
				'extra'      => array(
					'error_message' => $error->getMessage(),
					'error_file'    => $error->getFile() . ':' . $error->getLine(),
					'properties'    => $properties,
				),
			)
		);
	}
}
