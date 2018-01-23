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
	 * @dataProvider get_filter_properties_for_tracks_data
	 */
	function test_get_filter_properties_for_tracks( $expected, $filters ) {
		$this->assertSame( $expected, Jetpack_Search_Helpers::get_filter_properties_for_tracks( $filters ) );
	}

	/**
	 * @dataProvider get_widget_properties_for_tracks_data
	 */
	function test_get_widget_properties_for_tracks( $expected, $widget ) {
		$this->assertSame( $expected, Jetpack_Search_Helpers::get_widget_properties_for_tracks( $widget ) );
	}

	/**
	 * @dataProvider get_widget_tracks_value_data
	 */
	function test_get_widget_tracks_value( $expected, $old_value, $new_value ) {
		$this->assertSame( $expected, Jetpack_Search_Helpers::get_widget_tracks_value( $old_value, $new_value ) );
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

	function get_filter_properties_for_tracks_data() {
		return array(
			'empty_filters' => array(
				array(),
				array()
			),
			'single_filter' => array(
				array(
					'widget_filter_count' => 1,
					'widget_filter_type_taxonomy' => 1,
				),
				array(
					$this->get_cat_filter()
				)
			),
			'multiple_filters' => array(
				array(
					'widget_filter_count' => 3,
					'widget_filter_type_taxonomy' => 2,
					'widget_filter_type_post_type' => 1,
				),
				array(
					$this->get_cat_filter(),
					$this->get_post_type_filter(),
					$this->get_tag_filter()
				)
			)
		);
	}

	function get_widget_properties_for_tracks_data() {
		return array(
			'empty_instance' => array(
				array(),
				array()
			),
			'instance_with_only_multiwidet' => array(
				array(),
				array(
					'_multiwidget' => 1,
				),
			),
			'instance_with_no_filters' => array(
				array(
					'widget_title' => 'Search',
					'widget_use_filters' => 0,
					'widget_search_box_enabled' => 1,
				),
				$this->get_sample_widget_instance( 0 )
			),
			'instance_with_filters' => array(
				array(
					'widget_title' => 'Search',
					'widget_use_filters' => 1,
					'widget_search_box_enabled' => 1,
					'widget_filter_count' => 1,
					'widget_filter_type_taxonomy' => 1,
				),
				$this->get_sample_widget_instance( 1 )
			),
		);
	}

	function get_widget_tracks_value_data() {
		$instance_with_filter_updated = $this->get_sample_widget_instance();
		$instance_with_filter_updated['filters'][1] = $this->get_tag_filter();

		return array(
			'widget_updated_added_filters' => array(
				array(
					'action' => 'widget_updated',
					'widget' => array(
						'widget_title' => 'Search',
						'widget_use_filters' => 1,
						'widget_search_box_enabled' => 1,
						'widget_filter_count' => 1,
						'widget_filter_type_taxonomy' => 1,
					)
				),
				array( $this->get_sample_widget_instance( 0 ) ),
				array( $this->get_sample_widget_instance( 1 ) ),
			),
			'widget_updated_title_changed' => array(
				array(
					'action' => 'widget_updated',
					'widget' => array(
						'widget_title' => 'changed',
						'widget_use_filters' => 1,
						'widget_search_box_enabled' => 1,
						'widget_filter_count' => 2,
						'widget_filter_type_taxonomy' => 1,
						'widget_filter_type_post_type' => 1
					)
				),
				array( $this->get_sample_widget_instance() ),
				array( array_merge( $this->get_sample_widget_instance(), array( 'title' => 'changed' ) ) ),
			),
			'widget_update_removed_filters' => array(
				array(
					'action' => 'widget_updated',
					'widget' => array(
						'widget_title' => 'Search',
						'widget_use_filters' => 0,
						'widget_search_box_enabled' => 1,
					)
				),
				array( $this->get_sample_widget_instance( 2 ) ),
				array( $this->get_sample_widget_instance( 0 ) ),
			),
			'multiple_widgets_one_title_changed' => array(
				array(
					'action' => 'widget_updated',
					'widget' => array(
						'widget_title' => 'updated',
						'widget_use_filters' => 0,
						'widget_search_box_enabled' => 1,
					)
				),
				array(
					'0' => $this->get_sample_widget_instance( 0 ),
					'1' => $this->get_sample_widget_instance( 1 ),
					'2' => $this->get_sample_widget_instance( 2 ),
					'_multiwidget' => 1
				),
				array(
					'0' => array_merge( $this->get_sample_widget_instance( 0 ), array( 'title' => 'updated' ) ),
					'1' => $this->get_sample_widget_instance( 1 ),
					'2' => $this->get_sample_widget_instance( 2 ),
					'_multiwidget' => 1
				),
				array(
					'_multiwidget' => 1
				)
			),
			'multiple_widgets_filter_added' => array(
				array(
					'action' => 'widget_updated',
					'widget' => array(
						'widget_title' => 'Search',
						'widget_use_filters' => 1,
						'widget_search_box_enabled' => 1,
						'widget_filter_count' => 2,
						'widget_filter_type_taxonomy' => 1,
						'widget_filter_type_post_type' => 1
					)
				),
				array(
					'0' => $this->get_sample_widget_instance( 0 ),
					'1' => $this->get_sample_widget_instance( 1 ),
					'2' => $this->get_sample_widget_instance( 2 ),
					'_multiwidget' => 1
				),
				array(
					'0' => $this->get_sample_widget_instance( 0 ),
					'1' => $this->get_sample_widget_instance( 2 ),
					'2' => $this->get_sample_widget_instance( 2 ),
					'_multiwidget' => 1
				),
				array(
					'_multiwidget' => 1
				)
			),
			'multiple_widgets_filter_updated' => array(
				array(
					'action' => 'widget_updated',
					'widget' => array(
						'widget_title' => 'Search',
						'widget_use_filters' => 1,
						'widget_search_box_enabled' => 1,
						'widget_filter_count' => 2,
						'widget_filter_type_taxonomy' => 2,
					)
				),
				array(
					'0' => $this->get_sample_widget_instance( 0 ),
					'1' => $this->get_sample_widget_instance( 1 ),
					'2' => $this->get_sample_widget_instance( 2 ),
					'_multiwidget' => 1
				),
				array(
					'0' => $this->get_sample_widget_instance( 0 ),
					'1' => $this->get_sample_widget_instance( 1 ),
					'2' => $instance_with_filter_updated,
					'_multiwidget' => 1
				),
				array(
					'_multiwidget' => 1
				)
			),
			'widget_added_from_empty' => array(
				array(
					'action' => 'widget_added',
					'widget' => array(
						'widget_title' => 'Search',
						'widget_use_filters' => 1,
						'widget_search_box_enabled' => 1,
						'widget_filter_count' => 2,
						'widget_filter_type_taxonomy' => 1,
						'widget_filter_type_post_type' => 1,
					)
				),
				array( '_multiwidget' => 1 ),
				array(
					'0' => $this->get_sample_widget_instance(),
					'_multiwidget' => 1,
				),
			),
			'widget_removed_none_to_empty' => array(
				array(
					'action' => 'widget_deleted',
					'widget' => array(
						'widget_title' => 'Search',
						'widget_use_filters' => 1,
						'widget_search_box_enabled' => 1,
						'widget_filter_count' => 2,
						'widget_filter_type_taxonomy' => 1,
						'widget_filter_type_post_type' => 1,
					)
				),
				array(
					'0' => $this->get_sample_widget_instance(),
					'_multiwidget' => 1
				),
				array( '_multiwidget' => 1 ),
			),
			'widget_added_one_to_two' => array(
				array(
					'action' => 'widget_added',
					'widget' => array(
						'widget_title' => 'Search',
						'widget_use_filters' => 1,
						'widget_search_box_enabled' => 1,
						'widget_filter_count' => 1,
						'widget_filter_type_taxonomy' => 1,
					)
				),
				array(
					$this->get_sample_widget_instance(),
					'_multiwidget' => 1,
				),
				array(
					$this->get_sample_widget_instance(),
					$this->get_sample_widget_instance( 1 ),
					'_multiwidget' => 1,
				)
			),
			'widget_added_two_to_one' => array(
				array(
					'action' => 'widget_deleted',
					'widget' => array(
						'widget_title' => 'Search',
						'widget_use_filters' => 0,
						'widget_search_box_enabled' => 1,
					)
				),
				array(
					'1' => $this->get_sample_widget_instance( 0 ),
					'2' => $this->get_sample_widget_instance( 1 ),
					'_multiwidget' => 1,
				),
				array(
					'2' => $this->get_sample_widget_instance( 1 ),
					'_multiwidget' => 1,
				),
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
		$instance = array(
			'title' => 'Search',
			'use_filters' => 0,
			'search_box_enabled' => 1,

		);

		if ( $count_filters > 0 ) {
			$instance['use_filters'] = 1;
			$instance['filters'] = $this->get_sample_filters( $count_filters, $count_cat );
		}

		return $instance;
	}

	function get_cat_filter( $count = 4 ) {
		return array(
			'name' => 'Categories',
			'type' => 'taxonomy',
			'taxonomy' => 'category',
			'count' => $count,
		);
	}

	function get_tag_filter() {
		return array(
			'name' => 'Tags',
			'type' => 'taxonomy',
			'taxonomy' => 'tag',
			'count' => 2,
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
