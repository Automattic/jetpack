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
		$cache_key = 'content_research_gnews_' . md5( $query . '_' . $count );
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return $cached;
		}

		// Wrap in quotes to enforce exact matching (e.g. "Automattic" vs "Automatic").
		$exact_query = '"' . $query . '"';

		$url = 'https://news.google.com/rss/search?' . http_build_query(
			array(
				'q'    => $exact_query,
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

		// Parse RSS/XML safely: suppress warnings and disallow external entities.
		$previous_libxml_use_internal_errors = libxml_use_internal_errors( true );
		$xml                                 = simplexml_load_string( $body, '\\SimpleXMLElement', LIBXML_NONET | LIBXML_NOCDATA );
		libxml_clear_errors();
		libxml_use_internal_errors( $previous_libxml_use_internal_errors );

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
			$pub_date    = (string) $item->{'pubDate'}; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
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
			if ( mb_strlen( $excerpt ) > 200 ) {
				$excerpt = mb_substr( $excerpt, 0, 200 ) . '...';
			}

			$results[] = array(
				'source'     => 'googlenews',
				'title'      => sanitize_text_field( $title ),
				'url'        => esc_url_raw( $link ),
				'excerpt'    => sanitize_text_field( $excerpt ),
				'engagement' => array(),
				'author'     => sanitize_text_field( $source_name ),
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
