<?php
require dirname( __FILE__ ) . '/../../../../modules/infinite-scroll/infinity.php';

class WP_Test_The_Neverending_Home_Page extends WP_UnitTestCase {

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		$this->infinite_scroll = new The_Neverending_Home_Page;
	}

	public function test_body_class() {
		$classes = $this->infinite_scroll->body_class();
		$this->assertStringContainsString( 'infinite-scroll', $classes );
		$this->assertStringContainsString( 'neverending', $classes );
	}

	/**
	 * Test posts_per_page method when $_REQUEST['query_args']['posts_per_page'] is set.
	 *
	 * @dataProvider get_posts_per_page_in_request_data
	 * @author fgiannar
	 * @covers ::posts_per_page
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

	/**
	 *  Test to verify allowed_query_vars method which is used to combine the public and
	 *  private query vars using array_merge function adds all the array values instead of
	 *  replacing them.
	 */
	public function test_infinite_scroll_allowed_query_vars_combined_output() {
		global $wp;
		$expected_vars      = array();
		$public_query_vars  = $wp->public_query_vars;
		$private_query_vars = $wp->private_query_vars;
		$taxanomy_vars      = $this->infinite_scroll->get_taxonomy_vars();

		$expected_vars = array_merge( $public_query_vars, $private_query_vars, $taxanomy_vars, $expected_vars );

		foreach ( array_keys( $expected_vars, 'paged', true ) as $key ) {
			unset( $expected_vars[ $key ] );
		}

		$expected_vars = array_unique( $expected_vars );

		$actual_allowed_vars = apply_filters( 'infinite_scroll_allowed_vars', array() );
		$this->assertSame( $expected_vars, $actual_allowed_vars );
	}
}
