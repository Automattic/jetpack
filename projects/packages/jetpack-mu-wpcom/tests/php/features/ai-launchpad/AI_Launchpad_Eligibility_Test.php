<?php
/**
 * Tests for the AI Launchpad eligibility gate.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\DataProvider;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/ai-launchpad.php';

/**
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\AI_Launchpad::is_eligible
 */
class AI_Launchpad_Eligibility_Test extends \WorDBless\BaseTestCase {
	/**
	 * Assert that is_eligible() returns the expected boolean for each combination
	 * of the gate's inputs.
	 *
	 * @dataProvider provide_eligibility_inputs
	 *
	 * @param bool $has_paid_plan   Whether the site owns a bundle purchase.
	 * @param bool $was_ai_onboarded Whether the site already went through AI onboarding.
	 * @param bool $is_automattician Whether the current user is an Automattician.
	 * @param bool $has_sticker     Whether the site carries the tester blog sticker.
	 * @param bool $expected        Expected eligibility result.
	 */
	#[DataProvider( 'provide_eligibility_inputs' )]
	public function test_is_eligible( $has_paid_plan, $was_ai_onboarded, $is_automattician, $has_sticker, $expected ) {
		Functions\when( 'wpcom_get_site_purchases' )->justReturn(
			$has_paid_plan ? array( array( 'product_type' => 'bundle' ) ) : array()
		);
		Functions\when( 'is_automattician' )->justReturn( $is_automattician );
		Functions\when( 'has_blog_sticker' )->justReturn( $has_sticker );

		if ( $was_ai_onboarded ) {
			update_option( 'site_intent', 'ai-assembler' );
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
			'paid + a11n'                  => array( true, false, true, false, true ),
			'paid + sticker'               => array( true, false, false, true, true ),
			'no plan blocks a11n'          => array( false, false, true, true, false ),
			'onboarded blocks'             => array( true, true, true, true, false ),
			'paid but neither a11n/sticker' => array( true, false, false, false, false ),
		);
	}
}
