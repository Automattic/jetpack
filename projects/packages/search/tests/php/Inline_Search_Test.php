<?php
/**
 * Inline Search test cases
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Inline_Search test cases
 */
class Inline_Search_Test extends TestCase {
	/**
	 * The most recent v1.3 search test request URL, including query string.
	 *
	 * @var string
	 */
	protected $last_search_url = '';

	/**
	 * Set up test filters to mock search HTTP requests.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();

		$this->last_search_url = '';
		add_filter( 'pre_http_request', array( $this, 'filter_pre_http_request_mock' ), 10, 3 );
		add_filter( 'jetpack_search_should_handle_query', array( $this, 'filter_jetpack_search_should_handle_query' ), 10 );
	}

	/**
	 * Clean up test filters.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
		parent::tearDown();

		$this->last_search_url = '';
		remove_filter( 'pre_http_request', array( $this, 'filter_pre_http_request_mock' ), 10 );
		remove_filter( 'jetpack_search_should_handle_query', array( $this, 'filter_jetpack_search_should_handle_query' ), 10 );
	}

	/**
	 * Mock pre_http_request filter to prevent the HTTP request and capture the most recent search URL.
	 *
	 * @param false|array|\WP_Error $preempt    A preemptive return value of an HTTP request. Default false.
	 * @param array                 $args       HTTP request arguments.
	 * @param string                $actual_url The request URL.
	 */
	public function filter_pre_http_request_mock( $preempt, array $args, string $actual_url ) {
		$this->last_search_url = $actual_url;

		return array(
			'headers'  => array(),
			'body'     => wp_json_encode(
				array(
					'total'   => 0,
					'results' => array(),
				)
			),
			'response' => array( 'code' => 200 ),
			'cookies'  => array(),
			'filename' => null,
		);
	}

	/**
	 * Forces handling search query during tests.
	 *
	 * Normally, Jetpack Search only handles global $wp_the_query queries, and ignores other calls.
	 *
	 * @return true
	 */
	public function filter_jetpack_search_should_handle_query() {
		return true;
	}

	/**
	 * Verify that the class is instantiable
	 */
	public function test_deprecated_jetpack_search_class() {
		$search = Inline_Search::instance();
		self::assertTrue( is_a( $search, 'Automattic\Jetpack\Search\Inline_Search' ) );
	}

	/**
	 * Return test data for search requests.
	 *
	 * @return array[]
	 */
	public static function data_provider(): array {
		return array(
			'hello_world'      => array(
				'wp_query_args'     => array(
					's'              => 'hello_world',
					'posts_per_page' => 5,
					'post_type'      => 'any',
				),
				'expected_api_args' => array(
					'size'   => 5,
					'from'   => 0,
					'fields' => array( 'post_id' ),
					'query'  => 'hello_world',
					'sort'   => 'score_recency',
					'langs'  => array( 'en_US' ),
					'filter' => array(
						'bool' => array(
							'must' => array(
								array(
									'terms' => array(
										'post_type' => array( 'post', 'page', 'attachment' ),
									),
								),
							),
						),
					),
				),
			),
			'only_posts'       => array(
				'wp_query_args'     => array(
					's'              => 'only search posts',
					'posts_per_page' => 5,
					'post_type'      => 'post',
				),
				'expected_api_args' => array(
					'size'   => 5,
					'from'   => 0,
					'fields' => array( 'post_id' ),
					'query'  => 'only search posts',
					'sort'   => 'score_recency',
					'langs'  => array( 'en_US' ),
					'filter' => array(
						'bool' => array(
							'must' => array(
								array(
									'terms' => array(
										'post_type' => array( 'post' ),
									),
								),
							),
						),
					),
				),
			),
			'sort_by_date_asc' => array(
				'wp_query_args'     => array(
					's'              => 'search by date descending',
					'posts_per_page' => 5,
					'post_type'      => 'post',
					'order'          => 'asc',
					'orderby'        => 'date',
				),
				'expected_api_args' => array(
					'size'   => 5,
					'from'   => 0,
					'fields' => array( 'post_id' ),
					'query'  => 'search by date descending',
					'sort'   => 'date_asc',
					'langs'  => array( 'en_US' ),
					'filter' => array(
						'bool' => array(
							'must' => array(
								array(
									'terms' => array(
										'post_type' => array( 'post' ),
									),
								),
							),
						),
					),
				),
			),
		);
	}

	/**
	 * Test setup_corrected_query_hooks
	 *
	 * This test verifies that the setup_corrected_query_hooks method correctly adds the necessary hooks to the WP_Query object.
	 */
	public function test_setup_corrected_query_hooks() {
		$search = Inline_Search::instance();

		// Create a mock WP_Query that is a main search query
		$query = $this->getMockBuilder( '\WP_Query' )
			->disableOriginalConstructor()
			->getMock();
		$query->method( 'is_search' )->willReturn( true );
		$query->method( 'is_main_query' )->willReturn( true );

		// Call the method we're testing
		$search->setup_corrected_query_hooks( $query );

		// Verify that both hooks were added
		$this->assertEquals(
			10,
			has_filter( 'get_search_query', array( $search, 'maybe_use_corrected_query' ) ),
			'get_search_query filter was not added correctly'
		);
	}

	/**
	 * Test maybe_use_corrected_query method
	 *
	 * This test verifies that maybe_use_corrected_query returns the corrected query
	 * only when both corrected_query and results exist in search_result.
	 */
	public function test_maybe_use_corrected_query() {
		$search         = Inline_Search::instance();
		$original_query = 'original search';

		// Use reflection to access protected property
		$reflection = new \ReflectionClass( get_class( $search ) );
		$property   = $reflection->getProperty( 'search_result' );
		$property->setAccessible( true );

		// Test when search_result is empty
		$property->setValue( $search, array() );
		$this->assertEquals(
			$original_query,
			$search->maybe_use_corrected_query( $original_query ),
			'Should return original query when search_result is empty'
		);

		// Test when corrected_query exists but no results
		$property->setValue(
			$search,
			array(
				'corrected_query' => 'corrected search',
				'results'         => array(),
			)
		);
		$this->assertEquals(
			$original_query,
			$search->maybe_use_corrected_query( $original_query ),
			'Should return original query when results is empty'
		);

		// Test when results exist but no corrected_query
		$property->setValue(
			$search,
			array(
				'results' => array( 'some result' ),
			)
		);
		$this->assertEquals(
			$original_query,
			$search->maybe_use_corrected_query( $original_query ),
			'Should return original query when corrected_query is not set'
		);

		// Test when both corrected_query and results exist
		$property->setValue(
			$search,
			array(
				'corrected_query' => 'corrected search',
				'results'         => array( 'some result' ),
			)
		);
		$this->assertEquals(
			'corrected search',
			$search->maybe_use_corrected_query( $original_query ),
			'Should return corrected query when both corrected_query and results exist'
		);
	}

	/**
	 * Test search request
	 *
	 * @dataProvider data_provider
	 *
	 * @param array $wp_query_args     Input, WP_Query arguments.
	 * @param array $expected_api_args Output, expected API arguments.
	 */
	public function test_search( array $wp_query_args, array $expected_api_args ) {
		$search = Inline_Search::instance( 0 );
		$search->do_search( new \WP_Query( $wp_query_args ) );
		$actual_api_args = array();
		parse_str( wp_parse_url( $this->last_search_url, PHP_URL_QUERY ), $actual_api_args );
		$this->assertEquals( $expected_api_args, $actual_api_args );
	}

	/**
	 * Test get_title_selectors method
	 */
	public function test_get_title_selectors() {
		$search = Inline_Search::instance();

		// Use reflection to access private method
		$reflection = new \ReflectionClass( get_class( $search ) );
		$method     = $reflection->getMethod( 'get_title_selectors' );
		$method->setAccessible( true );

		// Test default selectors
		$default_selectors = array(
			'.wp-block-query-title',
			'.page-title',
			'.archive-title',
		);
		$this->assertEquals(
			$default_selectors,
			$method->invoke( $search ),
			'Default selectors should match expected values'
		);

		// Test with filter
		add_filter(
			'jetpack_search_title_selectors',
			function () {
				return array( '.custom-title', '.my-title' );
			}
		);

		$this->assertEquals(
			array( '.custom-title', '.my-title' ),
			$method->invoke( $search ),
			'Filtered selectors should match custom values'
		);

		// Clean up
		remove_all_filters( 'jetpack_search_title_selectors' );
	}

	/**
	 * Test get_corrected_query_html method
	 */
	public function test_get_corrected_query_html() {
		$search = Inline_Search::instance();

		// Use reflection to access private method and protected property
		$reflection = new \ReflectionClass( get_class( $search ) );
		$method     = $reflection->getMethod( 'get_corrected_query_html' );
		$method->setAccessible( true );
		$property = $reflection->getProperty( 'search_result' );
		$property->setAccessible( true );

		// Test with no search query
		$this->assertSame(
			'',
			$method->invoke( $search ),
			'Should return empty string when no search query'
		);

		// Mock 's' parameter
		$_GET['s'] = 'originl speling';

		// Test with corrected query and results
		$property->setValue(
			$search,
			array(
				'corrected_query' => 'original spelling',
				'results'         => array( 'some result' ),
			)
		);

		$expected_html = sprintf(
			'<h2 class="jetpack-search-corrected-query">' . "\n" .
			'				%s<strong>%s</strong>' . "\n" .
			'				</h2>',
			esc_html__( 'Search term corrected from: ', 'jetpack-search-pkg' ),
			'originl speling'
		);

		$this->assertEquals(
			$expected_html,
			$method->invoke( $search ),
			'Should return correction notice when query is corrected with results'
		);

		// Test with corrected query but no results
		$property->setValue(
			$search,
			array(
				'corrected_query' => 'original spelling',
				'results'         => array(),
			)
		);

		$expected_html = sprintf(
			'<h2 class="jetpack-search-corrected-query">' . "\n" .
			'				%s<strong>%s</strong>' . "\n" .
			'				</h2>',
			esc_html__( 'No results found for: ', 'jetpack-search-pkg' ),
			'originl speling'
		);

		$this->assertEquals(
			$expected_html,
			$method->invoke( $search ),
			'Should return no results notice when query is corrected without results'
		);

		// Clean up
		unset( $_GET['s'] );
	}

	/**
	 * Test enqueue_corrected_query_script method
	 */
	public function test_enqueue_corrected_query_script() {
		$search = Inline_Search::instance();

		// Use reflection to access private method
		$reflection = new \ReflectionClass( get_class( $search ) );
		$method     = $reflection->getMethod( 'enqueue_corrected_query_script' );
		$method->setAccessible( true );

		// Test script enqueuing
		$html      = '<div>Test HTML</div>';
		$selectors = array( '.test-selector' );
		$method->invoke( $search, $html, $selectors );

		$this->assertTrue(
			wp_script_is( 'jetpack-search-inline-corrected-query', 'registered' ),
			'Script should be registered'
		);

		$this->assertTrue(
			wp_script_is( 'jetpack-search-inline-corrected-query', 'enqueued' ),
			'Script should be enqueued'
		);

		// Test localized data
		$data = wp_scripts()->get_data( 'jetpack-search-inline-corrected-query', 'data' );
		$this->assertStringContainsString(
			'JetpackSearchCorrectedQuery',
			$data,
			'Script data should be localized with correct object name'
		);
		$this->assertStringContainsString(
			'"html":"<div>Test HTML<\\/div>"',
			$data,
			'Script data should contain the HTML'
		);
		$this->assertStringContainsString(
			json_encode( $selectors ),
			$data,
			'Script data should contain the selectors'
		);
	}

	/**
	 * Test output_corrected_query_script method
	 */
	public function test_output_corrected_query_script() {
		$search = Inline_Search::instance();

		// Use reflection to access protected property
		$reflection = new \ReflectionClass( get_class( $search ) );
		$property   = $reflection->getProperty( 'search_result' );
		$property->setAccessible( true );

		// Test with no corrected query
		$property->setValue( $search, array() );
		ob_start();
		$search->output_corrected_query_script();
		$output = ob_get_clean();
		$this->assertEmpty( $output, 'Should output nothing when no corrected query exists' );

		// Test with corrected query
		$_GET['s'] = 'test query';
		$property->setValue(
			$search,
			array(
				'corrected_query' => 'corrected query',
				'results'         => array( 'some result' ),
			)
		);

		ob_start();
		$search->output_corrected_query_script();
		$output = ob_get_clean();

		$this->assertTrue(
			wp_script_is( 'jetpack-search-inline-corrected-query', 'enqueued' ),
			'Script should be enqueued when corrected query exists'
		);

		// Clean up
		unset( $_GET['s'] );
	}
}
