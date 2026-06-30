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
 */
class Caption_Tracks {

	const POST_TYPE = 'vp_caption_track';

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
				'supports'            => array( 'title', 'editor' ),

				/*
				 * Caption tracks are an internal store reached only through the
				 * /jetpack/v4/videopress/caption-tracks routes, which authorize
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
		$track_id = absint( $request->get_param( 'id' ) );
		if ( $track_id ) {
			$existing_guid = (string) get_post_meta( $track_id, self::META_GUID, true );
			if ( '' !== $existing_guid ) {
				return self::current_user_can_edit_video( $existing_guid );
			}
		}

		$meta = (array) $request->get_param( 'meta' );
		$guid = isset( $meta[ self::META_GUID ] ) ? (string) $meta[ self::META_GUID ] : (string) $request->get_param( 'guid' );

		return self::current_user_can_edit_video( $guid );
	}

	/**
	 * Whether the current user may manage caption tracks for a VideoPress GUID.
	 *
	 * Editing a video's captions requires the ability to edit that video. The
	 * upload-capability fallback is reserved for environments without a local
	 * attachment store (e.g. WordPress.com); where the resolver is available a
	 * GUID that has no local attachment is denied rather than broadly allowed.
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

		return current_user_can( 'upload_files' );
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
	 * Canonicalize a manually entered BCP-47 language tag.
	 *
	 * Generated keys such as `auto_en` are source-track identifiers, not
	 * manually entered language tags, so they are rejected here.
	 *
	 * @param string $value Raw value.
	 * @return string
	 */
	public static function sanitize_manual_language( $value ) {
		$value = trim( sanitize_text_field( $value ) );

		if ( preg_match( '/^auto[_-]/i', $value ) ) {
			return '';
		}

		if ( ! preg_match( '/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i', $value ) ) {
			return '';
		}

		$parts = explode( '-', str_replace( '_', '-', $value ) );
		foreach ( $parts as $index => $part ) {
			if ( 0 === $index ) {
				$parts[ $index ] = strtolower( $part );
			} elseif ( 4 === strlen( $part ) && ctype_alpha( $part ) ) {
				$parts[ $index ] = ucfirst( strtolower( $part ) );
			} elseif ( ( 2 === strlen( $part ) && ctype_alpha( $part ) ) || ( 3 === strlen( $part ) && ctype_digit( $part ) ) ) {
				$parts[ $index ] = strtoupper( $part );
			} else {
				$parts[ $index ] = strtolower( $part );
			}
		}

		return implode( '-', $parts );
	}

	/**
	 * List caption tracks for a VideoPress GUID.
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
				'posts_per_page'         => 100,
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
		$track_id = absint( $request->get_param( 'id' ) );
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

		$postarr = array(
			'post_type'    => self::POST_TYPE,
			'post_title'   => sanitize_text_field( $request->get_param( 'title' ) ),
			'post_content' => wp_kses_post( $request->get_param( 'content' ) ),
			'post_status'  => 'publish' === $request->get_param( 'status' ) ? 'publish' : 'draft',
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

		foreach ( self::$meta_keys as $key ) {
			if ( array_key_exists( $key, $meta ) ) {
				update_post_meta( $post_id, $key, $meta[ $key ] );
			}
		}

		return rest_ensure_response( self::prepare_track_response( get_post( $post_id ) ) );
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
