<?php
/**
 * VideoPress Playlists
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * VideoPress Playlists class.
 *
 * Registers the `vps_playlist` attachment taxonomy and its term meta. The
 * taxonomy is intentionally invisible in wp-admin (no UI, not public) and is
 * consumed exclusively through the core REST media/terms endpoints by the
 * VideoPress dashboard.
 *
 * Design notes:
 *
 * - Playlist membership truth lives in the term relationships: a video is in
 *   a playlist if (and only if) the `vps_playlist` term is assigned to the
 *   attachment. A video can belong to any number of playlists.
 * - `vps_playlist_order` is presentation-only. It stores the playlist's
 *   ordered attachment IDs as a single array so a reorder is one atomic term
 *   meta write, and the same video can sit at different positions in
 *   different playlists. It never decides membership; IDs missing from the
 *   order meta are still playlist members, and stale IDs are ignored.
 * - Term meta deliberately has no Jetpack Sync handling. This is a known
 *   limitation: playlist meta is not mirrored to WordPress.com.
 */
class Playlists {

	/**
	 * Taxonomy slug for playlists.
	 *
	 * @var string
	 */
	const TAXONOMY = 'vps_playlist';

	/**
	 * REST base for the taxonomy.
	 *
	 * This is both the terms collection route (`/wp/v2/videopress-playlists`)
	 * and the property/filter name used on the core media endpoints
	 * (`POST /wp/v2/media/{id}` body key and `GET /wp/v2/media` query arg).
	 *
	 * @var string
	 */
	const REST_BASE = 'videopress-playlists';

	/**
	 * Term meta key holding the attachment ID of the playlist artwork image.
	 *
	 * @var string
	 */
	const META_ARTWORK_ID = 'vps_playlist_artwork_id';

	/**
	 * Term meta key holding the playlist type.
	 *
	 * @var string
	 */
	const META_TYPE = 'vps_playlist_type';

	/**
	 * Term meta key holding the ordered attachment IDs of the playlist.
	 *
	 * @var string
	 */
	const META_ORDER = 'vps_playlist_order';

	/**
	 * Allowed values for the playlist type meta.
	 *
	 * @var string[]
	 */
	const PLAYLIST_TYPES = array( 'collection', 'series', 'course', 'season' );

	/**
	 * Playlist type used when an invalid value is written outside REST.
	 *
	 * @var string
	 */
	const DEFAULT_PLAYLIST_TYPE = 'collection';

	/**
	 * Initializer.
	 *
	 * This method should be called only once by the Initializer class. Do not
	 * call this method again.
	 *
	 * Deliberately not gated on the Studio flag: the Initializer runs at
	 * plugins_loaded, which is too early to see a filter added from e.g. a
	 * theme's functions.php. The hooks wired here are cheap, `register()`
	 * re-evaluates the flag on `init`, and the delete_attachment handlers
	 * no-op while the taxonomy is unregistered — so the effective gate is a
	 * single `init`-time evaluation, matching when the Studio routes and
	 * initial state read the flag.
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register' ) );
		add_action( 'delete_attachment', array( __CLASS__, 'prune_deleted_attachment_from_playlist_order' ) );
		add_action( 'delete_attachment', array( __CLASS__, 'prune_deleted_attachment_from_playlist_artwork' ) );
	}

	/**
	 * Registers the playlist taxonomy and its term meta on `init`.
	 *
	 * Re-checks the Studio flag: the Initializer already gates `init()` on the
	 * flag at plugins_loaded, but re-evaluating the filter here means the
	 * registration honors the flag's state at `init` time, matching when the
	 * taxonomy actually registers.
	 */
	public static function register() {
		if ( ! Admin_UI::is_studio_enabled() ) {
			return;
		}

		self::register_playlist_taxonomy();
		self::register_playlist_term_meta();
	}

	/**
	 * Registers the `vps_playlist` taxonomy for attachments.
	 */
	private static function register_playlist_taxonomy() {
		register_taxonomy(
			self::TAXONOMY,
			'attachment',
			array(
				'public'                => false,
				'show_ui'               => false,
				'show_in_rest'          => true,
				'rest_base'             => self::REST_BASE,

				/*
				 * Core's terms controller allows anonymous view-context reads
				 * of any show_in_rest taxonomy; this subclass gates reads on
				 * the same `upload_files` capability as the write caps below,
				 * keeping the taxonomy's not-public design true over REST.
				 */
				'rest_controller_class' => Playlists_Rest_Controller::class,
				'hierarchical'          => false,
				'labels'                => array(
					'name'          => __( 'Playlists', 'jetpack-videopress-pkg' ),
					'singular_name' => __( 'Playlist', 'jetpack-videopress-pkg' ),
					'add_new_item'  => __( 'Add New Playlist', 'jetpack-videopress-pkg' ),
					'edit_item'     => __( 'Edit Playlist', 'jetpack-videopress-pkg' ),
					'search_items'  => __( 'Search Playlists', 'jetpack-videopress-pkg' ),
					'not_found'     => __( 'No playlists found.', 'jetpack-videopress-pkg' ),
				),

				/*
				 * Attachments live with `post_status = inherit`, and library
				 * uploads are typically unattached (parent 0). The default
				 * `_update_post_term_count()` only counts attachments whose
				 * parent post is published, so it would report 0 forever.
				 * `_update_generic_term_count()` counts raw term
				 * relationships instead.
				 *
				 * Known limitation: because raw relationships ignore
				 * post_status, a video trashed under MEDIA_TRASH still counts
				 * (and, since trashing doesn't fire `delete_attachment`, its
				 * `vps_playlist_order` entry survives too) until the trash is
				 * emptied. The dashboard tolerates the stale order entry; the
				 * playlist count simply runs high until then.
				 */
				'update_count_callback' => '_update_generic_term_count',

				/*
				 * Anyone who can upload videos can manage playlists. The
				 * `assign_terms` capability is what the core media REST
				 * endpoint checks when assigning playlists to a video.
				 */
				'capabilities'          => array(
					'manage_terms' => 'upload_files',
					'edit_terms'   => 'upload_files',
					'delete_terms' => 'upload_files',
					'assign_terms' => 'upload_files',
				),
			)
		);
	}

	/**
	 * Registers the playlist term meta.
	 *
	 * All keys are single-value, exposed in REST with an explicit schema, and
	 * writable only by users with `upload_files` (see
	 * {@see Playlists::auth_playlist_meta()}).
	 */
	private static function register_playlist_term_meta() {
		register_term_meta(
			self::TAXONOMY,
			self::META_ARTWORK_ID,
			array(
				'type'              => 'integer',
				'description'       => __( 'Attachment ID of the playlist artwork image.', 'jetpack-videopress-pkg' ),
				'single'            => true,
				'sanitize_callback' => 'absint',
				'auth_callback'     => array( __CLASS__, 'auth_playlist_meta' ),
				'show_in_rest'      => array(
					'schema' => array(
						'type'    => 'integer',
						'minimum' => 0,
					),
				),
			)
		);

		register_term_meta(
			self::TAXONOMY,
			self::META_TYPE,
			array(
				'type'              => 'string',
				'description'       => __( 'Type of the playlist.', 'jetpack-videopress-pkg' ),
				'single'            => true,
				'sanitize_callback' => array( __CLASS__, 'sanitize_playlist_type' ),
				'auth_callback'     => array( __CLASS__, 'auth_playlist_meta' ),
				'show_in_rest'      => array(
					'schema' => array(
						'type' => 'string',
						'enum' => self::PLAYLIST_TYPES,
					),
				),
			)
		);

		register_term_meta(
			self::TAXONOMY,
			self::META_ORDER,
			array(
				'type'              => 'array',
				'description'       => __( 'Ordered attachment IDs of the playlist.', 'jetpack-videopress-pkg' ),
				'single'            => true,
				'sanitize_callback' => array( __CLASS__, 'sanitize_playlist_order' ),
				'auth_callback'     => array( __CLASS__, 'auth_playlist_meta' ),
				'show_in_rest'      => array(
					'schema' => array(
						'type'  => 'array',
						'items' => array(
							'type'    => 'integer',
							'minimum' => 1,
						),
					),
				),
			)
		);
	}

	/**
	 * Sanitizes the playlist type meta value.
	 *
	 * Invalid values are coerced to the default type rather than rejected:
	 * `sanitize_meta()` has no error channel, so returning anything other
	 * than a valid value would either store garbage or silently turn the
	 * write into a delete. REST writes are additionally validated against the
	 * schema enum before this runs, so a 400 response still happens there;
	 * this callback is the safety net for direct `update_term_meta()` calls.
	 *
	 * @param mixed $value Meta value to sanitize.
	 * @return string One of the allowed playlist types.
	 */
	public static function sanitize_playlist_type( $value ) {
		if ( is_string( $value ) && in_array( $value, self::PLAYLIST_TYPES, true ) ) {
			return $value;
		}

		return self::DEFAULT_PLAYLIST_TYPE;
	}

	/**
	 * Sanitizes the playlist order meta value.
	 *
	 * Casts each entry to an integer, drops non-positive results (a negative
	 * ID is garbage, not a sign error, so it is discarded instead of being
	 * flipped onto some other attachment), and de-duplicates while keeping
	 * the first occurrence's position.
	 *
	 * @param mixed $value Meta value to sanitize.
	 * @return int[] Sanitized list of attachment IDs.
	 */
	public static function sanitize_playlist_order( $value ) {
		if ( ! is_array( $value ) ) {
			return array();
		}

		$order = array();
		foreach ( $value as $attachment_id ) {
			$attachment_id = (int) $attachment_id;

			if ( $attachment_id < 1 || in_array( $attachment_id, $order, true ) ) {
				continue;
			}

			$order[] = $attachment_id;
		}

		return $order;
	}

	/**
	 * Authorizes playlist term meta writes.
	 *
	 * Registered as the `auth_callback` for every playlist meta key, so it is
	 * consulted by `map_meta_cap()` for the `add_term_meta`, `edit_term_meta`
	 * and `delete_term_meta` capabilities — which is what the REST term meta
	 * fields check before writing.
	 *
	 * @param bool   $allowed  Whether the user can add the term meta. Default false.
	 * @param string $meta_key The meta key.
	 * @param int    $term_id  The term ID where the meta key is stored.
	 * @param int    $user_id  The user ID performing the action.
	 * @return bool Whether the user can write the meta key.
	 */
	public static function auth_playlist_meta( $allowed, $meta_key, $term_id, $user_id ) {
		return user_can( $user_id, 'upload_files' );
	}

	/**
	 * Removes a deleted attachment from every playlist's order meta.
	 *
	 * Runs on `delete_attachment`, which fires before the attachment's term
	 * relationships are removed, so the playlists the video belongs to are
	 * still queryable at this point.
	 *
	 * @param int $post_id Attachment ID being deleted.
	 */
	public static function prune_deleted_attachment_from_playlist_order( $post_id ) {
		if ( ! taxonomy_exists( self::TAXONOMY ) ) {
			return;
		}

		$terms = wp_get_object_terms( $post_id, self::TAXONOMY );
		if ( is_wp_error( $terms ) || empty( $terms ) ) {
			return;
		}

		$post_id = (int) $post_id;

		foreach ( $terms as $term ) {
			$order = get_term_meta( $term->term_id, self::META_ORDER, true );
			if ( ! is_array( $order ) || array() === $order ) {
				continue;
			}

			$pruned = array_values( array_diff( array_map( 'intval', $order ), array( $post_id ) ) );

			if ( count( $pruned ) !== count( $order ) ) {
				update_term_meta( $term->term_id, self::META_ORDER, $pruned );
			}
		}
	}

	/**
	 * Clears the artwork meta of every playlist referencing a deleted attachment.
	 *
	 * Runs on `delete_attachment`. Artwork images are ordinary image
	 * attachments (not playlist members), so this lookup is by meta value
	 * rather than by the deleted attachment's terms. Without it, a deleted
	 * artwork leaves a dangling attachment ID behind: the dashboard falls
	 * back to the placeholder but keeps offering "Change artwork" and re-runs
	 * a doomed media lookup on every playlists refetch.
	 *
	 * @param int $post_id Attachment ID being deleted.
	 */
	public static function prune_deleted_attachment_from_playlist_artwork( $post_id ) {
		if ( ! taxonomy_exists( self::TAXONOMY ) ) {
			return;
		}

		$term_ids = get_terms(
			array(
				'taxonomy'   => self::TAXONOMY,
				'hide_empty' => false,
				'fields'     => 'ids',
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- Term meta lookup over a small taxonomy, and only on attachment deletion.
				'meta_key'   => self::META_ARTWORK_ID,
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				'meta_value' => (int) $post_id,
			)
		);

		if ( is_wp_error( $term_ids ) ) {
			return;
		}

		foreach ( $term_ids as $term_id ) {
			delete_term_meta( $term_id, self::META_ARTWORK_ID );
		}
	}
}
