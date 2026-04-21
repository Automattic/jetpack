<?php
/**
 * Polymarket source adapter for Content Research.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

/**
 * Class Source_Polymarket
 *
 * Fetches prediction market data from Polymarket's public API.
 */
class Source_Polymarket implements Content_Research_Source {

	/**
	 * Search Polymarket for a given query.
	 *
	 * @param string $query The search query.
	 * @param int    $count Maximum number of results.
	 * @return array Normalized results.
	 */
	public function search( string $query, int $count = 10 ): array {
		$cache_key = 'content_research_polymarket_' . md5( $query );
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return $cached;
		}

		$url = add_query_arg(
			array(
				'q' => $query,
			),
			'https://gamma-api.polymarket.com/public-search'
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

		// Response is { events: [ ... ] }.
		$events = $body['events'] ?? array();
		if ( empty( $events ) ) {
			return array();
		}

		$results = array();

		foreach ( array_slice( $events, 0, $count ) as $event ) {
			$volume_raw = (float) ( $event['volume'] ?? 0 );
			$volume     = $volume_raw >= 1000
				? '$' . number_format( $volume_raw / 1000, 0 ) . 'K'
				: '$' . number_format( $volume_raw, 0 );

			// Best bid lives in the first market inside the event.
			$first_market = $event['markets'][0] ?? array();
			$best_bid     = isset( $first_market['bestBid'] )
				? round( (float) $first_market['bestBid'] * 100 ) . '% Yes'
				: '';

			$results[] = array(
				'source'    => 'polymarket',
				'title'     => $event['title'] ?? '',
				'url'       => 'https://polymarket.com/event/' . ( $event['slug'] ?? '' ),
				'odds'      => $best_bid,
				'volume'    => $volume,
				'timestamp' => '',
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
		return 'polymarket';
	}
}
