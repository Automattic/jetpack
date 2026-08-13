<?php
/**
 * Tests for VideoPress availability and its script data.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/videopress-availability.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\is_videopress_available
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_videopress_availability
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_videopress_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\is_videopress_available' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_videopress_availability' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_videopress_script_data' )]
class Videopress_Availability_Test extends BaseTestCase {

	/**
	 * Reset constants, options, and filters between tests.
	 */
	public function tear_down() {
		Constants::clear_constants();
		Cache::clear();
		delete_option( 'jetpack_active_modules' );
		remove_all_filters( VIDEOPRESS_AVAILABLE_FILTER );
		remove_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_videopress_script_data', 20 );

		parent::tear_down();
	}

	/**
	 * A site with neither the module nor the plugin has no VideoPress.
	 */
	public function test_videopress_is_unavailable_without_module_or_plugin() {
		$this->assertFalse( is_videopress_available() );
	}

	/**
	 * The Jetpack VideoPress module makes it available.
	 */
	public function test_videopress_is_available_with_the_jetpack_module() {
		update_option( 'jetpack_active_modules', array( 'videopress' ) );

		$this->assertTrue( is_videopress_available() );
	}

	/**
	 * The standalone VideoPress plugin defines its root-file constant as it loads.
	 */
	public function test_videopress_is_available_with_the_standalone_plugin() {
		Constants::set_constant( 'JETPACK_VIDEOPRESS_ROOT_FILE', '/plugins/videopress/jetpack-videopress.php' );

		$this->assertTrue( is_videopress_available() );
	}

	/**
	 * The WPCOM platform reads the plan feature, never the module list.
	 *
	 * `wpcom_site_has_feature()` does not exist in this environment, so an active
	 * module must not be enough to answer true.
	 *
	 * @dataProvider provide_wpcom_platform_sites
	 */
	#[DataProvider( 'provide_wpcom_platform_sites' )]
	public function test_videopress_follows_the_plan_feature_on_the_wpcom_platform( $constants ) {
		foreach ( $constants as $name => $value ) {
			Constants::set_constant( $name, $value );
		}
		update_option( 'jetpack_active_modules', array( 'videopress' ) );

		$this->assertFalse( is_videopress_available() );
	}

	/**
	 * The constants that place a site on each half of the WPCOM platform.
	 *
	 * @return array<string, array{array<string, mixed>}>
	 */
	public static function provide_wpcom_platform_sites() {
		return array(
			'Simple' => array( array( 'IS_WPCOM' => true ) ),
			'Atomic' => array(
				array(
					'ATOMIC_SITE_ID'       => 123,
					'ATOMIC_CLIENT_ID'     => 456,
					'WPCOMSH__PLUGIN_FILE' => '/plugins/wpcomsh/wpcomsh.php',
				),
			),
		);
	}

	/**
	 * Consumers can override the detection either way.
	 */
	public function test_videopress_availability_is_filterable() {
		add_filter( VIDEOPRESS_AVAILABLE_FILTER, '__return_true' );
		$this->assertTrue( is_videopress_available(), 'The filter can force detection on.' );

		remove_all_filters( VIDEOPRESS_AVAILABLE_FILTER );
		update_option( 'jetpack_active_modules', array( 'videopress' ) );
		$this->assertTrue( is_videopress_available(), 'Baseline: the module makes it available.' );

		add_filter( VIDEOPRESS_AVAILABLE_FILTER, '__return_false' );
		$this->assertFalse( is_videopress_available(), 'The filter can force detection off.' );
	}

	/**
	 * The flag rides along with the rest of the Premium Analytics script data.
	 */
	public function test_script_data_carries_the_flag_without_clobbering_siblings() {
		add_filter( VIDEOPRESS_AVAILABLE_FILTER, '__return_true' );

		$data = inject_videopress_script_data(
			array(
				'premium_analytics' => array(
					'initial_full_sync_finished' => 0,
				),
			)
		);

		$this->assertSame( 0, $data['premium_analytics']['initial_full_sync_finished'] );
		$this->assertTrue( $data['premium_analytics']['has_videopress'] );
	}

	/**
	 * Sites without VideoPress publish the flag as false rather than omitting it.
	 */
	public function test_script_data_reports_false_without_videopress() {
		$data = inject_videopress_script_data( array() );

		$this->assertFalse( $data['premium_analytics']['has_videopress'] );
	}

	/**
	 * Configure registers the script data filter.
	 */
	public function test_configure_registers_script_data_filter() {
		configure_videopress_availability();

		$this->assertNotFalse(
			has_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_videopress_script_data' )
		);
	}
}
