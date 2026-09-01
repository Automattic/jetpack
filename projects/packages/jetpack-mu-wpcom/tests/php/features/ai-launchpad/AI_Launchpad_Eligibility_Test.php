<?php
/**
 * Tests for the AI Launchpad eligibility gate.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\AI_Launchpad::is_eligible
 */
#[CoversMethod( AI_Launchpad::class, 'is_eligible' )]
class AI_Launchpad_Eligibility_Test extends \WorDBless\BaseTestCase {
	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		\Brain\Monkey\setUp();
		require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/ai-launchpad.php';
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		remove_all_filters( 'wpcom_launchpad_personalization_variation' );
		\Brain\Monkey\tearDown();
		parent::tear_down();
	}

	/**
	 * Assert that is_eligible() returns the expected boolean for each combination
	 * of the gate's inputs.
	 *
	 * @dataProvider provide_eligibility_inputs
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @param bool $was_ai_onboarded Whether the site already went through AI onboarding.
	 * @param bool $enabled          Whether the site has the wpcom_ai_launchpad_enabled option set.
	 * @param bool $dismissed        Whether the user dismissed the AI Launchpad.
	 * @param bool $expected         Expected eligibility result.
	 */
	#[DataProvider( 'provide_eligibility_inputs' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_is_eligible( $was_ai_onboarded, $enabled, $dismissed, $expected ) {
		if ( $was_ai_onboarded ) {
			update_option( 'site_intent', 'ai-assembler' );
		}
		if ( $enabled ) {
			update_option( 'wpcom_ai_launchpad_enabled', true );
		}
		if ( $dismissed ) {
			update_option( 'wpcom_ai_launchpad_dismissed', true );
		}

		$this->assertSame( $expected, AI_Launchpad::is_eligible() );
	}

	/**
	 * Data provider for test_is_eligible.
	 *
	 * The paid-plan requirement is temporarily lifted, so eligibility depends on the
	 * per-site enabled option and the user not having dismissed the AI Launchpad
	 * (skipping the wizard dismisses it). Being AI-onboarded (e.g. built with Big Sky)
	 * does not affect eligibility either way.
	 *
	 * @return array
	 */
	public static function provide_eligibility_inputs() {
		return array(
			'enabled'                     => array( false, true, false, true ),
			'not enabled'                 => array( false, false, false, false ),
			'ai-onboarded stays eligible' => array( true, true, false, true ),
			'ai-onboarded without enable' => array( true, false, false, false ),
			'dismissed blocks'            => array( false, true, true, false ),
		);
	}

	/**
	 * The ai-launchpad variation makes the site eligible without the legacy option.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_ai_launchpad_variation_makes_the_site_eligible() {
		add_filter( 'wpcom_launchpad_personalization_variation', fn() => 'ai_launchpad' );
		$this->assertTrue( AI_Launchpad::is_eligible() );
	}

	/**
	 * Variation-based enablement also covers AI-onboarded sites (e.g. a site built
	 * with Big Sky): the tasklist tailors to what the build already covered.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_ai_launchpad_variation_is_eligible_for_ai_built_sites() {
		add_filter( 'wpcom_launchpad_personalization_variation', fn() => 'ai_launchpad' );
		update_option( 'site_intent', 'ai-assembler' );
		$this->assertTrue( AI_Launchpad::is_eligible() );
	}

	/**
	 * The no-guidance variation is not eligible for the AI Launchpad.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_no_guidance_variation_is_not_eligible() {
		add_filter( 'wpcom_launchpad_personalization_variation', fn() => 'no_guidance' );
		$this->assertFalse( AI_Launchpad::is_eligible() );
	}

	/**
	 * The control variation without the legacy option is not eligible.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_control_without_legacy_option_is_not_eligible() {
		add_filter( 'wpcom_launchpad_personalization_variation', fn() => 'control' );
		$this->assertFalse( AI_Launchpad::is_eligible() );
	}

	/**
	 * The legacy per-site option still enables the AI Launchpad as a dev override.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_legacy_option_still_enables_as_a_dev_override() {
		add_filter( 'wpcom_launchpad_personalization_variation', fn() => 'control' );
		update_option( 'wpcom_ai_launchpad_enabled', 1 );
		$this->assertTrue( AI_Launchpad::is_eligible() );
	}
}
