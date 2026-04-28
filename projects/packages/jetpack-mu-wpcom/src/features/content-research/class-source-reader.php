<?php
/**
 * WPcom Reader source adapter for Content Research.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

/**
 * Class Source_Reader
 *
 * Fetches search results from the WordPress.com Reader API.
 */
class Source_Reader implements Content_Research_Source {

	/**
	 * Search WPcom Reader for a given query.
	 *
	 * @param string $query The search query.
	 * @param int    $count Maximum number of results.
	 * @return array Normalized results.
	 */
	public function search( string $query, int $count = 10 ): array {
		$cache_key = 'content_research_reader_' . md5( $query . '_' . $count );
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return $cached;
		}

		$url = 'https://public-api.wordpress.com/rest/v1.1/read/search?' . http_build_query(
			array(
				'q'      => $query,
				'number' => $count,
			)
		);

		$response = wp_remote_get(
			$url,
			array( 'timeout' => 10 )
		);

		if ( is_wp_error( $response ) ) {
			return array();
		}

		$code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $code ) {
			return array();
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( empty( $body['posts'] ) ) {
			return array();
		}

		$results = array();

		foreach ( $body['posts'] as $post ) {
			$results[] = array(
				'source'     => 'reader',
				'title'      => sanitize_text_field( $post['title'] ?? '' ),
				'url'        => esc_url_raw( $post['URL'] ?? '' ),
				'excerpt'    => sanitize_text_field( wp_trim_words( wp_strip_all_tags( $post['excerpt'] ?? '' ), 30 ) ),
				'engagement' => array(
					'upvotes'  => (int) ( $post['like_count'] ?? 0 ),
					'comments' => (int) ( $post['discussion']['comment_count'] ?? 0 ),
				),
				'author'     => sanitize_text_field( $post['author']['name'] ?? '' ),
				'timestamp'  => sanitize_text_field( $post['date'] ?? '' ),
			);
		}

		set_transient( $cache_key, $results, 5 * MINUTE_IN_SECONDS );

		return $results;
	}

	/**
	 * Get the source name.
	 *
	 * @return string
	 */
	public function get_source_name(): string {
		return 'reader';
	}
}
