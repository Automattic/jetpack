<?php
/**
 * Tests for WPCom Tracking for WP Admin Page Views.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Wpadmin_Page_View;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

require_once Jetpack_Mu_Wpcom::PKG_DIR . '../../plugins/wpcomsh/support-session.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-wpadmin-page-view/wpcom-wpadmin-page-view.php';

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class WPCOM_WPAdmin_Page_View_Test extends TestCase {
	use \Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;

	/**
	 * Used to mock global functions inside a namespace.
	 *
	 * @see https://github.com/php-mock/php-mock-phpunit
	 */
	use \phpmock\phpunit\PHPMock;

	public function setUp(): void {
		Monkey\setUp();
		parent::setUp();
	}

	public function tear_down() {
		Monkey\tearDown();
	}

	/**
	 * @dataProvider wpcom_nosara_track_admin_page_views_does_not_track_a11ns_provider
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	public function test_wpcom_nosara_track_admin_page_views_does_not_track_a11ns(
		$is_wpcom,
		$is_automattician,
		$is_network_admin
	) {
		define( 'IS_WPCOM', $is_wpcom );
		$this->assertTrue( defined( 'IS_WPCOM' ), 'IS_WPCOM should be defined' );
		$this->assertSame( IS_WPCOM, $is_wpcom, 'IS_WPCOM should equal the provided value' );

		if ( ! defined( 'WP_NETWORK_ADMIN' ) ) {
			define( 'WP_NETWORK_ADMIN', $is_network_admin );
		}
		$this->assertTrue( defined( 'WP_NETWORK_ADMIN' ), 'WP_NETWORK_ADMIN should be defined' );
		$this->assertSame( WP_NETWORK_ADMIN, $is_network_admin, 'WP_NETWORK_ADMIN should equal the provided value' );

		Functions\stubs(
			array(
				'is_automattician' => $is_automattician,
			)
		);

		// atomic setup not working :/
		// if ( ! $is_wpcom ) {
		// }

		ob_start();
		wpcom_nosara_track_admin_page_views();
		$output = ob_get_clean();

		$this->assertSame( '', $output );
	}

	public function wpcom_nosara_track_admin_page_views_does_not_track_a11ns_provider() {
		return array(
			array( true, true, null ),
			array( true, false, true ),
			array( false, null, null ),
		);
	}
}
