<?php
/**
 * Tests for the admin shell rollout on WordPress.com.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\DataProvider;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-feature-flags/class-wpcom-feature-flags.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-feature-flags/class-wpcom-admin-shell-rollout.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . '../../plugins/wpcomsh/support-session.php';

/**
 * Covers the precedence: kill switch, then the per-site override, then the Automattician default.
 */
class Wpcom_Admin_Shell_Rollout_Test extends \WorDBless\BaseTestCase {

	/**
	 * Whether the package bootstrap wired the default, captured before set_up() wires it by hand.
	 *
	 * @var int|false
	 */
	private static $bootstrap_wiring = false;

	/**
	 * Record the bootstrap's wiring before any test disturbs it.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		self::$bootstrap_wiring = has_filter( 'jetpack_feature_flag_enabled', array( Wpcom_Admin_Shell_Rollout::class, 'default_on_for_a11ns' ) );
	}

	/**
	 * Without the call in Jetpack_Mu_Wpcom::init(), every other test here still passes and the rollout ships inert.
	 */
	public function test_package_bootstrap_wires_the_rollout() {
		$this->assertSame( 5, self::$bootstrap_wiring );
	}

	/**
	 * Wire the filters the package bootstrap wires on real sites.
	 */
	public function set_up() {
		parent::set_up();

		Feature_Flags::register( Wpcom_Admin_Shell_Rollout::FLAG, array( 'default' => false ) );
		Wpcom_Feature_Flags::init();
		Wpcom_Admin_Shell_Rollout::init();
	}

	/**
	 * Reset the global state these tests touch.
	 */
	public function tear_down() {
		Constants::clear_constants();
		unset( $_COOKIE[ \WPCOMSH_Support_Session_Detect::COOKIE_NAME ] );
		delete_option( Wpcom_Feature_Flags::OVERRIDES_OPTION );
		delete_site_option( Wpcom_Admin_Shell_Rollout::KILL_SWITCH_OPTION );
		Wpcom_Feature_Flags::reset_overrides_cache();
		remove_all_filters( 'jetpack_feature_flag_enabled' );
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Wpcom_Admin_Shell_Rollout::FLAG );
		remove_all_filters( 'jetpack_admin_shell_enabled' );
		remove_all_filters( 'wpcom_admin_shell_kill_switch' );
		remove_all_actions( 'admin_menu' );
		Feature_Flags::reset();

		parent::tear_down();
	}

	/**
	 * Resolve the shell the way Admin_Shell::is_enabled() does.
	 *
	 * @return bool
	 */
	private function shell_enabled() {
		return (bool) apply_filters( 'jetpack_admin_shell_enabled', Feature_Flags::is_enabled( Wpcom_Admin_Shell_Rollout::FLAG ) );
	}

	/**
	 * Each layer of the precedence, alone and against the layers below it.
	 *
	 * @dataProvider provide_precedence
	 *
	 * @param bool      $a11n     Whether the visitor is a proxied Automattician on Atomic.
	 * @param bool|null $override The site's Tools → Feature Flags override, or null for none.
	 * @param bool      $killed   Whether the kill switch option is on.
	 * @param bool      $expected Whether the shell should be on.
	 */
	#[DataProvider( 'provide_precedence' )]
	public function test_precedence( $a11n, $override, $killed, $expected ) {
		if ( $a11n ) {
			Constants::set_constant( 'AT_PROXIED_REQUEST', true );
			$_COOKIE[ \WPCOMSH_Support_Session_Detect::COOKIE_NAME ] = 'false';
		}
		if ( null !== $override ) {
			update_option( Wpcom_Feature_Flags::OVERRIDES_OPTION, array( Wpcom_Admin_Shell_Rollout::FLAG => $override ) );
		}
		if ( $killed ) {
			update_site_option( Wpcom_Admin_Shell_Rollout::KILL_SWITCH_OPTION, 1 );
		}

		$this->assertSame( $expected, Feature_Flags::is_enabled( Wpcom_Admin_Shell_Rollout::FLAG ) );
		$this->assertSame( $expected, $this->shell_enabled() );
	}

	/**
	 * Data for test_precedence().
	 *
	 * @return array<string, array{bool, bool|null, bool, bool}>
	 */
	public static function provide_precedence() {
		return array(
			'Automattician'                         => array( true, null, false, true ),
			'not an Automattician'                  => array( false, null, false, false ),
			'override off beats the a11n default'   => array( true, false, false, false ),
			'override on for everyone'              => array( false, true, false, true ),
			'kill switch beats the a11n default'    => array( true, null, true, false ),
			'kill switch beats an override on'      => array( false, true, true, false ),
			'kill switch with a11n and override on' => array( true, true, true, false ),
		);
	}

	/**
	 * A support session reaches Atomic through the proxy too, but is not an Automattician dogfooding.
	 */
	public function test_support_session_stays_off() {
		Constants::set_constant( 'AT_PROXIED_REQUEST', true );
		$_COOKIE[ \WPCOMSH_Support_Session_Detect::COOKIE_NAME ] = 'true';

		$this->assertFalse( $this->shell_enabled() );
	}

	/**
	 * WordPress.com code can drive the kill switch through its filter, and it beats a later filter turning the shell on.
	 */
	public function test_kill_switch_filter_beats_shell_filter() {
		Constants::set_constant( 'AT_PROXIED_REQUEST', true );
		$_COOKIE[ \WPCOMSH_Support_Session_Detect::COOKIE_NAME ] = 'false';
		add_filter( 'jetpack_admin_shell_enabled', '__return_true', 999 );
		add_filter( 'wpcom_admin_shell_kill_switch', '__return_true' );

		$this->assertFalse( $this->shell_enabled() );
	}

	/**
	 * The Automattician default is for this flag only.
	 */
	public function test_other_flags_are_untouched() {
		Constants::set_constant( 'AT_PROXIED_REQUEST', true );
		$_COOKIE[ \WPCOMSH_Support_Session_Detect::COOKIE_NAME ] = 'false';

		$this->assertFalse( Feature_Flags::is_enabled( 'some-other-flag' ) );
	}
}
