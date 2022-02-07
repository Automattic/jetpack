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
		add_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_sidebar_configured' ), 10, 2 );
		$this->assertNotTrue( self::$instant_search->auto_config_overlay_sidebar_widgets() );
		remove_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_sidebar_configured' ) );
	}

	/**
	 * Test `auto_config_overlay_sidebar_widgets` success
	 */
	public function test_auto_config_overlay_sidebar_widgets_success() {
		add_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_sidebar_configured' ), 10, 2 );
		add_filter( 'option_' . Helper::get_widget_option_name(), array( $this, 'sidebars_widgets_jp_sidebar_configured' ), 10, 2 );
		self::$instant_search->auto_config_overlay_sidebar_widgets();
		remove_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_sidebar_configured' ) );
		remove_filter( 'option_' . Helper::get_widget_option_name(), array( $this, 'sidebars_widgets_jp_sidebar_configured' ) );

		$sidebars_widgets = get_option( 'sidebars_widgets' );
		$this->assertEquals( 'jetpack-search-filters-13', $sidebars_widgets['jetpack-instant-search-sidebar'][0] );
	}

	/**
	 * Test `auto_config_theme_sidebar_search_widget` failed - no sidebar
	 */
	public function test_auto_config_theme_sidebar_search_widget_no_sidebar() {
		add_filter( 'option_sidebars_widgets', '__return_false', 10, 2 );
		$this->assertNull( self::$instant_search->auto_config_theme_sidebar_search_widget() );
		remove_filter( 'option_sidebars_widgets', '__return_false' );
	}

	/**
	 * Test `auto_config_theme_sidebar_search_widget` failed - already has JP search widget
	 */
	public function test_auto_config_theme_sidebar_search_widget_already_configured() {
		add_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_sidebar_configured' ), 10, 2 );
		$this->assertNull( self::$instant_search->auto_config_theme_sidebar_search_widget() );
		remove_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_sidebar_configured' ) );
	}

	/**
	 * Test `auto_config_theme_sidebar_search_widget` failed - already has JP search widget
	 */
	public function test_auto_config_theme_sidebar_search_widget_replace_success() {
		add_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_has_core_search' ), 10, 2 );
		add_filter( 'option_' . Helper::get_widget_option_name(), '__return_false', 10, 2 );
		self::$instant_search->auto_config_theme_sidebar_search_widget();
		remove_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_has_core_search' ) );
		remove_filter( 'option_' . Helper::get_widget_option_name(), '__return_false' );

		$sidebars_widgets = get_option( 'sidebars_widgets' );
		$this->assertEquals( 'jetpack-search-filters-1', $sidebars_widgets['sidebar-1'][0] );
	}

	/**
	 * Test `auto_config_theme_sidebar_search_widget` failed - no search widget
	 */
	public function test_auto_config_theme_sidebar_search_widget_add_success() {
		add_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_empty_sidebar' ), 10, 2 );
		add_filter( 'option_' . Helper::get_widget_option_name(), '__return_false', 10, 2 );
		self::$instant_search->auto_config_theme_sidebar_search_widget();
		remove_filter( 'option_sidebars_widgets', array( $this, 'sidebars_widgets_theme_empty_sidebar' ) );
		remove_filter( 'option_' . Helper::get_widget_option_name(), '__return_false' );

		$sidebars_widgets = get_option( 'sidebars_widgets' );
		$this->assertEquals( 'jetpack-search-filters-1', $sidebars_widgets['sidebar-1'][0] );
	}

	/**
	 * Test `auto_config_result_format` - already configured
	 */
	public function test_auto_config_result_format_already_configured() {
		$result_format_option_name = Options::OPTION_PREFIX . 'result_format';

		$return_expaned_result_format = function () {
			return Options::RESULT_FORMAT_MINIMAL;
		};
		add_filter( 'option_' . $result_format_option_name, $return_expaned_result_format, 10, 2 );
		$this->assertNull( self::$instant_search->auto_config_result_format() );
		remove_filter( 'option_' . $result_format_option_name, $return_expaned_result_format );
	}

	/**
	 * Test `auto_config_result_format` - not set
	 */
	public function test_auto_config_result_format_not_set() {
		$result_format_option_name = Options::OPTION_PREFIX . 'result_format';

		add_filter( 'option_' . $result_format_option_name, '__return_false', 10, 2 );
		self::$instant_search->auto_config_result_format();
		remove_filter( 'option_' . $result_format_option_name, '__return_false' );

		$this->assertEquals( Options::RESULT_FORMAT_EXPANDED, get_option( $result_format_option_name, false ) );
	}

	/**
	 * Test `auto_config_result_format` - WooCommerce
	 */
	public function test_auto_config_result_format_woocommerce() {
		$result_format_option_name = Options::OPTION_PREFIX . 'result_format';

		add_filter( 'option_' . $result_format_option_name, '__return_false', 10, 2 );
		add_filter( 'active_plugins', array( $this, 'active_plugins_has_woocommerce' ), 10, 1 );
		self::$instant_search->auto_config_result_format();
		remove_filter( 'option_' . $result_format_option_name, '__return_false' );
		remove_filter( 'active_plugins', array( $this, 'active_plugins_has_woocommerce' ) );

		$this->assertEquals( Options::RESULT_FORMAT_PRODUCT, get_option( $result_format_option_name, false ) );
	}

	/**
	 * Value for sidebars_widgets - jp_sidebar_configured
	 */
	public function sidebars_widgets_jp_sidebar_configured() {
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
	}

	/**
	 * Value for sidebars_widgets - theme_sidebar_configured
	 */
	public function sidebars_widgets_theme_sidebar_configured() {
		return array( 'sidebar-1' => 'jetpack-search-filters-12' );
	}

	/**
	 * Value for sidebars_widgets - theme_has_core_search
	 */
	public function sidebars_widgets_theme_has_core_search() {
			return array( 'sidebar-1' => array( 'search-12' ) );
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
