<?php
/**
 * Marker-draft stubbing for the AI Launchpad tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Stands in for a saved AI draft: its marker-meta lookup runs through WP_Query, which WorDBless cannot execute.
 */
trait AI_Launchpad_Stubs_Marker_Draft {

	/**
	 * Resolves the draft lookup for one marker meta key to the given post id.
	 *
	 * @param string $meta_key The listener's marker meta key.
	 * @param int    $draft_id The draft post id the lookup should resolve to.
	 */
	private function stub_marker_draft( $meta_key, $draft_id ) {
		add_filter(
			'posts_pre_query',
			static function ( $posts, $query ) use ( $meta_key, $draft_id ) {
				return $meta_key === $query->get( 'meta_key' ) ? array( $draft_id ) : $posts;
			},
			10,
			2
		);
	}

	/**
	 * Drops stubbed lookups, which WP_Query caches in a group WorDBless never flushes. Call from tear_down().
	 */
	private function flush_marker_drafts() {
		wp_cache_flush_group( 'post-queries' );
	}
}
