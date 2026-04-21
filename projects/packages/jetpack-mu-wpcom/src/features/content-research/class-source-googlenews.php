<?php
/**
 * Google News source adapter for Content Research.
 *
 * Uses Google News RSS feed (free, no auth required).
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

/**
 * Class Source_GoogleNews
 *
 * Fetches search results from Google News RSS.
 */
class Source_GoogleNews implements Content_Research_Source {

	/**
	 * Search Google News for a given query.
	 *
	 * @param string $query The search query.
	 * @param int    $count Maximum number of results.
	 * @return array Normalized results.
	 */
	public function search( string $query, int $count = 10 ): array {
		$cache_key = 'content_research_gnews_' . md5( $query );
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return $cached;
		}

		$url = 'https://news.google.com/rss/search?' . http_build_query(
			array(
				'q'    => $query,
				'hl'   => 'en',
				'gl'   => 'US',
				'ceid' => 'US:en',
			)
		);

		$response = wp_remote_get(
			$url,
			array(
				'timeout' => 15,
				'headers' => array(
					'User-Agent' => 'WordPress/jetpack-mu-wpcom',
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

		$body = wp_remote_retrieve_body( $response );

		// Parse RSS/XML.
		$xml = simplexml_load_string( $body );
		if ( false === $xml || ! isset( $xml->channel->item ) ) {
			return array();
		}

		$results = array();
		$i       = 0;

		foreach ( $xml->channel->item as $item ) {
			if ( $i >= $count ) {
				break;
			}

			$title       = (string) $item->title;
			$link        = (string) $item->link;
			$pub_date    = (string) $item->pubDate;
			$source_name = '';

			// Google News titles are formatted as "Headline - Source Name".
			$dash_pos = strrpos( $title, ' - ' );
			if ( false !== $dash_pos ) {
				$source_name = substr( $title, $dash_pos + 3 );
				$title       = substr( $title, 0, $dash_pos );
			}

			// Description contains a brief snippet.
			$description = (string) $item->description;
			$excerpt     = wp_strip_all_tags( $description );
			if ( strlen( $excerpt ) > 200 ) {
				$excerpt = substr( $excerpt, 0, 200 ) . '...';
			}

			$results[] = array(
				'source'     => 'googlenews',
				'title'      => $title,
				'url'        => $link,
				'excerpt'    => $excerpt,
				'engagement' => array(),
				'author'     => $source_name,
				'timestamp'  => $pub_date ? gmdate( 'c', strtotime( $pub_date ) ) : '',
			);

			++$i;
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
		return 'googlenews';
	}
}
