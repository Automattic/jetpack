<?php
/**
 * Shared Jetpack admin page tests.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-settings-react-page.php';

/**
 * @covers \Jetpack_Admin_Page
 */
#[CoversClass( Jetpack_Admin_Page::class )]
class Jetpack_Admin_Page_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Log in as an administrator.
	 */
	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	/**
	 * @dataProvider rest_probe_cases
	 */
	#[DataProvider( 'rest_probe_cases' )]
	public function test_rest_probe_preserves_the_current_user( $auth, $switch_user, $expected ) {
		global $wp_rest_auth_cookie;
		$original_cookie     = $wp_rest_auth_cookie;
		$user_id             = get_current_user_id();
		$other_user_id       = $switch_user ? self::factory()->user->create( array( 'role' => 'editor' ) ) : 0;
		$wp_rest_auth_cookie = true;
		add_filter(
			'rest_authentication_errors',
			static function () use ( $auth, $other_user_id ) {
				if ( $other_user_id ) {
					wp_set_current_user( $other_user_id );
				}
				return $auth;
			}
		);

		try {
			$this->assertGreaterThan( 0, $user_id );
			$this->assertSame( $expected, ( new Jetpack_Settings_React_Page() )->is_rest_api_enabled() );
			$this->assertSame( $user_id, get_current_user_id() );
		} finally {
			$wp_rest_auth_cookie = $original_cookie;
		}
	}

	public static function rest_probe_cases() {
		return array(
			'null'        => array( null, false, true ),
			'false'       => array( false, false, true ),
			'WP_Error'    => array( new WP_Error( 'rest_denied' ), false, false ),
			'switch user' => array( true, true, true ),
		);
	}

	/**
	 * Tests that the PHP masthead links to the Settings page and no longer offers the old dashboard.
	 */
	public function test_masthead_links_to_the_settings_page_only() {
		ob_start();
		Jetpack_Admin_Page::wrap_ui( '__return_null' );
		$output = ob_get_clean();

		$this->assertStringContainsString( esc_url( admin_url( 'admin.php?page=jetpack-settings#/settings' ) ), $output );
		$this->assertStringNotContainsString( '>' . __( 'Dashboard', 'jetpack' ) . '<', $output );
	}

	/**
	 * Tests that the plan check runs on the Settings page, as it did at page=jetpack.
	 */
	public function test_plan_check_runs_on_the_settings_page() {
		$result = ( new Jetpack_Settings_React_Page() )->check_plan_deactivate_modules( WP_Screen::get( 'jetpack_page_jetpack-settings' ) );

		$this->assertIsArray( $result );
	}
}
