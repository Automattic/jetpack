<?php
/**
 * Tests for WPCom Tracking for WP Admin Page Views.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Unified_Admin_Page_View;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-unified-admin-page-view/wpcom-unified-admin-page-view.php';

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class WPCOM_Unified_Admin_Page_View_Test extends \WorDBless\BaseTestCase {
	/**
	 * Set up the WordPress fixtures and function mocks.
	 */
	public function set_up() {
		parent::set_up();
		\Brain\Monkey\setUp();
	}

	/**
	 * Remove the function mocks.
	 */
	public function tear_down() {
		\Brain\Monkey\tearDown();
		parent::tear_down();
	}

	/**
	 * Tests that we track admin page views for all users.
	 *
	 * @dataProvider user_meta_provider
	 *
	 * @param bool $is_wpcom         Whether the site is a WordPress.com site.
	 * @param bool $is_automattician Whether the user is an Automattician.
	 * @param bool $is_network_admin Whether the user is a network admin.
	 */
	#[DataProvider( 'user_meta_provider' )]
	public function test_all_users_page_view_event(
		$is_wpcom,
		$is_automattician,
		$is_network_admin
	) {
		define( 'IS_WPCOM', $is_wpcom );
		define( 'WP_NETWORK_ADMIN', $is_network_admin );
		Functions\when( 'is_automattician' )->justReturn( $is_automattician );

		$user_id = wp_insert_user(
			array(
				'user_login'      => 'tracking-test-user',
				'user_pass'       => 'test-password',
				'user_registered' => gmdate( 'Y-m-d H:i:s', time() - 30 * DAY_IN_SECONDS ),
			)
		);
		$this->assertIsInt( $user_id );
		$GLOBALS['current_user'] = get_userdata( $user_id );
		set_current_screen( 'dashboard' );

		if ( $is_wpcom ) {
			require_once ABSPATH . WPINC . '/class-wp-site.php';
			$GLOBALS['current_blog'] = new \WP_Site( (object) array( 'blog_id' => '123' ) );
			\Mockery::mock( 'alias:WPCOM_User' )->shouldReceive( 'get_types' )->once()->andReturn( array( 'Paid' ) );
		} else {
			Functions\stubs(
				array(
					'_wpcom_get_current_blog_id' => 123,
					'wpcomsh_get_wpcom_active_subscriptions' => array(),
					'wpcom_site_has_feature'     => false,
				)
			);
		}

		ob_start();
		try {
			wpcom_unified_track_admin_page_views();
			$output = ob_get_contents();
		} finally {
			ob_end_clean();
		}

		$this->assertStringContainsString( "[ 'recordEvent', 'wpcom_unified_admin_page_view', _admin_pv_props ]", $output );
		$this->assertStringContainsString( "[ 'identifyUser', $user_id, \"tracking-test-user\" ]", $output );
		$this->assertSame( 1, preg_match( '/var _admin_pv_props = (.+);/', $output, $matches ) );
		$this->assertSame(
			array(
				'route'           => $is_network_admin ? 'dashboard-network' : 'dashboard',
				'source'          => 'wp-admin',
				'is_block_editor' => false,
				'blog_id'         => $is_wpcom ? '123' : 123,
				'user_type'       => $is_wpcom ? 'Paid' : '',
			),
			json_decode( $matches[1], true, 512, JSON_THROW_ON_ERROR )
		);
	}

	public static function user_meta_provider(): array {
		return array(
			'Simple Automattician' => array( true, true, false ),
			'Simple network admin' => array( true, false, true ),
			'Atomic user'          => array( false, false, false ),
		);
	}
}
