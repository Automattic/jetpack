<?php
/**
 * Tests for WP_REST_Content_Research_Search.
 *
 * @package automattic/jetpack-mu-wpcom
 */

// phpcs:disable WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
$pkg_dir = \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR;
require_once $pkg_dir . 'src/features/content-research/interface-content-research-source.php';
require_once $pkg_dir . 'src/features/content-research/class-source-hackernews.php';
require_once $pkg_dir . 'src/features/content-research/class-source-reader.php';
require_once $pkg_dir . 'src/features/content-research/class-source-googlenews.php';
require_once $pkg_dir . 'src/features/content-research/class-wp-rest-content-research-search.php';
// phpcs:enable WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath

use A8C\FSE\WP_REST_Content_Research_Search;

/**
 * Test class for WP_REST_Content_Research_Search.
 *
 * Covers permission handling, engagement scoring, normalization, and recency boost.
 */
class Content_Research_Search_Test extends \WorDBless\BaseTestCase {

	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Controller instance for Reflection-based tests.
	 *
	 * @var WP_REST_Content_Research_Search
	 */
	private $controller;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();
		\Brain\Monkey\setUp();

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'cr_search_user',
				'user_pass'  => 'cr_search_pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( 0 );

		$this->controller = new WP_REST_Content_Research_Search();
		$this->controller->register_rest_route();

		do_action( 'rest_api_init' );
	}

	/**
	 * Tear down test fixtures.
	 */
	public function tear_down() {
		\Brain\Monkey\tearDown();
		parent::tear_down();
	}

	// ── Permission handling ────────────────────────────────────────────

	/**
	 * Unauthenticated requests should be rejected with 401.
	 */
	public function test_search_rejects_unauthenticated_request() {
		$request = new \WP_REST_Request( 'POST', '/wpcom/v2/content-research/search' );
		$request->set_param( 'topic', 'test' );
		$result = rest_do_request( $request );

		$this->assertSame( 401, $result->get_status() );
	}

	// ── Engagement scoring ────────────────────────────────────────────

	/**
	 * HN/Reader results score by upvotes * 1.0 + comments * 0.5.
	 */
	public function test_calculate_score_hn_engagement() {
		$method = $this->get_private_method( 'calculate_score' );

		$result = array(
			'source'     => 'hn',
			'engagement' => array(
				'upvotes'  => 100,
				'comments' => 50,
			),
		);

		$score = $method->invoke( $this->controller, $result );
		// 100 * 1.0 + 50 * 0.5 = 125.0
		$this->assertSame( 125.0, $score );
	}

	/**
	 * Reader engagement scoring uses the same formula as HN.
	 */
	public function test_calculate_score_reader_engagement() {
		$method = $this->get_private_method( 'calculate_score' );

		$result = array(
			'source'     => 'reader',
			'engagement' => array(
				'upvotes'  => 20,
				'comments' => 10,
			),
		);

		$score = $method->invoke( $this->controller, $result );
		// 20 * 1.0 + 10 * 0.5 = 25.0
		$this->assertSame( 25.0, $score );
	}

	/**
	 * Google News scores by recency: ~1.0 for just published, ~0 for 7+ days.
	 */
	public function test_calculate_score_googlenews_recency() {
		$method = $this->get_private_method( 'calculate_score' );

		// Just published.
		$result = array(
			'source'     => 'googlenews',
			'timestamp'  => gmdate( 'Y-m-d\TH:i:s\Z' ),
			'engagement' => array(),
		);
		$score  = $method->invoke( $this->controller, $result );
		$this->assertEqualsWithDelta( 1.0, $score, 0.01 );

		// 7 days old.
		$result['timestamp'] = gmdate( 'Y-m-d\TH:i:s\Z', time() - 7 * DAY_IN_SECONDS );
		$score               = $method->invoke( $this->controller, $result );
		$this->assertEqualsWithDelta( 0.0, $score, 0.02 );
	}

	/**
	 * Future timestamps in Google News results are clamped to now (score ~1.0).
	 */
	public function test_calculate_score_googlenews_future_timestamp_clamped() {
		$method = $this->get_private_method( 'calculate_score' );

		$result = array(
			'source'     => 'googlenews',
			'timestamp'  => gmdate( 'Y-m-d\TH:i:s\Z', time() + 3600 ),
			'engagement' => array(),
		);
		$score  = $method->invoke( $this->controller, $result );
		$this->assertEqualsWithDelta( 1.0, $score, 0.01 );
	}

	/**
	 * Google News results without a timestamp get a default score of 0.5.
	 */
	public function test_calculate_score_googlenews_no_timestamp() {
		$method = $this->get_private_method( 'calculate_score' );

		$result = array(
			'source'     => 'googlenews',
			'engagement' => array(),
		);
		$score  = $method->invoke( $this->controller, $result );
		$this->assertSame( 0.5, $score );
	}

	/**
	 * Zero engagement results in zero score.
	 */
	public function test_calculate_score_zero_engagement() {
		$method = $this->get_private_method( 'calculate_score' );

		$result = array(
			'source'     => 'hn',
			'engagement' => array(
				'upvotes'  => 0,
				'comments' => 0,
			),
		);
		$score  = $method->invoke( $this->controller, $result );
		$this->assertSame( 0.0, $score );
	}

	// ── Score normalization ───────────────────────────────────────────

	/**
	 * Scores are normalized per source to the 0-1 range.
	 */
	public function test_normalize_scores_per_source() {
		$method = $this->get_private_method( 'normalize_scores' );

		$results = array(
			array(
				'source' => 'hn',
				'_score' => 200.0,
			),
			array(
				'source' => 'hn',
				'_score' => 100.0,
			),
			array(
				'source' => 'reader',
				'_score' => 50.0,
			),
			array(
				'source' => 'reader',
				'_score' => 25.0,
			),
		);

		$normalized = $method->invoke( $this->controller, $results );

		// HN: 200/200 = 1.0, 100/200 = 0.5
		$this->assertEqualsWithDelta( 1.0, $normalized[0]['_score'], 0.001 );
		$this->assertEqualsWithDelta( 0.5, $normalized[1]['_score'], 0.001 );

		// Reader: 50/50 = 1.0, 25/50 = 0.5
		$this->assertEqualsWithDelta( 1.0, $normalized[2]['_score'], 0.001 );
		$this->assertEqualsWithDelta( 0.5, $normalized[3]['_score'], 0.001 );
	}

	/**
	 * A single result per source normalizes to 1.0.
	 */
	public function test_normalize_scores_single_result_per_source() {
		$method = $this->get_private_method( 'normalize_scores' );

		$results = array(
			array(
				'source' => 'hn',
				'_score' => 42.0,
			),
		);

		$normalized = $method->invoke( $this->controller, $results );
		$this->assertEqualsWithDelta( 1.0, $normalized[0]['_score'], 0.001 );
	}

	// ── Recency boost ─────────────────────────────────────────────────

	/**
	 * Brand-new items get ~2x boost, 30-day-old items ~1x, older items 0.5x.
	 */
	public function test_apply_recency_boost() {
		$method = $this->get_private_method( 'apply_recency_boost' );

		$results = array(
			// Brand new: ~2x boost.
			array(
				'_score'    => 1.0,
				'timestamp' => gmdate( 'Y-m-d\TH:i:s\Z' ),
			),
			// 30 days old: ~1x (no boost).
			array(
				'_score'    => 1.0,
				'timestamp' => gmdate( 'Y-m-d\TH:i:s\Z', time() - 30 * DAY_IN_SECONDS ),
			),
			// 60 days old: 0.5x penalty.
			array(
				'_score'    => 1.0,
				'timestamp' => gmdate( 'Y-m-d\TH:i:s\Z', time() - 60 * DAY_IN_SECONDS ),
			),
		);

		$boosted = $method->invoke( $this->controller, $results );

		$this->assertEqualsWithDelta( 2.0, $boosted[0]['_score'], 0.05 );
		$this->assertEqualsWithDelta( 1.0, $boosted[1]['_score'], 0.05 );
		$this->assertEqualsWithDelta( 0.5, $boosted[2]['_score'], 0.001 );
	}

	/**
	 * Items without a timestamp keep their original score.
	 */
	public function test_apply_recency_boost_no_timestamp() {
		$method = $this->get_private_method( 'apply_recency_boost' );

		$results = array(
			array( '_score' => 1.0 ),
		);

		$boosted = $method->invoke( $this->controller, $results );
		$this->assertSame( 1.0, $boosted[0]['_score'] );
	}

	/**
	 * Future timestamps are clamped to age 0 (maximum boost).
	 */
	public function test_apply_recency_boost_future_timestamp_clamped() {
		$method = $this->get_private_method( 'apply_recency_boost' );

		$results = array(
			array(
				'_score'    => 1.0,
				'timestamp' => gmdate( 'Y-m-d\TH:i:s\Z', time() + 3600 ),
			),
		);

		$boosted = $method->invoke( $this->controller, $results );
		// max(0, now - future) = 0 => freshness = 1.0 => score = 1.0 * (1.0 + 1.0) = 2.0
		$this->assertEqualsWithDelta( 2.0, $boosted[0]['_score'], 0.05 );
	}

	// ── Helper ────────────────────────────────────────────────────────

	/**
	 * Get a private method via Reflection and make it accessible.
	 *
	 * @param string $method_name The method name.
	 * @return \ReflectionMethod
	 */
	private function get_private_method( string $method_name ): \ReflectionMethod {
		$method = new \ReflectionMethod( WP_REST_Content_Research_Search::class, $method_name );
		$method->setAccessible( true );
		return $method;
	}
}
