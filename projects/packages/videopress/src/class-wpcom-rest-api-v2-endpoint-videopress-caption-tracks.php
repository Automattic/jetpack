<?php
/**
 * REST API endpoint for managing VideoPress caption tracks.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * VideoPress caption tracks wpcom api v2 endpoint. Registered under `wpcom/v2`
 * (rather than `jetpack/v4`) so the same routes serve WordPress.com Simple
 * sites, which don't load the Jetpack namespace.
 *
 * @phan-constructor-used-for-side-effects
 */
class WPCOM_REST_API_V2_Endpoint_VideoPress_Caption_Tracks extends \WP_REST_Controller {

	/**
	 * Upper bound on caption-cue blocks accepted in a single save.
	 *
	 * @var int
	 */
	const MAX_CUE_BLOCKS = 5000;

	/**
	 * Upper bound, in bytes, on submitted caption track content.
	 *
	 * @var int
	 */
	const MAX_CONTENT_BYTES = 1048576;

	/**
	 * Upper bound on tracks returned when listing a video's caption tracks.
	 *
	 * @var int
	 */
	const TRACK_LIST_LIMIT = 500;

	/**
	 * The namespace of this controller's route.
	 *
	 * @var string
	 */
	protected $namespace = 'wpcom/v2';

	/**
	 * The base of this controller's route.
	 *
	 * @var string
	 */
	protected $rest_base = 'videopress/caption-tracks';

	/**
	 * Metadata keys exposed in the REST payload.
	 *
	 * @var string[]
	 */
	private static $meta_keys = array(
		Caption_Tracks::META_GUID,
		Caption_Tracks::META_KIND,
		Caption_Tracks::META_SRC_LANG,
		Caption_Tracks::META_LABEL,
		Caption_Tracks::META_SOURCE_TRACK_KIND,
		Caption_Tracks::META_SOURCE_TRACK_SRC_LANG,
		Caption_Tracks::META_SOURCE_TRACK_SRC,
	);

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'rest_list_tracks' ),
					'permission_callback' => array( __CLASS__, 'rest_permission_check' ),
					'args'                => array(
						'guid' => array(
							'description' => __( 'VideoPress GUID.', 'jetpack-videopress-pkg' ),
							'type'        => 'string',
							'required'    => true,
						),
					),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'rest_save_track' ),
					'permission_callback' => array( __CLASS__, 'rest_permission_check' ),
					'args'                => $this->save_track_args(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)',
			array(
				array(
					// @phan-suppress-next-line PhanPluginMixedKeyNoKey -- register_rest_route() supports a shared `args` key alongside endpoint arrays.
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'rest_save_track' ),
					'permission_callback' => array( __CLASS__, 'rest_permission_check' ),
					'args'                => $this->save_track_args(),
				),
				array(
					'methods'             => \WP_REST_Server::DELETABLE,
					'callback'            => array( __CLASS__, 'rest_delete_track' ),
					'permission_callback' => array( __CLASS__, 'rest_permission_check' ),
				),
				'args' => array(
					'id' => array(
						'description' => __( 'Caption track ID.', 'jetpack-videopress-pkg' ),
						'type'        => 'integer',
						'required'    => true,
					),
				),
			)
		);
	}

	/**
	 * Request schema for the caption track create/update routes.
	 *
	 * Type and shape validation only; the save handler still owns the semantic
	 * checks (GUID format, language tag, kind) so it can return specific errors.
	 *
	 * @return array
	 */
	private function save_track_args() {
		$meta_properties = array();
		foreach ( self::$meta_keys as $key ) {
			$meta_properties[ $key ] = array( 'type' => 'string' );
		}

		return array(
			'guid'    => array(
				'description' => __( 'VideoPress GUID.', 'jetpack-videopress-pkg' ),
				'type'        => 'string',
			),
			'title'   => array(
				'description' => __( 'Caption track title.', 'jetpack-videopress-pkg' ),
				'type'        => 'string',
			),
			'content' => array(
				'description' => __( 'Serialized caption-cue block content.', 'jetpack-videopress-pkg' ),
				'type'        => 'string',
			),
			'status'  => array(
				'description' => __( 'Caption track status.', 'jetpack-videopress-pkg' ),
				'type'        => 'string',
				'enum'        => array( 'draft', 'publish' ),
			),
			'meta'    => array(
				'description'          => __( 'Caption track metadata.', 'jetpack-videopress-pkg' ),
				'type'                 => 'object',
				'required'             => true,
				'properties'           => $meta_properties,
				'additionalProperties' => false,
			),
		);
	}

	/**
	 * The caption-track ID from the request's URL path, if any.
	 *
	 * Only the `(?P<id>\d+)` item routes supply one. Reading it from the URL
	 * params rather than `get_param()` — which also exposes query-string and body
	 * values regardless of a route's declared args — stops a spoofed `?id=` on the
	 * list/create routes from re-targeting the request at another video's track.
	 *
	 * @param \WP_REST_Request $request Incoming request.
	 * @return int Track ID, or 0 when the route path has none.
	 */
	private static function url_track_id( \WP_REST_Request $request ) {
		$url_params = $request->get_url_params();
		return isset( $url_params['id'] ) ? (int) $url_params['id'] : 0;
	}

	/**
	 * REST permission callback for the caption track routes.
	 *
	 * Authorizes against the video the request targets: an existing track is
	 * authorized against the video it already belongs to, while a new track is
	 * authorized against the GUID supplied in the request.
	 *
	 * @param \WP_REST_Request $request Incoming request.
	 * @return bool
	 */
	public static function rest_permission_check( \WP_REST_Request $request ) {
		$track_id = self::url_track_id( $request );
		if ( $track_id ) {
			$existing = get_post( $track_id );
			if ( $existing instanceof \WP_Post && Caption_Tracks::POST_TYPE === $existing->post_type ) {
				/*
				 * An existing track stays pinned to the video it already belongs
				 * to; the request body can never re-target it. A track whose
				 * stored GUID is empty is malformed and cannot be authorized, so
				 * `current_user_can_edit_video` denies it rather than falling back
				 * to the (attacker-controlled) body GUID.
				 */
				return self::current_user_can_edit_video(
					(string) get_post_meta( $track_id, Caption_Tracks::META_GUID, true )
				);
			}
		}

		$meta = (array) $request->get_param( 'meta' );
		$guid = isset( $meta[ Caption_Tracks::META_GUID ] ) ? (string) $meta[ Caption_Tracks::META_GUID ] : (string) $request->get_param( 'guid' );

		return self::current_user_can_edit_video( $guid );
	}

	/**
	 * List caption tracks for a VideoPress GUID.
	 *
	 * Responses include each track's full content so the editor can open a
	 * draft without a second fetch, so payload size scales with the number of
	 * languages times their content size (capped per track by MAX_CONTENT_BYTES).
	 *
	 * @param \WP_REST_Request $request Incoming request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function rest_list_tracks( \WP_REST_Request $request ) {
		$guid = Caption_Tracks::sanitize_guid( $request->get_param( 'guid' ) );
		if ( empty( $guid ) ) {
			return new \WP_Error(
				'videopress_caption_track_invalid_guid',
				esc_html__( 'A valid VideoPress GUID is required.', 'jetpack-videopress-pkg' ),
				array( 'status' => 400 )
			);
		}

		$query = new \WP_Query(
			array(
				'post_type'              => Caption_Tracks::POST_TYPE,
				'post_status'            => 'any',
				// Safety cap against unbounded queries, not pagination; no video should approach this many tracks.
				'posts_per_page'         => self::TRACK_LIST_LIMIT,
				'orderby'                => 'modified',
				'order'                  => 'DESC',
				'meta_key'               => Caption_Tracks::META_GUID, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_value'             => $guid, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				'no_found_rows'          => true,
				'update_post_term_cache' => false,
			)
		);

		$tracks = array_map( array( __CLASS__, 'prepare_track_response' ), $query->posts );
		return rest_ensure_response( $tracks );
	}

	/**
	 * Create or update a caption track.
	 *
	 * @param \WP_REST_Request $request Incoming request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function rest_save_track( \WP_REST_Request $request ) {
		$track_id = self::url_track_id( $request );
		$existing = $track_id ? get_post( $track_id ) : null;

		if ( $track_id && ( ! $existing || Caption_Tracks::POST_TYPE !== $existing->post_type ) ) {
			return new \WP_Error(
				'videopress_caption_track_not_found',
				esc_html__( 'Caption track not found.', 'jetpack-videopress-pkg' ),
				array( 'status' => 404 )
			);
		}

		$meta = (array) $request->get_param( 'meta' );

		$existing_guid = $existing ? (string) get_post_meta( $track_id, Caption_Tracks::META_GUID, true ) : '';
		$guid          = Caption_Tracks::sanitize_guid(
			'' !== $existing_guid ? $existing_guid : ( $meta[ Caption_Tracks::META_GUID ] ?? $request->get_param( 'guid' ) )
		);

		if ( empty( $guid ) ) {
			return new \WP_Error(
				'videopress_caption_track_invalid_guid',
				esc_html__( 'A valid VideoPress GUID is required.', 'jetpack-videopress-pkg' ),
				array( 'status' => 400 )
			);
		}

		$src_lang = Caption_Tracks::sanitize_manual_language( $meta[ Caption_Tracks::META_SRC_LANG ] ?? '' );
		if ( empty( $src_lang ) ) {
			return new \WP_Error(
				'videopress_caption_track_invalid_language',
				esc_html__( 'A valid BCP-47 language tag is required.', 'jetpack-videopress-pkg' ),
				array( 'status' => 400 )
			);
		}

		$kind = Caption_Tracks::sanitize_kind( $meta[ Caption_Tracks::META_KIND ] ?? '' );
		if ( empty( $kind ) ) {
			return new \WP_Error(
				'videopress_caption_track_invalid_kind',
				esc_html__( 'A valid caption track kind is required.', 'jetpack-videopress-pkg' ),
				array( 'status' => 400 )
			);
		}

		/*
		 * Preserve an existing track's status when the request omits `status`
		 * (e.g. a label-only edit): treating a missing value as `draft` would
		 * silently unpublish a published caption track.
		 */
		$requested_status = $request->get_param( 'status' );
		if ( in_array( $requested_status, array( 'publish', 'draft' ), true ) ) {
			$post_status = $requested_status;
		} else {
			$post_status = $existing ? $existing->post_status : 'draft';
		}

		$post_content = self::sanitize_track_content( $request->get_param( 'content' ) );
		if ( is_wp_error( $post_content ) ) {
			return $post_content;
		}

		$postarr = array(
			'post_type'    => Caption_Tracks::POST_TYPE,
			'post_title'   => sanitize_text_field( $request->get_param( 'title' ) ),
			'post_content' => $post_content,
			'post_status'  => $post_status,
		);

		if ( $track_id ) {
			$postarr['ID'] = $track_id;
			$result        = wp_update_post( wp_slash( $postarr ), true );
		} else {
			$result = wp_insert_post( wp_slash( $postarr ), true );
		}

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$post_id                               = (int) $result;
		$meta[ Caption_Tracks::META_GUID ]     = $guid;
		$meta[ Caption_Tracks::META_SRC_LANG ] = $src_lang;
		$meta[ Caption_Tracks::META_KIND ]     = $kind;

		/*
		 * REST params arrive unslashed while the metadata layer unslashes on
		 * write, so slash the values to keep literal backslashes intact.
		 */
		foreach ( self::$meta_keys as $key ) {
			if ( array_key_exists( $key, $meta ) ) {
				update_post_meta( $post_id, $key, wp_slash( $meta[ $key ] ) );
			}
		}

		return rest_ensure_response( self::prepare_track_response( get_post( $post_id ) ) );
	}

	/**
	 * Delete a caption track.
	 *
	 * @param \WP_REST_Request $request Incoming request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function rest_delete_track( \WP_REST_Request $request ) {
		$track_id = self::url_track_id( $request );
		$existing = $track_id ? get_post( $track_id ) : null;

		if ( ! $existing || Caption_Tracks::POST_TYPE !== $existing->post_type ) {
			return new \WP_Error(
				'videopress_caption_track_not_found',
				esc_html__( 'Caption track not found.', 'jetpack-videopress-pkg' ),
				array( 'status' => 404 )
			);
		}

		if ( ! wp_delete_post( $track_id, true ) ) {
			return new \WP_Error(
				'videopress_caption_track_delete_failed',
				esc_html__( 'Unable to delete the caption track.', 'jetpack-videopress-pkg' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response(
			array(
				'deleted' => true,
				'id'      => $track_id,
			)
		);
	}

	/**
	 * Prepare a caption track REST response.
	 *
	 * @param \WP_Post $post Caption track post.
	 * @return array
	 */
	public static function prepare_track_response( \WP_Post $post ) {
		$meta = array();
		foreach ( self::$meta_keys as $key ) {
			$meta[ $key ] = (string) get_post_meta( $post->ID, $key, true );
		}

		return array(
			'id'      => (int) $post->ID,
			'title'   => $post->post_title,
			'content' => $post->post_content,
			'status'  => $post->post_status,
			'meta'    => $meta,
		);
	}

	/**
	 * Sanitize serialized caption-cue block content.
	 *
	 * The client canonicalizes cue text before saving, but a direct API call
	 * could embed a WebVTT/comment terminator (`-->`) in a cue's text and corrupt
	 * block parsing or the WebVTT the track is later serialized to. Re-parse the
	 * blocks, keep only caption-cue blocks, neutralize the terminator in each
	 * cue's text, and rebuild each cue as a void block from its name and
	 * attributes only, so no submitted inner HTML survives into stored content.
	 *
	 * @param string $content Raw serialized block content.
	 * @return string|\WP_Error Sanitized block content, or an error when the payload exceeds the size caps.
	 */
	private static function sanitize_track_content( $content ) {
		$content = (string) $content;
		if ( '' === trim( $content ) ) {
			return '';
		}

		if ( strlen( $content ) > self::MAX_CONTENT_BYTES ) {
			return self::track_too_large_error();
		}

		$sanitized = array();
		foreach ( parse_blocks( $content ) as $block ) {
			if ( Caption_Tracks::CUE_BLOCK_NAME !== ( $block['blockName'] ?? '' ) ) {
				continue;
			}

			$attrs = isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : array();
			if ( isset( $attrs['text'] ) ) {
				$attrs['text'] = str_replace(
					array( '--!>', '-->' ),
					'->',
					(string) $attrs['text']
				);
			}

			$sanitized[] = array(
				'blockName'    => Caption_Tracks::CUE_BLOCK_NAME,
				'attrs'        => $attrs,
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			);
		}

		if ( count( $sanitized ) > self::MAX_CUE_BLOCKS ) {
			return self::track_too_large_error();
		}

		return serialize_blocks( $sanitized );
	}

	/**
	 * Error returned when submitted track content exceeds the size caps.
	 *
	 * @return \WP_Error
	 */
	private static function track_too_large_error() {
		return new \WP_Error(
			'videopress_caption_track_too_large',
			esc_html__( 'The caption track content is too large.', 'jetpack-videopress-pkg' ),
			array( 'status' => 400 )
		);
	}

	/**
	 * Whether the current user may manage caption tracks for a VideoPress GUID.
	 *
	 * Editing a video's captions requires the ability to edit that video. Where
	 * the GUID resolver is unavailable (an environment without a local
	 * attachment store, e.g. WordPress.com) ownership can't be verified, so the
	 * fallback requires `edit_others_posts` rather than the far broader
	 * `upload_files`: without it any author could manage another author's video
	 * captions. The resolver ships with this package, so this fallback is a rare
	 * last resort.
	 *
	 * @param string $guid VideoPress GUID.
	 * @return bool
	 */
	private static function current_user_can_edit_video( $guid ) {
		$guid = Caption_Tracks::sanitize_guid( $guid );

		if ( '' === $guid ) {
			return false;
		}

		if ( function_exists( 'videopress_get_post_by_guid' ) ) {
			$attachment = videopress_get_post_by_guid( $guid );

			return $attachment instanceof \WP_Post && current_user_can( 'edit_post', $attachment->ID );
		}

		return current_user_can( 'edit_others_posts' );
	}
}

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	wpcom_rest_api_v2_load_plugin( 'Automattic\Jetpack\VideoPress\WPCOM_REST_API_V2_Endpoint_VideoPress_Caption_Tracks' );
}
