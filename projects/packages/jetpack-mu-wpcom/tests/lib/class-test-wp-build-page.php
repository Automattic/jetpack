<?php
/**
 * A minimal wp-build page for testing the shared base.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_WP_Build_Page;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/common/class-wpcom-wp-build-page.php';

/**
 * A wp-build page whose build directory a test can point anywhere.
 */
class Test_WP_Build_Page extends WPCOM_WP_Build_Page {

	const MENU_SLUG         = 'jetpack-test-page';
	const WP_BUILD_PAGE     = 'test-page';
	const INITIAL_STATE_VAR = 'testPageInitialState';

	/**
	 * Build directory override, or null for the package's own.
	 *
	 * @var string|null
	 */
	public static $build_dir = null;

	/**
	 * The initial state the page hands over.
	 *
	 * @var array
	 */
	public static $initial_state = array( 'enabled' => true );

	/**
	 * The build directory.
	 *
	 * @return string
	 */
	public static function build_dir() {
		return self::$build_dir ?? parent::build_dir();
	}

	/**
	 * The page title.
	 *
	 * @return string
	 */
	public static function get_page_title() {
		return 'Test Page';
	}

	/**
	 * The menu entry's label.
	 *
	 * @return string
	 */
	public static function get_menu_title() {
		return 'Test';
	}

	/**
	 * The initial state.
	 *
	 * @return array
	 */
	public static function get_initial_state() {
		return self::$initial_state;
	}
}
