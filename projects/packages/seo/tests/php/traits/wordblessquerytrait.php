<?php
/**
 * Shared WorDBless WP_Query support for Jetpack SEO tests.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

/**
 * Short-circuits the subset of WP_Query behavior unavailable in WorDBless.
 */
trait WorDBless_Query_Trait {

	/**
	 * Test-only WP_Query short-circuit.
	 *
	 * @var callable|null
	 */
	private $posts_query_filter = null;

	/**
	 * Test-only found_posts override for aggregate queries.
	 *
	 * @var callable|null
	 */
	private $found_posts_filter = null;

	/**
	 * Short-circuit queries with inserted posts that match their query vars.
	 *
	 * @param int[] $post_ids Inserted post IDs.
	 * @return void
	 */
	private function hook_wordbless_posts_query( $post_ids ) {
		$this->posts_query_filter = function ( $posts, $query ) use ( $post_ids ) {
			return $this->get_wordbless_query_matches( $post_ids, $query, 'ids' === $query->get( 'fields' ) );
		};
		$this->found_posts_filter = function ( $found_posts, $query ) use ( $post_ids ) {
			return count( $this->get_wordbless_query_matches( $post_ids, $query, true ) );
		};

		add_filter( 'posts_pre_query', $this->posts_query_filter, 10, 2 );
		add_filter( 'found_posts', $this->found_posts_filter, 10, 2 );
	}

	/**
	 * Remove test-only query filters.
	 *
	 * @return void
	 */
	private function clear_wordbless_posts_query() {
		if ( null !== $this->posts_query_filter ) {
			remove_filter( 'posts_pre_query', $this->posts_query_filter, 10 );
			$this->posts_query_filter = null;
		}
		if ( null !== $this->found_posts_filter ) {
			remove_filter( 'found_posts', $this->found_posts_filter, 10 );
			$this->found_posts_filter = null;
		}
	}

	/**
	 * Match inserted posts against the query shape needed by SEO tests.
	 *
	 * @param int[]     $post_ids Inserted post IDs.
	 * @param \WP_Query $query    Query to match.
	 * @param bool      $ids_only Whether to return IDs instead of post objects.
	 * @return array
	 */
	private function get_wordbless_query_matches( $post_ids, $query, $ids_only ) {
		$post_types = (array) $query->get( 'post_type' );
		$meta_query = $query->get( 'meta_query' );
		$matches    = array();

		foreach ( $post_ids as $post_id ) {
			$post = get_post( $post_id );
			if ( ! $post || 'publish' !== $post->post_status || ! in_array( $post->post_type, $post_types, true ) ) {
				continue;
			}

			if ( is_array( $meta_query ) && isset( $meta_query[0]['key'] ) ) {
				$meta    = get_post_meta( $post_id, $meta_query[0]['key'], true );
				$value   = isset( $meta_query[0]['value'] ) ? $meta_query[0]['value'] : '';
				$compare = isset( $meta_query[0]['compare'] ) ? $meta_query[0]['compare'] : '=';

				if ( '!=' === $compare && $meta === $value ) {
					continue;
				}
				if ( '!=' !== $compare && $meta !== $value ) {
					continue;
				}
			}

			$matches[] = $ids_only ? (int) $post_id : $post;
		}

		return $matches;
	}
}
