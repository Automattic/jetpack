<?php
/**
 * Test class for AI_Launchpad_Memberships.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;

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
	 * Reset the stub signals before each test.
	 */
	public function set_up() {
		parent::set_up();
		AI_Launchpad_Stub_Jetpack_Memberships::$connected        = false;
		AI_Launchpad_Stub_Jetpack_Memberships::$plans            = false;
		AI_Launchpad_Stub_Jetpack_Memberships::$newsletter_plans = false;
	}

	/**
	 * The stripe_connected and set_up_payments tasks follow the connected-account signal.
	 */
	public function test_stripe_tasks_follow_connected_account() {
		$this->assertFalse( AI_Launchpad_Memberships::is_task_complete( 'stripe_connected' ) );
		$this->assertFalse( AI_Launchpad_Memberships::is_task_complete( 'set_up_payments' ) );

		AI_Launchpad_Stub_Jetpack_Memberships::$connected = true;

		$this->assertTrue( AI_Launchpad_Memberships::is_task_complete( 'stripe_connected' ) );
		$this->assertTrue( AI_Launchpad_Memberships::is_task_complete( 'set_up_payments' ) );
	}

	/**
	 * The paid_offer_created task follows the any-paid-plan signal.
	 */
	public function test_paid_offer_follows_configured_plans() {
		$this->assertFalse( AI_Launchpad_Memberships::is_task_complete( 'paid_offer_created' ) );

		AI_Launchpad_Stub_Jetpack_Memberships::$plans = true;

		$this->assertTrue( AI_Launchpad_Memberships::is_task_complete( 'paid_offer_created' ) );
	}

	/**
	 * The newsletter_plan_created task follows the newsletter-plan signal,
	 * independent of the generic paid-plan signal.
	 */
	public function test_newsletter_plan_follows_newsletter_signal() {
		// A generic paid plan alone does not complete the newsletter task.
		AI_Launchpad_Stub_Jetpack_Memberships::$plans = true;
		$this->assertFalse( AI_Launchpad_Memberships::is_task_complete( 'newsletter_plan_created' ) );

		AI_Launchpad_Stub_Jetpack_Memberships::$newsletter_plans = true;
		$this->assertTrue( AI_Launchpad_Memberships::is_task_complete( 'newsletter_plan_created' ) );
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

	/**
	 * A task that isn't overridden is never reported complete by this helper.
	 */
	public function test_non_membership_task_is_not_complete() {
		AI_Launchpad_Stub_Jetpack_Memberships::$connected = true;
		$this->assertFalse( AI_Launchpad_Memberships::is_task_complete( 'first_post_published' ) );
	}
}
