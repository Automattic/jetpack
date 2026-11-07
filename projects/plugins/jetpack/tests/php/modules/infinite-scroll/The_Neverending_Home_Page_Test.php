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

	public function test_get_new_styles_returns_only_new_non_empty_styles_and_restores_concatenation() {
		$wp_styles = new WP_Styles();
		$wp_styles->add( 'is-inlined', false );
		$wp_styles->add_inline_style( 'is-inlined', '.is-inlined-test{color:red}' );
		$wp_styles->add( 'is-linked', 'https://example.org/is-linked.css', array(), '1.0' );
		$wp_styles->add( 'is-new-linked', 'https://example.org/is-new-linked.css', array(), '2.0', 'print' );
		$wp_styles->add( 'is-empty', false );
		$wp_styles->done      = array( 'is-inlined', 'is-linked', 'is-new-linked', 'is-empty', 'is-unregistered' );
		$wp_styles->do_concat = true;

		$styles = The_Neverending_Home_Page::get_new_styles( $wp_styles, array( 'is-linked' ) );

		$this->assertSame( array( 'is-inlined', 'is-new-linked' ), array_column( $styles, 'handle' ) );
		$this->assertStringContainsString( '.is-inlined-test{color:red}', $styles[0]['html'] );
		$this->assertArrayNotHasKey( 'src', $styles[0] );
		$this->assertSame( 'https://example.org/is-new-linked.css?ver=2.0', $styles[1]['src'] );
		$this->assertSame( 'print', $styles[1]['media'] );
		$this->assertTrue( $wp_styles->do_concat );
	}

	public function test_get_new_styles_resends_per_request_block_styles_without_duplicate_ids() {
		$wp_styles = new WP_Styles();
		$wp_styles->add( 'core-block-supports', false );
		$wp_styles->add_inline_style( 'core-block-supports', '.wp-container-core-group-is-layout-abc{gap:6rem}' );
		$wp_styles->add( 'is-static', false );
		$wp_styles->add_inline_style( 'is-static', '.is-static{color:red}' );
		$wp_styles->done = array( 'core-block-supports', 'is-static' );

		$styles = The_Neverending_Home_Page::get_new_styles( $wp_styles, array( 'core-block-supports', 'is-static' ) );

		$this->assertSame( array( 'core-block-supports' ), array_column( $styles, 'handle' ) );
		$this->assertStringContainsString( 'gap:6rem', $styles[0]['html'] );
		$this->assertStringNotContainsString( 'id=', $styles[0]['html'] );
	}

	public function test_filter_rewriting_src_makes_client_load_the_new_url() {
		global $wp_styles;
		$original_styles = $wp_styles;
		$wp_styles       = new WP_Styles();
		$wp_styles->add( 'is-cdn', 'https://example.org/is-cdn.css', array(), '1.0' );
		$wp_styles->add( 'is-untouched', 'https://example.org/is-untouched.css', array(), '1.0' );
		$wp_styles->done    = array( 'is-cdn', 'is-untouched' );
		$_REQUEST['styles'] = array( 'is-theme' );

		$rewrite = function ( $styles ) {
			foreach ( $styles as &$style ) {
				if ( 'is-cdn' === $style['handle'] ) {
					$style['src'] = 'https://cdn.example.org/is-cdn.css';
				}
			}
			return $styles;
		};
		add_filter( 'infinite_scroll_additional_stylesheets', $rewrite );
		$results = $this->infinite_scroll->filter_infinite_scroll_results( array( 'type' => 'success' ), array(), null );
		remove_filter( 'infinite_scroll_additional_stylesheets', $rewrite );
		unset( $_REQUEST['styles'] );
		$wp_styles = $original_styles;

		$this->assertArrayNotHasKey( 'html', $results['styles'][0] );
		$this->assertSame( 'https://cdn.example.org/is-cdn.css', $results['styles'][0]['src'] );
		$this->assertArrayHasKey( 'html', $results['styles'][1] );
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
