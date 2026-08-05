<?php
/**
 * The Overview's content-coverage counts: how many published supported content
 * items have each SEO field set, computed in a single aggregate query and
 * cached in a transient that post/meta writes invalidate.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Computes, caches, and invalidates the content-coverage counts.
 */
class Content_Coverage {

	/**
	 * Post-meta keys mirrored from `Jetpack_SEO_Posts` (in plugins/jetpack).
	 * Duplicated here as literals on purpose: that plugin class is NOT reliably
	 * loaded in this package's admin context (the `Jetpack_SEO_Utils`
	 * `class_exists` guard in {@see Dashboard_Data::get_overview_data()} is there
	 * for the same reason), so referencing its constants would fatal.
	 * Content-coverage counting only needs the key strings, which are stable.
	 */
	const META_DESCRIPTION = 'advanced_seo_description';
	const META_SCHEMA_TYPE = 'jetpack_seo_schema_type';
	const META_TITLE       = 'jetpack_seo_html_title';
	const META_NOINDEX     = 'jetpack_seo_noindex';

	/**
	 * Transient holding the coverage counts.
	 *
	 * Versioned, so a future change to the payload's shape can't read a stale array
	 * written by an older version of this code.
	 *
	 * @var string
	 */
	const TRANSIENT = 'jetpack_seo_content_coverage_counts_v1';

	/**
	 * How long the counts survive without being invalidated.
	 *
	 * @var int
	 */
	const TTL = HOUR_IN_SECONDS;

	/**
	 * Post types the counts span.
	 *
	 * @return string[]
	 */
	private static function post_types() {
		return Post_Types::get_supported_content_types();
	}

	/**
	 * The SEO post-meta keys the counts read.
	 *
	 * @return string[]
	 */
	private static function meta_keys() {
		return array(
			self::META_SCHEMA_TYPE,
			self::META_TITLE,
			self::META_DESCRIPTION,
			self::META_NOINDEX,
		);
	}

	/**
	 * Factual content-coverage counts for the Overview card: how many published
	 * supported content items have each SEO field set. State, not a score — the
	 * card shows proportions + raw counts and lets the admin decide what matters.
	 *
	 * Served from {@see self::TRANSIENT} when it's warm. The counts are read on
	 * every load of the SEO page — and by every tab of it, since the dashboard preloads
	 * all of its REST reads at once — so without a cache a plain reload pays for the
	 * query again having changed nothing.
	 *
	 * @return array{total:int,with_schema:int,with_title:int,with_description:int,with_search_visible:int}
	 */
	public static function get() {
		$cached = get_transient( self::TRANSIENT );

		if ( self::is_valid( $cached ) ) {
			return $cached;
		}

		$coverage = self::compute();

		set_transient( self::TRANSIENT, $coverage, self::TTL );

		return $coverage;
	}

	/**
	 * Whether a value read back from the cache is a coverage payload this code can use.
	 *
	 * @param mixed $value Value read from the transient.
	 * @return bool
	 */
	private static function is_valid( $value ) {
		if ( ! is_array( $value ) ) {
			return false;
		}

		foreach ( array( 'total', 'with_schema', 'with_title', 'with_description', 'with_search_visible' ) as $key ) {
			if ( ! isset( $value[ $key ] ) || ! is_int( $value[ $key ] ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Count the coverage metrics straight from the database.
	 *
	 * @return array{total:int,with_schema:int,with_title:int,with_description:int,with_search_visible:int}
	 */
	private static function compute() {
		global $wpdb;

		$post_types = self::post_types();
		$meta_keys  = self::meta_keys();

		$meta_key_placeholders  = implode( ', ', array_fill( 0, count( $meta_keys ), '%s' ) );
		$post_type_placeholders = implode( ', ', array_fill( 0, count( $post_types ), '%s' ) );

		/*
		 * Driven from `wp_postmeta`, not `wp_posts`: most sites have far more published
		 * posts than SEO fields set, so the join starts from the small side, where the
		 * `meta_key` index serves `meta_key IN (…)` directly.
		 *
		 * The aggregate has no GROUP BY, so it still returns its single row — counts at
		 * zero, `total` intact — on a site with no SEO meta at all.
		 *
		 * COUNT( DISTINCT p.ID ) because a post can carry more than one row for the same
		 * meta key. `<> ''` counts a field as set; noindex alone is an exact `= '1'`.
		 */
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
		$sql = $wpdb->prepare(
			"SELECT
				(
					SELECT COUNT(*)
					FROM {$wpdb->posts}
					WHERE post_status = 'publish' AND post_type IN ( {$post_type_placeholders} )
				) AS total,
				COUNT( DISTINCT CASE WHEN pm.meta_key = %s AND pm.meta_value <> '' THEN p.ID END ) AS with_schema,
				COUNT( DISTINCT CASE WHEN pm.meta_key = %s AND pm.meta_value <> '' THEN p.ID END ) AS with_title,
				COUNT( DISTINCT CASE WHEN pm.meta_key = %s AND pm.meta_value <> '' THEN p.ID END ) AS with_description,
				COUNT( DISTINCT CASE WHEN pm.meta_key = %s AND pm.meta_value = '1' THEN p.ID END ) AS noindexed
			FROM {$wpdb->postmeta} pm
			INNER JOIN {$wpdb->posts} p
				ON p.ID = pm.post_id
				AND p.post_status = 'publish'
				AND p.post_type IN ( {$post_type_placeholders} )
			WHERE pm.meta_key IN ( {$meta_key_placeholders} )",
			array_merge(
				$post_types,
				// The CASE arms above, in the order they appear.
				array( self::META_SCHEMA_TYPE, self::META_TITLE, self::META_DESCRIPTION, self::META_NOINDEX ),
				$post_types,
				$meta_keys
			)
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared -- Aggregate count with no core API equivalent; $sql is the prepared statement built directly above. The result is cached in self::TRANSIENT by the get() wrapper, which is the only caller — the sniff just can't see across the two methods.
		$row = $wpdb->get_row( $sql, ARRAY_A );

		// Defaults, so a query that returns nothing at all reads as an empty site rather
		// than fataling on a missing key.
		$counts = array_map(
			'intval',
			array_merge(
				array(
					'total'            => 0,
					'with_schema'      => 0,
					'with_title'       => 0,
					'with_description' => 0,
					'noindexed'        => 0,
				),
				is_array( $row ) ? $row : array()
			)
		);

		return array(
			'total'               => $counts['total'],
			'with_schema'         => $counts['with_schema'],
			'with_title'          => $counts['with_title'],
			'with_description'    => $counts['with_description'],
			// Search-engine visibility is the inverse of the per-post noindex meta: a
			// post is visible unless it's explicitly set to noindex (stored as '1'), so
			// most posts (no meta row) count as visible.
			'with_search_visible' => max( 0, $counts['total'] - $counts['noindexed'] ),
		);
	}

	/**
	 * Hook the writes that can move the coverage counts.
	 *
	 * @return void
	 */
	public static function register_invalidation() {
		// Covers publish, unpublish, trash, untrash and scheduled posts going live — every
		// route by which a post enters or leaves the published set.
		add_action( 'transition_post_status', array( __CLASS__, 'invalidate_on_status_change' ), 10, 3 );
		add_action( 'deleted_post', array( __CLASS__, 'invalidate_on_delete' ), 10, 2 );

		foreach ( array( 'added_post_meta', 'updated_post_meta', 'deleted_post_meta' ) as $hook ) {
			add_action( $hook, array( __CLASS__, 'invalidate_on_meta_change' ), 10, 3 );
		}
	}

	/**
	 * Drop the cached counts when a post enters or leaves the published set.
	 *
	 * Known limitation: this hook only ever sees the post's new type, so converting a
	 * published post to an uncounted post type (or the reverse) isn't caught here and
	 * leaves `total` stale until the next tracked write or the transient's TTL expiry.
	 * A direct `set_post_type()` bypasses every hook anyway, so the TTL backstop is what
	 * ultimately bounds that staleness.
	 *
	 * @param string        $new_status Status the post is moving to.
	 * @param string        $old_status Status the post is moving from.
	 * @param \WP_Post|null $post       The post being transitioned.
	 * @return void
	 */
	public static function invalidate_on_status_change( $new_status, $old_status, $post ) {
		if ( ! $post instanceof \WP_Post || ! in_array( $post->post_type, self::post_types(), true ) ) {
			return;
		}

		// Draft to draft, pending to draft, and the like never touch the counts.
		if ( 'publish' !== $new_status && 'publish' !== $old_status ) {
			return;
		}

		self::invalidate();
	}

	/**
	 * Drop the cached counts when a post is deleted outright.
	 *
	 * Trashing already goes through `transition_post_status`; this catches a hard delete,
	 * which for an already-trashed post transitions nothing.
	 *
	 * @param int           $post_id Deleted post ID.
	 * @param \WP_Post|null $post    The post that was deleted.
	 * @return void
	 */
	public static function invalidate_on_delete( $post_id, $post = null ) {
		if ( ! $post instanceof \WP_Post || ! in_array( $post->post_type, self::post_types(), true ) ) {
			return;
		}

		self::invalidate();
	}

	/**
	 * Drop the cached counts when one of the SEO fields they count is written.
	 *
	 * @param int|int[] $meta_id   Meta row ID, or IDs on delete. Unused.
	 * @param int       $object_id Post the meta belongs to. Unused.
	 * @param string    $meta_key  Meta key written.
	 * @return void
	 */
	public static function invalidate_on_meta_change( $meta_id, $object_id, $meta_key ) {
		if ( ! in_array( $meta_key, self::meta_keys(), true ) ) {
			return;
		}

		self::invalidate();
	}

	/**
	 * Drop the cached counts.
	 *
	 * @return void
	 */
	private static function invalidate() {
		delete_transient( self::TRANSIENT );
	}
}
