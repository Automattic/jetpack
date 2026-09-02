<?php
/**
 * Helper for the Posts to Podcast feature.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

/**
 * Gating, permission, and query helpers for the Posts to Podcast feature.
 */
class Posts_To_Podcast_Helper {

	/**
	 * Post meta key the generation pipeline writes on each post it creates.
	 */
	const EPISODE_META_KEY = 'posts_to_podcast_metadata';

	/**
	 * Whether the Posts to Podcast feature is active for the current request.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		/**
		 * Filter to allow disabling the Posts to Podcast feature on a per-site basis.
		 * Defaults to true wherever the podcast package is active; flip this to false
		 * to hide the section during a staged rollout without disabling the package.
		 *
		 * @since 0.1.0
		 *
		 * @param bool $enabled Whether the feature is enabled. Default true.
		 */
		return (bool) apply_filters( 'jetpack_posts_to_podcast_is_enabled', true );
	}

	/**
	 * Permission callback for the local proxy REST endpoint.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 *
	 * @return true|\WP_Error
	 */
	public static function get_status_permission_check( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new \WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to use this feature on this site.', 'jetpack-podcast' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * List the posts this feature generated, newest first, as the paginated
	 * envelope both the Create AI podcast page and its REST route render.
	 *
	 * `perm => editable` makes the list follow the wp-admin Posts screen: users
	 * without `edit_others_posts` only see the episodes they authored.
	 *
	 * @param int $page     1-based page number.
	 * @param int $per_page Items per page, clamped to 1..50.
	 *
	 * @return array{items: array, total: int, page: int, perPage: int, totalPages: int}
	 */
	public static function get_episodes( $page, $per_page ) {
		$page     = max( 1, (int) $page );
		$per_page = max( 1, min( 50, (int) $per_page ) );

		$query = new \WP_Query(
			array(
				'post_type'              => 'post',
				'post_status'            => array( 'draft', 'publish' ),
				'perm'                   => 'editable',
				'posts_per_page'         => $per_page,
				'paged'                  => $page,
				'orderby'                => 'date',
				'order'                  => 'DESC',
				'update_post_term_cache' => false,
				'meta_query'             => array(
					array(
						'key'     => self::EPISODE_META_KEY,
						'compare' => 'EXISTS',
					),
				),
			)
		);

		$items = array();
		foreach ( $query->posts as $post ) {
			$raw_meta = get_post_meta( $post->ID, self::EPISODE_META_KEY, true );
			$meta     = is_string( $raw_meta ) ? json_decode( $raw_meta, true ) : null;
			$audio    = ( is_array( $meta ) && isset( $meta['audio'] ) && is_array( $meta['audio'] ) ) ? $meta['audio'] : array();
			$title    = wp_strip_all_tags(
				html_entity_decode( (string) get_the_title( $post ), ENT_QUOTES | ENT_HTML5, 'UTF-8' )
			);
			if ( '' === trim( $title ) ) {
				// translators: Fallback shown in the Generated podcasts list when a draft has an empty title.
				$title = __( '(no title)', 'jetpack-podcast' );
			}

			$items[] = array(
				'id'        => $post->ID,
				'title'     => $title,
				'status'    => $post->post_status,
				'date'      => mysql2date( 'c', $post->post_date_gmt, false ),
				'editUrl'   => get_edit_post_link( $post->ID, 'raw' ),
				'mediaUrl'  => isset( $audio['url'] ) ? esc_url_raw( (string) $audio['url'] ) : '',
				'mediaType' => 'audio',
				'mediaMime' => isset( $audio['mimeType'] ) ? (string) $audio['mimeType'] : '',
				'duration'  => isset( $audio['durationSeconds'] ) ? (int) round( (float) $audio['durationSeconds'] ) : 0,
			);
		}

		$total = (int) $query->found_posts;

		return array(
			'items'      => $items,
			'total'      => $total,
			'page'       => $page,
			'perPage'    => $per_page,
			'totalPages' => (int) ceil( $total / $per_page ),
		);
	}
}
