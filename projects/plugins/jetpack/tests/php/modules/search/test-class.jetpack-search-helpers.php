<?php

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	require_once WPMU_PLUGIN_DIR . '/jetpack-plugin/vendor/autoload_packages.php';
}

use Automattic\Jetpack\Constants;

require_jetpack_file( 'modules/search/class.jetpack-search.php' );
require_jetpack_file( 'modules/search/class.jetpack-search-helpers.php' );
require_jetpack_file( 'modules/search/class-jetpack-search-options.php' );

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

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		$GLOBALS['wp_customize'] = new WP_Test_Jetpack_Search_Helpers_Customize();

		$this->request_uri = $_SERVER['REQUEST_URI'];
		$this->get = $_GET;
		$this->get = $_POST;
		$this->registered_widgets = $GLOBALS['wp_registered_widgets'];
		$this->query = $GLOBALS['wp_query'];
		$this->post_types = $GLOBALS['wp_post_types'];
		delete_option( Jetpack_Search_Helpers::get_widget_option_name() );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		$_SERVER['REQUEST_URI'] = $this->request_uri;
		$_GET = $this->get;
		$_POST = $this->post;
		$GLOBALS['wp_registered_widgets'] = $this->registered_widgets;
		$GLOBALS['wp_query'] = $this->query;
		$GLOBALS['wp_post_types'] = $this->post_types;
		remove_filter( 'sidebars_widgets', array( $this, '_fake_out_search_widget' ) );

		unset( $GLOBALS['wp_customize'] );

		Constants::clear_constants();
		remove_all_filters( 'jetpack_search_has_vip_index' );

		parent::tear_down();
	}

	function test_get_search_url_removes_page_when_no_query_s() {
		$_SERVER['REQUEST_URI'] = "http://example.com/search/test/page/2/";
		set_query_var( 's', 'test' );

		$url = Jetpack_Search_Helpers::get_search_url();

		$this->assertStringNotContainsString( '/search/test/', $url );
		$this->assertStringNotContainsString( '/page/', $url );
		$this->assertStringContainsString( 's=test', $url );
	}

	function test_get_search_url_removes_page() {
		$_SERVER['REQUEST_URI'] = "http://example.com/page/2/?s=test";
		$_GET['s'] = 'test';

		$url = Jetpack_Search_Helpers::get_search_url();

		$this->assertStringNotContainsString( '/page/', $url );
		$this->assertStringContainsString( 's=test', $url );
	}

	function test_get_search_url_removes_paged_query_arg() {
		$_SERVER['REQUEST_URI'] = "http://example.com/page/2/?s=test&paged=2";
		$_GET['s'] = 'test';
		$_GET['paged'] = '2';

		$url = Jetpack_Search_Helpers::get_search_url();

		$this->assertStringNotContainsString( 'paged=', $url );
		$this->assertStringContainsString( 's=test', $url );
	}

	function test_add_query_arg_works_when_sending_array_of_args() {
		$_SERVER['REQUEST_URI'] = "http://example.com/page/2/?s=test&post_type=page";
		$_GET['s'] = 'test';

		$url = Jetpack_Search_Helpers::add_query_arg( array(
			'post_type' => 'page',
			'category' => 'uncategorized',
		) );

		$this->assertStringContainsString( 's=test', $url );
		$this->assertStringContainsString( 'post_type=page', $url );
		$this->assertStringContainsString( 'category=uncategorized', $url );
	}

	function test_add_query_arg_does_not_persist_page() {
		$_SERVER['REQUEST_URI'] = "http://example.com/page/2/?s=test&post_type=page";
		$_GET['s'] = 'test';

		$url = Jetpack_Search_Helpers::add_query_arg( 'post_type', 'page' );

		$this->assertStringNotContainsString( '/page/', $url );
		$this->assertStringContainsString( 's=test', $url );
	}

	function test_remove_query_arg_does_not_persist_page() {
		$_SERVER['REQUEST_URI'] = "http://example.com/page/2/?s=test";
		$_GET['s'] = 'test';

		$url = Jetpack_Search_Helpers::remove_query_arg( 'post_type' );

		$this->assertStringNotContainsString( '/page/', $url );
		$this->assertStringContainsString( 's=test', $url );
		$this->assertStringNotContainsString( 'post_type=', $url );
	}

	function test_add_query_arg_respects_url_passed() {
		$input_url = 'http://example.com/page/2/?s=test';
		$_SERVER['REQUEST_URI'] = $input_url;
		$_GET['s'] = 'test';

		$url = Jetpack_Search_Helpers::add_query_arg( 'post_type', 'page', $input_url );
		$this->assertSame( 'http://example.com/page/2/?s=test&post_type=page', $url );
	}

	function test_remove_query_arg_respects_url_passed() {
		$input_url = 'http://example.com/page/2/?s=test&post_type=post,page';
		$_SERVER['REQUEST_URI'] = $input_url;
		$_GET['s'] = 'test';
		$_GET['post_type'] = 'post,page';

		$url = Jetpack_Search_Helpers::remove_query_arg( 'post_type', $input_url );
		$this->assertSame( 'http://example.com/page/2/?s=test', $url );
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
		$filters = $raw_option[22]['filters'];
		$additional_filters = array(
			$this->get_cat_filter(),
			$this->get_tag_filter(),
			$this->get_post_type_filter(),
			$this->get_date_histogram_posts_by_month_filter(),
			$this->get_date_histogram_posts_by_year_filter(),
			$this->get_date_histogram_posts_modified_by_month_filter(),
			$this->get_date_histogram_posts_modified_by_year_filter(),
			$this->get_date_histogram_posts_by_month_gmt__filter(),
			$this->get_date_histogram_posts_by_year_gmt__filter(),
			$this->get_date_histogram_posts_modified_by_month_gmt_filter(),
			$this->get_date_histogram_posts_modified_by_year_gmt_filter(),
		);

		// Let's remove the name of the additional filters that way we can test our default name generation
		foreach ( $additional_filters as $filter ) {
			if ( isset( $filter['name'] ) ) {
				unset( $filter['name'] );
			}

			$filters[] = $filter;
		}

		$raw_option[22]['filters'] = $filters;

		update_option( Jetpack_Search_Helpers::get_widget_option_name(), $raw_option );
		$this->register_fake_widgets();

		$expected = array(
			'taxonomy_0' => array(
				'name' => 'Categories',
				'type' => 'taxonomy',
				'taxonomy' => 'category',
				'count' => 4,
				'widget_id' => 'jetpack-search-filters-22',
			),
			'post_type_1' => array(
				'name' => 'Post Type',
				'type' => 'post_type',
				'count' => 5,
				'widget_id' => 'jetpack-search-filters-22',
			),
			'taxonomy_2' => array(
				'type' => 'taxonomy',
				'taxonomy' => 'category',
				'count' => 4,
				'widget_id' => 'jetpack-search-filters-22',
				'name' => 'Categories',
			),
			'taxonomy_3' => array(
				'type' => 'taxonomy',
				'taxonomy' => 'post_tag',
				'count' => 2,
				'widget_id' => 'jetpack-search-filters-22',
				'name' => 'Tags',
			),
			'post_type_4' => array(
				'type' => 'post_type',
				'count' => 5,
				'widget_id' => 'jetpack-search-filters-22',
				'name' => 'Post Types',
			),
			'date_histogram_5' => array(
				'type' => 'date_histogram',
				'field' => 'post_date',
				'interval' => 'month',
				'count' => 10,
				'widget_id' => 'jetpack-search-filters-22',
				'name' => 'Month',
			),
			'date_histogram_6' => array(
				'type' => 'date_histogram',
				'field' => 'post_date',
				'interval' => 'year',
				'count' => 10,
				'widget_id' => 'jetpack-search-filters-22',
				'name' => 'Year',
			),
			'date_histogram_7' => array(
				'type' => 'date_histogram',
				'field' => 'post_modified',
				'interval' => 'month',
				'count' => 10,
				'widget_id' => 'jetpack-search-filters-22',
				'name' => 'Month Updated',
			),
			'date_histogram_8' => array(
				'type' => 'date_histogram',
				'field' => 'post_modified',
				'interval' => 'year',
				'count' => 10,
				'widget_id' => 'jetpack-search-filters-22',
				'name' => 'Year Updated',
			),
			'date_histogram_9' => array(
				'type' => 'date_histogram',
				'field' => 'post_date_gmt',
				'interval' => 'month',
				'count' => 10,
				'widget_id' => 'jetpack-search-filters-22',
				'name' => 'Month',
			),
			'date_histogram_10' => array(
				'type' => 'date_histogram',
				'field' => 'post_date_gmt',
				'interval' => 'year',
				'count' => 10,
				'widget_id' => 'jetpack-search-filters-22',
				'name' => 'Year',
			),
			'date_histogram_11' => array(
				'type' => 'date_histogram',
				'field' => 'post_modified_gmt',
				'interval' => 'month',
				'count' => 10,
				'widget_id' => 'jetpack-search-filters-22',
				'name' => 'Month Updated',
			),
			'date_histogram_12' => array(
				'type' => 'date_histogram',
				'field' => 'post_modified_gmt',
				'interval' => 'year',
				'count' => 10,
				'widget_id' => 'jetpack-search-filters-22',
				'name' => 'Year Updated',
			),
		);

		$this->assertSame( $expected, Jetpack_Search_Helpers::get_filters_from_widgets() );
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
	function test_post_types_differ_searchable( $expected, $post_types = array() ) {
		$GLOBALS['wp_post_types'] = array(
			'post'       => array( 'name' => 'post', 'exclude_from_search' => false ),
			'page'       => array( 'name' => 'page', 'exclude_from_search' => false ),
			'attachment' => array( 'name' => 'attachment', 'exclude_from_search' => false )
		);
		$this->assertSame( $expected, Jetpack_Search_Helpers::post_types_differ_searchable( $post_types ) );
	}

	/**
	 * @dataProvider get_post_types_differ_query_data
	 */
	function test_post_types_differ_query( $expected, $post_types = array(), $get = array() ) {
		$_GET = $get;
		$this->assertSame( $expected, Jetpack_Search_Helpers::post_types_differ_query( $post_types ) );
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
	 * @dataProvider get_remove_active_from_post_type_buckets_data
	 */
	public function test_remove_active_from_post_type_buckets( $expected, $input ) {
		$this->assertSame(
			$expected,
			Jetpack_Search_Helpers::remove_active_from_post_type_buckets( $input )
		);
	}

	/**
	 * @dataProvider get_add_post_types_to_url_data
	 */
	function test_add_post_types_to_url( $expected, $url, $post_types ) {
		$this->assertSame(
			$expected,
			Jetpack_Search_Helpers::add_post_types_to_url( $url, $post_types )
		);
	}

	/**
	 * @dataProvider get_ensure_post_types_on_remove_url_data
	 */
	function test_ensure_post_types_on_remove_url( $expected, $filters, $post_types ) {
		$this->assertSame(
			$expected,
			Jetpack_Search_Helpers::ensure_post_types_on_remove_url( $filters, $post_types )
		);
	}

	/**
	 * @dataProvider get_site_has_vip_index_data
	 */
	public function test_site_has_vip_index( $expected, $constant = null, $filter = false ) {
		if ( ! is_null( $constant ) ) {
			Constants::set_constant( 'JETPACK_SEARCH_VIP_INDEX', $constant );
		}

		if ( $filter ) {
			add_filter( 'jetpack_search_has_vip_index', $filter );
		}

		$this->assertSame( $expected, Jetpack_Search_Options::site_has_vip_index() );
	}

	/**
	 * @dataProvider get_max_posts_per_page_data
	 */
	public function test_get_max_posts_per_page( $expected, $has_vip_index ) {
		Constants::set_constant( 'JETPACK_SEARCH_VIP_INDEX', $has_vip_index );
		$this->assertSame( $expected, Jetpack_Search_Helpers::get_max_posts_per_page() );
	}

	/**
	 * @dataProvider get_max_offset_data
	 */
	public function test_get_max_offset( $expected, $has_vip_index ) {
		Constants::set_constant( 'JETPACK_SEARCH_VIP_INDEX', $has_vip_index );
		$this->assertSame( $expected, Jetpack_Search_Helpers::get_max_offset() );
	}

	/**
	 * @dataProvider get_date_filter_type_name_data
	 */
	public function test_get_date_filter_type_name( $expected, $type, $is_updated ) {
		$this->assertSame(
			$expected, Jetpack_Search_Helpers::get_date_filter_type_name(
				$type,
				$is_updated
			)
		);
	}

	public function get_date_filter_type_name_data() {
		return array(
			'default' => array(
				'Month',
				'something',
				null,
			),
			'month' => array(
				'Month',
				'month',
				false,
			),
			'month_update' => array(
				'Month Updated',
				'month',
				true,
			),
			'year' => array(
				'Year',
				'year',
				false,
			),
			'year_updated' => array(
				'Year Updated',
				'year',
				true,
			),
		);
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
		return array(
			'no_post_types' => array(
				false,
				array(),
			),
			'post_types_same' => array(
				false,
				array( 'post', 'page', 'attachment' )
			),
			'post_types_same_count_different_types' => array(
				true,
				array( 'post', 'page', 'jetpack-testimonial' )
			),
			'post_types_has_fewer' => array(
				true,
				'post_types' => array( 'post' )
			),
			'post_types_has_more' => array(
				true,
				array( 'post', 'page', 'attachment', 'jetpack-testimonial' )
			),
		);
	}

	function get_post_types_differ_query_data() {
		return array(
			'no_post_types_on_instance' => array(
				false,
				array(),
			),
			'post_types_same' => array(
				false,
				array( 'post', 'page', 'attachment' ),
				array( 'post_type' => array( 'post', 'page', 'attachment' ) )
			),
			'post_types_same_count_different_types' => array(
				true,
				array( 'post', 'page', 'jetpack-testimonial' ),
				array( 'post_type' => array( 'post', 'page', 'attachment' ) )
			),
			'post_types_instance_has_fewer' => array(
				true,
				array( 'post' ),
				array( 'post_type' => array( 'post', 'page' ) )
			),
			'post_types_instance_has_more' => array(
				true,
				array( 'post', 'page', 'attachment', 'jetpack-testimonial' ),
				array( 'post_type' => 'post,page' )
			),
			'post_types_same_csv' => array(
				false,
				array( 'post', 'page', 'attachment' ),
				array( 'post_type' => 'post, page, attachment' )
			),
			'post_types_same_count_different_types_csv' => array(
				true,
				array( 'post', 'page', 'jetpack-testimonial' ),
				array( 'post_type' => 'post, page, attachment' )
			),
			'post_types_instance_has_fewer_csv' => array(
				true,
				array( 'post' ),
				array( 'post_type' => 'post, page' )
			),
			'post_types_instance_has_more_csv' => array(
				true,
				array( 'post', 'page', 'attachment', 'jetpack-testimonial' ),
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
					'widget_search_box_enabled' => 1,
				),
				$this->get_sample_widget_instance( 0 )
			),
			'instance_with_filters' => array(
				array(
					'widget_title' => 'Search',
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

	public function get_remove_active_from_post_type_buckets_data() {
		return array(
			'empty_array' => array(
				array(),
				array(),
			),
			'unchanged_if_not_post_type_filter' => array(
				array(
					'taxonomy_0' => array(
						'type' => 'taxonomy',
					),
				),
				array(
					'taxonomy_0' => array(
						'type' => 'taxonomy',
					),
				),
			),
			'unchanged_if_post_type_but_no_buckets' => array(
				array(
					'post_type_0' => array(
						'type' => 'post_type',
					),
				),
				array(
					'post_type_0' => array(
						'type' => 'post_type',
					),
				),
			),
			'active_false_on_post_type_buckets' => array(
				array(
					'post_type_0' => array(
						'type' => 'post_type',
						'buckets' => array(
							array(
								'active' => false,
							),
							array(
								'active' => false,
							),
						),
					),
				),
				array(
					'post_type_0' => array(
						'type' => 'post_type',
						'buckets' => array(
							array(
								'active' => true,
							),
							array(
								'active' => true,
							),
						),
					),
				),
			),
		);
	}

	function get_add_post_types_to_url_data() {
		return array(
			'same_url_empty_post_types' => array(
				'http://jetpack.com?s=test',
				'http://jetpack.com?s=test',
				array(),
			),
			'no_post_types_on_url' => array(
				'http://jetpack.com?s=test&post_type=post,page',
				'http://jetpack.com?s=test',
				array( 'post', 'page' ),
			),
			'overwrite_existing_post_types' => array(
				'http://jetpack.com?s=test&post_type=post,page',
				'http://jetpack.com?s=test&post_type=jetpack-testimonial',
				array( 'post', 'page' ),
			),
		);
	}

	function get_ensure_post_types_on_remove_url_data() {
		return array(
			'unmodified_if_no_post_types' => array(
				array(
					'taxonomy_0' => array(
						'type' => 'taxonomy',
					),
				),
				array(
					'taxonomy_0' => array(
						'type' => 'taxonomy',
					),
				),
				array(),
			),
			'unmodified_if_post_type_no_buckets' => array(
				array(
					'post_type_0' => array(
						'type' => 'post_type',
					),
				),
				array(
					'post_type_0' => array(
						'type' => 'post_type',
					),
				),
				array(),
			),
			'unmodified_if_remove_url_not_on_bucket' => array(
				array(
					'post_type_0' => array(
						'type' => 'post_type',
						'buckets' => array(
							array(
								'name' => 'test',
							),
						),
					),
				),
				array(
					'post_type_0' => array(
						'type' => 'post_type',
						'buckets' => array(
							array(
								'name' => 'test',
							),
						),
					),
				),
				array(),
			),
			'unmodified_if_remove_url_bad' => array(
				array(
					'post_type_0' => array(
						'type' => 'post_type',
						'buckets' => array(
							array(
								'name' => 'test',
								'remove_url' => 'http://:80',
							),
						),
					),
				),
				array(
					'post_type_0' => array(
						'type' => 'post_type',
						'buckets' => array(
							array(
								'name' => 'test',
								'remove_url' => 'http://:80',
							),
						),
					),
				),
				array(),
			),
			'unmodified_if_no_query' => array(
				array(
					'post_type_0' => array(
						'type' => 'post_type',
						'buckets' => array(
							array(
								'name' => 'test',
								'remove_url' => 'http://jetpack.com',
							),
						),
					),
				),
				array(
					'post_type_0' => array(
						'type' => 'post_type',
						'buckets' => array(
							array(
								'name' => 'test',
								'remove_url' => 'http://jetpack.com',
							),
						),
					),
				),
				array(),
			),
			'unmodified_if_query_has_post_type' => array(
				array(
					'post_type_0' => array(
						'type' => 'post_type',
						'buckets' => array(
							array(
								'name' => 'test',
								'remove_url' => 'http://jetpack.com?post_type=post,page',
							),
						),
					),
				),
				array(
					'post_type_0' => array(
						'type' => 'post_type',
						'buckets' => array(
							array(
								'name' => 'test',
								'remove_url' => 'http://jetpack.com?post_type=post,page',
							),
						),
					),
				),
				array(),
			),
			'adds_post_types_if_no_post_types_on_remove_url' => array(
				array(
					'post_type_0' => array(
						'type' => 'post_type',
						'buckets' => array(
							array(
								'name' => 'test',
								'remove_url' => 'http://jetpack.com?post_type=post,page',
							),
						),
					),
				),
				array(
					'post_type_0' => array(
						'type' => 'post_type',
						'buckets' => array(
							array(
								'name' => 'test',
								'remove_url' => 'http://jetpack.com',
							),
						),
					),
				),
				array( 'post', 'page' ),
			),
		);
	}

	public function get_site_has_vip_index_data() {
		return array(
			'default_constants_filter' => array(
				false,
			),
			'constant_false_no_filter' => array(
				false,
				false,
			),
			'constant_true_no_filter' => array(
				true,
				true,
			),
			'constant_false_filter_true' => array(
				true,
				false,
				'__return_true',
			),
			'constant_true_filter_false' => array(
				false,
				true,
				'__return_false',
			),
		);
	}

	public function get_max_offset_data() {
		return array (
			'not_vip_index' => array(
				1000,
				false,
			),
			'has_vip_index' => array(
				9000,
				true,
			),
		);
	}

	public function get_max_posts_per_page_data() {
		return array (
			'not_vip_index' => array(
				100,
				false,
			),
			'has_vip_index' => array(
				1000,
				true,
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
			'search_box_enabled' => 1,
		);

		if ( $count_filters > 0 ) {
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
			'taxonomy' => 'post_tag',
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

	function get_date_histogram_posts_by_month_filter() {
		return array(
			'type'     => 'date_histogram',
			'field'    => 'post_date',
			'interval' => 'month',
			'count'    => 10,
		);
	}

	function get_date_histogram_posts_by_year_filter() {
		return array(
			'type'     => 'date_histogram',
			'field'    => 'post_date',
			'interval' => 'year',
			'count'    => 10,
		);
	}

	function get_date_histogram_posts_modified_by_month_filter() {
		return array(
			'type'     => 'date_histogram',
			'field'    => 'post_modified',
			'interval' => 'month',
			'count'    => 10,
		);
	}

	function get_date_histogram_posts_modified_by_year_filter() {
		return array(
			'type'     => 'date_histogram',
			'field'    => 'post_modified',
			'interval' => 'year',
			'count'    => 10,
		);
	}

	function get_date_histogram_posts_by_month_gmt__filter() {
		return array(
			'type'     => 'date_histogram',
			'field'    => 'post_date_gmt',
			'interval' => 'month',
			'count'    => 10,
		);
	}

	function get_date_histogram_posts_by_year_gmt__filter() {
		return array(
			'type'     => 'date_histogram',
			'field'    => 'post_date_gmt',
			'interval' => 'year',
			'count'    => 10,
		);
	}

	function get_date_histogram_posts_modified_by_month_gmt_filter() {
		return array(
			'type'     => 'date_histogram',
			'field'    => 'post_modified_gmt',
			'interval' => 'month',
			'count'    => 10,
		);
	}

	function get_date_histogram_posts_modified_by_year_gmt_filter() {
		return array(
			'type'     => 'date_histogram',
			'field'    => 'post_modified_gmt',
			'interval' => 'year',
			'count'    => 10,
		);
	}
}
