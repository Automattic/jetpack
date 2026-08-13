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
 * Left alone, every episode resolves its own media as it renders — the
 * enclosure URL to an attachment ID, that attachment's metadata for
 * `<itunes:duration>`, the featured image for `<itunes:image>` — roughly four
 * uncached queries an item. {@see self::prime()} does the whole page in three,
 * so the `rss2_item` hooks read warm caches instead.
 */
class Episode_Media_Cache {

	/**
	 * Enclosure URL → attachment ID, from the last {@see self::prime()}. Holds
	 * only matches, keyed as `rss_enclosure()` renders the URL — which is what
	 * {@see Customize_Feed::rewrite_enclosure()} reads back out of the markup.
	 *
	 * @var array<string, int>
	 */
	private static $attachment_ids = array();

	/**
	 * Resolve the page's enclosure URLs and warm the caches the item hooks
	 * read. Safe to call with the unfiltered post list — posts without an
	 * `enclosure` row contribute nothing.
	 *
	 * `the_posts` runs before WP primes the loop's meta cache, so the
	 * `update_meta_cache()` call is what keeps the reads below, and core's
	 * `rss_enclosure()` later, from being a round trip apiece.
	 *
	 * The empty-`$paths` guard is load-bearing: `WP_Meta_Query` drops an `IN`
	 * clause whose value is an empty array, leaving a bare `_wp_attached_file`
	 * key match that would pull back every attachment on the site.
	 *
	 * The lookup is deliberately narrower than core's: `inherit`-status
	 * attachments on an exact path match, where `attachment_url_to_postid()`
	 * ignores post status and also accepts a case-insensitive match. Whatever
	 * it misses still resolves through {@see self::attachment_id()}.
	 *
	 * @param array $posts Posts about to be rendered. `the_posts` is a filter,
	 *                     so entries aren't guaranteed to be `WP_Post` — hence
	 *                     the check before each is used.
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

		$dir            = wp_get_upload_dir();
		$paths          = array();
		$attachment_ids = array();

		foreach ( $post_ids as $post_id ) {
			foreach ( (array) get_post_meta( $post_id, 'enclosure', false ) as $enclosure ) {
				$url = esc_url( trim( explode( "\n", (string) $enclosure )[0] ) );
				if ( '' !== $url ) {
					$paths[ self::attached_file_path( $url, $dir ) ][] = $url;
				}
			}

			$thumbnail_id = (int) get_post_meta( $post_id, '_thumbnail_id', true );
			if ( $thumbnail_id > 0 ) {
				$attachment_ids[] = $thumbnail_id;
			}
		}

		$found = array();
		if ( $paths ) {
			$found = get_posts(
				array(
					'post_type'              => 'attachment',
					'post_status'            => 'inherit',
					'numberposts'            => -1,
					'fields'                 => 'ids',
					'orderby'                => 'none',
					'no_found_rows'          => true,
					'update_post_term_cache' => false,
					'meta_query'             => array(
						array(
							'key'     => '_wp_attached_file',
							'value'   => array_map( 'strval', array_keys( $paths ) ),
							'compare' => 'IN',
						),
					),
				)
			);
		}

		$attachment_ids = array_values( array_unique( array_merge( $attachment_ids, $found ) ) );
		if ( ! $attachment_ids ) {
			return;
		}

		_prime_post_caches( $attachment_ids, false, true );

		$by_path = array();
		foreach ( $found as $id ) {
			$by_path[ (string) get_post_meta( $id, '_wp_attached_file', true ) ] = $id;
		}

		foreach ( $paths as $path => $urls ) {
			$id = $by_path[ (string) $path ] ?? 0;
			if ( $id > 0 ) {
				foreach ( $urls as $url ) {
					self::$attachment_ids[ $url ] = $id;
				}
			}
		}
	}

	/**
	 * The attachment behind an enclosure URL: from the batch when
	 * {@see self::prime()} matched one, otherwise from core.
	 *
	 * A hit runs the same filters, in the same order, that
	 * `attachment_url_to_postid()` would — only the query itself is replaced —
	 * so plugins overriding either end of the lookup still win. A miss defers
	 * to core outright: the batch only matches files under this site's uploads
	 * dir, and offloaded-media plugins lean on those filters to map a CDN URL
	 * back to its attachment.
	 *
	 * @param string $url Enclosure URL, as `rss_enclosure()` rendered it.
	 * @return int Attachment ID, or 0.
	 */
	public static function attachment_id( string $url ): int {
		if ( ! isset( self::$attachment_ids[ $url ] ) ) {
			return attachment_url_to_postid( $url );
		}

		/** This filter is documented in wp-includes/media.php */
		$pre = apply_filters( 'pre_attachment_url_to_postid', null, $url );
		if ( null !== $pre ) {
			return (int) $pre;
		}

		/** This filter is documented in wp-includes/media.php */
		return (int) apply_filters( 'attachment_url_to_postid', self::$attachment_ids[ $url ], $url );
	}

	/**
	 * Reduce an attachment URL to the relative path stored in
	 * `_wp_attached_file`, step for step with `attachment_url_to_postid()`. A
	 * URL from outside the uploads dir comes back unchanged and matches
	 * nothing, same as core.
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
