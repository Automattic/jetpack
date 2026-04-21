<?php
/**
 * WP_REST_Content_Research_Search file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

/**
 * Class WP_REST_Content_Research_Search.
 *
 * Handles the /wpcom/v2/content-research/search endpoint.
 * Fans out to multiple external sources in parallel, normalizes results,
 * and returns an engagement-scored, unified response.
 */
class WP_REST_Content_Research_Search extends \WP_REST_Controller {

	/**
	 * WP_REST_Content_Research_Search constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'content-research/search';
	}

	/**
	 * Register available routes.
	 */
	public function register_rest_route() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'search' ),
				'permission_callback' => 'is_user_logged_in',
				'args'                => array(
					'topic'   => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'sources' => array(
						'type'    => 'array',
						'default' => array( 'hn', 'polymarket', 'reader', 'googlenews' ),
						'items'   => array(
							'type' => 'string',
						),
					),
					'count'   => array(
						'type'    => 'integer',
						'default' => 10,
					),
				),
			)
		);
	}

	/**
	 * Get all available source adapters.
	 *
	 * @return array<string, Content_Research_Source> Map of source name to adapter instance.
	 */
	private function get_sources(): array {
		return array(
			'reddit'     => new Source_Reddit(),
			'hn'         => new Source_HackerNews(),
			'polymarket' => new Source_Polymarket(),
			'reader'     => new Source_Reader(),
			'googlenews' => new Source_GoogleNews(),
		);
	}

	/**
	 * Calculate an engagement score for a result.
	 *
	 * @param array $result A normalized result item.
	 * @return float The engagement score.
	 */
	private function calculate_score( array $result ): float {
		$upvotes  = (float) ( $result['engagement']['upvotes'] ?? 0 );
		$comments = (float) ( $result['engagement']['comments'] ?? 0 );

		// Google News has no engagement data — score by recency.
		if ( 'googlenews' === $result['source'] ) {
			$timestamp = $result['timestamp'] ?? '';
			if ( $timestamp ) {
				$age_hours = ( time() - strtotime( $timestamp ) ) / 3600;
				// Newer articles score higher: 1.0 for just published, ~0 for 7+ days old.
				return max( 0, 1.0 - ( $age_hours / 168 ) );
			}
			return 0.5;
		}

		// Polymarket results scored by volume.
		if ( 'polymarket' === $result['source'] ) {
			$volume_str = $result['volume'] ?? '$0';
			// Parse "$66K" → 66000, "$500" → 500.
			$volume_str = str_replace( array( '$', ',' ), '', $volume_str );
			if ( stripos( $volume_str, 'K' ) !== false ) {
				return (float) str_replace( 'K', '', $volume_str ) * 1000;
			}
			return (float) $volume_str;
		}

		return $upvotes * 1.0 + $comments * 0.5;
	}

	/**
	 * Normalize scores per source so no single source dominates.
	 *
	 * @param array $results All results with raw scores.
	 * @return array Results with normalized scores.
	 */
	private function normalize_scores( array $results ): array {
		// Group by source and find max per source.
		$max_by_source = array();
		foreach ( $results as $result ) {
			$source = $result['source'];
			$score  = $result['_score'];
			if ( ! isset( $max_by_source[ $source ] ) || $score > $max_by_source[ $source ] ) {
				$max_by_source[ $source ] = $score;
			}
		}

		// Normalize each result's score to 0-1 range per source.
		foreach ( $results as &$result ) {
			$max = $max_by_source[ $result['source'] ] ?? 1;
			if ( $max > 0 ) {
				$result['_score'] = $result['_score'] / $max;
			}
		}
		unset( $result );

		return $results;
	}

	/**
	 * Search all sources and return unified results.
	 *
	 * @param \WP_REST_Request $request The incoming request.
	 * @return \WP_REST_Response
	 */
	public function search( \WP_REST_Request $request ) {
		$topic           = $request->get_param( 'topic' );
		$requested       = $request->get_param( 'sources' );
		$count           = $request->get_param( 'count' );
		$all_sources     = $this->get_sources();
		$sources_queried = array();
		$all_results     = array();

		foreach ( $all_sources as $name => $source ) {
			if ( ! in_array( $name, $requested, true ) ) {
				continue;
			}

			$sources_queried[] = $name;
			$source_results    = $source->search( $topic, $count );

			foreach ( $source_results as &$result ) {
				$result['_score'] = $this->calculate_score( $result );
			}
			unset( $result );

			$all_results = array_merge( $all_results, $source_results );
		}

		// Normalize and sort by engagement score.
		$all_results = $this->normalize_scores( $all_results );
		usort(
			$all_results,
			function ( $a, $b ) {
				return $b['_score'] <=> $a['_score'];
			}
		);

		// Remove internal score field from output.
		$all_results = array_map(
			function ( $result ) {
				unset( $result['_score'] );
				return $result;
			},
			$all_results
		);

		return rest_ensure_response(
			array(
				'results' => $all_results,
				'meta'    => array(
					'topic'           => $topic,
					'sources_queried' => $sources_queried,
					'total_results'   => count( $all_results ),
				),
			)
		);
	}
}
