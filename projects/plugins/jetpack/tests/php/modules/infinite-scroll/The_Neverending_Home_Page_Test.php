<?php

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
require __DIR__ . '/../../../../modules/infinite-scroll/infinity.php';

/**
 * Tests for The_Neverending_Home_Page.
 *
 * @covers The_Neverending_Home_Page
 */
#[CoversClass( The_Neverending_Home_Page::class )]
class The_Neverending_Home_Page_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	private $infinite_scroll;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		$this->infinite_scroll = new The_Neverending_Home_Page();
	}

	public function test_body_class() {
		$classes = $this->infinite_scroll->body_class();
		$this->assertStringContainsString( 'infinite-scroll', $classes );
		$this->assertStringContainsString( 'neverending', $classes );
	}

	/**
	 * A post type the request asks for is only merged into the query when it is
	 * viewable on the front end.
	 *
	 * @dataProvider get_injected_post_type_data
	 *
	 * @param mixed $requested_post_type The $_REQUEST['query_args']['post_type'] value.
	 * @param mixed $expected            The post_type the query should end up running with.
	 */
	#[DataProvider( 'get_injected_post_type_data' )]
	public function test_inject_query_args_post_type( $requested_post_type, $expected ) {
		register_post_type(
			'jptest_private',
			array(
				'public'             => false,
				'publicly_queryable' => false,
			)
		);
		register_post_type(
			'jptest_public',
			array(
				'public'             => true,
				'publicly_queryable' => true,
			)
		);

		$_REQUEST['query_args'] = array( 'post_type' => $requested_post_type );

		$query_args = $this->infinite_scroll->inject_query_args( array( 'post_type' => 'post' ) );

		$this->assertSame( $expected, $query_args['post_type'] );

		unset( $_REQUEST['query_args'] );
		unregister_post_type( 'jptest_private' );
		unregister_post_type( 'jptest_public' );
	}

	/**
	 * Gets the test data for test_inject_query_args_post_type().
	 *
	 * @return array The test data.
	 */
	public static function get_injected_post_type_data() {
		return array(
			'builtin public post type'       => array( 'page', 'page' ),
			'registered public post type'    => array( 'jptest_public', 'jptest_public' ),
			'any'                            => array( 'any', 'any' ),
			'non-viewable post type'         => array( 'jptest_private', 'post' ),
			'unregistered post type'         => array( 'no_such_type', 'post' ),
			'array with a non-viewable type' => array( array( 'jptest_public', 'jptest_private' ), 'post' ),
		);
	}

	/**
	 * Test posts_per_page method when $_REQUEST['query_args']['posts_per_page'] is set.
	 *
	 * @dataProvider get_posts_per_page_in_request_data
	 * @author fgiannar
	 *
	 * @param mixed $posts_per_page_query_arg The $_REQUEST['query_args']['posts_per_page'] value.
	 * @param int   $expected The expected return value of the posts_per_page method.
	 */
	#[DataProvider( 'get_posts_per_page_in_request_data' )]
	public function test_max_posts_per_page_in_request( $posts_per_page_query_arg, $expected ) {
		$_REQUEST['query_args']['posts_per_page'] = $posts_per_page_query_arg;

		$posts_per_page = The_Neverending_Home_Page::posts_per_page();
		$this->assertSame( $expected, $posts_per_page );
	}

	/**
	 * Gets the test data for test_max_posts_per_page_in_request().
	 *
	 * @return array The test data.
	 */
	public static function get_posts_per_page_in_request_data() {
		$posts_per_page_limit       = The_Neverending_Home_Page::MAX_ALLOWED_POSTS_PER_PAGE_ΙΝ_REQUEST;
		$posts_per_page_under_limit = The_Neverending_Home_Page::MAX_ALLOWED_POSTS_PER_PAGE_ΙΝ_REQUEST - 1;
		$posts_per_page_over_limit  = The_Neverending_Home_Page::MAX_ALLOWED_POSTS_PER_PAGE_ΙΝ_REQUEST + 1;
		$default_posts_per_page     = (int) The_Neverending_Home_Page::get_settings()->posts_per_page;

		return array(
			'posts_per_page_under_allowed_limit' => array(
				$posts_per_page_under_limit,
				$posts_per_page_under_limit,
			),
			'posts_per_page_edge_allowed_limit'  => array(
				$posts_per_page_limit,
				$posts_per_page_limit,
			),
			'posts_per_page_over_allowed_limit'  => array(
				$posts_per_page_over_limit,
				$default_posts_per_page,
			),
			'posts_per_page_numeric'             => array(
				'100',
				100,
			),
			'posts_per_page_not_numeric'         => array(
				'not-numeric',
				$default_posts_per_page,
			),
			'posts_per_page_not_an_integer'      => array(
				10.5,
				10,
			),
			'posts_per_page_negative'            => array(
				-100,
				$default_posts_per_page,
			),
		);
	}
}
