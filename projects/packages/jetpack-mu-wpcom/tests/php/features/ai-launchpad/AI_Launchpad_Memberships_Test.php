<?php
/**
 * Test class for AI_Launchpad_Memberships.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once __DIR__ . '/fixtures/memberships-stubs.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-memberships.php';

/**
 * Test class for AI_Launchpad_Memberships.
 *
 * @covers \AI_Launchpad_Memberships
 */
#[CoversClass( AI_Launchpad_Memberships::class )]
class AI_Launchpad_Memberships_Test extends \WorDBless\BaseTestCase {

	/**
	 * Each membership task follows its own Jetpack_Memberships signal: the two Stripe tasks follow the
	 * connected-account flag, paid_offer_created follows any configured paid plan, and
	 * newsletter_plan_created follows the newsletter plan alone — a generic paid plan does not complete it.
	 *
	 * @dataProvider provide_membership_signals
	 *
	 * @param string[] $signals  The Jetpack_Memberships signals that are on ('connected', 'plans', 'newsletter_plans').
	 * @param string   $task_id  The catalog task ID.
	 * @param bool     $expected Whether the task should be reported complete.
	 */
	#[DataProvider( 'provide_membership_signals' )]
	public function test_is_task_complete( array $signals, $task_id, $expected ) {
		AI_Launchpad_Stub_Jetpack_Memberships::$connected        = in_array( 'connected', $signals, true );
		AI_Launchpad_Stub_Jetpack_Memberships::$plans            = in_array( 'plans', $signals, true );
		AI_Launchpad_Stub_Jetpack_Memberships::$newsletter_plans = in_array( 'newsletter_plans', $signals, true );

		$this->assertSame( $expected, AI_Launchpad_Memberships::is_task_complete( $task_id ) );
	}

	/**
	 * Data provider for test_is_task_complete.
	 *
	 * @return array
	 */
	public static function provide_membership_signals() {
		return array(
			'stripe_connected without a connected account' => array( array(), 'stripe_connected', false ),
			'stripe_connected with a connected account'    => array( array( 'connected' ), 'stripe_connected', true ),
			'set_up_payments without a connected account'  => array( array(), 'set_up_payments', false ),
			'set_up_payments with a connected account'     => array( array( 'connected' ), 'set_up_payments', true ),
			'paid_offer_created without configured plans'  => array( array(), 'paid_offer_created', false ),
			'paid_offer_created with configured plans'     => array( array( 'plans' ), 'paid_offer_created', true ),
			'newsletter_plan_created ignores generic plans' => array( array( 'plans' ), 'newsletter_plan_created', false ),
			'newsletter_plan_created with its own plan'    => array( array( 'newsletter_plans' ), 'newsletter_plan_created', true ),
			'a non-membership task is never complete'      => array( array( 'connected', 'plans', 'newsletter_plans' ), 'first_post_published', false ),
		);
	}

	/**
	 * Only the four membership tasks are overridden.
	 */
	public function test_only_membership_tasks_are_overridden() {
		$this->assertTrue( AI_Launchpad_Memberships::has_override( 'stripe_connected' ) );
		$this->assertTrue( AI_Launchpad_Memberships::has_override( 'set_up_payments' ) );
		$this->assertTrue( AI_Launchpad_Memberships::has_override( 'paid_offer_created' ) );
		$this->assertTrue( AI_Launchpad_Memberships::has_override( 'newsletter_plan_created' ) );
		$this->assertFalse( AI_Launchpad_Memberships::has_override( 'first_post_published' ) );
		$this->assertFalse( AI_Launchpad_Memberships::has_override( 'setup_ssh' ) );
	}
}
