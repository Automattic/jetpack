<?php
/**
 * Tests for the launchpad_screen Site Setup filter.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/launchpad/launchpad.php';

class Launchpad_Screen_Site_Setup_Filter_Test extends \WorDBless\BaseTestCase {

	public function test_ai_launchpad_forces_off() {
		update_option( 'wpcom_ai_launchpad_enabled', 1 );
		$this->assertSame( 'off', wpcom_maybe_disable_launchpad_screen_for_site_setup( 'full' ) );
	}

	public function test_ai_launchpad_stays_off_when_dismissed() {
		update_option( 'wpcom_ai_launchpad_enabled', 1 );
		update_option( 'wpcom_ai_launchpad_dismissed', 1 );
		$this->assertSame( 'off', wpcom_maybe_disable_launchpad_screen_for_site_setup( 'full' ) );
	}

	public function test_no_guidance_forces_off() {
		update_option( 'wpcom_ai_launchpad_no_guidance', 1 );
		$this->assertSame( 'off', wpcom_maybe_disable_launchpad_screen_for_site_setup( 'full' ) );
	}

	public function test_other_sites_pass_the_value_through() {
		$this->assertSame( 'full', wpcom_maybe_disable_launchpad_screen_for_site_setup( 'full' ) );
	}

	public function test_false_passes_through() {
		update_option( 'wpcom_ai_launchpad_no_guidance', 1 );
		$this->assertFalse( wpcom_maybe_disable_launchpad_screen_for_site_setup( false ) );
	}
}
