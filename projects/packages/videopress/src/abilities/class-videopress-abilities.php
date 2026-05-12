<?php
/**
 * Jetpack VideoPress Abilities Registration
 *
 * Registers Jetpack VideoPress abilities with the WordPress Abilities API.
 * Ability callbacks delegate to the package's existing helper classes
 * (`Data`, `Site`, `VideoPressToken`) so they inherit the same data sources
 * the dashboard already uses.
 *
 * @package automattic/jetpack-videopress
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9. The Registrar base class guards its function_exists() checks so the package is safe on older WP. @todo Remove this line when the minimum supported WordPress version is 6.9.

namespace Automattic\Jetpack\VideoPress\Abilities;

use Automattic\Jetpack\My_Jetpack\Product;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\VideoPress\Data;
use Automattic\Jetpack\VideoPress\Upload_Exception;
use Automattic\Jetpack\VideoPress\VideoPressToken;
use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_Error;
use WP_REST_Request;

/**
 * Class VideoPress_Abilities
 *
 * Registers Jetpack VideoPress abilities with the WordPress Abilities API.
 * Reads-only first; write abilities (update / delete / upload-blob) are
 * intentionally deferred to a follow-up PR so the dispatch design can land
 * separately from the read surface.
 */
class VideoPress_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-videopress';

	/**
	 * VideoPress storage quota in bytes for the paid 1TB plan.
	 *
	 * Matches the constant the dashboard storage meter renders against —
	 * see `client/admin/components/video-storage-meter/index.tsx` (`1000^4`).
	 * Kept here in PHP so the ability returns the same number the UI shows.
	 */
	const QUOTA_BYTES_1TB = 1000000000000;

	/**
	 * Privacy enum values returned by the underlying jetpack_videopress meta.
	 * Mirrors `VIDEOPRESS_PRIVACY::IS_PUBLIC` / `IS_PRIVATE` / `SITE_DEFAULT`.
	 */
	const PRIVACY_PUBLIC       = 0;
	const PRIVACY_PRIVATE      = 1;
	const PRIVACY_SITE_DEFAULT = 2;

	/**
	 * Maximum per_page value enforced by list-videos. The schema declares the
	 * same maximum, but the callback re-clamps because schema defaults aren't
	 * auto-injected.
	 */
	const MAX_PER_PAGE = 100;

	/**
	 * Default per_page when the caller omits it.
	 */
	const DEFAULT_PER_PAGE = 20;

	/**
	 * Input enum for the privacy filter on list-videos. Maps the human strings
	 * the agent passes to the integer privacy_setting stored in attachment meta.
	 */
	const STATUS_TO_PRIVACY = array(
		'public'       => self::PRIVACY_PUBLIC,
		'private'      => self::PRIVACY_PRIVATE,
		'site-private' => self::PRIVACY_SITE_DEFAULT,
	);

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return self::CATEGORY_SLUG;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack VideoPress" is a product name and should not be translated.
			'label'       => 'Jetpack VideoPress',
			'description' => __( 'Abilities for managing Jetpack VideoPress-hosted videos and storage.', 'jetpack-videopress-pkg' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-videopress/list-videos'        => self::spec_list_videos(),
			'jetpack-videopress/get-storage-quota'  => self::spec_get_storage_quota(),
			'jetpack-videopress/get-upload-token'   => self::spec_get_upload_token(),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Ability specs
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Spec: jetpack-videopress/list-videos.
	 *
	 * Consolidated-read shape. When `media_id` is supplied the ability returns
	 * a 0- or 1-element array, so the caller doesn't have to pick between
	 * `list-videos` and a `get-video` ability for the single-record case.
	 */
	private static function spec_list_videos(): array {
		return array(
			'label'               => __( 'List VideoPress-hosted videos', 'jetpack-videopress-pkg' ),
			'description'         => __(
				'List VideoPress-hosted videos on this site. Returns a paginated array of compact summaries, one per video, including media_id, guid, title, public URL, poster image, privacy and rating, duration (ms), dimensions, upload date, and current thumbnail/processing status. Supply `media_id` to fetch a single entry (returns a 0- or 1-element array — never WP_Error for a missing id). Combine with `search` (matches title), `status` (`public`, `private`, `site-private`), and `page` / `per_page` (max 100) to narrow results. Reads VideoPress attachments out of the WordPress media library; the agent typically calls this before `jetpack-videopress/get-storage-quota` for a dashboard overview.',
				'jetpack-videopress-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(
					'search'   => array(
						'type'        => 'string',
						'description' => __( 'Search videos by title.', 'jetpack-videopress-pkg' ),
					),
					'status'   => array(
						'type'        => 'string',
						'description' => __( 'Filter by privacy: "public" (everyone), "private" (always private), "site-private" (follows the site default).', 'jetpack-videopress-pkg' ),
						'enum'        => array( 'public', 'private', 'site-private' ),
					),
					'page'     => array(
						'type'        => 'integer',
						'description' => __( 'Page number for paginated results.', 'jetpack-videopress-pkg' ),
						'default'     => 1,
						'minimum'     => 1,
					),
					'per_page' => array(
						'type'        => 'integer',
						'description' => __( 'Number of videos per page. Server caps at 100.', 'jetpack-videopress-pkg' ),
						'default'     => self::DEFAULT_PER_PAGE,
						'minimum'     => 1,
						'maximum'     => self::MAX_PER_PAGE,
					),
					'media_id' => array(
						'type'        => 'integer',
						'description' => __( 'Return only the video with this attachment ID. Empty result when the id does not exist or is not a VideoPress video.', 'jetpack-videopress-pkg' ),
						'minimum'     => 1,
					),
				),
				'additionalProperties' => false,
			),
			'execute_callback'    => array( __CLASS__, 'list_videos' ),
			'permission_callback' => array( __CLASS__, 'can_upload_files' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Spec: jetpack-videopress/get-storage-quota.
	 *
	 * Zero-arg overview ability. The dashboard storage meter renders the same
	 * data; surfacing it here lets the agent answer "how much space have I
	 * used?" in one call without paginating list-videos.
	 */
	private static function spec_get_storage_quota(): array {
		return array(
			'label'               => __( 'Get VideoPress storage quota', 'jetpack-videopress-pkg' ),
			'description'         => __(
				'Return the current VideoPress storage state for this site. Output: { used_bytes (int), quota_bytes (int|null — null for unlimited plans), percent_used (float, 0-100, null for unlimited), plan_class (one of "free", "videopress-1tb", "videopress-unlimited"), can_upload (bool — whether the current user can upload to VideoPress) }. Idempotent: repeated calls return the same numbers within the underlying 15-second feature transient. Pair with `jetpack-videopress/list-videos` for a full dashboard snapshot.',
				'jetpack-videopress-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(),
				'additionalProperties' => false,
			),
			'execute_callback'    => array( __CLASS__, 'get_storage_quota' ),
			'permission_callback' => array( __CLASS__, 'can_upload_files' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Spec: jetpack-videopress/get-upload-token.
	 *
	 * Mints a one-shot upload JWT and the resumable upload URL. Annotated
	 * non-readonly because it allocates a fresh credential on every call, and
	 * non-idempotent because each call returns a new token even when the inputs
	 * are the same. Destructive remains false: minting a token doesn't change
	 * any site-visible state.
	 */
	private static function spec_get_upload_token(): array {
		return array(
			'label'               => __( 'Get VideoPress upload token', 'jetpack-videopress-pkg' ),
			'description'         => __(
				'Mint a one-shot VideoPress upload credential the caller can use to PUT/POST a video file to WPCOM. Returns { upload_url (string), token (string), expires_at (int|null — Unix timestamp; null when the underlying service did not include an expiry), max_size_bytes (int|null — null when the service did not advertise a per-upload limit) }. Each call mints a fresh token, so do not cache the result; expect short-lived JWTs. Returns WP_Error when the site is not connected to WordPress.com (`videopress_not_connected`) or when the WPCOM token mint fails (`videopress_upload_token_unavailable`).',
				'jetpack-videopress-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(),
				'additionalProperties' => false,
			),
			'execute_callback'    => array( __CLASS__, 'get_upload_token' ),
			'permission_callback' => array( __CLASS__, 'can_upload_files' ),
			'meta'                => array(
				'annotations'  => array(
					// Token minting is a state-allocating call from the service
					// side, not a pure read.
					'readonly'    => false,
					'destructive' => false,
					'idempotent'  => false,
				),
				'show_in_rest' => true,
			),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Permission callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Shared permission callback for the read+mint surface.
	 *
	 * Mirrors `Uploader_Rest_Endpoints::permissions_callback()` and
	 * `WPCOM_REST_API_V2_Endpoint_VideoPress`'s upload-jwt route, which both
	 * gate on `upload_files`. Storage and listing also gate on the same cap so
	 * the surface answers a uniform question — "is this user the person who
	 * would actually be uploading?" — rather than splitting cap checks per
	 * ability.
	 *
	 * @return bool
	 */
	public static function can_upload_files(): bool {
		return current_user_can( 'upload_files' );
	}

	/*
	---------------------------------------------------------------------
	 * Execute callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Execute: list-videos.
	 *
	 * Delegates to GET /wp/v2/media filtered to `video/videopress`, then
	 * reshapes each attachment into the compact summary documented by the
	 * spec. When `media_id` is supplied we short-circuit to a single internal
	 * request for that attachment so callers get a 0- or 1-element array
	 * without an N-page scan.
	 *
	 * @param array $input Arguments from the ability input.
	 * @return array
	 */
	public static function list_videos( $input = null ): array {
		$input = is_array( $input ) ? $input : array();

		// Single-id short circuit. Returns 0- or 1-element array per the
		// consolidated-read contract.
		if ( isset( $input['media_id'] ) && is_numeric( $input['media_id'] ) ) {
			$media_id = (int) $input['media_id'];
			if ( $media_id <= 0 ) {
				return array();
			}
			$summary = self::fetch_single_video_summary( $media_id );
			return null === $summary ? array() : array( $summary );
		}

		$per_page = isset( $input['per_page'] ) ? (int) $input['per_page'] : self::DEFAULT_PER_PAGE;
		if ( $per_page < 1 ) {
			$per_page = self::DEFAULT_PER_PAGE;
		}
		if ( $per_page > self::MAX_PER_PAGE ) {
			$per_page = self::MAX_PER_PAGE;
		}

		$page = isset( $input['page'] ) ? (int) $input['page'] : 1;
		if ( $page < 1 ) {
			$page = 1;
		}

		$request = new WP_REST_Request( 'GET', '/wp/v2/media' );
		$request->set_param( 'mime_type', 'video/videopress' );
		$request->set_param( 'per_page', $per_page );
		$request->set_param( 'page', $page );

		if ( isset( $input['search'] ) && '' !== $input['search'] ) {
			$request->set_param( 'search', (string) $input['search'] );
		}

		if ( isset( $input['status'], self::STATUS_TO_PRIVACY[ $input['status'] ] ) ) {
			// Reuses the videopress_privacy_setting filter exposed by
			// WPCOM_REST_API_V2_Attachment_VideoPress_Data::filter_attachments_by_jetpack_videopress_fields().
			$request->set_param( 'videopress_privacy_setting', (string) self::STATUS_TO_PRIVACY[ $input['status'] ] );
		}

		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return array();
		}

		$data = $response->get_data();
		if ( ! is_array( $data ) ) {
			return array();
		}

		$result = array();
		foreach ( $data as $attachment ) {
			$summary = self::summarize_attachment( (array) $attachment );
			if ( null !== $summary ) {
				$result[] = $summary;
			}
		}

		return $result;
	}

	/**
	 * Execute: get-storage-quota.
	 *
	 * Derives the same numbers the dashboard renders:
	 *  - used_bytes from `Site::get_site_info()['options']['videopress_storage_used']`
	 *    (already converted to bytes by `Data::get_storage_used()`).
	 *  - quota_bytes / plan_class from the WPCOM features list.
	 *
	 * @param array $input Unused.
	 * @return array
	 */
	public static function get_storage_quota( $input = null ): array {
		unset( $input );

		$used_bytes = (int) Data::get_storage_used();

		$plan_class = self::detect_plan_class();
		$quota_bytes = self::quota_for_plan( $plan_class );

		$percent_used = null;
		if ( null !== $quota_bytes && $quota_bytes > 0 ) {
			$percent_used = round( ( $used_bytes / $quota_bytes ) * 100, 2 );
			if ( $percent_used > 100 ) {
				$percent_used = 100.0;
			}
		}

		return array(
			'used_bytes'   => $used_bytes,
			'quota_bytes'  => $quota_bytes,
			'percent_used' => $percent_used,
			'plan_class'   => $plan_class,
			'can_upload'   => Data::can_perform_action() && current_user_can( 'upload_files' ),
		);
	}

	/**
	 * Execute: get-upload-token.
	 *
	 * Wraps `VideoPressToken::videopress_upload_jwt()` and the same
	 * resumable-upload URL the wpcom v2 `upload-jwt` controller surfaces. The
	 * token is short-lived; the agent must consume it immediately rather than
	 * caching it.
	 *
	 * @param array $input Unused.
	 * @return array|WP_Error
	 */
	public static function get_upload_token( $input = null ) {
		unset( $input );

		if ( ! Data::has_connected_owner() ) {
			return new WP_Error(
				'videopress_not_connected',
				__( 'Connect Jetpack to WordPress.com before requesting a VideoPress upload token. Run the Jetpack connection flow, then retry this ability.', 'jetpack-videopress-pkg' )
			);
		}

		$blog_id = Data::get_blog_id();
		if ( ! $blog_id ) {
			return new WP_Error(
				'videopress_not_connected',
				__( 'The site is not registered with WordPress.com. Complete the Jetpack site-registration step, then retry this ability.', 'jetpack-videopress-pkg' )
			);
		}

		try {
			$token = VideoPressToken::videopress_upload_jwt();
		} catch ( Upload_Exception $e ) {
			return new WP_Error(
				'videopress_upload_token_unavailable',
				$e->getMessage()
			);
		}

		$upload_url = function_exists( 'videopress_make_resumable_upload_path' )
			? videopress_make_resumable_upload_path( $blog_id )
			: '';

		return array(
			'upload_url'     => (string) $upload_url,
			'token'          => (string) $token,
			'expires_at'     => self::extract_jwt_expiry( $token ),
			'max_size_bytes' => null,
		);
	}

	/*
	---------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Fetch and project a single VideoPress attachment summary by id.
	 *
	 * Returns null when the id does not resolve to a VideoPress video so the
	 * caller can produce a 0-element array for the unknown-id case.
	 *
	 * @param int $media_id Attachment id.
	 * @return array|null
	 */
	private static function fetch_single_video_summary( int $media_id ): ?array {
		$request = new WP_REST_Request( 'GET', '/wp/v2/media/' . $media_id );
		$request->set_param( 'context', 'edit' );

		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return null;
		}

		$data = (array) $response->get_data();
		if ( empty( $data['id'] ) ) {
			return null;
		}

		// Reject non-VideoPress attachments — the caller asked for a VideoPress
		// video and an "other media" object would be a confusing answer.
		$mime = isset( $data['mime_type'] ) ? (string) $data['mime_type'] : '';
		if ( 'video/videopress' !== $mime ) {
			return null;
		}

		return self::summarize_attachment( $data );
	}

	/**
	 * Project a /wp/v2/media attachment payload into the compact list-videos
	 * shape documented by the spec.
	 *
	 * @param array $attachment Attachment payload from the REST media endpoint.
	 * @return array|null Summary, or null if the payload is missing the
	 *                    minimum fields needed to identify the video.
	 */
	private static function summarize_attachment( array $attachment ): ?array {
		if ( empty( $attachment['id'] ) ) {
			return null;
		}

		$videopress    = isset( $attachment['jetpack_videopress'] ) && is_array( $attachment['jetpack_videopress'] )
			? $attachment['jetpack_videopress']
			: array();
		$media_details = isset( $attachment['media_details'] ) && is_array( $attachment['media_details'] )
			? $attachment['media_details']
			: array();
		$vp_details    = isset( $media_details['videopress'] ) && is_array( $media_details['videopress'] )
			? $media_details['videopress']
			: array();

		$privacy_setting = isset( $videopress['privacy_setting'] )
			? (int) $videopress['privacy_setting']
			: self::PRIVACY_SITE_DEFAULT;

		$privacy_label = 'site-default';
		if ( self::PRIVACY_PUBLIC === $privacy_setting ) {
			$privacy_label = 'public';
		} elseif ( self::PRIVACY_PRIVATE === $privacy_setting ) {
			$privacy_label = 'private';
		}

		$duration_ms = null;
		if ( isset( $vp_details['duration'] ) && is_numeric( $vp_details['duration'] ) ) {
			$duration_ms = (int) $vp_details['duration'];
		}

		$width = null;
		if ( isset( $media_details['width'] ) && is_numeric( $media_details['width'] ) ) {
			$width = (int) $media_details['width'];
		}

		$height = null;
		if ( isset( $media_details['height'] ) && is_numeric( $media_details['height'] ) ) {
			$height = (int) $media_details['height'];
		}

		$title = '';
		if ( isset( $videopress['title'] ) && is_string( $videopress['title'] ) ) {
			$title = $videopress['title'];
		} elseif ( isset( $attachment['title'] ) && is_array( $attachment['title'] ) ) {
			$title = (string) ( $attachment['title']['rendered'] ?? $attachment['title']['raw'] ?? '' );
		}

		$poster = null;
		if ( isset( $vp_details['poster'] ) && is_string( $vp_details['poster'] ) && '' !== $vp_details['poster'] ) {
			$poster = $vp_details['poster'];
		}

		$thumbnail_status = $poster ? 'ready' : 'pending';
		$processing_status = isset( $vp_details['finished'] ) && $vp_details['finished'] ? 'complete' : 'processing';

		return array(
			'media_id'          => (int) $attachment['id'],
			'guid'              => isset( $attachment['jetpack_videopress_guid'] )
				? (string) $attachment['jetpack_videopress_guid']
				: '',
			'title'             => $title,
			'url'               => isset( $attachment['source_url'] ) ? (string) $attachment['source_url'] : '',
			'poster'            => $poster,
			'privacy'           => $privacy_label,
			'rating'            => isset( $videopress['rating'] ) ? (string) $videopress['rating'] : '',
			'duration_ms'       => $duration_ms,
			'width'             => $width,
			'height'            => $height,
			'uploaded_at'       => isset( $attachment['date_gmt'] ) ? (string) $attachment['date_gmt'] : '',
			'thumbnail_status'  => $thumbnail_status,
			'processing_status' => $processing_status,
		);
	}

	/**
	 * Determine the active VideoPress plan class from the WPCOM features list.
	 *
	 * Returns one of `free`, `videopress-1tb`, `videopress-unlimited`. The
	 * `unlimited` branch matches My Jetpack's feature catalog; the `1tb`
	 * branch covers both Jetpack's `videopress-1tb-storage` and the simple
	 * `videopress` feature WPCOM uses on its own platform.
	 *
	 * @return string
	 */
	private static function detect_plan_class(): string {
		$features = Product::get_site_features_from_wpcom();
		if ( ! is_array( $features ) ) {
			return 'free';
		}

		$active = isset( $features['active'] ) && is_array( $features['active'] )
			? $features['active']
			: array();

		if ( in_array( 'videopress-unlimited-storage', $active, true ) ) {
			return 'videopress-unlimited';
		}

		$is_wpcom_platform = ( new Host() )->is_wpcom_platform();

		if ( in_array( 'videopress-1tb-storage', $active, true )
			|| ( $is_wpcom_platform && in_array( 'videopress', $active, true ) )
		) {
			return 'videopress-1tb';
		}

		return 'free';
	}

	/**
	 * Translate a plan class into the byte quota the dashboard shows.
	 *
	 * @param string $plan_class One of the detect_plan_class() return values.
	 * @return int|null Bytes, or null for unlimited.
	 */
	private static function quota_for_plan( string $plan_class ): ?int {
		if ( 'videopress-unlimited' === $plan_class ) {
			return null;
		}
		// Both the free tier and the 1TB plan render against the same 1TB
		// cap in the dashboard. We surface the same number here so the
		// agent's percent_used matches what the user sees.
		return self::QUOTA_BYTES_1TB;
	}

	/**
	 * Decode the `exp` claim from a JWT without verifying the signature.
	 *
	 * Returns null when the payload can't be parsed — callers treat a missing
	 * expiry as "unknown" rather than guessing one.
	 *
	 * @param string $token JWT.
	 * @return int|null Unix timestamp, or null when not available.
	 */
	private static function extract_jwt_expiry( string $token ): ?int {
		$parts = explode( '.', $token );
		if ( count( $parts ) < 2 ) {
			return null;
		}

		$payload_b64 = strtr( $parts[1], '-_', '+/' );
		$padding     = strlen( $payload_b64 ) % 4;
		if ( $padding > 0 ) {
			$payload_b64 .= str_repeat( '=', 4 - $padding );
		}

		$payload_json = base64_decode( $payload_b64, true );
		if ( false === $payload_json ) {
			return null;
		}

		$payload = json_decode( $payload_json, true );
		if ( ! is_array( $payload ) || ! isset( $payload['exp'] ) || ! is_numeric( $payload['exp'] ) ) {
			return null;
		}

		return (int) $payload['exp'];
	}
}
