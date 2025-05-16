<?php
/**
 * Inline Search filters test cases
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Inline Search test cases verifying filters
 */
class Inline_Search_Filters_Test extends TestCase {
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
		add_filter(
			'jetpack_search_should_handle_query',
			array(
				$this,
				'filter_jetpack_search_should_handle_query',
			),
			10
		);
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
		remove_filter(
			'jetpack_search_should_handle_query',
			array(
				$this,
				'filter_jetpack_search_should_handle_query',
			),
			10
		);
	}

	/**
	 * Mock pre_http_request filter to prevent the HTTP request and capture the most recent search URL.
	 *
	 * @param false|array|\WP_Error $preempt A preemptive return value of an HTTP request. Default false.
	 * @param array                 $args HTTP request arguments.
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
	 * Return test data for search requests.
	 *
	 * @return array[]
	 */
	public static function data_provider_es_query_args_filter(): array {
		return array(
			'exclude_by_tags'     => array(
				'wp_query_args'     => array(
					's'              => 'hello_world',
					'posts_per_page' => 5,
					'post_type'      => 'any',
				),
				'es_q_args_filter'  => function ( $es_query_args ) {
					$es_query_args['query'] = array(
						'bool' => array(
							'must'     => array( $es_query_args['query'] ),
							'must_not' => array(
								array( 'term' => array( 'tag.slug' => 'exclude_me' ) ),
							),
						),
					);

					return $es_query_args;
				},
				'expected_api_args' => array(
					'size'             => '5',
					'from'             => '0',
					'fields'           => array( 'post_id' ),
					'query'            => 'hello_world',
					'sort'             => 'score_recency',
					'langs'            => array( 'en_US' ),
					'filter'           => array(
						'bool' => array(
							'must_not' => array(
								array(
									'term' => array(
										'tag.slug' => 'exclude_me',
									),
								),
							),
							'filter'   => array(
								array(
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
					),
					'highlight_fields' => array( 'title', 'content', 'comments' ),
					'highlight'        => array(
						'fields' => array( 'title', 'content', 'comments' ),
					),
				),
			),
			'multiple_exclusions' => array(
				'wp_query_args'     => array(
					's'              => 'hello_world',
					'posts_per_page' => 5,
					'post_type'      => 'any',
				),
				'es_q_args_filter'  => function ( $es_query_args ) {
					$es_query_args['query'] = array(
						'bool' => array(
							'must'     => array( $es_query_args['query'] ),
							'must_not' => array(
								array( 'terms' => array( 'post_id' => array( 3, 4, 5 ) ) ),
								array( 'term' => array( 'category.slug' => 'exclude_me' ) ),
								array( 'term' => array( 'tag.slug' => 'exclude_me' ) ),
							),
						),
					);

					return $es_query_args;
				},
				'expected_api_args' => array(
					'size'             => '5',
					'from'             => '0',
					'fields'           => array( 'post_id' ),
					'query'            => 'hello_world',
					'sort'             => 'score_recency',
					'langs'            => array( 'en_US' ),
					'filter'           => array(
						'bool' => array(
							'must_not' => array(
								array( 'terms' => array( 'post_id' => array( '3', '4', '5' ) ) ),
								array( 'term' => array( 'category.slug' => 'exclude_me' ) ),
								array( 'term' => array( 'tag.slug' => 'exclude_me' ) ),
							),
							'filter'   => array(
								array(
									'bool' => array(
										'must' => array(
											array(
												'terms' => array(
													'post_type' => array(
														'post',
														'page',
														'attachment',
													),
												),
											),
										),
									),
								),
							),
						),
					),
					'highlight_fields' => array( 'title', 'content', 'comments' ),
					'highlight'        => array(
						'fields' => array( 'title', 'content', 'comments' ),
					),
				),
			),
			'filter_to_category'  => array(
				'wp_query_args'     => array(
					's'              => 'hello_world',
					'posts_per_page' => 5,
					'post_type'      => 'any',
				),
				'es_q_args_filter'  => function ( $es_query_args ) {
					$es_query_args['query'] = array(
						'bool' => array(
							'must'   => array( $es_query_args['query'] ),
							'filter' => array(
								array( 'terms' => array( 'category.slug' => array( 'include_me1', 'include_me2' ) ) ),
							),
						),
					);

					return $es_query_args;
				},
				'expected_api_args' => array(
					'size'             => '5',
					'from'             => '0',
					'fields'           => array( 'post_id' ),
					'query'            => 'hello_world',
					'sort'             => 'score_recency',
					'langs'            => array( 'en_US' ),
					'filter'           => array(
						'bool' => array(
							'filter' => array(
								array( 'terms' => array( 'category.slug' => array( 'include_me1', 'include_me2' ) ) ),
								array(
									'bool' => array(
										'must' => array(
											array(
												'terms' => array(
													'post_type' => array(
														'post',
														'page',
														'attachment',
													),
												),
											),
										),
									),
								),
							),
						),
					),
					'highlight_fields' => array( 'title', 'content', 'comments' ),
					'highlight'        => array(
						'fields' => array( 'title', 'content', 'comments' ),
					),
				),
			),
		);
	}

	/**
	 * Test search request
	 *
	 * @dataProvider data_provider_es_query_args_filter
	 *
	 * @param array    $wp_query_args Input, WP_Query arguments.
	 * @param callable $es_q_args_filter Filter function to be applied.
	 * @param array    $expected_api_args Output, expected API arguments.
	 */
	#[DataProvider( 'data_provider_es_query_args_filter' )]
	public function test_jetpack_search_es_query_args_filter( array $wp_query_args, callable $es_q_args_filter, array $expected_api_args ) {
		$search = Inline_Search::instance( 0 );
		add_filter( 'jetpack_search_es_query_args', $es_q_args_filter );
		try {
			$search->do_search( new \WP_Query( $wp_query_args ) );
		} finally {
			remove_filter( 'jetpack_search_es_query_args', $es_q_args_filter );
		}
		$actual_api_args = array();
		parse_str( wp_parse_url( $this->last_search_url, PHP_URL_QUERY ), $actual_api_args );
		$this->assertEquals( $expected_api_args, $actual_api_args );
	}

	/**
	 * Return test data for search requests.
	 *
	 * @return array[]
	 */
	public static function data_provider_instant_search_options_filter(): array {
		return array(
			'additional_should'   => array(
				'wp_query_args'     => array(
					's'              => 'hello_world',
					'posts_per_page' => 5,
					'post_type'      => 'any',
				),
				'is_opt_filter'     => function ( $options ) {
					$options['adminQueryFilter'] = array(
						'bool' => array(
							'should' => array(
								array( 'term' => array( 'post_type' => 'product' ) ),
								array( 'term' => array( 'post_type' => 'page' ) ),
							),
						),
					);

					return $options;
				},
				'expected_api_args' => array(
					'size'             => '5',
					'from'             => '0',
					'fields'           => array( 'post_id' ),
					'query'            => 'hello_world',
					'sort'             => 'score_recency',
					'langs'            => array( 'en_US' ),
					'filter'           => array(
						'bool' => array(
							'filter' => array(
								'bool' => array(
									'must' => array(
										array(
											'terms' => array(
												'post_type' => array(
													'post',
													'page',
													'attachment',
												),
											),
										),
									),
								),
							),
							'must'   => array(
								'bool' => array(
									'should' => array(
										array( 'term' => array( 'post_type' => 'product' ) ),
										array( 'term' => array( 'post_type' => 'page' ) ),
									),
								),
							),
						),
					),
					'highlight_fields' => array( 'title', 'content', 'comments' ),
					'highlight'        => array(
						'fields' => array( 'title', 'content', 'comments' ),
					),
				),
			),
			'additional_must_not' => array(
				'wp_query_args'     => array(
					's'              => 'hello_world',
					'posts_per_page' => 5,
					'post_type'      => 'any',
				),
				'is_opt_filter'     => function ( $options ) {
					$options['adminQueryFilter'] = array(
						'bool' => array(
							'must_not' => array(
								array( 'term' => array( 'category.slug' => 'removeme' ) ),
							),
						),
					);

					return $options;
				},
				'expected_api_args' => array(
					'size'             => '5',
					'from'             => '0',
					'fields'           => array( 'post_id' ),
					'query'            => 'hello_world',
					'sort'             => 'score_recency',
					'langs'            => array( 'en_US' ),
					'filter'           => array(
						'bool' => array(
							'filter' => array(
								'bool' => array(
									'must' => array(
										array(
											'terms' => array(
												'post_type' => array(
													'post',
													'page',
													'attachment',
												),
											),
										),
									),
								),
							),
							'must'   => array(
								'bool' => array(
									'must_not' => array(
										array( 'term' => array( 'category.slug' => 'removeme' ) ),
									),
								),
							),
						),
					),
					'highlight_fields' => array( 'title', 'content', 'comments' ),
					'highlight'        => array(
						'fields' => array( 'title', 'content', 'comments' ),
					),
				),
			),
		);
	}

	/**
	 * Test search request
	 *
	 * @dataProvider data_provider_instant_search_options_filter
	 *
	 * @param array    $wp_query_args Input, WP_Query arguments.
	 * @param callable $is_opt_filter Filter function to be applied.
	 * @param array    $expected_api_args Output, expected API arguments.
	 */
	#[DataProvider( 'data_provider_instant_search_options_filter' )]
	public function test_instant_search_options_filter( array $wp_query_args, callable $is_opt_filter, array $expected_api_args ) {
		$search = Inline_Search::instance( 0 );
		add_filter( 'jetpack_instant_search_options', $is_opt_filter );
		try {
			$search->do_search( new \WP_Query( $wp_query_args ) );
		} finally {
			remove_filter( 'jetpack_instant_search_options', $is_opt_filter );
		}
		$actual_api_args = array();
		parse_str( wp_parse_url( $this->last_search_url, PHP_URL_QUERY ), $actual_api_args );
		$this->assertEquals( $expected_api_args, $actual_api_args );
	}
}
