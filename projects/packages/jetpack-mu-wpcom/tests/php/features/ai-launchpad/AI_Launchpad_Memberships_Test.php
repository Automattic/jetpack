<?php
/**
 * Test class for AI_Launchpad_Memberships.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once __DIR__ . '/fixtures/memberships-stubs.php';

/**
 * Test class for AI_Launchpad_Memberships.
 *
 * @covers \AI_Launchpad_Memberships
 */
#[CoversClass( AI_Launchpad_Memberships::class )]
class AI_Launchpad_Memberships_Test extends \WorDBless\BaseTestCase {

	/**
	 * Reset the stub so its signals don't leak into later tests.
	 */
	public function tear_down() {
		AI_Launchpad_Stub_Jetpack_Memberships::reset();
		parent::tear_down();
	}

	/**
	 * Each membership task follows its own Jetpack_Memberships signal; a generic paid plan does not complete
	 * newsletter_plan_created, and a non-membership task is not overridden at all.
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
		$this->assertSame( 'first_post_published' !== $task_id, AI_Launchpad_Memberships::has_override( $task_id ) );
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
			'set_up_payments with a connected account'     => array( array( 'connected' ), 'set_up_payments', true ),
			'paid_offer_created without configured plans'  => array( array(), 'paid_offer_created', false ),
			'paid_offer_created with configured plans'     => array( array( 'plans' ), 'paid_offer_created', true ),
			'newsletter_plan_created ignores generic plans' => array( array( 'plans' ), 'newsletter_plan_created', false ),
			'newsletter_plan_created with its own plan'    => array( array( 'newsletter_plans' ), 'newsletter_plan_created', true ),
			'a non-membership task is never complete'      => array( array( 'connected', 'plans', 'newsletter_plans' ), 'first_post_published', false ),
		);
	}
}
