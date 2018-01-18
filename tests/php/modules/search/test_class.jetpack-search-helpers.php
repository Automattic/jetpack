<?php

require dirname( __FILE__ ) . '/../../../../modules/search/class.jetpack-search.php';
require dirname( __FILE__ ) . '/../../../../modules/search/class.jetpack-search-helpers.php';

class WP_Test_Jetpack_Search_Helpers extends WP_UnitTestCase {
	protected $request_uri;
	protected $get;
	protected $registered_widgets;

	function setup() {
		$this->request_uri = $_SERVER['REQUEST_URI'];
		$this->get = $_GET;
		$this->registered_widgets = $GLOBALS['wp_registered_widgets'];
		delete_option( Jetpack_Search_Helpers::get_widget_option_name() );
	}

	function tearDown() {
		$_SERVER['REQUEST_URI'] = $this->request_uri;
		$_GET = $this->get;
		$GLOBALS['wp_registered_widgets'] = $this->registered_widgets;
		remove_filter( 'sidebars_widgets', array( $this, '_fake_out_search_widget' ) );
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
			'22' => array(
				'title' => 'Search',
				'use_filters' => 1,
				'search_box_enabled' => 1,
				'filters' => array(
					array(
						'name' => 'Categories',
						'type' => 'taxonomy',
						'taxonomy' => 'category',
						'count' => 4
					),
					array(
						'name' => 'Post Type',
						'type' => 'post_type',
						'count' => 5,
					)
				)
			),
			'_multiwidget' => 1
		);
	}
}
