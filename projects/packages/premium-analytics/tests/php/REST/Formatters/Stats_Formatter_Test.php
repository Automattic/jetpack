<?php
/**
 * Tests for Stats_Formatter.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST\Formatters;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_REST_Request;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\REST\Formatters\Stats_Formatter
 * @covers \Automattic\Jetpack\PremiumAnalytics\REST\Formatters\Leaderboard_Formatter
 */
#[CoversClass( Stats_Formatter::class )]
#[CoversClass( Leaderboard_Formatter::class )]
class Stats_Formatter_Test extends BaseTestCase {

	/**
	 * Formatter under test.
	 *
	 * @var Stats_Formatter
	 */
	private $formatter;

	/**
	 * Set up the formatter.
	 */
	public function set_up() {
		parent::set_up();
		$this->formatter = new Stats_Formatter();
	}

	public function test_maps_summary_postviews_to_leaderboard_entries() {
		$raw    = $this->top_posts_body(
			array(
				$this->postview( '11', 'Home', 90, 'page', 'https://ex.test/' ),
				$this->postview( '22', 'About', 30, 'page', 'https://ex.test/about' ),
			)
		);
		$result = $this->formatter->format(
			$raw,
			$this->request(
				'stats/top-posts',
				array(
					'period' => 'day',
					'date'   => '2026-06-15',
				)
			)
		);

		$this->assertCount( 2, $result['data'] );

		$first = $result['data'][0];
		$this->assertSame( '11', $first['id'] );
		$this->assertSame( 'Home', $first['label'] );
		$this->assertSame( 90, $first['value'] );
		$this->assertSame( 0, $first['previous_value'] );
		$this->assertSame( 0, $first['previous_share'] );
		$this->assertSame( 0, $first['delta'] );
		$this->assertSame(
			array(
				'href' => 'https://ex.test/',
				'type' => 'page',
			),
			$first['meta']
		);

		$this->assertSame(
			array(
				'period' => 'day',
				'date'   => '2026-06-15',
				'total'  => 120,
				'count'  => 2,
			),
			$result['meta']
		);
	}

	public function test_current_share_is_relative_to_the_top_value() {
		$raw    = $this->top_posts_body(
			array(
				$this->postview( '1', 'Top', 200, 'post' ),
				$this->postview( '2', 'Half', 100, 'post' ),
			)
		);
		$result = $this->formatter->format( $raw, $this->request( 'stats/top-posts' ) );

		$this->assertSame( 100.0, $result['data'][0]['current_share'] );
		$this->assertSame( 50.0, $result['data'][1]['current_share'] );
	}

	public function test_ranks_entries_by_value_descending() {
		$raw    = $this->top_posts_body(
			array(
				$this->postview( '1', 'Low', 5, 'post' ),
				$this->postview( '2', 'High', 50, 'post' ),
				$this->postview( '3', 'Mid', 20, 'post' ),
			)
		);
		$result = $this->formatter->format( $raw, $this->request( 'stats/top-posts' ) );

		$this->assertSame( array( 'High', 'Mid', 'Low' ), array_column( $result['data'], 'label' ) );
	}

	public function test_name_param_filters_on_type_and_rescopes_the_share_denominator() {
		$raw    = $this->top_posts_body(
			array(
				$this->postview( '1', 'Big page', 100, 'page' ),
				$this->postview( '2', 'Top post', 40, 'post' ),
				$this->postview( '3', 'Small post', 10, 'post' ),
			)
		);
		$result = $this->formatter->format(
			$raw,
			$this->request( 'stats/top-posts', array( 'name' => 'post' ) )
		);

		$this->assertSame( array( 'Top post', 'Small post' ), array_column( $result['data'], 'label' ) );
		// Share is over the filtered max (40), not the unfiltered page (100).
		$this->assertSame( 100.0, $result['data'][0]['current_share'] );
		$this->assertSame( 25.0, $result['data'][1]['current_share'] );
		$this->assertSame( 50, $result['meta']['total'] );
	}

	public function test_name_param_accepts_a_comma_separated_list() {
		$raw    = $this->top_posts_body(
			array(
				$this->postview( '1', 'A page', 10, 'page' ),
				$this->postview( '2', 'A post', 20, 'post' ),
				$this->postview( '3', 'A product', 5, 'product' ),
			)
		);
		$result = $this->formatter->format(
			$raw,
			$this->request( 'stats/top-posts', array( 'name' => 'post,page' ) )
		);

		$this->assertSame( array( 'A post', 'A page' ), array_column( $result['data'], 'label' ) );
	}

	public function test_days_shaped_body_yields_empty_data_and_zeroed_meta() {
		$raw = array(
			'date' => '2026-06-15',
			'days' => array(
				'2026-06-15' => array(
					'postviews'   => array( $this->postview( '1', 'Ignored', 10, 'post' ) ),
					'total_views' => 10,
				),
			),
		);

		$result = $this->formatter->format(
			$raw,
			$this->request(
				'stats/top-posts',
				array(
					'period' => 'day',
					'date'   => '2026-06-15',
				)
			)
		);

		$this->assertSame( array(), $result['data'] );
		$this->assertSame(
			array(
				'period' => 'day',
				'date'   => '2026-06-15',
				'total'  => 0,
				'count'  => 0,
			),
			$result['meta']
		);
	}

	public function test_empty_summary_bucket_yields_empty_leaderboard() {
		$result = $this->formatter->format( $this->top_posts_body( array() ), $this->request( 'stats/top-posts' ) );

		$this->assertSame( array(), $result['data'] );
		$this->assertSame( 0, $result['meta']['total'] );
		$this->assertSame( 0, $result['meta']['count'] );
	}

	public function test_unconfigured_resource_passes_the_body_through_unchanged() {
		$raw = array(
			'fields' => array( 'views' ),
			'data'   => array( array( '2026-06-15', 5 ) ),
		);

		$result = $this->formatter->format( $raw, $this->request( 'stats/visits' ) );

		$this->assertSame( $raw, $result );
	}

	public function test_upstream_params_injects_summarize_for_top_posts() {
		$this->assertSame(
			array( 'summarize' => true ),
			$this->formatter->upstream_params( $this->request( 'stats/top-posts' ) )
		);
	}

	public function test_upstream_params_is_empty_for_an_unconfigured_resource() {
		$this->assertSame( array(), $this->formatter->upstream_params( $this->request( 'stats/visits' ) ) );
	}

	/**
	 * A WPCOM top-posts body wrapping the given postviews in a `summary` bucket.
	 *
	 * @param array $postviews Postview item rows.
	 *
	 * @return array
	 */
	private function top_posts_body( array $postviews ): array {
		$total = 0;
		foreach ( $postviews as $item ) {
			$total += $item['views'];
		}

		return array(
			'date'    => '2026-06-15',
			'summary' => array(
				'postviews'   => $postviews,
				'total_views' => $total,
			),
		);
	}

	/**
	 * Build a single WPCOM postview item.
	 *
	 * @param string $id    Post id.
	 * @param string $title Post title.
	 * @param int    $views View count.
	 * @param string $type  Post type.
	 * @param string $href  Post URL.
	 *
	 * @return array
	 */
	private function postview( string $id, string $title, int $views, string $type, string $href = 'https://ex.test/p' ): array {
		return array(
			'id'     => $id,
			'href'   => $href,
			'date'   => '2026-06-10',
			'title'  => $title,
			'type'   => $type,
			'views'  => $views,
			'public' => true,
		);
	}

	/**
	 * Build a proxy request with the endpoint capture and query params set.
	 *
	 * @param string $endpoint Analytics endpoint.
	 * @param array  $params   Query params.
	 *
	 * @return WP_REST_Request
	 */
	private function request( string $endpoint, array $params = array() ): WP_REST_Request {
		$request = new WP_REST_Request( 'GET', '/jetpack-premium-analytics/v1/proxy/' . $endpoint );
		// Set query params before the endpoint capture: set_query_params() replaces
		// the GET bag, which would otherwise drop a previously-set endpoint param.
		$request->set_query_params( $params );
		$request->set_param( 'endpoint', $endpoint );

		return $request;
	}
}
