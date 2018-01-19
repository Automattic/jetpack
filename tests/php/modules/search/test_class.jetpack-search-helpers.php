<?php

require dirname( __FILE__ ) . '/../../../../modules/search/class.jetpack-search.php';
require dirname( __FILE__ ) . '/../../../../modules/search/class.jetpack-search-helpers.php';

class WP_Test_Jetpack_Search_Helpers_Customize {
	public $previewing = false;

	public function is_preview() {
		return (bool) $this->previewing;
	}
}

class WP_Test_Jetpack_Search_Helpers_Query {
	public $searching = true;
	public function is_search() {
		return $this->searching;
	}
}

class WP_Test_Jetpack_Search_Helpers extends WP_UnitTestCase {
	protected $request_uri;
	protected $get;
	protected $post;
	protected $registered_widgets;
	protected $query;
	protected $post_types;

	function setup() {
		$GLOBALS['wp_customize'] = new WP_Test_Jetpack_Search_Helpers_Customize();

		$this->request_uri = $_SERVER['REQUEST_URI'];
		$this->get = $_GET;
		$this->get = $_POST;
		$this->registered_widgets = $GLOBALS['wp_registered_widgets'];
		$this->query = $GLOBALS['wp_query'];
		$this->post_types = $GLOBALS['wp_post_types'];
		delete_option( Jetpack_Search_Helpers::get_widget_option_name() );
	}

	function tearDown() {
		$_SERVER['REQUEST_URI'] = $this->request_uri;
		$_GET = $this->get;
		$_POST = $this->post;
		$GLOBALS['wp_registered_widgets'] = $this->registered_widgets;
		$GLOBALS['wp_query'] = $this->query;
		$GLOBALS['wp_post_types'] = $this->post_types;
		remove_filter( 'sidebars_widgets', array( $this, '_fake_out_search_widget' ) );

		unset( $GLOBALS['wp_customize'] );
	}

	function test_get_search_url_removes_page_when_no_query_s() {
		$_SERVER['REQUEST_URI'] = "http://example.com/search/test/page/2/";
		set_query_var( 's', 'test' );

		$url = Jetpack_Search_Helpers::get_search_url();

		$this->assertNotContains( '/search/test/', $url );
		$this->assertNotContains( '/page/', $url );
		$this->assertContains( 's=test', $url );
	}

	function test_get_search_url_removes_page() {
		$_SERVER['REQUEST_URI'] = "http://example.com/page/2/?s=test";
		$_GET['s'] = 'test';

		$url = Jetpack_Search_Helpers::get_search_url();

		$this->assertNotContains( '/page/', $url );
		$this->assertContains( 's=test', $url );
	}

	function test_get_search_url_removes_paged_query_arg() {
		$_SERVER['REQUEST_URI'] = "http://example.com/page/2/?s=test&paged=2";
		$_GET['s'] = 'test';
		$_GET['paged'] = '2';

		$url = Jetpack_Search_Helpers::get_search_url();

		$this->assertNotContains( 'paged=', $url );
		$this->assertContains( 's=test', $url );
	}

	function test_add_query_arg_works_when_sending_array_of_args() {
		$_SERVER['REQUEST_URI'] = "http://example.com/page/2/?s=test&post_type=page";
		$_GET['s'] = 'test';

		$url = Jetpack_Search_Helpers::add_query_arg( array(
			'post_type' => 'page',
			'category' => 'uncategorized',
		) );

		$this->assertContains( 's=test', $url );
		$this->assertContains( 'post_type=page', $url );
		$this->assertContains( 'category=uncategorized', $url );
	}

	function test_add_query_arg_does_not_persist_page() {
		$_SERVER['REQUEST_URI'] = "http://example.com/page/2/?s=test&post_type=page";
		$_GET['s'] = 'test';

		$url = Jetpack_Search_Helpers::add_query_arg( 'post_type', 'page' );

		$this->assertNotContains( '/page/', $url );
		$this->assertContains( 's=test', $url );
	}

	function test_remove_query_arg_does_not_persist_page() {
		$_SERVER['REQUEST_URI'] = "http://example.com/page/2/?s=test";
		$_GET['s'] = 'test';

		$url = Jetpack_Search_Helpers::remove_query_arg( 'post_type' );

		$this->assertNotContains( '/page/', $url );
		$this->assertContains( 's=test', $url );
		$this->assertNotContains( 'post_type=', $url );
	}

	function test_get_widget_option_name() {
		$this->assertSame( 'widget_jetpack-search-filters', Jetpack_Search_Helpers::get_widget_option_name() );
	}

	function test_get_widgets_from_option_empty_widget_option() {
		$this->assertSame( array(), Jetpack_Search_Helpers::get_widgets_from_option() );
	}

	function test_get_widgets_from_option_with_widgets_saved() {
		update_option( Jetpack_Search_Helpers::get_widget_option_name(), $this->get_sample_widgets_option() );

		$filters = Jetpack_Search_Helpers::get_widgets_from_option();

		$expected = $this->get_sample_widgets_option();
		unset( $expected['_multiwidget'] );

		$this->assertSame( $expected, $filters );
	}
	/**
	 * @dataProvider get_build_widget_id_data
	 */
	function test_build_widget_id( $number, $expected ) {
		$this->assertSame( $expected, Jetpack_Search_Helpers::build_widget_id( $number ) );
	}

	/**
	 * @dataProvider get_test_is_active_widget_data
	 */
	function test_is_active_widget( $number, $expected ) {
		$this->register_fake_widgets();

		$widget_id = Jetpack_Search_Helpers::build_widget_id( $number );

		$this->assertSame( $expected, Jetpack_Search_Helpers::is_active_widget( $widget_id ) );

	}

	function test_get_filters_from_widgets() {
		$raw_option = $this->get_sample_widgets_option();
		update_option( Jetpack_Search_Helpers::get_widget_option_name(), $raw_option );
		$this->register_fake_widgets();

		$filters = Jetpack_Search_Helpers::get_filters_from_widgets();

		$this->assertCount( count( $raw_option['22']['filters'] ), $filters );

		$this->assertArrayHasKey( 'taxonomy_0', $filters );
		foreach ( array( 'name', 'type', 'taxonomy', 'count', 'widget_id'  ) as $key ) {
			$this->assertArrayHasKey( $key, $filters['taxonomy_0'], sprintf( 'Could not find %s key in taxonomy_0', $key ) );
		}

		$this->assertSame( 'taxonomy', $filters['taxonomy_0']['type'] );
		$this->assertSame( 'category', $filters['taxonomy_0']['taxonomy'] );
		$this->assertSame( 4, (int) $filters['taxonomy_0']['count'] );
		$this->assertSame( 'jetpack-search-filters-22', $filters['taxonomy_0']['widget_id'] );

		$this->assertArrayHasKey( 'post_type_1', $filters );
		foreach ( array( 'name', 'type', 'count', 'widget_id'  ) as $key ) {
			$this->assertArrayHasKey( $key, $filters['post_type_1'], sprintf( 'Could not find %s key in post_type_1', $key ) );
		}

		$this->assertSame( 'post_type', $filters['post_type_1']['type'] );
		$this->assertSame( 5, (int) $filters['post_type_1']['count'] );
		$this->assertSame( 'jetpack-search-filters-22', $filters['post_type_1']['widget_id'] );
	}

	/**
	 * @dataProvider get_should_rerun_search_in_customizer_preview_data
	 */
	function test_should_rerun_search_in_customizer_preview( $expected, $previewing = false, $post = false ) {
		if ( $previewing ) {
			$GLOBALS['wp_customize']->previewing = true;
		}
		if ( $post ) {
			$_POST = array( 'test' => 1 );
		}

		$this->assertSame( $expected, Jetpack_Search_Helpers::should_rerun_search_in_customizer_preview() );
	}

	/**
	 * @dataProvider get_array_diff_data
	 */
	function test_array_diff( $expected, $array_1, $array_2 ) {
		$this->assertSame( $expected, Jetpack_Search_Helpers::array_diff( $array_1, $array_2 ) );
	}

	/**
	 * @dataProvider get_post_types_differ_searchable_data
	 */
	function test_post_types_differ_searchable( $expected, $instance = array() ) {
		$GLOBALS['wp_post_types'] = array(
			'post'       => array( 'name' => 'post', 'exclude_from_search' => false ),
			'page'       => array( 'name' => 'page', 'exclude_from_search' => false ),
			'attachment' => array( 'name' => 'attachment', 'exclude_from_search' => false )
		);
		$this->assertSame( $expected, Jetpack_Search_Helpers::post_types_differ_searchable( $instance ) );
	}

	/**
	 * @dataProvider get_post_types_differ_query_data
	 */
	function test_post_types_differ_query( $expected, $instance = array(), $get = array() ) {
		$_GET = $get;
		$this->assertSame( $expected, Jetpack_Search_Helpers::post_types_differ_query( $instance ) );
	}

	/**
	 * Data providers
	 */
	function get_build_widget_id_data() {
		return array(
			'jetpack-search-filters-22' => array(
				22,
				'jetpack-search-filters-22'
			),
			'jetpack-search-filters-10' => array(
				10,
				'jetpack-search-filters-10'
			)
		);
	}

	function get_test_is_active_widget_data() {
		return array(
			'jetpack-search-filters-22' => array(
				22,
				true
			),
			'jetpack-search-filters-10' => array(
				10,
				false
			)
		);
	}

	function get_should_rerun_search_in_customizer_preview_data() {
		return array(
			'not_previewing' => array(
				false
			),
			'is_previewing_not_post' => array(
				false,
				true
			),
			'is_preview_and_post_filters_initially_empty' => array(
				true,
				true,
				true,
			),
		);
	}

	function get_array_diff_data() {
		return array(
			'all_empty' => array(
				array(),
				array(),
				array(),
			),
			'same_count_same_items' => array(
				array(),
				array( 'post' ),
				array( 'post' ),
			),
			'same_count_different_items' => array(
				array( 'post' ),
				array( 'post' ),
				array( 'page' ),
			),
			'array_1_more_items' => array(
				array( 'jetpack-testimonial' ),
				array( 'post', 'page', 'jetpack-testimonial' ),
				array( 'post', 'page' ),
			),
			'array_2_more_items' => array(
				array( 'jetpack-testimonial' ),
				array( 'post', 'page' ),
				array( 'post', 'page', 'jetpack-testimonial' ),
			)
		);
	}

	function get_post_types_differ_searchable_data() {
		$empty_post_types_instance = $this->get_sample_widget_instance();
		return array(
			'no_post_types_on_instance' => array(
				false,
				$empty_post_types_instance,
			),
			'post_types_same' => array(
				false,
				array_merge( $empty_post_types_instance, array(
					'post_types' => array( 'post', 'page', 'attachment' )
				) ),
			),
			'post_types_same_count_different_types' => array(
				true,
				array_merge( $empty_post_types_instance, array(
					'post_types' => array( 'post', 'page', 'jetpack-testimonial' )
				) ),
			),
			'post_types_instance_has_fewer' => array(
				true,
				array_merge( $empty_post_types_instance, array(
					'post_types' => array( 'post' )
				) )
			),
			'post_types_instance_has_more' => array(
				true,
				array_merge( $empty_post_types_instance, array(
					'post_types' => array( 'post', 'page', 'attachment', 'jetpack-testimonial' )
				) )
			),
		);
	}

	function get_post_types_differ_query_data() {
		$empty_post_types_instance = $this->get_sample_widget_instance();
		return array(
			'no_post_types_on_instance' => array(
				false,
				$empty_post_types_instance,
			),
			'post_types_same' => array(
				false,
				array_merge( $empty_post_types_instance, array(
					'post_types' => array( 'post', 'page', 'attachment' )
				) ),
				array( 'post_type' => array( 'post', 'page', 'attachment' ) )
			),
			'post_types_same_count_different_types' => array(
				true,
				array_merge( $empty_post_types_instance, array(
					'post_types' => array( 'post', 'page', 'jetpack-testimonial' )
				) ),
				array( 'post_type' => array( 'post', 'page', 'attachment' ) )
			),
			'post_types_instance_has_fewer' => array(
				true,
				array_merge( $empty_post_types_instance, array(
					'post_types' => array( 'post' )
				) ),
				array( 'post_type' => array( 'post', 'page' ) )
			),
			'post_types_instance_has_more' => array(
				true,
				array_merge( $empty_post_types_instance, array(
					'post_types' => array( 'post', 'page', 'attachment', 'jetpack-testimonial' )
				) ),
				array( 'post_type' => 'post,page' )
			),
			'post_types_same_csv' => array(
				false,
				array_merge( $empty_post_types_instance, array(
					'post_types' => array( 'post', 'page', 'attachment' )
				) ),
				array( 'post_type' => 'post, page, attachment' )
			),
			'post_types_same_count_different_types_csv' => array(
				true,
				array_merge( $empty_post_types_instance, array(
					'post_types' => array( 'post', 'page', 'jetpack-testimonial' )
				) ),
				array( 'post_type' => 'post, page, attachment' )
			),
			'post_types_instance_has_fewer_csv' => array(
				true,
				array_merge( $empty_post_types_instance, array(
					'post_types' => array( 'post' )
				) ),
				array( 'post_type' => 'post, page' )
			),
			'post_types_instance_has_more_csv' => array(
				true,
				array_merge( $empty_post_types_instance, array(
					'post_types' => array( 'post', 'page', 'attachment', 'jetpack-testimonial' )
				) ),
				array( 'post_type' => 'post, page' )
			),
		);
	}

	/**
	 * Helpers
	 */
	function _fake_out_search_widget( $widgets ) {
		$widgets['wp_inactive_widgets'][] = 'jetpack-search-filters-10';

		$override = array();
		foreach ( $widgets as $key => $sidebar ) {
			if ( 'wp_inactive_widgets' == $key ) {
				continue;
			}

			$widgets[ $key ][] = 'jetpack-search-filters-22';
			return $widgets;
		}

		return $widgets;
	}

	function register_fake_widgets() {
		add_filter( 'sidebars_widgets', array( $this, '_fake_out_search_widget' ) );

		$widget_ids = array(
			'jetpack-search-filters-10',
			'jetpack-search-filters-22',
		);

		foreach( $widget_ids as $id ) {
			$GLOBALS['wp_registered_widgets'][ $id ] = array(
				'id' => $id,
			);
		}
	}

	function get_sample_widgets_option() {
		return array(
			'15' => array(
				'title' => 'Search',
				'use_filters' => 1,
				'search_box_enabled' => 0,
				'filters' => array(
					array(
						'name' => 'Categories',
						'type' => 'taxonomy',
						'taxonomy' => 'category',
						'count' => 4
					)
				)
			),
			'22' => $this->get_sample_widget_instance(),
			'_multiwidget' => 1
		);
	}

	function get_sample_filters( $count_filters = 2, $count_cat = 4 ) {
		$filters = array();

		if ( $count_filters > 0 ) {
			$filters[] = $this->get_cat_filter( $count_cat );
		}

		if ( $count_filters > 1 ) {
			$filters[] = $this->get_post_type_filter();
		}

		return $filters;
	}

	function get_sample_widget_instance( $count_filters = 2, $count_cat = 4 ) {
		return array(
			'title' => 'Search',
			'use_filters' => 1,
			'search_box_enabled' => 1,
			'filters' => $this->get_sample_filters( $count_filters, $count_cat )
		);
	}

	function get_cat_filter( $count = 4 ) {
		return array(
			'name' => 'Categories',
			'type' => 'taxonomy',
			'taxonomy' => 'category',
			'count' => $count,
		);
	}

	function get_post_type_filter() {
		return array(
			'name' => 'Post Type',
			'type' => 'post_type',
			'count' => 5,
		);
	}
}
