<?php
/**
 * Inline Search test cases
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\Attributes\DataProvider;
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
	 * Test search request
	 *
	 * @dataProvider data_provider
	 *
	 * @param array $wp_query_args     Input, WP_Query arguments.
	 * @param array $expected_api_args Output, expected API arguments.
	 */
	#[DataProvider( 'data_provider' )]
	public function test_search( array $wp_query_args, array $expected_api_args ) {
		$search = Inline_Search::instance( 0 );
		$search->do_search( new \WP_Query( $wp_query_args ) );
		$actual_api_args = array();
		parse_str( wp_parse_url( $this->last_search_url, PHP_URL_QUERY ), $actual_api_args );
		$this->assertEquals( $expected_api_args, $actual_api_args );
	}
}
