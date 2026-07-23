<?php
/**
 * Covers the deterministic goal rules that replaced prose rules in the tailoring prompt.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Commerce and newsletter tasks must be unreachable for goals they do not belong to, whether the
 * model is asked not to pick them or picks them anyway. Prose in the prompt is not enforcement.
 */
class AI_Launchpad_Goal_Exclusions_Test extends \WorDBless\BaseTestCase {

	/**
	 * Set up: register the default launchpad checklists so the catalog resolves.
	 */
	public function set_up() {
		parent::set_up();
		wpcom_register_default_launchpad_checklists();
	}

	/**
	 * Commerce tasks are restricted to the sell goal.
	 */
	public function test_commerce_tasks_are_excluded_for_non_sell_goals() {
		$excluded = AI_Launchpad_REST::excluded_task_ids_for_goal( 'write' );

		$this->assertContains( 'woo_products', $excluded );
		$this->assertContains( 'woo_customize_store', $excluded );
		$this->assertContains( 'set_up_payments', $excluded );
		$this->assertContains( 'stripe_connected', $excluded );
		$this->assertContains( 'woo_woocommerce_payments', $excluded );
	}

	/**
	 * Commerce tasks stay available on the sell goal.
	 */
	public function test_commerce_tasks_are_allowed_for_sell() {
		$excluded = AI_Launchpad_REST::excluded_task_ids_for_goal( 'sell' );

		$this->assertNotContains( 'woo_products', $excluded );
		$this->assertNotContains( 'set_up_payments', $excluded );
	}

	/**
	 * Subscriber-acquisition tasks are restricted to the newsletter goal.
	 */
	public function test_subscriber_tasks_are_excluded_for_non_newsletter_goals() {
		$excluded = AI_Launchpad_REST::excluded_task_ids_for_goal( 'build' );

		$this->assertContains( 'add_10_email_subscribers', $excluded );
		$this->assertContains( 'newsletter_plan_created', $excluded );
		$this->assertContains( 'import_subscribers', $excluded );
	}

	/**
	 * Subscriber tasks stay available on the newsletter goal.
	 */
	public function test_subscriber_tasks_are_allowed_for_newsletter() {
		$excluded = AI_Launchpad_REST::excluded_task_ids_for_goal( 'newsletter' );

		$this->assertNotContains( 'add_10_email_subscribers', $excluded );
	}

	/**
	 * The course-setup task is restricted to the educate goal.
	 *
	 * Its catalog gate (WoA + Sensei LMS active) already hides it almost everywhere, so the entry costs
	 * nothing — but it is the one id annotated with a single goal, and without it the map's stated
	 * invariant ("every id annotated with a single goal belongs here") has a lone unexplained exception.
	 */
	public function test_course_setup_is_restricted_to_educate() {
		$this->assertContains( 'sensei_setup', AI_Launchpad_REST::excluded_task_ids_for_goal( 'write' ) );
		$this->assertNotContains( 'sensei_setup', AI_Launchpad_REST::excluded_task_ids_for_goal( 'educate' ) );
	}

	/**
	 * The gallery task is excluded from sell, preserving the store/gallery mutual exclusion.
	 */
	public function test_gallery_is_excluded_for_sell() {
		$this->assertContains( 'add_gallery_page', AI_Launchpad_REST::excluded_task_ids_for_goal( 'sell' ) );
		$this->assertNotContains( 'add_gallery_page', AI_Launchpad_REST::excluded_task_ids_for_goal( 'portfolio' ) );
	}

	/**
	 * An unknown or empty goal excludes every restricted task rather than allowing everything.
	 */
	public function test_unknown_goal_excludes_all_restricted_tasks() {
		$excluded = AI_Launchpad_REST::excluded_task_ids_for_goal( '' );

		$this->assertContains( 'woo_products', $excluded );
		$this->assertContains( 'add_10_email_subscribers', $excluded );
	}
}
