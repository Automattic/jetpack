<?php
/**
 * Tests for the launchpad_screen personalization filter.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/launchpad/launchpad.php';

class Launchpad_Personalization_Screen_Filter_Test extends \WorDBless\BaseTestCase {

	public function tear_down() {
		remove_all_filters( 'wpcom_launchpad_personalization_arm' );
		parent::tear_down();
	}

	public function test_ai_launchpad_arm_forces_off() {
		add_filter( 'wpcom_launchpad_personalization_arm', fn() => 'ai-launchpad' );
		$this->assertSame(
			'off',
			wpcom_maybe_disable_for_launchpad_personalization( 'full' )
		);
	}

	public function test_no_guidance_arm_forces_off() {
		add_filter( 'wpcom_launchpad_personalization_arm', fn() => 'no-guidance' );
		$this->assertSame(
			'off',
			wpcom_maybe_disable_for_launchpad_personalization( 'full' )
		);
	}

	public function test_control_passes_the_value_through() {
		add_filter( 'wpcom_launchpad_personalization_arm', fn() => 'control' );
		$this->assertSame(
			'full',
			wpcom_maybe_disable_for_launchpad_personalization( 'full' )
		);
	}

	public function test_false_short_circuits_before_resolving_the_arm() {
		$this->assertFalse( wpcom_maybe_disable_for_launchpad_personalization( false ) );
	}
}
