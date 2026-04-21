<?php
/**
 * GitHub source adapter for Content Research.
 *
 * Uses GitHub's public Search API (no auth required, 10 req/min unauthenticated).
 * Searches issues, discussions, and PRs for engagement-scored results.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

/**
 * Class Source_GitHub
 *
 * Fetches search results from GitHub's public search API.
 */
class Source_GitHub implements Content_Research_Source {

	/**
	 * Search GitHub issues and discussions for a given query.
	 *
	 * @param string $query The search query.
	 * @param int    $count Maximum number of results.
	 * @return array Normalized results.
	 */
	public function search( string $query, int $count = 10 ): array {
		$cache_key = 'content_research_github_' . md5( $query );
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return $cached;
		}

		// Search issues and PRs (includes discussions in many repos).
		$thirty_days_ago = gmdate( 'Y-m-d', time() - ( 30 * DAY_IN_SECONDS ) );
		$search_query    = $query . ' created:>' . $thirty_days_ago;

		$url = add_query_arg(
			array(
				'q'        => $search_query,
				'sort'     => 'reactions',
				'order'    => 'desc',
				'per_page' => $count,
			),
			'https://api.github.com/search/issues'
		);

		$response = wp_remote_get(
			$url,
			array(
				'timeout' => 15,
				'headers' => array(
					'Accept'     => 'application/vnd.github+json',
					'User-Agent' => 'WordPress/jetpack-mu-wpcom',
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			l( 'content-research github: wp_error', $response->get_error_message() );
			return array();
		}

		$code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $code ) {
			l( 'content-research github: response code', $code );
			return array();
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( empty( $body['items'] ) ) {
			return array();
		}

		$results = array();

		foreach ( $body['items'] as $item ) {
			$reactions = (int) ( $item['reactions']['total_count'] ?? 0 );
			$comments  = (int) ( $item['comments'] ?? 0 );

			$results[] = array(
				'source'     => 'github',
				'title'      => $item['title'] ?? '',
				'url'        => $item['html_url'] ?? '',
				'excerpt'    => mb_substr( $item['body'] ?? '', 0, 200 ),
				'engagement' => array(
					'upvotes'  => $reactions,
					'comments' => $comments,
				),
				'author'     => $item['user']['login'] ?? '',
				'timestamp'  => $item['created_at'] ?? '',
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
		return 'github';
	}
}
