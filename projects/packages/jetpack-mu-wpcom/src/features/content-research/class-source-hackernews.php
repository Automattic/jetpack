<?php
/**
 * Hacker News source adapter for Content Research.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

/**
 * Class Source_HackerNews
 *
 * Fetches search results from Hacker News via the Algolia API.
 */
class Source_HackerNews implements Content_Research_Source {

	/**
	 * Search Hacker News for a given query.
	 *
	 * @param string $query The search query.
	 * @param int    $count Maximum number of results.
	 * @return array Normalized results.
	 */
	public function search( string $query, int $count = 10 ): array {
		$cache_key = 'content_research_hn_' . md5( $query );
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return $cached;
		}

		$thirty_days_ago = time() - ( 30 * DAY_IN_SECONDS );

		// Wrap in quotes to enforce exact matching (e.g. "Automattic" vs "Automatic").
		$exact_query = '"' . $query . '"';

		$url = add_query_arg(
			array(
				'query'          => $exact_query,
				'tags'           => 'story',
				'numericFilters' => 'created_at_i>' . $thirty_days_ago,
				'hitsPerPage'    => $count,
			),
			'https://hn.algolia.com/api/v1/search'
		);

		$response = wp_remote_get(
			$url,
			array(
				'timeout' => 10,
				'headers' => array(
					'Accept' => 'application/json',
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return array();
		}

		$code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $code ) {
			return array();
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( empty( $body['hits'] ) ) {
			return array();
		}

		$results = array();

		foreach ( $body['hits'] as $hit ) {
			$results[] = array(
				'source'     => 'hn',
				'title'      => $hit['title'] ?? '',
				'url'        => $hit['url'] ?? ( 'https://news.ycombinator.com/item?id=' . ( $hit['objectID'] ?? '' ) ),
				'excerpt'    => '',
				'engagement' => array(
					'upvotes'  => (int) ( $hit['points'] ?? 0 ),
					'comments' => (int) ( $hit['num_comments'] ?? 0 ),
				),
				'author'     => $hit['author'] ?? '',
				'timestamp'  => $hit['created_at'] ?? '',
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
		return 'hn';
	}
}
