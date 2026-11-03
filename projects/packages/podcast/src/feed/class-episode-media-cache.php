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
 * Left alone, every episode resolves its own media as it renders — enclosure
 * URL to attachment ID, that attachment's metadata for `<itunes:duration>`, the
 * featured image for `<itunes:image>` — roughly four uncached queries an item.
 * {@see self::prime()} does the whole page in three.
 */
class Episode_Media_Cache {

	/**
	 * `_wp_attached_file` path → attachment ID, from the last {@see self::prime()}.
	 *
	 * Keyed by path, not URL: filters ahead of ours rewrite the enclosure URL
	 * before {@see Customize_Feed::rewrite_enclosure()} reads it back out of the
	 * markup — WordPress.com forces it to `http` — and reducing both ends to the
	 * path folds that difference away.
	 *
	 * @var array<string, int>
	 */
	private static $attachment_ids = array();

	/**
	 * Paths per lookup. `posts_per_rss` is configurable and episodes carry more
	 * than one enclosure row, so the page size can't be trusted to bound the
	 * `IN` list.
	 */
	private const CHUNK_SIZE = 500;

	/**
	 * Resolve the page's enclosure URLs and warm the caches the item hooks read.
	 * Safe to call with the unfiltered post list.
	 *
	 * @param array $posts Posts about to be rendered. `the_posts` is a filter, so
	 *                     entries aren't guaranteed to be `WP_Post`.
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

		// `the_posts` runs before WP primes the loop's meta cache, so without this
		// every read below — and core's `rss_enclosure()` later — is a round trip.
		update_meta_cache( 'post', $post_ids );

		$dir            = wp_get_upload_dir();
		$paths          = array();
		$attachment_ids = array();

		foreach ( $post_ids as $post_id ) {
			foreach ( (array) get_post_meta( $post_id, 'enclosure', false ) as $enclosure ) {
				$url = esc_url( trim( explode( "\n", (string) $enclosure )[0] ) );
				if ( '' !== $url ) {
					$paths[ self::attached_file_path( $url, $dir ) ] = true;
				}
			}

			$thumbnail_id = (int) get_post_meta( $post_id, '_thumbnail_id', true );
			if ( $thumbnail_id > 0 ) {
				$attachment_ids[] = $thumbnail_id;
			}
		}

		// Chunked, and never reached with no paths at all: `WP_Meta_Query` drops an
		// `IN` clause whose value is an empty array, leaving a bare key match that
		// would return every attachment on the site.
		$found = array();
		foreach ( array_chunk( array_keys( $paths ), self::CHUNK_SIZE ) as $chunk ) {
			$found = array_merge(
				$found,
				get_posts(
					array(
						'post_type'              => 'attachment',
						// `attachment_url_to_postid()` scans `postmeta` unscoped, so any
						// status is a record it can pick and narrowing would hide the
						// ambiguity rather than settle it. `wp_insert_post()` only lets
						// an attachment hold four of these, but listing them here would
						// copy an invariant that lives in core.
						'post_status'            => array_keys( get_post_stati() ),
						'numberposts'            => -1,
						'fields'                 => 'ids',
						'orderby'                => 'none',
						'no_found_rows'          => true,
						'update_post_term_cache' => false,
						'meta_query'             => array(
							array(
								'key'     => '_wp_attached_file',
								'value'   => array_map( 'strval', $chunk ),
								'compare' => 'IN',
							),
						),
					)
				)
			);
		}

		$attachment_ids = array_values( array_unique( array_merge( $attachment_ids, $found ) ) );
		if ( ! $attachment_ids ) {
			return;
		}

		_prime_post_caches( $attachment_ids, false, true );

		// One attachment can hold several `_wp_attached_file` rows and the lookup
		// matches on any of them, so count it against every requested path it holds.
		// Reading just the first value would bucket it under a path nobody asked
		// for and leave the one that actually matched looking unique.
		$candidates = array();
		foreach ( $found as $id ) {
			foreach ( (array) get_post_meta( $id, '_wp_attached_file', false ) as $value ) {
				if ( isset( $paths[ (string) $value ] ) ) {
					$candidates[ (string) $value ][] = (int) $id;
				}
			}
		}

		// Unambiguous paths only. Core picks between duplicates in `postmeta` order,
		// which a joined query can't reproduce, and a batch hit never reaches the
		// fallback — so a wrong guess would be unrecoverable. Leave those to core.
		foreach ( $candidates as $path => $ids ) {
			$ids = array_unique( $ids );
			if ( 1 === count( $ids ) ) {
				self::$attachment_ids[ (string) $path ] = (int) reset( $ids );
			}
		}
	}

	/**
	 * The attachment behind an enclosure URL: from the batch when
	 * {@see self::prime()} resolved one unambiguously, otherwise from core.
	 *
	 * A hit runs the same filters, in the same order, that
	 * `attachment_url_to_postid()` would, so plugins overriding either end still
	 * win. A miss defers to core rather than answering 0 — offloaded-media plugins
	 * map a CDN URL back to its attachment through those same filters.
	 *
	 * @param string $url Enclosure URL, as it came back out of the markup.
	 * @return int Attachment ID, or 0.
	 */
	public static function attachment_id( string $url ): int {
		$id = self::$attachment_ids[ self::attached_file_path( $url, wp_get_upload_dir() ) ] ?? 0;

		if ( 0 === $id ) {
			return attachment_url_to_postid( $url );
		}

		/** This filter is documented in wp-includes/media.php */
		$pre = apply_filters( 'pre_attachment_url_to_postid', null, $url );
		if ( null !== $pre ) {
			return (int) $pre;
		}

		/** This filter is documented in wp-includes/media.php */
		return (int) apply_filters( 'attachment_url_to_postid', $id, $url );
	}

	/**
	 * Reduce an attachment URL to the relative path stored in `_wp_attached_file`,
	 * step for step with `attachment_url_to_postid()` — including its scheme
	 * normalization, which is what lets both ends of the batch agree. A URL from
	 * outside the uploads dir comes back unchanged and matches nothing.
	 *
	 * @param string $url URL to normalize.
	 * @param array  $dir `wp_get_upload_dir()` result.
	 * @return string
	 */
	private static function attached_file_path( string $url, array $dir ): string {
		$path      = $url;
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
