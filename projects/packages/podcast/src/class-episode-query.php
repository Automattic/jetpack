<?php
/**
 * Podcast episode query helpers.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use WP_Post;
use WP_Query;

/**
 * Shared helpers for identifying posts that are actual podcast episodes.
 */
class Episode_Query {

	/**
	 * Maximum number of published posts to scan per readiness check to keep
	 * dashboard status calls bounded on large sites while still covering typical
	 * show catalogs (50 posts/page x 10 pages).
	 *
	 * @var int
	 */
	private const MAX_POSTS_TO_SCAN = 500;

	/**
	 * Whether a post carries supported podcast media.
	 *
	 * @param WP_Post $post Post being checked.
	 */
	public static function post_has_podcast_media( WP_Post $post ): bool {
		return self::has_podcast_episode_block_media( $post )
			|| has_block( 'core/audio', $post )
			|| ! empty( get_attached_media( 'audio', $post->ID ) );
	}

	/**
	 * Whether a post has a Podcast Episode block with a concrete media URL.
	 *
	 * @param WP_Post $post Post being checked.
	 */
	private static function has_podcast_episode_block_media( WP_Post $post ): bool {
		return self::blocks_have_podcast_episode_media( parse_blocks( $post->post_content ) );
	}

	/**
	 * Recursively inspect parsed blocks for a Podcast Episode media URL.
	 *
	 * @param array $blocks Parsed blocks.
	 */
	private static function blocks_have_podcast_episode_media( array $blocks ): bool {
		foreach ( $blocks as $block ) {
			if (
				isset( $block['blockName'] ) &&
				'jetpack/podcast-episode' === $block['blockName'] &&
				isset( $block['attrs']['mediaUrl'] ) &&
				is_string( $block['attrs']['mediaUrl'] ) &&
				'' !== trim( $block['attrs']['mediaUrl'] )
			) {
				return true;
			}

			if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) && self::blocks_have_podcast_episode_media( $block['innerBlocks'] ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Whether the configured category has at least one published episode.
	 *
	 * @param int $category_id     Configured podcast category ID.
	 * @param int $exclude_post_id Optional post ID to exclude from the scan.
	 */
	public static function has_published_episode( int $category_id, int $exclude_post_id = 0 ): bool {
		if ( $category_id <= 0 ) {
			return false;
		}

		$page = 1;
		$scanned_posts = 0;
		while ( $scanned_posts < self::MAX_POSTS_TO_SCAN ) {
			$query = new WP_Query(
				array(
					'post_status'            => 'publish',
					'post_type'              => 'post',
					'cat'                    => $category_id,
					'post__not_in'           => $exclude_post_id > 0 ? array( $exclude_post_id ) : array(),
					'posts_per_page'         => 50,
					'paged'                  => $page,
					'ignore_sticky_posts'    => true,
					'no_found_rows'          => true,
					'update_post_meta_cache' => false,
					'update_post_term_cache' => false,
				)
			);

			if ( empty( $query->posts ) ) {
				break;
			}

			foreach ( $query->posts as $post ) {
				++$scanned_posts;

				if ( self::post_has_podcast_media( $post ) ) {
					return true;
				}
			}

			++$page;
		}

		return false;
	}
}
