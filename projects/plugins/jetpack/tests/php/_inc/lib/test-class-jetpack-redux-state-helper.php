<?php
/**
 * Redux State Helper unit tests.
 *
 * @package automattic/jetpack
 */

jetpack_require_lib( 'admin-pages/class-jetpack-redux-state-helper' );

/**
 * Class for testing the Jetpack_Redux_State_Helper class.
 *
 * @coversDefaultClass Jetpack_Redux_State_Helper
 */
class WP_Test_Jetpack_Redux_State_Helper extends WP_UnitTestCase {
	/**
	 * Theme features.
	 *
	 * @var array
	 */
	private $theme_features;

	/**
	 * Saving the original theme features.
	 */
	public function set_up() {
		parent::set_up();

		global $_wp_theme_features;
		$this->theme_features = $_wp_theme_features;
	}

	/**
	 * Restoring the original theme features.
	 */
	public function tear_down() {
		global $_wp_theme_features;

		$_wp_theme_features = $this->theme_features;
		parent::tear_down();
	}

	/**
	 * Tests whether get_initial_state() signals that the theme supports widgets.
	 *
	 * @covers ::get_initial_state
	 */
	public function test_theme_support_widgets() {
		add_theme_support( 'widgets' );

		$redux_state = Jetpack_Redux_State_Helper::get_initial_state();
		$this->assertSame( true, $redux_state['themeData']['support']['widgets'] );
	}

	/**
	 * Tests whether get_initial_state() signals that the theme does not support widgets.
	 *
	 * @covers ::get_initial_state
	 */
	public function test_theme_do_not_support_widgets() {
		_remove_theme_support( 'widgets' );

		$redux_state = Jetpack_Redux_State_Helper::get_initial_state();
		$this->assertSame( false, $redux_state['themeData']['support']['widgets'] );
	}
}
