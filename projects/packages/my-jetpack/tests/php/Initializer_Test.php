<?php
/**
 * Test the My Jetpack Initializer.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Tests for the Initializer class.
 */
class Initializer_Test extends BaseTestCase {
	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		Constants::clear_constants();
	}

	/**
	 * Onboarding is available on regular (non-Simple) sites.
	 */
	public function test_onboarding_is_available_by_default() {
		$this->assertTrue( Initializer::is_onboarding_available() );
	}

	/**
	 * Onboarding is never available on WordPress.com Simple sites.
	 */
	public function test_onboarding_is_not_available_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		$this->assertFalse( Initializer::is_onboarding_available() );
	}

	/**
	 * Data provider for the onboarding redirect decision.
	 *
	 * @return array
	 */
	public static function provide_onboarding_redirect_cases() {
		$to_onboarding = array(
			'page' => 'my-jetpack',
			'step' => 'onboarding',
		);
		$to_home       = array( 'page' => 'my-jetpack' );

		return array(
			'available, disconnected, no step: redirect to onboarding' => array( '', false, true, $to_onboarding ),
			'available, disconnected, on onboarding: stay' => array( 'onboarding', false, true, null ),
			'available, connected, no step: stay'          => array( '', true, true, null ),
			'available, connected, on onboarding: redirect home' => array( 'onboarding', true, true, $to_home ),
			'unavailable, disconnected, no step: stay'     => array( '', false, false, null ),
			'unavailable, disconnected, on onboarding: redirect home' => array( 'onboarding', false, false, $to_home ),
			'unavailable, connected, no step: stay'        => array( '', true, false, null ),
			'unavailable, connected, on onboarding: redirect home' => array( 'onboarding', true, false, $to_home ),
		);
	}

	/**
	 * The redirect decision is correct for every combination of step,
	 * connection state, and onboarding availability.
	 *
	 * @dataProvider provide_onboarding_redirect_cases
	 *
	 * @param string     $step                 The `step` query param.
	 * @param bool       $is_connected         Whether the site is connected.
	 * @param bool       $onboarding_available Whether onboarding is available on this site.
	 * @param array|null $expected             Expected redirect query args, or null to stay.
	 */
	#[DataProvider( 'provide_onboarding_redirect_cases' )]
	public function test_get_onboarding_redirect_args( $step, $is_connected, $onboarding_available, $expected ) {
		$this->assertSame( $expected, Initializer::get_onboarding_redirect_args( $step, $is_connected, $onboarding_available ) );
	}
}
