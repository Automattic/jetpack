<?php
/**
 * Batch-resolves the media a podcast feed render needs, up front.
 *
 * @package automattic/jetpack-podcast
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Podcast\Feed;

use WP_Post;

/**
 * Rendering one episode reaches for media three times, and nothing it touches
 * is in cache yet: the enclosure URL is resolved to an attachment ID
 * (`attachment_url_to_postid()`, which compares `meta_value` across every
 * `_wp_attached_file` row), that attachment's metadata is read for
 * `<itunes:duration>`, and the featured image is loaded for `<itunes:image>`.
 * That is four queries an item, one of them matching on an unindexed column, so
 * a 300-episode feed spends the bulk of its render waiting on the database.
 *
 * None of it has to be per-item work, though: the whole post list is known
 * before the first item renders. {@see self::prime()} resolves it in a fixed
 * handful of queries up front, so the `rss2_item` hooks read warm caches
 * instead of issuing their own lookups.
 */
class Episode_Media_Cache {

	/**
	 * Enclosure URL → attachment ID, from the last {@see self::prime()}. Keyed
	 * by the URL exactly as `rss_enclosure()` renders it, which is what
	 * {@see Customize_Feed::rewrite_enclosure()} pulls back out of the markup.
	 *
	 * @var array<string, int>
	 */
	private static $attachment_ids = array();

	/**
	 * Paths per `IN (…)` batch. Feeds can be configured to serve an unbounded
	 * number of items, so the lookup is chunked rather than trusting the page
	 * size to stay sane.
	 */
	private const CHUNK_SIZE = 500;

	/**
	 * Warm every cache the feed's item hooks will read: the page's post meta,
	 * the attachment behind each enclosure URL, and the post + meta caches for
	 * those attachments and the episodes' featured images.
	 *
	 * The `update_meta_cache()` call is doing real work despite looking
	 * redundant — `the_posts` runs before WP primes the loop's meta cache, so
	 * without it every `enclosure` / `_thumbnail_id` read below, and core's own
	 * `rss_enclosure()` later, is a round trip apiece.
	 *
	 * Safe to call with the unfiltered post list: posts without an `enclosure`
	 * row contribute no URLs.
	 *
	 * @param WP_Post[] $posts Posts about to be rendered.
	 */
	public static function prime( array $posts ): void {
		self::$attachment_ids = array();

		$post_ids = array();
		foreach ( $posts as $post ) {
			if ( $post instanceof WP_Post ) {
				$post_ids[] = (int) $post->ID;
			}
		}

		if ( ! $post_ids ) {
			return;
		}

		update_meta_cache( 'post', $post_ids );

		$urls           = array();
		$attachment_ids = array();

		foreach ( $post_ids as $post_id ) {
			foreach ( (array) get_post_meta( $post_id, 'enclosure', false ) as $enclosure ) {
				$url = self::enclosure_url( (string) $enclosure );
				if ( '' !== $url ) {
					$urls[ $url ] = true;
				}
			}

			$thumbnail_id = (int) get_post_meta( $post_id, '_thumbnail_id', true );
			if ( $thumbnail_id > 0 ) {
				$attachment_ids[] = $thumbnail_id;
			}
		}

		self::$attachment_ids = self::resolve_urls( array_keys( $urls ) );

		$attachment_ids = array_filter( array_merge( $attachment_ids, array_values( self::$attachment_ids ) ) );
		if ( $attachment_ids ) {
			_prime_post_caches( array_values( array_unique( $attachment_ids ) ), false, true );
		}
	}

	/**
	 * The attachment behind an enclosure URL: from the batch when
	 * {@see self::prime()} resolved one, and from core otherwise.
	 *
	 * Deferring to core rather than answering `0` for what the batch missed is
	 * deliberate. The batch only matches files stored under this site's uploads
	 * dir, and `attachment_url_to_postid()` applies filters that plugins —
	 * offloaded-media ones especially — use to map a CDN or S3 URL back to its
	 * attachment. Short-circuiting a miss would silently cost those sites their
	 * `<itunes:duration>` and play tracking, for a query we only save on
	 * enclosures that were never going to resolve anyway.
	 *
	 * @param string $url Enclosure URL, as `rss_enclosure()` rendered it.
	 * @return int Attachment ID, or 0 when the URL isn't a local attachment.
	 */
	public static function attachment_id( string $url ): int {
		$primed = self::$attachment_ids[ $url ] ?? 0;

		return $primed > 0 ? $primed : attachment_url_to_postid( $url );
	}

	/**
	 * Drop the primed map. Each {@see self::prime()} already replaces it
	 * wholesale, so this is only for callers that need the static state gone
	 * without a render — chiefly tests.
	 */
	public static function reset(): void {
		self::$attachment_ids = array();
	}

	/**
	 * The URL core will put in the `<enclosure>` tag for a stored `enclosure`
	 * meta value (`url\nlength\nmime\n`) — matching `rss_enclosure()`'s own
	 * `esc_url( trim( … ) )` so the map keys line up with what
	 * {@see Customize_Feed::rewrite_enclosure()} reads back out of the markup.
	 *
	 * @param string $enclosure Raw `enclosure` meta value.
	 * @return string Empty string when the row has no URL.
	 */
	private static function enclosure_url( string $enclosure ): string {
		$lines = explode( "\n", $enclosure );

		return esc_url( trim( $lines[0] ) );
	}

	/**
	 * Resolve many URLs to attachment IDs in one query per chunk, mirroring
	 * `attachment_url_to_postid()`'s own matching so a batched lookup can't
	 * disagree with the per-URL one it replaces. Distinct URLs can share a
	 * path, so the lookup collapses to paths and fans back out to URLs.
	 *
	 * `meta_value` comparison is case-insensitive under MySQL's default
	 * collation, so a query can match a row differing only in case. Core
	 * prefers the exact-case row and otherwise takes the first match, hence the
	 * two buckets.
	 *
	 * @param string[] $urls Distinct URLs.
	 * @return array<string, int> URL → attachment ID (0 when unresolved).
	 */
	private static function resolve_urls( array $urls ): array {
		global $wpdb;

		if ( ! $urls ) {
			return array();
		}

		$dir = wp_get_upload_dir();

		$paths = array();
		foreach ( $urls as $url ) {
			$paths[ self::attached_file_path( (string) $url, $dir ) ][] = (string) $url;
		}

		$rows = array();
		foreach ( array_chunk( array_keys( $paths ), self::CHUNK_SIZE ) as $chunk ) {
			$chunk        = array_map( 'strval', $chunk );
			$placeholders = implode( ', ', array_fill( 0, count( $chunk ), '%s' ) );

			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- $placeholders is a generated list of %s and every value goes through prepare(); this is the batched form of core's own uncached `attachment_url_to_postid()` query, and its results are what get cached.
			$results = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key = '_wp_attached_file' AND meta_value IN ( $placeholders )",
					$chunk
				)
			);
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

			if ( $results ) {
				$rows = array_merge( $rows, $results );
			}
		}

		$exact = array();
		$loose = array();
		foreach ( $rows as $row ) {
			$value = (string) $row->meta_value;
			$id    = (int) $row->post_id;

			if ( ! isset( $exact[ $value ] ) ) {
				$exact[ $value ] = $id;
			}
			$lower = strtolower( $value );
			if ( ! isset( $loose[ $lower ] ) ) {
				$loose[ $lower ] = $id;
			}
		}

		$resolved = array();
		foreach ( $paths as $path => $path_urls ) {
			$path = (string) $path;
			$id   = $exact[ $path ] ?? ( $loose[ strtolower( $path ) ] ?? 0 );
			foreach ( $path_urls as $url ) {
				$resolved[ $url ] = $id;
			}
		}

		return $resolved;
	}

	/**
	 * Reduce an attachment URL to the relative path stored in
	 * `_wp_attached_file`, step for step with `attachment_url_to_postid()`
	 * (including forcing the scheme to match the uploads dir). A URL from
	 * outside the uploads dir is returned unchanged and simply matches
	 * nothing — same as core.
	 *
	 * @param string $url URL to normalize.
	 * @param array  $dir `wp_get_upload_dir()` result.
	 * @return string
	 */
	private static function attached_file_path( string $url, array $dir ): string {
		$path = $url;

		$site_url  = wp_parse_url( $dir['url'] );
		$url_parts = wp_parse_url( $path );

		if ( isset( $url_parts['scheme'] ) && isset( $site_url['scheme'] ) && $url_parts['scheme'] !== $site_url['scheme'] ) {
			$path = str_replace( $url_parts['scheme'], $site_url['scheme'], $path );
		}

		$baseurl = $dir['baseurl'] . '/';
		if ( 0 === strpos( $path, $baseurl ) ) {
			$path = substr( $path, strlen( $baseurl ) );
		}

		return $path;
	}
}
