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
		\Brain\Monkey\tearDown();
		parent::tear_down();
	}

	/**
	 * @dataProvider provide_eligibility_inputs
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @param bool $was_ai_onboarded Whether the site already went through AI onboarding.
	 * @param bool $enabled          Whether wpcom_ai_launchpad_enabled is set.
	 * @param bool $dismissed        Whether the user dismissed the AI Launchpad.
	 * @param bool $no_guidance      Whether wpcom_ai_launchpad_no_guidance is set.
	 * @param bool $expected         Expected eligibility result.
	 */
	#[DataProvider( 'provide_eligibility_inputs' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_is_eligible( $was_ai_onboarded, $enabled, $dismissed, $no_guidance, $expected ) {
		if ( $was_ai_onboarded ) {
			update_option( 'site_intent', 'ai-assembler' );
		}
		if ( $enabled ) {
			update_option( 'wpcom_ai_launchpad_enabled', true );
		}
		if ( $dismissed ) {
			update_option( 'wpcom_ai_launchpad_dismissed', true );
		}
		if ( $no_guidance ) {
			update_option( 'wpcom_ai_launchpad_no_guidance', true );
		}

		$this->assertSame( $expected, AI_Launchpad::is_eligible() );
	}

	/**
	 * Data provider for test_is_eligible.
	 *
	 * @return array
	 */
	public static function provide_eligibility_inputs() {
		return array(
			'enabled'                     => array( false, true, false, false, true ),
			'not enabled'                 => array( false, false, false, false, false ),
			'ai-onboarded stays eligible' => array( true, true, false, false, true ),
			'ai-onboarded without enable' => array( true, false, false, false, false ),
			'dismissed blocks'            => array( false, true, true, false, false ),
			'no guidance blocks'          => array( false, false, false, true, false ),
			'no guidance beats enabled'   => array( false, true, false, true, false ),
		);
	}
}
