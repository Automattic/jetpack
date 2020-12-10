<?php
/**
 * Mock class to help make Jetpack_Podcast_Helper more testable.
 *
 * @package jetpack
 */

/**
 * Class Mock_Jetpack_Podcast_Helper
 */
class Mock_Jetpack_Podcast_Helper extends Jetpack_Podcast_Helper {
	/**
	 * Mock of load_feed().
	 *
	 * @param string $feed Feed.
	 * @return \Mock_SimplePie|\WP_Error
	 */
	public static function load_feed( $feed ) {
		if ( 'http://error' === $feed ) {
			return new WP_Error( 'feed_error', 'Feed error.' );
		}

		return new Mock_SimplePie();
	}

	/**
	 * Mock of setup_tracks_callback().
	 *
	 * @param \SimplePie_Item $episode Episode.
	 * @return array
	 */
	public static function setup_tracks_callback( $episode ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array(
			'id'          => wp_unique_id( 'podcast-track-' ),
			'link'        => 'https://example.org',
			'src'         => 'https://example.org',
			'type'        => 'episode',
			'description' => '',
			'title'       => '',
		);
	}
}
