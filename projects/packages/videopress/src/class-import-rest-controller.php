<?php
/**
 * VideoPress Studio YouTube import REST endpoints.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_Error;
use WP_Query;
use WP_REST_Response;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * REST endpoints backing the Studio "Import from YouTube" flow.
 *
 * Registered from the Initializer's REST closure only when the Studio
 * feature filter (Admin_UI::STUDIO_FILTER) is on, and re-gated inside
 * register_routes() so the class is self-contained and testable.
 *
 * Scope reality (v1): the YouTube Data API v3 exposes metadata and
 * thumbnails only — never media files — so an "import" creates a DRAFT
 * placeholder attachment carrying the video's metadata; the user later
 * completes it by attaching their own exported media file through the
 * existing tus upload flow, at which point the stored metadata and poster
 * are applied and the placeholder is removed. No YouTube Keyring service
 * exists on WPCOM yet either, so every backend-shaped endpoint here runs
 * against the bundled fixtures in src/import-fixtures/ while the
 * `videopress_import_mock_mode` filter (default true) is on, and returns
 * 501 when it is off. When the real WPCOM-proxied listing lands, only this
 * class changes — the route contracts stay identical, so the UI never
 * knows. (Precedent for the real mode: the Google Photos flow in the
 * jetpack plugin's WPCOM_REST_API_V2_Endpoint_External_Media.)
 *
 * Contract (all under jetpack/v4/videopress):
 * - GET    /import/youtube/connection →
 *          { connected, account_name, profile_image, connect_url }
 * - DELETE /import/youtube/connection → { deleted: true }
 * - GET    /import/youtube/videos?page_token=&number= →
 *          { videos: [ { external_id, title, description, tags[],
 *            duration_seconds, privacy, published_at,
 *            thumbnails { default, high, maxres },
 *            already_imported, attachment_id } ], next_page_token }
 * - POST   /import/youtube { video_ids: [] } →
 *          202 { job_id, items: [ { external_id, status: 'queued' } ] }.
 *          v1 processes synchronously before responding; the 202/queued
 *          shape is the contract a future async backend keeps.
 * - GET    /import/status/{job_id} →
 *          { job_id, status: 'running'|'done'|'failed',
 *            items: [ { external_id, status, attachment_id, error } ] }
 *          from a transient-backed job record (expires after an hour).
 *          Not mock-gated: job records are backend-agnostic.
 * - POST   /import/complete { draft_id, media_id } →
 *          { completed: true, media_id }. Called by the attach flow after
 *          the media file uploaded and the stored metadata was applied: it
 *          moves the imported markers onto the new video (so
 *          already-imported lookups keep flagging the YouTube source after
 *          the placeholder is gone) and deletes the draft. Not mock-gated:
 *          placeholders are local regardless of the listing backend.
 *
 * Draft placeholder representation (decisions):
 * - post_type 'attachment', post_status 'inherit', post_parent 0 — the
 *   same shape as a real unattached upload;
 * - post_mime_type 'video/videopress-draft', deliberately NOT
 *   'video/videopress': exact-mime queries for real VideoPress videos can
 *   never match a placeholder (WP treats a full "type/subtype" mime query
 *   as an exact match), while the type stays self-describing and the
 *   Studio library can query for it explicitly;
 * - `_videopress_import` meta holds the imported metadata blob (source,
 *   external_id, title, description, tags, duration_seconds, privacy,
 *   published_at, thumbnail_url, thumbnail_attachment_id);
 * - `_videopress_import_external_id` meta ('youtube:{external_id}') is a
 *   dedicated scalar key so already-imported lookups run as a meta IN
 *   query instead of matching inside the serialized blob;
 * - `_videopress_import_status` meta is 'awaiting_media' until the
 *   completion flow attaches a real media file;
 * - the best thumbnail (maxres → high → default) is sideloaded as a child
 *   image attachment of the placeholder (flagged `videopress_poster_image`
 *   like the existing poster sideloader, so galleries exclude it); if the
 *   download fails the import still succeeds with thumbnail_attachment_id
 *   0 and the URL retained in the blob.
 * - Re-importing an already-imported video is idempotent: the item
 *   resolves to the existing placeholder as 'done' instead of failing or
 *   duplicating. Completed imports stay flagged too — /import/complete
 *   moves the marker meta onto the real video before the placeholder is
 *   deleted.
 * - Deleting a placeholder (any surface) cascades to its sideloaded
 *   thumbnail via cleanup_draft_thumbnail(), hooked unconditionally on
 *   `delete_attachment` from the Initializer.
 *
 * @phan-constructor-used-for-side-effects
 */
class Import_Rest_Controller {

	/**
	 * REST namespace, matching the package's other dashboard routes
	 * (Rest_Controller::REST_NAMESPACE).
	 *
	 * @var string
	 */
	const REST_NAMESPACE = 'jetpack/v4/videopress';

	/**
	 * Meta key holding the imported metadata blob on a placeholder.
	 *
	 * @var string
	 */
	const META_IMPORT = '_videopress_import';

	/**
	 * Meta key holding the import lifecycle status of a placeholder.
	 *
	 * @var string
	 */
	const META_IMPORT_STATUS = '_videopress_import_status';

	/**
	 * Meta key holding 'source:external_id' for already-imported lookups.
	 *
	 * @var string
	 */
	const META_IMPORT_EXTERNAL_ID = '_videopress_import_external_id';

	/**
	 * Mime type of a draft placeholder attachment. Deliberately distinct
	 * from 'video/videopress' so placeholders never masquerade as real
	 * videos in exact-mime queries.
	 *
	 * @var string
	 */
	const DRAFT_MIME_TYPE = 'video/videopress-draft';

	/**
	 * Import status of a placeholder that still needs its media file.
	 *
	 * @var string
	 */
	const STATUS_AWAITING_MEDIA = 'awaiting_media';

	/**
	 * Import status stored on the real video once the attach flow completed
	 * the import (the placeholder itself is deleted at that point).
	 *
	 * @var string
	 */
	const STATUS_COMPLETED = 'completed';

	/**
	 * Prefix of the transient holding one import job's record.
	 *
	 * @var string
	 */
	const JOB_TRANSIENT_PREFIX = 'videopress_import_job_';

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Whether the import endpoints should register at all.
	 *
	 * Mirrors the guard in Initializer so the gating is testable without
	 * driving the whole initializer.
	 *
	 * @return bool
	 */
	public static function should_register() {
		return Admin_UI::is_studio_enabled();
	}

	/**
	 * Whether the import backend runs against the bundled fixtures.
	 *
	 * @return bool
	 */
	public static function is_mock_mode() {
		/**
		 * Filters whether the Studio import endpoints serve bundled fixture
		 * data instead of the real WPCOM-proxied YouTube listing. Defaults
		 * to true because no YouTube Keyring service exists on WPCOM yet;
		 * when the real proxy lands this default flips and the mock (plus
		 * its fixtures) is deleted.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $mock_mode Defaults to true.
		 */
		return (bool) apply_filters( 'videopress_import_mock_mode', true );
	}

	/**
	 * Register the import routes.
	 */
	public function register_routes() {
		if ( ! self::should_register() ) {
			return;
		}

		register_rest_route(
			self::REST_NAMESPACE,
			'/import/youtube/connection',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_connection' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_connection' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/import/youtube/videos',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'list_videos' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'page_token' => array(
						'description' => __( 'Opaque pagination token from a previous response. Empty for the first page.', 'jetpack-videopress-pkg' ),
						'type'        => 'string',
						'default'     => '',
					),
					'number'     => array(
						'description' => __( 'Number of videos per page.', 'jetpack-videopress-pkg' ),
						'type'        => 'integer',
						'default'     => 20,
						'minimum'     => 1,
						'maximum'     => 50,
					),
				),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/import/youtube',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_import' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'video_ids' => array(
						'description' => __( 'YouTube video IDs to import as draft placeholders.', 'jetpack-videopress-pkg' ),
						'type'        => 'array',
						'required'    => true,
						'minItems'    => 1,
						'maxItems'    => 20,
						'items'       => array(
							'type'    => 'string',
							'pattern' => '^[A-Za-z0-9_-]{1,64}$',
						),
					),
				),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/import/complete',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'complete_import' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'draft_id' => array(
						'description' => __( 'Attachment ID of the draft placeholder being completed.', 'jetpack-videopress-pkg' ),
						'type'        => 'integer',
						'required'    => true,
						'minimum'     => 1,
					),
					'media_id' => array(
						'description' => __( 'Attachment ID of the uploaded video replacing the draft.', 'jetpack-videopress-pkg' ),
						'type'        => 'integer',
						'required'    => true,
						'minimum'     => 1,
					),
				),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/import/status/(?P<job_id>[A-Za-z0-9\-]+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_import_status' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'job_id' => array(
						'description' => __( 'The import job ID returned when the import was created.', 'jetpack-videopress-pkg' ),
						'type'        => 'string',
						'required'    => true,
					),
				),
			)
		);
	}

	/**
	 * Permission check shared by every route: importing creates media, so
	 * `upload_files` gates reads and writes alike (mirroring the playlists
	 * controller).
	 *
	 * @return true|WP_Error
	 */
	public function permissions_check() {
		if ( current_user_can( 'upload_files' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			__( 'Sorry, you are not allowed to import videos.', 'jetpack-videopress-pkg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * GET /import/youtube/connection — the connected YouTube identity.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_connection() {
		$gate = $this->require_mock_mode();
		if ( is_wp_error( $gate ) ) {
			return $gate;
		}

		$identity = $this->get_fixtures()['connection'];

		return rest_ensure_response(
			array(
				'connected'     => true,
				'account_name'  => (string) $identity['account_name'],
				'profile_image' => (string) $identity['profile_image'],
				// Only meaningful when disconnected; the mock is always connected.
				'connect_url'   => null,
			)
		);
	}

	/**
	 * DELETE /import/youtube/connection — disconnect the YouTube account.
	 *
	 * Mock no-op: there is no stored token to revoke yet.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_connection() {
		$gate = $this->require_mock_mode();
		if ( is_wp_error( $gate ) ) {
			return $gate;
		}

		return rest_ensure_response( array( 'deleted' => true ) );
	}

	/**
	 * GET /import/youtube/videos — one page of the channel's uploads.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function list_videos( $request ) {
		$gate = $this->require_mock_mode();
		if ( is_wp_error( $gate ) ) {
			return $gate;
		}

		$offset = $this->parse_page_token( (string) $request['page_token'] );
		if ( is_wp_error( $offset ) ) {
			return $offset;
		}

		$number   = (int) $request['number'];
		$videos   = $this->get_fixtures()['videos'];
		$page     = array_slice( $videos, $offset, $number );
		$imported = $this->find_imported_attachments( array_column( $page, 'external_id' ) );

		foreach ( $page as &$video ) {
			$attachment_id             = isset( $imported[ $video['external_id'] ] ) ? $imported[ $video['external_id'] ] : null;
			$video['already_imported'] = null !== $attachment_id;
			$video['attachment_id']    = $attachment_id;
		}
		unset( $video );

		$next_offset = $offset + $number;

		return rest_ensure_response(
			array(
				'videos'          => array_values( $page ),
				'next_page_token' => $next_offset < count( $videos ) ? 'mock-page-' . $next_offset : null,
			)
		);
	}

	/**
	 * POST /import/youtube — import the given videos as draft placeholders.
	 *
	 * Version 1 processes each ID synchronously before responding, but the response
	 * is the queued snapshot (202) so the contract already matches the async
	 * backend that replaces this later; clients follow up on /import/status.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_import( $request ) {
		$gate = $this->require_mock_mode();
		if ( is_wp_error( $gate ) ) {
			return $gate;
		}

		$video_ids = array_values( array_unique( array_map( 'strval', (array) $request['video_ids'] ) ) );

		$fixture_map = array();
		foreach ( $this->get_fixtures()['videos'] as $video ) {
			$fixture_map[ $video['external_id'] ] = $video;
		}

		$job_id = wp_generate_uuid4();
		$items  = array();
		foreach ( $video_ids as $external_id ) {
			$items[] = array(
				'external_id'   => $external_id,
				'status'        => 'queued',
				'attachment_id' => null,
				'error'         => null,
			);
		}

		$this->save_job( $job_id, 'running', $items );

		// The 202 body is the queued snapshot, captured before processing.
		$queued_items = array_map(
			static function ( $item ) {
				return array(
					'external_id' => $item['external_id'],
					'status'      => 'queued',
				);
			},
			$items
		);

		$failures = 0;
		foreach ( $items as $index => $item ) {
			$items[ $index ] = array_merge( $item, $this->import_item( $item['external_id'], $fixture_map ) );
			if ( 'failed' === $items[ $index ]['status'] ) {
				++$failures;
			}
			// Persist after every item so a status poll never sees a stale record.
			$this->save_job( $job_id, 'running', $items );
		}

		$this->save_job( $job_id, count( $items ) === $failures ? 'failed' : 'done', $items );

		return new WP_REST_Response(
			array(
				'job_id' => $job_id,
				'items'  => $queued_items,
			),
			202
		);
	}

	/**
	 * GET /import/status/{job_id} — the job record for a previous import.
	 *
	 * Deliberately not mock-gated: job records are local and backend-agnostic.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_import_status( $request ) {
		$job = get_transient( self::JOB_TRANSIENT_PREFIX . $request['job_id'] );

		if ( ! is_array( $job ) ) {
			return new WP_Error(
				'import_job_not_found',
				__( 'No import job with that ID was found. Job records expire an hour after they finish.', 'jetpack-videopress-pkg' ),
				array( 'status' => 404 )
			);
		}

		return rest_ensure_response( $job );
	}

	/**
	 * POST /import/complete — finish an import whose media file was attached.
	 *
	 * The attach flow calls this after the upload succeeded and the stored
	 * metadata was applied to the new video. Two things happen here, in
	 * order:
	 *
	 * 1. The imported markers (`_videopress_import` blob and the external-id
	 *    lookup key) are copied onto the completed video, with the lifecycle
	 *    status set to {@see STATUS_COMPLETED}. Without this the markers
	 *    would die with the placeholder and the YouTube video would reappear
	 *    unbadged in the picker, ready to be imported and attached again —
	 *    silently accumulating duplicate VideoPress videos of one source.
	 * 2. The placeholder is deleted, cascading to its sideloaded thumbnail
	 *    via {@see cleanup_draft_thumbnail()}.
	 *
	 * Deliberately not mock-gated: placeholders and their markers are local
	 * regardless of which backend produced the listing.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function complete_import( $request ) {
		$draft_id = (int) $request['draft_id'];
		$media_id = (int) $request['media_id'];

		$draft = get_post( $draft_id );
		if ( ! $draft || 'attachment' !== $draft->post_type || self::DRAFT_MIME_TYPE !== $draft->post_mime_type ) {
			return new WP_Error(
				'import_draft_not_found',
				__( 'No import draft with that ID was found.', 'jetpack-videopress-pkg' ),
				array( 'status' => 404 )
			);
		}

		$media = get_post( $media_id );
		if ( ! $media || 'attachment' !== $media->post_type || self::DRAFT_MIME_TYPE === $media->post_mime_type ) {
			return new WP_Error(
				'import_media_not_found',
				__( 'No uploaded video with that ID was found.', 'jetpack-videopress-pkg' ),
				array( 'status' => 404 )
			);
		}

		$import = get_post_meta( $draft_id, self::META_IMPORT, true );
		if ( is_array( $import ) ) {
			update_post_meta( $media_id, self::META_IMPORT, $import );
		}
		$external_id = (string) get_post_meta( $draft_id, self::META_IMPORT_EXTERNAL_ID, true );
		if ( '' !== $external_id ) {
			update_post_meta( $media_id, self::META_IMPORT_EXTERNAL_ID, $external_id );
		}
		update_post_meta( $media_id, self::META_IMPORT_STATUS, self::STATUS_COMPLETED );

		if ( ! wp_delete_attachment( $draft_id, true ) ) {
			// The markers were already copied, so completing again later (or
			// deleting the leftover draft from the library) still converges.
			return new WP_Error(
				'import_draft_delete_failed',
				__( 'The import draft could not be removed.', 'jetpack-videopress-pkg' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response(
			array(
				'completed' => true,
				'media_id'  => $media_id,
			)
		);
	}

	/**
	 * Delete the sideloaded thumbnail of a draft placeholder that is being
	 * deleted, whatever surface deletes it (the attach flow's completion
	 * endpoint, the library's Delete action, wp-admin's Media Library).
	 *
	 * The sideloader parents the thumbnail to the placeholder, but
	 * wp_delete_attachment() never cascades to children, and the existing
	 * poster cleanup (Attachment_Handler::delete_video_wpcom) only follows
	 * `_thumbnail_id` on real VideoPress attachments — so without this hook
	 * every discarded or completed import leaks a hidden-but-real image
	 * attachment and its files.
	 *
	 * Hooked on `delete_attachment` unconditionally from the Initializer:
	 * placeholders can outlive the Studio flag, and the guard is one mime
	 * comparison per attachment delete.
	 *
	 * @param int      $post_id The attachment being deleted.
	 * @param \WP_Post $post    The attachment post object.
	 */
	public static function cleanup_draft_thumbnail( $post_id, $post ) {
		if ( ! isset( $post->post_mime_type ) || self::DRAFT_MIME_TYPE !== $post->post_mime_type ) {
			return;
		}

		$import       = get_post_meta( $post_id, self::META_IMPORT, true );
		$thumbnail_id = is_array( $import ) && isset( $import['thumbnail_attachment_id'] ) ? (int) $import['thumbnail_attachment_id'] : 0;
		if ( $thumbnail_id <= 0 ) {
			return;
		}

		// Same safety check as Attachment_Handler::delete_video_poster_attachment:
		// only delete images the sideloader flagged as ours.
		if ( '1' === (string) get_post_meta( $thumbnail_id, 'videopress_poster_image', true ) ) {
			wp_delete_attachment( $thumbnail_id, true );
		}
	}

	/**
	 * Gate for endpoints whose real backend (the WPCOM YouTube proxy) does
	 * not exist yet.
	 *
	 * @return true|WP_Error True in mock mode, a 501 otherwise.
	 */
	private function require_mock_mode() {
		if ( self::is_mock_mode() ) {
			return true;
		}

		return new WP_Error(
			'not_implemented',
			__( 'The YouTube import backend is not available yet. This endpoint currently only serves mock data; keep the videopress_import_mock_mode filter enabled until the WPCOM proxy ships.', 'jetpack-videopress-pkg' ),
			array( 'status' => 501 )
		);
	}

	/**
	 * Import one video: resolve duplicates, create the draft placeholder,
	 * sideload its thumbnail, and store the metadata.
	 *
	 * @param string $external_id The YouTube video ID.
	 * @param array  $fixture_map Listing items keyed by external_id.
	 * @return array Partial item record: status, and attachment_id or error.
	 */
	private function import_item( $external_id, $fixture_map ) {
		$external_id = sanitize_text_field( (string) $external_id );

		$existing = $this->find_imported_attachments( array( $external_id ) );
		if ( isset( $existing[ $external_id ] ) ) {
			// Idempotent: re-importing resolves to the existing placeholder.
			return array(
				'status'        => 'done',
				'attachment_id' => $existing[ $external_id ],
			);
		}

		if ( ! isset( $fixture_map[ $external_id ] ) ) {
			return array(
				'status' => 'failed',
				'error'  => array(
					'code'    => 'unknown_video',
					'message' => __( 'No video with that ID exists on the connected channel.', 'jetpack-videopress-pkg' ),
				),
			);
		}

		$video = $fixture_map[ $external_id ];

		/*
		 * Sanitize at the storage boundary even though v1 data comes from the
		 * bundled fixtures: when the real YouTube listing replaces them, only
		 * this class is supposed to change, so the seam that keeps external
		 * strings (kses-exempt for unfiltered_html admins on wp_insert_post)
		 * out of the database unsanitized has to exist here already.
		 */
		$title       = sanitize_text_field( (string) $video['title'] );
		$description = sanitize_textarea_field( (string) $video['description'] );

		$attachment_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_parent'    => 0,
				'post_mime_type' => self::DRAFT_MIME_TYPE,
				'post_title'     => $title,
				'post_content'   => $description,
			),
			true
		);
		if ( is_wp_error( $attachment_id ) ) {
			return array(
				'status' => 'failed',
				'error'  => array(
					'code'    => 'attachment_create_failed',
					'message' => $attachment_id->get_error_message(),
				),
			);
		}

		$thumbnail_url           = esc_url_raw( $this->best_thumbnail_url( isset( $video['thumbnails'] ) ? (array) $video['thumbnails'] : array() ) );
		$thumbnail_attachment_id = $this->sideload_thumbnail( $thumbnail_url, $attachment_id );

		update_post_meta(
			$attachment_id,
			self::META_IMPORT,
			array(
				'source'                  => 'youtube',
				'external_id'             => $external_id,
				'title'                   => $title,
				'description'             => $description,
				'tags'                    => array_map( 'sanitize_text_field', array_map( 'strval', (array) $video['tags'] ) ),
				'duration_seconds'        => (int) $video['duration_seconds'],
				'privacy'                 => sanitize_text_field( (string) $video['privacy'] ),
				'published_at'            => sanitize_text_field( (string) $video['published_at'] ),
				'thumbnail_url'           => $thumbnail_url,
				'thumbnail_attachment_id' => $thumbnail_attachment_id,
			)
		);
		update_post_meta( $attachment_id, self::META_IMPORT_EXTERNAL_ID, 'youtube:' . $external_id );
		update_post_meta( $attachment_id, self::META_IMPORT_STATUS, self::STATUS_AWAITING_MEDIA );

		/*
		 * Concurrency guard: the duplicate check above is check-then-insert
		 * with no lock, so two simultaneous imports of the same video (a
		 * double submit, two tabs) can both get here. Now that the marker
		 * meta is written, re-resolve and treat the oldest placeholder as
		 * canonical so both requests converge on one attachment.
		 */
		$canonical_id = $this->resolve_canonical_placeholder( $external_id, (int) $attachment_id );
		if ( $canonical_id !== (int) $attachment_id ) {
			// Cascades to our sideloaded thumbnail via cleanup_draft_thumbnail().
			wp_delete_attachment( $attachment_id, true );
			return array(
				'status'        => 'done',
				'attachment_id' => $canonical_id,
			);
		}

		return array(
			'status'        => 'done',
			'attachment_id' => (int) $attachment_id,
		);
	}

	/**
	 * Resolve which placeholder is canonical for an external ID: the oldest
	 * (lowest-ID) attachment carrying its marker meta. See the concurrency
	 * guard in import_item().
	 *
	 * @param string $external_id   The YouTube video ID.
	 * @param int    $attachment_id The placeholder this request just created.
	 * @return int The canonical placeholder attachment ID.
	 */
	private function resolve_canonical_placeholder( $external_id, $attachment_id ) {
		$query = new WP_Query(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'posts_per_page' => 1,
				'orderby'        => 'ID',
				'order'          => 'ASC',
				'fields'         => 'ids',
				'no_found_rows'  => true,
				'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
					array(
						'key'   => self::META_IMPORT_EXTERNAL_ID,
						'value' => 'youtube:' . $external_id,
					),
				),
			)
		);

		return isset( $query->posts[0] ) ? (int) $query->posts[0] : $attachment_id;
	}

	/**
	 * Map external IDs to the attachment IDs of their existing placeholders.
	 *
	 * @param string[] $external_ids The YouTube video IDs to look up.
	 * @return array<string,int> external_id => attachment_id for imported ones.
	 */
	private function find_imported_attachments( $external_ids ) {
		if ( empty( $external_ids ) ) {
			return array();
		}

		$meta_values = array();
		foreach ( $external_ids as $external_id ) {
			$meta_values[] = 'youtube:' . $external_id;
		}

		$query = new WP_Query(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'posts_per_page' => count( $external_ids ),
				'fields'         => 'ids',
				'no_found_rows'  => true,
				// One dedicated scalar key per placeholder; pages are at most
				// 50 items, so the IN list stays small.
				'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
					array(
						'key'     => self::META_IMPORT_EXTERNAL_ID,
						'value'   => $meta_values,
						'compare' => 'IN',
					),
				),
			)
		);

		$map = array();
		foreach ( $query->posts as $attachment_id ) {
			$value = (string) get_post_meta( $attachment_id, self::META_IMPORT_EXTERNAL_ID, true );
			if ( str_starts_with( $value, 'youtube:' ) ) {
				$map[ substr( $value, strlen( 'youtube:' ) ) ] = (int) $attachment_id;
			}
		}

		return $map;
	}

	/**
	 * Pick the best available thumbnail URL for a listing item.
	 *
	 * @param array $thumbnails The item's thumbnails map (default|high|maxres).
	 * @return string The URL, or '' when none is usable.
	 */
	private function best_thumbnail_url( $thumbnails ) {
		foreach ( array( 'maxres', 'high', 'default' ) as $size ) {
			if ( ! empty( $thumbnails[ $size ] ) ) {
				return (string) $thumbnails[ $size ];
			}
		}

		return '';
	}

	/**
	 * Sideload a thumbnail as a child image attachment of the placeholder,
	 * following the videopress_download_poster_image() pattern (including
	 * its `videopress_poster_image` exclusion flag).
	 *
	 * Failures are non-fatal by design: the import keeps the URL in its
	 * metadata blob and reports 0 here.
	 *
	 * @param string $url           The thumbnail URL.
	 * @param int    $attachment_id The placeholder attachment ID.
	 * @return int The sideloaded attachment ID, or 0 on failure.
	 */
	private function sideload_thumbnail( $url, $attachment_id ) {
		if ( '' === $url ) {
			return 0;
		}

		// Fix the filename for query strings and reject non-image URLs.
		preg_match( '/[^\?]+\.(jpe?g|jpe|gif|png|webp)\b/i', $url, $matches );
		if ( ! $matches ) {
			return 0;
		}

		if ( ! function_exists( 'download_url' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}
		if ( ! function_exists( 'media_handle_sideload' ) ) {
			require_once ABSPATH . 'wp-admin/includes/media.php';
			require_once ABSPATH . 'wp-admin/includes/image.php';
		}

		/*
		 * In mock mode the fixture thumbnails are bundled with the package
		 * (import-fixtures/thumbs/), so "downloading" one is a local copy —
		 * download_url() against the site's own plugins URL would be a
		 * loopback request that fails in plenty of dev environments. The
		 * branch is deleted with the rest of the mock.
		 */
		$tmp_name = $this->fixture_thumbnail_tmp_copy( $url );
		if ( '' === $tmp_name ) {
			$tmp_name = download_url( $url );
		}

		$file_array = array(
			'name'     => basename( $matches[0] ),
			'tmp_name' => $tmp_name,
		);
		if ( is_wp_error( $file_array['tmp_name'] ) ) {
			return 0;
		}

		$thumbnail_id = media_handle_sideload( $file_array, $attachment_id );
		if ( is_wp_error( $thumbnail_id ) ) {
			if ( file_exists( $file_array['tmp_name'] ) ) {
				wp_delete_file( $file_array['tmp_name'] );
			}
			return 0;
		}

		// Same flag the existing poster sideloader sets, so galleries and
		// image queries exclude the thumbnail.
		update_post_meta( $thumbnail_id, 'videopress_poster_image', 1 );

		return (int) $thumbnail_id;
	}

	/**
	 * Copy a bundled fixture thumbnail to a temp file for sideloading.
	 *
	 * DELETABLE with the mock: only returns a path in mock mode, and only
	 * for URLs whose basename matches a file under import-fixtures/thumbs/
	 * (which is where every fixture thumbnail URL points).
	 *
	 * @param string $url The thumbnail URL from the fixture listing.
	 * @return string A temp-file path media_handle_sideload() may consume
	 *                (and will move/delete), or '' when the URL is not a
	 *                bundled fixture thumbnail.
	 */
	private function fixture_thumbnail_tmp_copy( $url ) {
		if ( ! self::is_mock_mode() ) {
			return '';
		}

		$path = (string) wp_parse_url( $url, PHP_URL_PATH );
		if ( '' === $path ) {
			return '';
		}

		// basename() strips any traversal; the file must exist in our dir.
		$file = __DIR__ . '/import-fixtures/thumbs/' . basename( $path );
		if ( ! file_exists( $file ) ) {
			return '';
		}

		$tmp_name = wp_tempnam( $file );
		if ( ! $tmp_name ) {
			return '';
		}
		if ( ! copy( $file, $tmp_name ) ) {
			wp_delete_file( $tmp_name );
			return '';
		}

		return $tmp_name;
	}

	/**
	 * Parse a listing page token back into a fixture offset.
	 *
	 * @param string $page_token The incoming token ('' means the first page).
	 * @return int|WP_Error The offset, or a 400 for foreign tokens.
	 */
	private function parse_page_token( $page_token ) {
		if ( '' === $page_token ) {
			return 0;
		}

		if ( ! preg_match( '/^mock-page-(\d+)$/', $page_token, $matches ) ) {
			return new WP_Error(
				'import_invalid_page_token',
				__( 'The page token is not one this listing issued.', 'jetpack-videopress-pkg' ),
				array( 'status' => 400 )
			);
		}

		return (int) $matches[1];
	}

	/**
	 * Persist a job record. One transient per job; an hour is plenty for a
	 * synchronous v1 and short enough to self-clean.
	 *
	 * @param string $job_id The job ID.
	 * @param string $status Overall status: running|done|failed.
	 * @param array  $items  The per-video item records.
	 */
	private function save_job( $job_id, $status, $items ) {
		set_transient(
			self::JOB_TRANSIENT_PREFIX . $job_id,
			array(
				'job_id' => $job_id,
				'status' => $status,
				'items'  => array_values( $items ),
			),
			HOUR_IN_SECONDS
		);
	}

	/**
	 * Load the bundled fixtures, tolerating their (planned) deletion.
	 *
	 * @return array { connection: array, videos: array }.
	 */
	private function get_fixtures() {
		static $fixtures = null;

		if ( null === $fixtures ) {
			$path     = __DIR__ . '/import-fixtures/youtube-videos.php';
			$data     = file_exists( $path ) ? require $path : null;
			$fixtures = is_array( $data ) && isset( $data['connection'] ) && isset( $data['videos'] )
				? $data
				: array(
					'connection' => array(
						'account_name'  => '',
						'profile_image' => '',
					),
					'videos'     => array(),
				);
		}

		return $fixtures;
	}
}
