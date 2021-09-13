<?php
require dirname( __FILE__ ) . '/../../../../modules/infinite-scroll/infinity.php';

class WP_Test_The_Neverending_Home_Page extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();

		$this->infinite_scroll = new The_Neverending_Home_Page;
	}

	public function test_body_class() {
		$classes = $this->infinite_scroll->body_class();
		$this->assertContains( 'infinite-scroll', $classes );
		$this->assertContains( 'neverending', $classes );
	}

	/**
	 * Test posts_per_page method when $_REQUEST['query_args']['posts_per_page'] is set.
	 *
	 * @dataProvider get_posts_per_page_in_request_data
	 * @author fgiannar
	 * @covers The_Neverending_Home_Page
	 *
	 * @param mixed $posts_per_page_query_arg The $_REQUEST['query_args']['posts_per_page'] value.
	 * @param int   $expected The expected return value of the posts_per_page method.
	 */
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
	public function get_posts_per_page_in_request_data() {
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
