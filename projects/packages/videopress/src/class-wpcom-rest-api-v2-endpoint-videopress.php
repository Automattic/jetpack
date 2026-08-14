<?php
/**
 * REST API endpoint for managing VideoPress metadata.
 *
 * @package automattic/jetpack
 * @since-jetpack 9.3.0
 * @since 0.1.3
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Constants;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * VideoPress wpcom api v2 endpoint
 *
 * @phan-constructor-used-for-side-effects
 */
class WPCOM_REST_API_V2_Endpoint_VideoPress extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'videopress';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		// Meta Route.
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/meta',
			array(
				'args'                => array(
					'id'              => array(
						'description' => __( 'The post id for the attachment.', 'jetpack-videopress-pkg' ),
						'type'        => 'integer',
						'required'    => true,
					),
					'title'           => array(
						'description'       => __( 'The title of the video.', 'jetpack-videopress-pkg' ),
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'description'     => array(
						'description'       => __( 'The description of the video.', 'jetpack-videopress-pkg' ),
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_textarea_field',
					),
					'caption'         => array(
						'description'       => __( 'The caption of the video.', 'jetpack-videopress-pkg' ),
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_textarea_field',
					),
					'rating'          => array(
						'description'       => __( 'The video content rating. One of G, PG-13 or R-17', 'jetpack-videopress-pkg' ),
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'display_embed'   => array(
						'description' => __( 'Display the share menu in the player.', 'jetpack-videopress-pkg' ),
						'type'        => 'boolean',
					),
					'allow_download'  => array(
						'description' => __( 'Display download option and allow viewers to download this video', 'jetpack-videopress-pkg' ),
						'type'        => 'boolean',
					),
					'privacy_setting' => array(
						'description' => __( 'How to determine if the video should be public or private', 'jetpack-videopress-pkg' ),
						'type'        => 'integer',
						'enum'        => array(
							\VIDEOPRESS_PRIVACY::IS_PUBLIC,
							\VIDEOPRESS_PRIVACY::IS_PRIVATE,
							\VIDEOPRESS_PRIVACY::SITE_DEFAULT,
						),
					),
				),
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'videopress_block_update_meta' ),
				'permission_callback' => function ( $request ) {
					if ( ! Data::can_perform_action() ) {
						return false;
					}
					// Authorize against the specific attachment the request targets,
					// not just the generic edit_posts capability. `id` is read from
					// the JSON body to match videopress_block_update_meta(), so a
					// Contributor cannot modify (or, via a privacy downgrade, expose)
					// another user's video.
					$params  = $request->get_json_params();
					$post_id = isset( $params['id'] ) ? (int) $params['id'] : 0;
					return current_user_can( 'edit_post', $post_id );
				},
			)
		);

		// Poster Route.
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/(?P<video_guid>[A-Za-z0-9]{8})/poster',
			array(
				'args' => array(
					'video_guid' => array(
						'description' => __( 'The VideoPress GUID.', 'jetpack-videopress-pkg' ), // @phan-suppress-current-line PhanPluginMixedKeyNoKey
						'type'        => 'string',
						'required'    => true,
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'videopress_block_get_poster' ),
					'permission_callback' => function ( $request ) {
						// Reading a poster/frame exposes video content, so require the
						// same per-video view authorization as playback in addition to
						// `read`. This closes a Subscriber+ read of any private video's
						// poster/frame by guid.
						//
						// `read` is kept because is_current_user_authed_for_video() has
						// no logged-out bail and returns true for an effectively public
						// video, so dropping it would make this route reachable
						// anonymously -- an unauthenticated amplifier for the two
						// outbound WordPress.com requests the handler makes.
						return current_user_can( 'read' )
							&& Access_Control::instance()->is_current_user_authed_for_video( $request->get_param( 'video_guid' ), 0 );
					},
				),
				array(
					'args'                => array(
						'at_time'              => array(
							'description' => __( 'The time in the video to use as the poster frame.', 'jetpack-videopress-pkg' ),
							'type'        => 'integer',
						),
						'is_millisec'          => array(
							'description' => __( 'Whether the time is in milliseconds or seconds.', 'jetpack-videopress-pkg' ),
							'type'        => 'boolean',
						),
						'poster_attachment_id' => array(
							'description' => __( 'The attachment id of the poster image.', 'jetpack-videopress-pkg' ),
							'type'        => 'integer',
						),
					),
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'videopress_block_update_poster' ),
					'permission_callback' => function ( $request ) {
						// Authorize the poster write against the specific video rather
						// than the site-wide upload_files capability alone, so an author
						// cannot overwrite the poster of another user's video by guid.
						//
						// upload_files is kept as a floor: for an attachment
						// (post_status 'inherit') core maps edit_post to edit_posts for
						// the post author, which a Contributor has and which does not
						// imply the media rights this route needs.
						return Data::can_perform_action()
							&& current_user_can( 'upload_files' )
							&& current_user_can( 'edit_post', self::get_video_attachment_id( $request->get_param( 'video_guid' ) ) );
					},
				),
			)
		);

		// Endpoint to know if the video metadata is editable.
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/(?P<video_guid>[A-Za-z0-9]{8})/check-ownership/(?P<post_id>\d+)/',
			array(
				'args' => array(
					'video_guid' => array(
						'description' => __( 'The VideoPress GUID.', 'jetpack-videopress-pkg' ), // @phan-suppress-current-line PhanPluginMixedKeyNoKey
						'type'        => 'string',
						'required'    => true,
					),
					'post_id'    => array(
						'description' => __( 'The post id for the attachment.', 'jetpack-videopress-pkg' ),
						'type'        => 'integer',
						'required'    => true,
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'videopress_video_belong_to_site' ),
					'permission_callback' => function () {
						return Data::can_perform_action() && current_user_can( 'upload_files' );
					},
				),
			)
		);

		// Token Route.
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/upload-jwt',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'videopress_upload_jwt' ),
				'permission_callback' => function () {
					return Data::can_perform_action() && current_user_can( 'upload_files' );
				},
			)
		);

		// Playback Token Route.
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/playback-jwt/(?P<video_guid>[A-Za-z0-9]{8})',
			array(
				'args'                => array(
					'video_guid'           => array(
						'description' => __( 'The VideoPress GUID.', 'jetpack-videopress-pkg' ),
						'type'        => 'string',
						'required'    => true,
					),
					'post_id'              => array(
						'description' => __( 'The post the video is embedded in, used to authorize access.', 'jetpack-videopress-pkg' ),
						'type'        => 'integer',
						'required'    => false,
					),
					'subscription_plan_id' => array(
						'description' => __( 'The subscription plan the premium-content block gating the video uses.', 'jetpack-videopress-pkg' ),
						'type'        => 'integer',
						'required'    => false,
					),
				),
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'videopress_playback_jwt' ),
				'permission_callback' => function () {
					return current_user_can( 'read' );
				},
			)
		);

		// Settings Routes. Primarily for WordPress.com Simple, where the
		// videopress/v1 namespace never reaches the REST dispatcher; the
		// routes also register self-hosted as a harmless duplicate of
		// videopress/v1/settings (the callbacks are host-safe).
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'videopress_get_settings' ),
					'permission_callback' => function () {
						return current_user_can( 'manage_options' );
					},
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'videopress_update_settings' ),
					'permission_callback' => function () {
						return Data::can_perform_action() && current_user_can( 'manage_options' );
					},
					'args'                => array(
						'videopress_videos_private_for_site' => array(
							'description' => __( 'If the VideoPress videos should be private by default', 'jetpack-videopress-pkg' ),
							'type'        => 'boolean',
						),
						'videopress_auto_subtitles_disabled' => array(
							'description' => __( 'If auto-generated subtitles should be skipped for new videos', 'jetpack-videopress-pkg' ),
							'type'        => 'boolean',
						),
					),
				),
			)
		);

		// Promote Route. WordPress.com Simple only: turn an existing local
		// video attachment into a VideoPress video in-process. The file
		// already lives on WordPress.com storage, so unlike the self-hosted
		// flow (which walks videopress/v1/upload/{id} pushing tus chunks)
		// promotion is a single call: create the global videos-table row and
		// enqueue the transcode. Lives in wpcom/v2 because videopress/v1
		// never reaches the REST dispatcher on Simple; the callback returns
		// a clean error on every other host.
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/promote/(?P<attachment_id>\d+)',
			array(
				'args'                => array(
					'attachment_id' => array(
						'description' => __( 'The attachment id of the video to promote.', 'jetpack-videopress-pkg' ),
						'type'        => 'integer',
						'required'    => true,
					),
				),
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'videopress_promote_attachment' ),
				'permission_callback' => function ( $request ) {
					// videopress/v1/upload (the self-hosted equivalent) never reaches
					// the REST dispatcher on WordPress.com Simple; promotion is the
					// Simple path and acts on a caller-supplied attachment id, so in
					// addition to upload_files it needs the same per-object check to
					// avoid a cross-user IDOR.
					if ( ! Data::can_perform_action() || ! current_user_can( 'upload_files' ) ) {
						return false;
					}
					return current_user_can( 'edit_post', (int) $request->get_param( 'attachment_id' ) );
				},
			)
		);
	}

	/**
	 * Returns the VideoPress site settings.
	 *
	 * `Data::get_videopress_settings()` is already IS_WPCOM-aware (site
	 * privacy / site type resolution), so the same callback serves every
	 * host.
	 *
	 * @return WP_REST_Response The response object.
	 */
	public function videopress_get_settings() {
		return rest_ensure_response( Data::get_videopress_settings() );
	}

	/**
	 * Updates the VideoPress site settings.
	 *
	 * Mirrors `VideoPress_Rest_Api_V1_Settings::update_settings()`, except
	 * on WPCOM only `videopress_auto_subtitles_disabled` is honored:
	 * `videopress_private_enabled_for_site` is a dead option on Simple,
	 * where the site-default privacy derives from the site's own privacy
	 * setting. When a caller supplies that param on WPCOM it is not
	 * persisted, and the response reports it under `ignored` so consumers
	 * are not told a write succeeded when it was silently discarded.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response The response object.
	 */
	public function videopress_update_settings( $request ) {
		$private_for_site        = $request->get_param( 'videopress_videos_private_for_site' );
		$auto_subtitles_disabled = $request->get_param( 'videopress_auto_subtitles_disabled' );

		$ignored = array();

		// On WordPress.com Simple the site-default privacy derives from the
		// site's own privacy setting, so `videopress_private_enabled_for_site`
		// is a dead option. Drop the param rather than pretend to persist it,
		// and surface it as ignored so the response stays truthful.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if ( null !== $private_for_site ) {
				$ignored[] = 'videopress_videos_private_for_site';
			}
			$private_for_site = null;
		}

		if ( null !== $private_for_site ) {
			update_option( 'videopress_private_enabled_for_site', $private_for_site );
		}

		if ( null !== $auto_subtitles_disabled ) {
			update_option( 'videopress_auto_subtitles_disabled', $auto_subtitles_disabled );
		}

		$response = array(
			'code'    => 'success',
			'message' => __( 'VideoPress settings updated successfully.', 'jetpack-videopress-pkg' ),
			'data'    => 200,
		);

		if ( ! empty( $ignored ) ) {
			$response['ignored'] = $ignored;
			$response['message'] = __( 'VideoPress settings updated. Some settings are not configurable on this site and were ignored.', 'jetpack-videopress-pkg' );
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Promote an existing local video attachment to VideoPress. WordPress.com
	 * Simple only.
	 *
	 * The population this serves: sites that uploaded videos on a plan
	 * without VideoPress and later upgraded to one that includes it — their
	 * pre-upgrade videos are plain attachments with no path onto VideoPress
	 * (the dashboard's self-hosted promote flow can't run on Simple).
	 *
	 * Promotion is in-place: the same attachment id gains a row in the
	 * global videos table — no sibling attachment is created and no
	 * `_videopress_uploaded_id` marker is written (that is the self-hosted
	 * sibling convention). The handler calls the exact primitive every
	 * direct upload to a VideoPress-enabled Simple site flows through via
	 * its `add_attachment` hook: `remote_transcode_one_video()`.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function videopress_promote_attachment( $request ) {
		if ( ! $this->promote_is_available() ) {
			return new WP_Error(
				'videopress_promote_not_available',
				__( 'Promoting local videos is only available on WordPress.com sites.', 'jetpack-videopress-pkg' ),
				array( 'status' => 404 )
			);
		}

		$attachment_id = (int) $request->get_param( 'attachment_id' );
		$blog_id       = get_current_blog_id();

		$post = get_post( $attachment_id );
		if ( ! $post || 'attachment' !== $post->post_type || 'trash' === $post->post_status || ! wp_attachment_is( 'video', $post ) ) {
			return new WP_Error(
				'videopress_promote_invalid_attachment',
				__( 'The attachment is not a video in this site’s media library.', 'jetpack-videopress-pkg' ),
				array( 'status' => 404 )
			);
		}

		/*
		 * Plan gate. The native path enforces VideoPress at upload/mime time
		 * (wpcom_site_can_upload_videos()) and remote_transcode_one_video()
		 * itself checks nothing — without this, a site whose plan allows
		 * plain video uploads but not VideoPress could enqueue transcodes.
		 */
		if ( ! $this->promote_site_has_videopress( $blog_id ) ) {
			return new WP_Error(
				'videopress_promote_not_allowed',
				__( 'This site’s plan does not include VideoPress.', 'jetpack-videopress-pkg' ),
				array( 'status' => 403 )
			);
		}

		if ( ! $this->promote_load_primitives() ) {
			return new WP_Error(
				'videopress_promote_unavailable',
				__( 'VideoPress is not available right now. Please try again later.', 'jetpack-videopress-pkg' ),
				array( 'status' => 500 )
			);
		}

		/*
		 * Already on VideoPress? Report success idempotently. Cache-busted
		 * read: the wpcom delete path does clean this key, but a stale 12h
		 * 'video-info' entry must not misreport here — and the fresh read
		 * re-primes the cache the primitive's own (non-busted) lookup uses.
		 */
		$info = $this->promote_video_info( $blog_id, $attachment_id );
		if ( $info && ! empty( $info->guid ) ) {
			return rest_ensure_response(
				array(
					'guid'               => $info->guid,
					'media_id'           => $attachment_id,
					'already_videopress' => true,
				)
			);
		}

		/*
		 * A soft-deleted VideoPress row may still occupy this attachment's
		 * slot: the videos table's primary key is (blog_id, post_id), so a
		 * tombstoned row makes video_create_info()'s insert fail silently
		 * and the fresh promote below would report an unexplained failure.
		 * (The tombstoned attachment renders as an ordinary local video —
		 * the REST fields only see live rows — so the UI can reach this.)
		 * Detect it and answer honestly instead. Resurrecting the row via
		 * the primitive's $redo path is a possible follow-up, but it needs
		 * rollback semantics this endpoint doesn't want to own yet.
		 */
		if ( $this->promote_find_any_guid( $blog_id, $attachment_id ) ) {
			return new WP_Error(
				'videopress_promote_previously_deleted',
				__( 'This video was previously deleted from VideoPress, so it can’t be promoted automatically. Please upload it as a new video instead.', 'jetpack-videopress-pkg' ),
				array( 'status' => 409 )
			);
		}

		/*
		 * remote_transcode_one_video() derives the transcoder's fetch URL
		 * from the attached file's blogs.dir path with an unguarded regex; a
		 * non-matching path (some imports/migrations) would still create the
		 * videos row and enqueue a malformed job that renders as
		 * "Processing" forever. Validate with the same pattern first
		 * (verbatim, unescaped dot included) and fail clean.
		 */
		$path = get_attached_file( $attachment_id );
		if ( ! $path || ! preg_match( '|/wp-content/blogs.dir\S+?files(.+)$|i', $path ) ) {
			return new WP_Error(
				'videopress_promote_unsupported_file',
				__( 'This video’s file cannot be promoted automatically. Please download it and upload it again.', 'jetpack-videopress-pkg' ),
				array( 'status' => 400 )
			);
		}

		/*
		 * Best-effort mutex around the primitive: the pre-checks above are
		 * check-then-act, and remote_transcode_one_video() ignores
		 * video_create_info()'s outcome and queues its transcode job
		 * unconditionally — so two near-simultaneous promotes (double-click,
		 * two tabs) would transcode the same video twice. wp_cache_add() is
		 * atomic on the wpcom object cache; the TTL comfortably outlives the
		 * primitive's sleep(3) and self-heals if the request dies mid-hold.
		 */
		$promote_lock = $this->promote_lock_key( $blog_id, $attachment_id );
		if ( ! wp_cache_add( $promote_lock, 1, 'video-info', 30 ) ) {
			return new WP_Error(
				'videopress_promote_in_progress',
				__( 'This video is already being promoted to VideoPress.', 'jetpack-videopress-pkg' ),
				array( 'status' => 409 )
			);
		}

		/*
		 * Creates the videos-table row (video_create_info()) and enqueues
		 * the async transcode job. The fresh-upload path sleep(3)s before
		 * queueing (DB-write settling), so this request takes ~3s.
		 */
		$this->promote_transcode( $attachment_id );

		/*
		 * The primitive returns bare false for every bail reason (missing
		 * attachment, already transcoded, …), so verify by re-reading the
		 * videos table instead of trusting the return value.
		 */
		$info = $this->promote_video_info( $blog_id, $attachment_id );

		wp_cache_delete( $promote_lock, 'video-info' );

		if ( ! $info || empty( $info->guid ) ) {
			return new WP_Error(
				'videopress_promote_failed',
				__( 'The video could not be promoted to VideoPress. Please try again later.', 'jetpack-videopress-pkg' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response(
			array(
				'guid'     => $info->guid,
				'media_id' => $attachment_id,
			)
		);
	}

	/*
	 * The five methods below are the promote flow's wpcom seams. They exist
	 * so the orchestration above is unit-testable: monorepo CI can never
	 * define IS_WPCOM, so without them every branch past the host guard
	 * would be dead code under test. A WorDBless test double overrides
	 * exactly these (and nothing else) to exercise the real ordering,
	 * error contract, and mutex behavior.
	 */

	/**
	 * The object-cache key serializing promotes of one attachment.
	 *
	 * @param int $blog_id       The blog id.
	 * @param int $attachment_id The attachment id.
	 * @return string
	 */
	protected function promote_lock_key( $blog_id, $attachment_id ) {
		return "videopress-promote-{$blog_id}-{$attachment_id}";
	}

	/**
	 * Whether the in-process promote flow is available on this host.
	 *
	 * @return bool
	 */
	protected function promote_is_available() {
		return defined( 'IS_WPCOM' ) && IS_WPCOM;
	}

	/**
	 * Whether the site's plan includes VideoPress.
	 *
	 * @param int $blog_id The blog to check.
	 * @return bool
	 */
	protected function promote_site_has_videopress( $blog_id ) {
		return function_exists( 'wpcom_site_has_videopress' ) && wpcom_site_has_videopress( $blog_id );
	}

	/**
	 * Ensure the wpcom transcode primitives are loaded.
	 *
	 * Public-api requests define ADMIN_PLUGINS, so they normally already
	 * are; this mirrors the wpcom TUS uploader's
	 * ensure_wpcom_admin_includes_present() guard for any context where
	 * they aren't. Each file is existence-checked individually so a
	 * partially-moved set mid-deploy degrades to the handler's clean error
	 * rather than a require fatal.
	 *
	 * @return bool Whether the primitives are callable.
	 */
	protected function promote_load_primitives() {
		if ( ! function_exists( 'remote_transcode_one_video' ) && defined( 'ABSPATH' ) ) {
			$transcode_includes = array(
				'class.videopress-job-base.php',
				'class.video-job-thumbnails.php',
				'class.video-thumbnailer.php',
				'video-transcoder.php',
				'transcode.php',
			);
			foreach ( $transcode_includes as $transcode_include ) {
				$transcode_include_path = ABSPATH . 'wp-content/admin-plugins/videopress/' . $transcode_include;
				if ( file_exists( $transcode_include_path ) ) {
					require_once $transcode_include_path;
				}
			}
		}

		return function_exists( 'remote_transcode_one_video' ) && function_exists( 'video_get_info_by_blogpostid' );
	}

	/**
	 * Cache-busted read of the live videos-table row for an attachment.
	 *
	 * @param int $blog_id       The blog id.
	 * @param int $attachment_id The attachment id.
	 * @return object|false The video info object, or false when no live row exists.
	 */
	protected function promote_video_info( $blog_id, $attachment_id ) {
		return video_get_info_by_blogpostid( $blog_id, $attachment_id, true );
	}

	/**
	 * Find any videos-table guid for the attachment, tombstoned included —
	 * the live-row helper can't see soft-deleted rows.
	 *
	 * @param int $blog_id       The blog id.
	 * @param int $attachment_id The attachment id.
	 * @return string|null The guid, or null when no row exists at all.
	 */
	protected function promote_find_any_guid( $blog_id, $attachment_id ) {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- wpcom global table; must see tombstoned rows and must not be cached.
		return $wpdb->get_var( $wpdb->prepare( 'SELECT guid FROM videos WHERE blog_id = %d AND post_id = %d', $blog_id, $attachment_id ) );
	}

	/**
	 * Run the wpcom promote primitive for an attachment.
	 *
	 * @param int $attachment_id The attachment id.
	 * @return void
	 */
	protected function promote_transcode( $attachment_id ) {
		remote_transcode_one_video( $attachment_id ); // @phan-suppress-current-line PhanUndeclaredFunction -- wpcom-only (admin-plugins/videopress/transcode.php), promote_load_primitives()-guarded; not in the generated wpcom stubs yet.
	}

	/**
	 * Check whether the video belongs to the current site,
	 * considering the given post_id and the video_guid.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response True if the video belongs to the current site, false otherwise.
	 */
	public function videopress_video_belong_to_site( $request ) {
		$post_id    = $request->get_param( 'post_id' );
		$video_guid = $request->get_param( 'video_guid' );

		if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
			$found_guid = get_post_meta( $post_id, 'videopress_guid', true );
		} else {
			$blog_id    = get_current_blog_id();
			$info       = video_get_info_by_blogpostid( $blog_id, $post_id );
			$found_guid = $info ? $info->guid : '';
		}

		if ( ! $found_guid ) {
			return rest_ensure_response( array( 'video-belong-to-site' => false ) );
		}

		return rest_ensure_response( array( 'video-belong-to-site' => $found_guid === $video_guid ) );
	}

	/**
	 * Hit WPCOM poster endpoint.
	 *
	 * @param string $video_guid  The VideoPress GUID.
	 * @param array  $args        Request args.
	 * @param array  $body        Request body.
	 * @param string $query       Request query.
	 * @return WP_REST_Response|WP_Error
	 */
	public function wpcom_poster_request( $video_guid, $args, $body = null, $query = '' ) {
		$query    = $query !== '' ? '?' . $query : '';
		$endpoint = 'videos/' . $video_guid . '/poster' . $query;

		$url = sprintf(
			'%s/%s/v%s/%s',
			Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' ),
			'rest',
			'1.1',
			$endpoint
		);

		$request_args = array_merge( $args, array( 'body' => $body ) );

		// @phan-suppress-next-line PhanAccessMethodInternal -- Phan is correct, but the usage is intentional.
		$result = Client::_wp_remote_request( $url, $request_args );

		if ( is_wp_error( $result ) ) {
			return rest_ensure_response( $result );
		}

		$response = $result['http_response'];

		$status = $response->get_status();

		$data = array(
			'code' => $status,
			'data' => json_decode( $response->get_data(), true ),
		);

		return rest_ensure_response(
			new WP_REST_Response( $data, $status )
		);
	}

	/**
	 * Resolve a VideoPress guid to its local attachment id on the current site.
	 *
	 * Used to authorize poster reads/writes against the specific video. Returns
	 * 0 when the guid cannot be resolved to an attachment on this site, so the
	 * capability check that consumes it fails closed.
	 *
	 * @param string $video_guid The VideoPress GUID.
	 * @return int The attachment/post id, or 0 if it cannot be resolved.
	 */
	private static function get_video_attachment_id( $video_guid ) {
		if ( empty( $video_guid ) ) {
			return 0;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$video_info = video_get_info_by_guid( $video_guid );
			if ( empty( $video_info ) || (int) $video_info->blog_id !== get_current_blog_id() ) {
				return 0;
			}
			return (int) $video_info->post_id;
		}

		// utility-functions.php is not loaded in every configuration, so fail
		// closed rather than fatal if the resolver is unavailable.
		if ( ! function_exists( 'videopress_get_post_by_guid' ) ) {
			return 0;
		}

		$attachment = videopress_get_post_by_guid( $video_guid );
		return $attachment ? (int) $attachment->ID : 0;
	}

	/**
	 * Update the a poster image via the WPCOM REST API.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function videopress_block_update_poster( $request ) {
		try {
			$blog_id     = VideoPressToken::blog_id();
			$token       = VideoPressToken::videopress_onetime_upload_token();
			$video_guid  = $request->get_param( 'video_guid' );
			$json_params = $request->get_json_params();

			$args = array(
				'method'  => 'POST',
				'headers' => array(
					'content-type'  => 'application/json',
					'Authorization' => 'X_UPLOAD_TOKEN token="' . $token . '" blog_id="' . $blog_id . '"',
				),
			);

			return $this->wpcom_poster_request(
				$video_guid,
				$args,
				wp_json_encode( $json_params, JSON_UNESCAPED_SLASHES )
			);
		} catch ( \Exception $e ) {
			return rest_ensure_response( new WP_Error( 'videopress_block_update_poster_error', $e->getMessage() ) );
		}
	}

	/**
	 * Retrieves a poster image via the WPCOM REST API.
	 *
	 * @param WP_REST_Request $request the request object.
	 * @return object|WP_Error Success object or WP_Error with error details.
	 */
	public function videopress_block_get_poster( $request ) {
		$video_guid = $request->get_param( 'video_guid' );
		$jwt        = VideoPressToken::videopress_playback_jwt( $video_guid );

		// videopress_playback_jwt() returns rather than throws on a transport
		// failure or a missing blog token, so surface the error instead of
		// interpolating a WP_Error into the query string below (a fatal on PHP 8).
		if ( is_wp_error( $jwt ) ) {
			return rest_ensure_response( $jwt );
		}

		$args = array(
			'method' => 'GET',
		);

		return $this->wpcom_poster_request(
			$video_guid,
			$args,
			null,
			'metadata_token=' . $jwt
		);
	}

	/**
	 * Endpoint for getting the VideoPress Upload JWT
	 *
	 * @return WP_Rest_Response - The response object.
	 */
	public static function videopress_upload_jwt() {
		$has_connected_owner = Data::has_connected_owner();
		if ( ! $has_connected_owner ) {
			return rest_ensure_response(
				new WP_Error(
					'owner_not_connected',
					'User not connected.',
					array(
						'code'        => 503,
						'connect_url' => Admin_UI::get_admin_page_url(),
					)
				)
			);
		}

		$blog_id = Data::get_blog_id();
		if ( ! $blog_id ) {
			return rest_ensure_response(
				new WP_Error( 'site_not_registered', 'Site not registered.', 503 )
			);
		}

		try {
			$token  = VideoPressToken::videopress_upload_jwt();
			$status = 200;
			$data   = array(
				'upload_token'   => $token,
				'upload_url'     => videopress_make_resumable_upload_path( $blog_id ),
				'upload_blog_id' => $blog_id,
			);
		} catch ( \Exception $e ) {
			$status = 500;
			$data   = array(
				'error' => $e->getMessage(),
			);

		}

		return rest_ensure_response(
			new WP_REST_Response( $data, $status )
		);
	}

	/**
	 * Endpoint for generating a VideoPress Playback JWT
	 *
	 * @param WP_REST_Request $request the request object.
	 * @return WP_Rest_Response - The response object.
	 */
	public static function videopress_playback_jwt( $request ) {
		$has_connected_owner = Data::has_connected_owner();
		if ( ! $has_connected_owner ) {
			return rest_ensure_response(
				new WP_Error(
					'owner_not_connected',
					'User not connected.',
					array(
						'code'        => 503,
						'connect_url' => Admin_UI::get_admin_page_url(),
					)
				)
			);
		}

		$blog_id = Data::get_blog_id();
		if ( ! $blog_id ) {
			return rest_ensure_response(
				new WP_Error( 'site_not_registered', 'Site not registered.', 503 )
			);
		}

		try {
			$video_guid = $request->get_param( 'video_guid' );

			// Authorize the caller for this specific video before minting a token.
			// The route only requires `read`, so without this a subscriber could
			// obtain a playback token for any guid on the site (private or
			// paywalled) by calling this endpoint directly, bypassing the
			// front-end player's per-video access check. post_id/subscription_plan_id
			// carry the embedding context the same way the AJAX player does.
			$embedded_post_id = (int) $request->get_param( 'post_id' );
			$selected_plan_id = (int) $request->get_param( 'subscription_plan_id' );
			if ( ! Access_Control::instance()->is_current_user_authed_for_video( $video_guid, $embedded_post_id, $selected_plan_id ) ) {
				return rest_ensure_response(
					new WP_Error( 'unauthorized', __( 'You cannot view this video.', 'jetpack-videopress-pkg' ), array( 'status' => 403 ) )
				);
			}

			$token  = VideoPressToken::videopress_playback_jwt( $video_guid );
			$status = 200;
			$data   = array(
				'playback_token' => $token,
			);
		} catch ( \Exception $e ) {
			$status = 500;
			$data   = array(
				'error' => $e->getMessage(),
			);

		}

		return rest_ensure_response(
			new WP_REST_Response( $data, $status )
		);
	}

	/**
	 * Updates attachment meta and video metadata via the WPCOM REST API.
	 *
	 * @param WP_REST_Request $request the request object.
	 * @return object|WP_Error Success object or WP_Error with error details.
	 */
	public function videopress_block_update_meta( $request ) {
		$json_params = $request->get_json_params();
		$post_id     = $json_params['id'];

		if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
			$guid = get_post_meta( $post_id, 'videopress_guid', true );
		} else {
			$blog_id = get_current_blog_id();
			$info    = video_get_info_by_blogpostid( $blog_id, $post_id );
			$guid    = $info ? $info->guid : '';
		}

		if ( ! $guid ) {
			return rest_ensure_response(
				new WP_Error(
					'error',
					__( 'This attachment cannot be updated yet.', 'jetpack-videopress-pkg' )
				)
			);
		}

		$video_request_params = $json_params;
		unset( $video_request_params['id'] );
		$video_request_params['guid'] = $guid;

		$endpoint = 'videos';
		$args     = array(
			'method'  => 'POST',
			'headers' => array( 'content-type' => 'application/json' ),
		);

		$result = Client::wpcom_json_api_request_as_blog(
			$endpoint,
			'2',
			$args,
			wp_json_encode( $video_request_params, JSON_UNESCAPED_SLASHES ),
			'wpcom'
		);

		if ( is_wp_error( $result ) ) {
			return rest_ensure_response( $result );
		}

		$response_body = json_decode( wp_remote_retrieve_body( $result ) );
		if ( is_bool( $response_body ) && $response_body ) {
			/*
			 * Title, description and caption of the video are not stored as metadata on the attachment,
			 * but as post_content, post_title and post_excerpt on the attachment's post object.
			 * We need to update those fields here, too.
			 */
			$post_title = null;
			if ( isset( $json_params['title'] ) ) {
				$post_title = sanitize_text_field( $json_params['title'] );
				wp_update_post(
					array(
						'ID'         => $post_id,
						'post_title' => $post_title,
					)
				);
			}

			$post_content = null;
			if ( isset( $json_params['description'] ) ) {
				$post_content = sanitize_textarea_field( $json_params['description'] );
				wp_update_post(
					array(
						'ID'           => $post_id,
						'post_content' => $post_content,
					)
				);
			}

			$post_excerpt = null;
			if ( isset( $json_params['caption'] ) ) {
				$post_excerpt = sanitize_textarea_field( $json_params['caption'] );
				wp_update_post(
					array(
						'ID'           => $post_id,
						'post_excerpt' => $post_excerpt,
					)
				);
			}

			// VideoPress data is stored in attachment meta for Jetpack sites, but not on wpcom.
			if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
				$meta               = wp_get_attachment_metadata( $post_id );
				$should_update_meta = false;

				if ( ! $meta ) {
					return rest_ensure_response(
						new WP_Error(
							'error',
							__( 'Attachment meta was not found.', 'jetpack-videopress-pkg' )
						)
					);
				}

				if ( isset( $json_params['display_embed'] ) && isset( $meta['videopress']['display_embed'] ) ) {
					$meta['videopress']['display_embed'] = $json_params['display_embed'];
					$should_update_meta                  = true;
				}

				if ( isset( $json_params['rating'] ) && isset( $meta['videopress']['rating'] ) && videopress_is_valid_video_rating( $json_params['rating'] ) ) {
					$meta['videopress']['rating'] = $json_params['rating'];
					$should_update_meta           = true;

					/** Set a new meta field so we can filter using it directly */
					update_post_meta( $post_id, 'videopress_rating', $json_params['rating'] );
				}

				if ( isset( $json_params['title'] ) ) {
					$meta['videopress']['title'] = $post_title;
					$should_update_meta          = true;
				}

				if ( isset( $json_params['description'] ) ) {
					$meta['videopress']['description'] = $post_content;
					$should_update_meta                = true;
				}

				if ( isset( $json_params['caption'] ) ) {
					$meta['videopress']['caption'] = $post_excerpt;
					$should_update_meta            = true;
				}

				if ( isset( $json_params['poster'] ) ) {
					$meta['videopress']['poster'] = $json_params['poster'];
					$should_update_meta           = true;
				}

				if ( isset( $json_params['allow_download'] ) ) {
					$allow_download = (bool) $json_params['allow_download'];
					if ( ! isset( $meta['videopress']['allow_download'] ) || $meta['videopress']['allow_download'] !== $allow_download ) {
						$meta['videopress']['allow_download'] = $allow_download;
						$should_update_meta                   = true;
					}
				}

				if ( isset( $json_params['privacy_setting'] ) ) {
					$privacy_setting = $json_params['privacy_setting'];
					if ( ! isset( $meta['videopress']['privacy_setting'] ) || $meta['videopress']['privacy_setting'] !== $privacy_setting ) {
						$meta['videopress']['privacy_setting'] = $privacy_setting;
						$should_update_meta                    = true;

						/** Set a new meta field so we can filter using it directly */
						update_post_meta( $post_id, 'videopress_privacy_setting', $privacy_setting );
					}
				}

				if ( $should_update_meta ) {
					wp_update_attachment_metadata( $post_id, $meta );
				}
			}

			return rest_ensure_response(
				array(
					'code'    => 'success',
					'message' => __( 'Video meta updated successfully.', 'jetpack-videopress-pkg' ),
					'data'    => 200,
				)
			);
		} else {
			return rest_ensure_response(
				new WP_Error(
					$response_body->code,
					$response_body->message,
					$response_body->data
				)
			);
		}
	}
}

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	wpcom_rest_api_v2_load_plugin( 'Automattic\Jetpack\VideoPress\WPCOM_REST_API_V2_Endpoint_VideoPress' );
}
