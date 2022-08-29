<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Test class `Instant_Search`
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Instant_Search class auto config widgets.
 *
 * @package automattic/jetpack-search
 */
class Test_Instant_Search_Auto_Config_JP_Search_Widget extends TestCase {
	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {
		Instant_Search::initialize( -1 );
	}

	/**
	 * Test `auto_config_overlay_sidebar_widgets` already configured
	 */
	public function test_auto_config_overlay_sidebar_widgets_already_configured() {
		add_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_overlay_sidebar_configured' ) );
		$this->assertNull( Instant_Search::instance()->auto_config_overlay_sidebar_widgets() );
		remove_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_overlay_sidebar_configured' ) );
	}

	/**
	 * Test `auto_config_overlay_sidebar_widgets` copy from theme sidebar
	 */
	public function test_auto_config_overlay_sidebar_widgets_copy_from_theme_sidebar() {
		add_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_sidebar_configured' ) );
		add_filter( 'option_widget_jetpack-search-filters', array( $this, 'jp_search_widgets' ) );
		$this->assertTrue( Instant_Search::instance()->auto_config_overlay_sidebar_widgets() );
		remove_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_sidebar_configured' ) );
		remove_filter( 'option_widget_jetpack-search-filters', array( $this, 'jp_search_widgets' ) );

		$sidebars_widgets = get_option( 'sidebars_widgets' );
		$this->assertEquals( 'jetpack-search-filters-13', $sidebars_widgets[ Instant_Search::INSTANT_SEARCH_SIDEBAR ][0] );
	}

	/**
	 * Test `auto_config_non_fse_theme_sidebar_search_widget` skip - no sidebar
	 */
	public function test_auto_config_non_fse_theme_sidebar_search_widget_no_sidebar() {
		add_filter( 'option_sidebars_widgets', '__return_false' );
		$this->assertNull( Instant_Search::instance()->auto_config_non_fse_theme_sidebar_search_widget() );
		remove_filter( 'option_sidebars_widgets', '__return_false' );
	}

	/**
	 * Test `auto_config_non_fse_theme_sidebar_search_widget` skip - already has JP search widget
	 */
	public function test_auto_config_non_fse_theme_sidebar_search_widget_already_configured() {
		add_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_sidebar_configured' ) );
		$this->assertNull( Instant_Search::instance()->auto_config_non_fse_theme_sidebar_search_widget() );
		remove_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_sidebar_configured' ) );
	}

	/**
	 * Test `auto_config_non_fse_theme_sidebar_search_widget` replace core search widget
	 */
	public function test_auto_config_non_fse_theme_sidebar_search_widget_replace_success() {
		add_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_has_core_search' ) );
		add_filter( 'option_' . Helper::get_widget_option_name(), '__return_false' );
		$this->assertTrue( Instant_Search::instance()->auto_config_non_fse_theme_sidebar_search_widget() );
		remove_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_has_core_search' ) );
		remove_filter( 'option_' . Helper::get_widget_option_name(), '__return_false' );

		$sidebars_widgets = get_option( 'sidebars_widgets' );
		$this->assertEquals( 'jetpack-search-filters-1', $sidebars_widgets['sidebar-1'][0] );
	}

	/**
	 * Test `auto_config_non_fse_theme_sidebar_search_widget` replace core search widget.
	 *
	 * @see https://github.com/Automattic/jetpack/issues/22588
	 */
	public function test_auto_config_theme_sidebar_search_block_replace_success() {
		add_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_has_search_block' ) );
		add_filter( 'option_' . Helper::get_widget_option_name(), '__return_false' );
		add_filter( 'option_widget_block', array( $this, 'widget_block_widgets' ) );
		$this->assertTrue( Instant_Search::instance()->auto_config_non_fse_theme_sidebar_search_widget() );
		remove_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_has_search_block' ) );
		remove_filter( 'option_' . Helper::get_widget_option_name(), '__return_false' );
		remove_filter( 'option_widget_block', array( $this, 'widget_block_widgets' ) );

		$sidebars_widgets = get_option( 'sidebars_widgets' );
		$this->assertEquals( 'jetpack-search-filters-1', $sidebars_widgets['sidebar-1'][0] );
	}

	/**
	 * Test `auto_config_non_fse_theme_sidebar_search_widget` success - no search widget
	 */
	public function test_auto_config_non_fse_theme_sidebar_search_widget_add_success() {
		add_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_empty_sidebar' ) );
		add_filter( 'option_' . Helper::get_widget_option_name(), '__return_false' );
		$this->assertTrue( Instant_Search::instance()->auto_config_non_fse_theme_sidebar_search_widget() );
		remove_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_empty_sidebar' ) );
		remove_filter( 'option_' . Helper::get_widget_option_name(), '__return_false' );

		$sidebars_widgets = get_option( 'sidebars_widgets' );
		$this->assertEquals( 'jetpack-search-filters-1', $sidebars_widgets['sidebar-1'][0] );
	}

	/**
	 * Test `auto_config_result_format` skip - already configured
	 */
	public function test_auto_config_result_format_already_configured() {
		$result_format_option_name = Options::OPTION_PREFIX . 'result_format';

		$return_expaned_result_format = function () {
			return Options::RESULT_FORMAT_MINIMAL;
		};
		add_filter( 'option_' . $result_format_option_name, $return_expaned_result_format );
		$this->assertNull( Instant_Search::instance()->auto_config_result_format() );
		remove_filter( 'option_' . $result_format_option_name, $return_expaned_result_format );
	}

	/**
	 * Test `auto_config_result_format` default format - not set
	 */
	public function test_auto_config_result_format_not_set() {
		$result_format_option_name = Options::OPTION_PREFIX . 'result_format';

		add_filter( 'option_' . $result_format_option_name, '__return_false' );
		$this->assertTrue( Instant_Search::instance()->auto_config_result_format() );
		remove_filter( 'option_' . $result_format_option_name, '__return_false' );

		$this->assertEquals( Options::RESULT_FORMAT_EXPANDED, get_option( $result_format_option_name, false ) );
	}

	/**
	 * Test `auto_config_result_format` product format - WooCommerce
	 */
	public function test_auto_config_result_format_woocommerce() {
		$result_format_option_name = Options::OPTION_PREFIX . 'result_format';

		add_filter( 'option_' . $result_format_option_name, '__return_false' );
		add_filter( 'active_plugins', array( $this, 'active_plugins_has_woocommerce' ) );
		$this->assertTrue( Instant_Search::instance()->auto_config_result_format() );
		remove_filter( 'option_' . $result_format_option_name, '__return_false' );
		remove_filter( 'active_plugins', array( $this, 'active_plugins_has_woocommerce' ) );

		$this->assertEquals( Options::RESULT_FORMAT_PRODUCT, get_option( $result_format_option_name, false ) );
	}

	/**
	 * Value for sidebars_widgets - jp_sidebar_configured
	 */
	public function jp_search_widgets() {
		return array(
			'_multiwidget' => 1,
			12             =>
			array(
				'title'   => '',
				'filters' =>
				array(
					array(
						'name'     => '',
						'type'     => 'taxonomy',
						'taxonomy' => 'category',
						'count'    => 5,
					),
					array(
						'name'     => '',
						'type'     => 'taxonomy',
						'taxonomy' => 'post_tag',
						'count'    => 5,
					),
					array(
						'name'     => '',
						'type'     => 'date_histogram',
						'count'    => 5,
						'field'    => 'post_date',
						'interval' => 'year',
					),
				),
			),
		);
	}

	/**
	 * Value for sidebars_widgets - theme_sidebar_configured
	 */
	public function sidebars_widgets_theme_sidebar_configured() {
		return array( 'sidebar-1' => array( 'jetpack-search-filters-12' ) );
	}

		/**
		 * Value for sidebars_widgets - theme_sidebar_configured
		 */
	public function sidebars_widgets_overlay_sidebar_configured() {
		return array( Instant_Search::INSTANT_SEARCH_SIDEBAR => array( 'jetpack-search-filters-12' ) );
	}

	/**
	 * Value for sidebars_widgets - theme_has_core_search
	 */
	public function sidebars_widgets_theme_has_core_search() {
			return array( 'sidebar-1' => array( 'search-12' ) );
	}

	/**
	 * Value for sidebars_widgets - theme_has_core_search
	 */
	public function sidebars_widgets_theme_has_search_block() {
		return array( 'sidebar-1' => array( 'block-12' ) );
	}

	/**
	 * Value for sidebars_widgets - theme_has_core_search
	 */
	public function widget_block_widgets() {
		return array( '12' => '<!-- wp:search /-->' );
	}

	/**
	 * Value for sidebars_widgets - theme_empty_sidebar
	 */
	public function sidebars_widgets_theme_empty_sidebar() {
		return array( 'sidebar-1' => array() );
	}

	/**
	 * WooCommerce is activated.
	 */
	public function active_plugins_has_woocommerce() {
		return array( 'woocommerce/woocommerce.php' );
	}

}
