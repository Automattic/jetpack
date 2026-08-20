<?php
/**
 * VideoPress caption track post type and helpers.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * Stores editable caption track documents as private WordPress posts.
 *
 * Track content is stored as serialized `videopress/caption-cue` block markup,
 * matching the block-based editor that produces it. This is a deliberate
 * trade-off: it keeps the draft round-trippable through the editor without a
 * bespoke format, at the cost of coupling stored drafts to the block markup
 * (sanitization re-parses blocks, and replacing the editor later means
 * migrating stored content).
 *
 * The REST routes serving this store live in
 * {@see WPCOM_REST_API_V2_Endpoint_VideoPress_Caption_Tracks}.
 */
class Caption_Tracks {

	const POST_TYPE = 'vp_caption_track';

	const CUE_BLOCK_NAME = 'videopress/caption-cue';

	const META_GUID                  = '_videopress_guid';
	const META_KIND                  = '_videopress_caption_kind';
	const META_SRC_LANG              = '_videopress_caption_src_lang';
	const META_LABEL                 = '_videopress_caption_label';
	const META_SOURCE_TRACK_KIND     = '_videopress_source_track_kind';
	const META_SOURCE_TRACK_SRC_LANG = '_videopress_source_track_src_lang';
	const META_SOURCE_TRACK_SRC      = '_videopress_source_track_src';

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
}
