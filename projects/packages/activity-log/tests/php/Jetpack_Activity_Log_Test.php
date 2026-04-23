<?php
/**
 * Unit tests for the Jetpack_Activity_Log class.
 *
 * Ports the three gating cases from the legacy
 * `my-jetpack/tests/php/Activitylog_Test.php` — which was deleted when
 * the menu item moved into this package (#48244, Phase 1) — and aims
 * them at the new surfaces: `is_available()` and `add_wp_admin_submenu()`.
 *
 * @package automattic/jetpack-activity-log
 */

// After changing this file, consider increasing the version number ("VXXX") in all the files using this namespace, in
// order to ensure that the specific version of this file always get loaded. Otherwise, Jetpack autoloader might decide
// to load an older/newer version of the class (if, for example, both the standalone and bundled versions of the plugin
// are installed, or in some other cases).
namespace Automattic\Jetpack\Activity_Log\V0001;

use WorDBless\BaseTestCase;
use function get_current_user_id;
use function is_multisite;
use function wp_insert_user;
use function wp_set_current_user;

/**
 * Gating tests for the Activity Log admin page.
 */
class Jetpack_Activity_Log_Test extends BaseTestCase {

	/**
	 * Admin user id, seeded per-test.
	 *
	 * @var int
	 */
	protected $admin_id;

	/**
	 * Editor user id, seeded per-test.
	 *
	 * @var int
	 */
	protected $editor_id;

	/**
	 * Whether `is_user_connected()` should return true in the current
	 * test. Flipped per-test; the `user_tokens` option mock reads it.
	 *
	 * @var bool
	 */
	private $is_user_connected = true;

	/**
	 * Stand the users up and mock the Jetpack site/user connection so
	 * `is_available()`'s connection gate passes by default. Individual
	 * tests that want the not-connected branch toggle
	 * `$this->is_user_connected` before calling the helper.
	 */
	protected function set_up() {
		$this->admin_id  = wp_insert_user(
			array(
				'user_login' => 'activity_log_admin',
				'user_pass'  => 'pw',
				'role'       => 'administrator',
			)
		);
		$this->editor_id = wp_insert_user(
			array(
				'user_login' => 'activity_log_editor',
				'user_pass'  => 'pw',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( 0 );

		$this->is_user_connected = true;
		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_connection_options' ), 10, 2 );
	}

	/**
	 * Restore any filters and reset the current user.
	 */
	protected function tear_down() {
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_connection_options' ), 10 );
		wp_set_current_user( 0 );
	}

	/**
	 * `is_available()` returns false on multisite regardless of role or
	 * connection state. Ported from the legacy
	 * `test_add_submenu_jetpack_multisite` case.
	 */
	public function test_is_available_returns_false_on_multisite() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Multisite gating only runs on multisite.' );
		}

		wp_set_current_user( $this->admin_id );

		$this->assertFalse( Jetpack_Activity_Log::is_available() );
	}

	/**
	 * Editors shouldn't see the Activity Log menu. Ported from
	 * `test_add_submenu_jetpack_editor`.
	 */
	public function test_is_available_returns_false_for_editors() {
		wp_set_current_user( $this->editor_id );

		$this->assertFalse( Jetpack_Activity_Log::is_available() );
	}

	/**
	 * Admins with a user-level WPCOM connection see the menu. Ported
	 * from `test_add_submenu_jetpack_admin`.
	 */
	public function test_is_available_returns_true_for_connected_admin() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Single-site admin gating only runs on single-site.' );
		}

		wp_set_current_user( $this->admin_id );

		$this->assertTrue( Jetpack_Activity_Log::is_available() );
	}

	/**
	 * Same admin, but without a user-level WPCOM connection — the menu
	 * stays hidden. This branch didn't exist in the legacy my-jetpack
	 * test because that class registered the menu unconditionally; the
	 * connection check moved into the gating helper when the page went
	 * native (#48244, Phase 1).
	 */
	public function test_is_available_returns_false_for_unconnected_admin() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Single-site admin gating only runs on single-site.' );
		}

		wp_set_current_user( $this->admin_id );
		$this->is_user_connected = false;

		$this->assertFalse( Jetpack_Activity_Log::is_available() );
	}

	/**
	 * `add_wp_admin_submenu()` short-circuits to null when
	 * `is_available()` would return false, regardless of whether the
	 * surrounding Admin_Menu::add_menu call would accept the parameters.
	 */
	public function test_add_wp_admin_submenu_short_circuits_when_unavailable() {
		wp_set_current_user( $this->editor_id );

		$this->assertNull( Jetpack_Activity_Log::add_wp_admin_submenu() );
	}

	/**
	 * Intercept the `Jetpack_Options` read and provide enough of a
	 * site/user connection that `Connection_Manager::is_user_connected()`
	 * returns the value of `$this->is_user_connected`. Pattern lifted
	 * from `Blaze\Dashboard_REST_Controller_Test`.
	 *
	 * @param mixed  $value The current option value.
	 * @param string $name  Option name.
	 * @return mixed
	 */
	public function mock_jetpack_connection_options( $value, $name ) {
		switch ( $name ) {
			case 'blog_token':
				return 'blog.token';
			case 'id':
				return '1234';
			case 'user_tokens':
				if ( ! $this->is_user_connected ) {
					return array();
				}
				$current_user_id = get_current_user_id();
				if ( $current_user_id ) {
					return array(
						$current_user_id => sprintf(
							'token%d.secret%d.%d',
							$current_user_id,
							$current_user_id,
							$current_user_id
						),
					);
				}
		}

		return $value;
	}
}
