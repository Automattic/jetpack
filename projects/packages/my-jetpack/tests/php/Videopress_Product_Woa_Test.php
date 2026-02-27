<?php
/**
 * Tests for VideoPress product behavior on WoA sites.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\My_Jetpack\Products\Videopress;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

require_once __DIR__ . '/assets/wpcom-feature-mocks.php';

/**
 * Tests for VideoPress product status and activation on WoA.
 */
class Videopress_Product_Woa_Test extends TestCase {

	/**
	 * The current user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * Filter callback for making the videopress module active.
	 *
	 * @param array $modules Active modules.
	 * @return array
	 */
	public static function add_videopress_module( $modules ) {
		$modules[] = 'videopress';
		return $modules;
	}

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->install_mock_plugins();
		wp_cache_delete( 'plugins', 'plugins' );

		self::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( self::$user_id );
	}

	/**
	 * Installs mock plugins.
	 */
	public function install_mock_plugins() {
		$plugin_dir = WP_PLUGIN_DIR . '/' . Videopress::$plugin_slug;
		if ( ! file_exists( $plugin_dir ) ) {
			mkdir( $plugin_dir, 0777, true );
		}
		if ( ! file_exists( WP_PLUGIN_DIR . '/jetpack' ) ) {
			mkdir( WP_PLUGIN_DIR . '/jetpack', 0777, true );
		}
		copy( __DIR__ . '/assets/videopress-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack-videopress/jetpack-videopress.php' );
		copy( __DIR__ . '/assets/jetpack-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		unset( $GLOBALS['wpcom_test_feature_exists'] );
		unset( $GLOBALS['wpcom_test_site_features'] );
		remove_filter( 'jetpack_active_modules', array( __CLASS__, 'add_videopress_module' ) );
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Simulate a WoA site where the 'videopress' feature is known but the
	 * current plan does not include it (e.g. Personal plan).
	 */
	private function simulate_woa_without_videopress() {
		$GLOBALS['wpcom_test_feature_exists'] = array( 'videopress' );
		$GLOBALS['wpcom_test_site_features']  = array();
	}

	/**
	 * Simulate a WoA site where the current plan includes VideoPress
	 * (e.g. Premium or higher).
	 */
	private function simulate_woa_with_videopress() {
		$GLOBALS['wpcom_test_feature_exists'] = array( 'videopress' );
		$GLOBALS['wpcom_test_site_features']  = array( 'videopress' );
	}

	/**
	 * On WoA Personal (no videopress feature), is_active() should return false
	 * even when the plugin and module are active.
	 */
	public function test_is_active_returns_false_on_woa_without_videopress_feature() {
		$this->simulate_woa_without_videopress();
		activate_plugins( 'jetpack/jetpack.php' );
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'add_videopress_module' ) );

		$this->assertFalse( Videopress::is_active() );
	}

	/**
	 * On WoA Premium (has videopress feature), is_active() should return true
	 * when the plugin and module are active.
	 */
	public function test_is_active_returns_true_on_woa_with_videopress_feature() {
		$this->simulate_woa_with_videopress();
		activate_plugins( 'jetpack/jetpack.php' );
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'add_videopress_module' ) );

		$this->assertTrue( Videopress::is_active() );
	}

	/**
	 * On self-hosted (no wpcom functions active), is_active() should return true
	 * when the plugin and module are active — the free tier applies.
	 *
	 * Note: The mock wpcom_feature_exists() in wpcom-feature-mocks.php means
	 * Current_Plan::supports() follows the WoA path, but with no globals set
	 * it returns false, which still exercises the self-hosted-like free-tier
	 * fallback in the parent class.
	 */
	public function test_is_active_returns_true_on_self_hosted() {
		// Don't set any wpcom globals — simulates self-hosted.
		activate_plugins( 'jetpack/jetpack.php' );
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'add_videopress_module' ) );

		$this->assertTrue( Videopress::is_active() );
	}

	/**
	 * On WoA Personal with the module active, get_status() should return
	 * 'needs_plan' instead of 'needs_activation'.
	 */
	public function test_get_status_returns_needs_plan_on_woa_without_videopress_feature() {
		$this->simulate_woa_without_videopress();
		activate_plugins( 'jetpack/jetpack.php' );
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'add_videopress_module' ) );

		$this->assertSame( Products::STATUS_NEEDS_PLAN, Videopress::get_status() );
	}

	/**
	 * On WoA Personal with the module not active, get_status() should still
	 * not return 'needs_activation'.
	 */
	public function test_get_status_does_not_return_needs_activation_on_woa_without_videopress_feature() {
		$this->simulate_woa_without_videopress();
		activate_plugins( 'jetpack/jetpack.php' );

		$this->assertNotSame( Products::STATUS_NEEDS_ACTIVATION, Videopress::get_status() );
	}

	/**
	 * On WoA Premium (has videopress feature), get_status() should pass
	 * through the parent status unchanged.
	 */
	public function test_get_status_passes_through_on_woa_with_videopress_feature() {
		$this->simulate_woa_with_videopress();
		activate_plugins( 'jetpack/jetpack.php' );
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'add_videopress_module' ) );

		$status = Videopress::get_status();
		$this->assertNotSame( Products::STATUS_NEEDS_PLAN, $status );
	}

	/**
	 * On self-hosted, get_status() should not return 'needs_plan' —
	 * the free tier is available.
	 */
	public function test_get_status_does_not_return_needs_plan_on_self_hosted() {
		// Don't set any wpcom globals — simulates self-hosted.
		activate_plugins( 'jetpack/jetpack.php' );
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'add_videopress_module' ) );

		$this->assertNotSame( Products::STATUS_NEEDS_PLAN, Videopress::get_status() );
	}
}
