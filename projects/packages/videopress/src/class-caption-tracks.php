<?php
/**
 * VideoPress caption track post type and helpers.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_Error;
use WP_Post;
use WP_REST_Request;

/**
 * Stores editable caption track documents as private WordPress posts.
 *
 * Track content is stored as serialized `videopress/caption-cue` block markup,
 * matching the block-based editor that produces it. This is a deliberate
 * trade-off: it keeps the draft round-trippable through the editor without a
 * bespoke format, at the cost of coupling stored drafts to the block markup
 * (sanitization re-parses blocks, and replacing the editor later means
 * migrating stored content).
 */
class Caption_Tracks {

	const POST_TYPE = 'vp_caption_track';

	const CUE_BLOCK_NAME = 'videopress/caption-cue';

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

	const META_GUID                  = '_videopress_guid';
	const META_KIND                  = '_videopress_caption_kind';
	const META_SRC_LANG              = '_videopress_caption_src_lang';
	const META_LABEL                 = '_videopress_caption_label';
	const META_SOURCE_TRACK_KIND     = '_videopress_source_track_kind';
	const META_SOURCE_TRACK_SRC_LANG = '_videopress_source_track_src_lang';
	const META_SOURCE_TRACK_SRC      = '_videopress_source_track_src';

	/**
	 * Metadata keys exposed in the REST payload.
	 *
	 * @var string[]
	 */
	private static $meta_keys = array(
		self::META_GUID,
		self::META_KIND,
		self::META_SRC_LANG,
		self::META_LABEL,
		self::META_SOURCE_TRACK_KIND,
		self::META_SOURCE_TRACK_SRC_LANG,
		self::META_SOURCE_TRACK_SRC,
	);

	/**
	 * Initialize the caption track post type.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_post_type' ) );
		add_action( 'init', array( __CLASS__, 'register_meta' ) );
	}

	/**
	 * Register the private caption track post type.
	 *
	 * @return void
	 */
	public static function register_post_type() {
		register_post_type(
			self::POST_TYPE,
			array(
				'labels'              => array(
					'name'          => __( 'VideoPress caption tracks', 'jetpack-videopress-pkg' ),
					'singular_name' => __( 'VideoPress caption track', 'jetpack-videopress-pkg' ),
				),
				'public'              => false,
				'exclude_from_search' => true,
				'publicly_queryable'  => false,
				'show_ui'             => false,
				'show_in_menu'        => false,
				'show_in_rest'        => false,
				// No revisions: there is no restore UI, and each one would copy up to 1MB of content.
				'supports'            => array( 'title', 'editor' ),

				/*
				 * Caption tracks are an internal store reached only through the
				 * /wpcom/v2/videopress/caption-tracks routes, which authorize
				 * each request against the video it targets. The post type itself
				 * is not exposed (no REST, no admin UI), so standard post
				 * capabilities are sufficient.
				 */
				'capability_type'     => 'post',
				'map_meta_cap'        => true,
			)
		);
	}

	/**
	 * Register caption track metadata so values are sanitized when saved.
	 *
	 * @return void
	 */
	public static function register_meta() {
		$string_meta = array(
			self::META_GUID                  => array( __CLASS__, 'sanitize_guid' ),
			self::META_KIND                  => array( __CLASS__, 'sanitize_kind' ),
			self::META_SRC_LANG              => array( __CLASS__, 'sanitize_manual_language' ),
			self::META_LABEL                 => 'sanitize_text_field',
			self::META_SOURCE_TRACK_KIND     => array( __CLASS__, 'sanitize_kind' ),
			self::META_SOURCE_TRACK_SRC_LANG => 'sanitize_text_field',
			self::META_SOURCE_TRACK_SRC      => 'esc_url_raw',
		);

		foreach ( $string_meta as $key => $sanitize_callback ) {
			register_post_meta(
				self::POST_TYPE,
				$key,
				array(
					'type'              => 'string',
					'single'            => true,
					'sanitize_callback' => $sanitize_callback,
				)
			);
		}
	}

	/**
	 * REST permission callback for the caption track routes.
	 *
	 * Authorizes against the video the request targets: an existing track is
	 * authorized against the video it already belongs to, while a new track is
	 * authorized against the GUID supplied in the request.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return bool
	 */
	public static function rest_permission_check( WP_REST_Request $request ) {
		$track_id = (int) $request->get_param( 'id' );
		if ( $track_id ) {
			$existing = get_post( $track_id );
			if ( $existing instanceof WP_Post && self::POST_TYPE === $existing->post_type ) {
				/*
				 * An existing track stays pinned to the video it already belongs
				 * to; the request body can never re-target it. A track whose
				 * stored GUID is empty is malformed and cannot be authorized, so
				 * `current_user_can_edit_video` denies it rather than falling back
				 * to the (attacker-controlled) body GUID.
				 */
				return self::current_user_can_edit_video(
					(string) get_post_meta( $track_id, self::META_GUID, true )
				);
			}
		}

		$meta = (array) $request->get_param( 'meta' );
		$guid = isset( $meta[ self::META_GUID ] ) ? (string) $meta[ self::META_GUID ] : (string) $request->get_param( 'guid' );

		return self::current_user_can_edit_video( $guid );
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
		$guid = self::sanitize_guid( $guid );

		if ( '' === $guid ) {
			return false;
		}

		if ( function_exists( 'videopress_get_post_by_guid' ) ) {
			$attachment = videopress_get_post_by_guid( $guid );

			return $attachment instanceof WP_Post && current_user_can( 'edit_post', $attachment->ID );
		}

		return current_user_can( 'edit_others_posts' );
	}

	/**
	 * Sanitize a VideoPress GUID.
	 *
	 * @param string $value Raw value.
	 * @return string
	 */
	public static function sanitize_guid( $value ) {
		$value = sanitize_text_field( $value );
		return preg_match( '/^[a-z0-9]{8}$/i', $value ) ? $value : '';
	}

	/**
	 * Sanitize a text track kind.
	 *
	 * @param string $value Raw value.
	 * @return string
	 */
	public static function sanitize_kind( $value ) {
		$value = sanitize_key( $value );
		$valid = array( 'subtitles', 'captions', 'descriptions', 'chapters', 'metadata' );
		return in_array( $value, $valid, true ) ? $value : '';
	}

	/**
	 * Validate a caption track's BCP-47 language tag.
	 *
	 * The client canonicalizes tags with `Intl.getCanonicalLocales` before
	 * saving, and the "one track per language" lookup matches stored tags by
	 * exact string, so this is a validation gate only: it rejects generated
	 * source keys such as `auto_en` and malformed tags, then keeps the client's
	 * canonical value verbatim. Re-casing here would risk diverging from the
	 * client's canonical form and silently create duplicate tracks.
	 *
	 * @param string $value Raw value.
	 * @return string Validated tag, or empty string when invalid.
	 */
	public static function sanitize_manual_language( $value ) {
		$value = trim( sanitize_text_field( $value ) );

		if ( preg_match( '/^auto[_-]/i', $value ) ) {
			return '';
		}

		if ( ! preg_match( '/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i', $value ) ) {
			return '';
		}

		return $value;
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
	 * @return string|WP_Error Sanitized block content, or an error when the payload exceeds the size caps.
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
			if ( self::CUE_BLOCK_NAME !== ( $block['blockName'] ?? '' ) ) {
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
				'blockName'    => self::CUE_BLOCK_NAME,
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
	 * @return WP_Error
	 */
	private static function track_too_large_error() {
		return new WP_Error(
			'videopress_caption_track_too_large',
			esc_html__( 'The caption track content is too large.', 'jetpack-videopress-pkg' ),
			array( 'status' => 400 )
		);
	}

	/**
	 * List caption tracks for a VideoPress GUID.
	 *
	 * Responses include each track's full content so the editor can open a
	 * draft without a second fetch, so payload size scales with the number of
	 * languages times their content size (capped per track by MAX_CONTENT_BYTES).
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function rest_list_tracks( WP_REST_Request $request ) {
		$guid = self::sanitize_guid( $request->get_param( 'guid' ) );
		if ( empty( $guid ) ) {
			return new WP_Error(
				'videopress_caption_track_invalid_guid',
				esc_html__( 'A valid VideoPress GUID is required.', 'jetpack-videopress-pkg' ),
				array( 'status' => 400 )
			);
		}

		$query = new \WP_Query(
			array(
				'post_type'              => self::POST_TYPE,
				'post_status'            => 'any',
				// Safety cap against unbounded queries, not pagination; no video should approach this many tracks.
				'posts_per_page'         => self::TRACK_LIST_LIMIT,
				'orderby'                => 'modified',
				'order'                  => 'DESC',
				'meta_key'               => self::META_GUID, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
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
	 * @param WP_REST_Request $request Incoming request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function rest_save_track( WP_REST_Request $request ) {
		$track_id = (int) $request->get_param( 'id' );
		$existing = $track_id ? get_post( $track_id ) : null;

		if ( $track_id && ( ! $existing || self::POST_TYPE !== $existing->post_type ) ) {
			return new WP_Error(
				'videopress_caption_track_not_found',
				esc_html__( 'Caption track not found.', 'jetpack-videopress-pkg' ),
				array( 'status' => 404 )
			);
		}

		$meta = (array) $request->get_param( 'meta' );

		$existing_guid = $existing ? (string) get_post_meta( $track_id, self::META_GUID, true ) : '';
		$guid          = self::sanitize_guid(
			'' !== $existing_guid ? $existing_guid : ( $meta[ self::META_GUID ] ?? $request->get_param( 'guid' ) )
		);

		if ( empty( $guid ) ) {
			return new WP_Error(
				'videopress_caption_track_invalid_guid',
				esc_html__( 'A valid VideoPress GUID is required.', 'jetpack-videopress-pkg' ),
				array( 'status' => 400 )
			);
		}

		$src_lang = self::sanitize_manual_language( $meta[ self::META_SRC_LANG ] ?? '' );
		if ( empty( $src_lang ) ) {
			return new WP_Error(
				'videopress_caption_track_invalid_language',
				esc_html__( 'A valid BCP-47 language tag is required.', 'jetpack-videopress-pkg' ),
				array( 'status' => 400 )
			);
		}

		$kind = self::sanitize_kind( $meta[ self::META_KIND ] ?? '' );
		if ( empty( $kind ) ) {
			return new WP_Error(
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
			'post_type'    => self::POST_TYPE,
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

		$post_id                     = (int) $result;
		$meta[ self::META_GUID ]     = $guid;
		$meta[ self::META_SRC_LANG ] = $src_lang;
		$meta[ self::META_KIND ]     = $kind;

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
	 * @param WP_REST_Request $request Incoming request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function rest_delete_track( WP_REST_Request $request ) {
		$track_id = (int) $request->get_param( 'id' );
		$existing = $track_id ? get_post( $track_id ) : null;

		if ( ! $existing || self::POST_TYPE !== $existing->post_type ) {
			return new WP_Error(
				'videopress_caption_track_not_found',
				esc_html__( 'Caption track not found.', 'jetpack-videopress-pkg' ),
				array( 'status' => 404 )
			);
		}

		if ( ! wp_delete_post( $track_id, true ) ) {
			return new WP_Error(
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
	 * @param WP_Post $post Caption track post.
	 * @return array
	 */
	public static function prepare_track_response( WP_Post $post ) {
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
}
