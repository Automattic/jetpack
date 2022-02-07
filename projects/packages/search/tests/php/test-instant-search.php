<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Test class `Instant_Search`
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the REST_Controller class.
 *
 * @package automattic/jetpack-search
 */
class Test_Instant_Search extends TestCase {
	/**
	 * Hold `Instant_Search` instance.
	 *
	 * @var Instant_Search
	 */
	protected static $instant_search;

	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {
		Instant_Search::initialize( -1 );
		self::$instant_search = Instant_Search::instance();
	}

	/**
	 * Test `auto_config_overlay_sidebar_widgets` failed
	 */
	public function test_auto_config_overlay_sidebar_widgets_already_configured() {
		$sidebars_widgets_value = function () {
			return array(
				'sidebar-1'                      => array(),
				'jetpack-instant-search-sidebar' => array( 'jetpack-search-filters-11' ),
			);
		};
		add_filter( 'option_sidebars_widgets', $sidebars_widgets_value, 10, 2 );

		$this->assertNotTrue( self::$instant_search->auto_config_overlay_sidebar_widgets() );
		remove_filter( 'option_sidebars_widgets', $sidebars_widgets_value );
	}

	/**
	 * Test `auto_config_overlay_sidebar_widgets` success
	 */
	public function test_auto_config_overlay_sidebar_widgets_success() {
		$sidebars_widgets_value = function () {
			return array( 'sidebar-1' => 'jetpack-search-filters-12' );
		};
		add_filter( 'option_sidebars_widgets', $sidebars_widgets_value, 10, 2 );

		$func_jp_search_widgets = function () {
			return array(
				'12' => array(
					'filters' => array(
						array(
							'name'  => '',
							'type'  => 'post_type',
							'count' => 5,
						),
					),
				),
			);
		};
		add_filter( 'option_' . Helper::get_widget_option_name(), $func_jp_search_widgets, 10, 2 );

		self::$instant_search->auto_config_overlay_sidebar_widgets();

		remove_filter( 'option_sidebars_widgets', $sidebars_widgets_value );
		remove_filter( 'option_' . Helper::get_widget_option_name(), $func_jp_search_widgets );

		$sidebars_widgets = get_option( 'sidebars_widgets' );

		$this->assertEquals( 'jetpack-search-filters-13', $sidebars_widgets['jetpack-instant-search-sidebar'][0] );
	}

}
