<?php
/**
 * Tests for Launchpad_Personalization_Experiment.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Launchpad_Personalization_Experiment;
use PHPUnit\Framework\Attributes\CoversClass;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/common/class-launchpad-personalization-experiment.php';

/**
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\Launchpad_Personalization_Experiment
 */
#[CoversClass( Launchpad_Personalization_Experiment::class )]
class Launchpad_Personalization_Experiment_Test extends \WorDBless\BaseTestCase {

	public function tear_down() {
		remove_all_filters( 'wpcom_launchpad_personalization_variation' );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	public function test_returns_control_without_a_logged_in_user() {
		wp_set_current_user( 0 );
		$this->assertSame( 'control', Launchpad_Personalization_Experiment::get_variation() );
	}

	public function test_override_filter_wins() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'lpe_override_user',
				'user_pass'  => 'password',
				'user_email' => 'lpe_override_user@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );
		add_filter( 'wpcom_launchpad_personalization_variation', fn() => 'no_guidance' );
		$this->assertSame( 'no_guidance', Launchpad_Personalization_Experiment::get_variation() );
	}

	public function test_unknown_override_normalizes_to_control() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'lpe_unknown_user',
				'user_pass'  => 'password',
				'user_email' => 'lpe_unknown_user@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );
		add_filter( 'wpcom_launchpad_personalization_variation', fn() => 'bogus' );
		$this->assertSame( 'control', Launchpad_Personalization_Experiment::get_variation() );
	}
}
