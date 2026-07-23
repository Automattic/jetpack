<?php
/**
 * Covers the deterministic goal rules that replaced prose rules in the tailoring prompt.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Commerce and newsletter tasks must be unreachable for goals they do not belong to, whether the
 * model is asked not to pick them or picks them anyway. Prose in the prompt is not enforcement.
 */
class AI_Launchpad_Goal_Exclusions_Test extends \WorDBless\BaseTestCase {

	/**
	 * Each goal excludes the tasks that belong to other goals, and keeps its own.
	 *
	 * The `sensei_setup` entry looks redundant with its catalog gate (WoA + Sensei LMS active), which already
	 * hides it almost everywhere — but it is the one id annotated with a single goal, and without it the map's
	 * stated invariant ("every id annotated with a single goal belongs here") has a lone unexplained exception,
	 * which AI_Launchpad_Task_Menu_Test asserts against.
	 *
	 * `add_gallery_page` runs the other way (excluded for one goal rather than restricted to one), preserving
	 * the store/gallery mutual exclusion: a store site must not end up with both sequences.
	 *
	 * @dataProvider provide_goal_exclusions
	 *
	 * @param string   $goal     The goal slug, or '' for an unknown/absent goal.
	 * @param string[] $excluded Task IDs that must be excluded for this goal.
	 * @param string[] $allowed  Task IDs that must stay available for this goal.
	 */
	#[DataProvider( 'provide_goal_exclusions' )]
	public function test_excluded_task_ids_for_goal( $goal, array $excluded, array $allowed ) {
		$actual = AI_Launchpad_REST::excluded_task_ids_for_goal( $goal );

		foreach ( $excluded as $task_id ) {
			$this->assertContains( $task_id, $actual, "$task_id must be excluded for the '$goal' goal." );
		}
		foreach ( $allowed as $task_id ) {
			$this->assertNotContains( $task_id, $actual, "$task_id must stay available for the '$goal' goal." );
		}
	}

	/**
	 * Data provider for test_excluded_task_ids_for_goal.
	 *
	 * @return array
	 */
	public static function provide_goal_exclusions() {
		return array(
			'commerce and course tasks need their own goals' => array(
				'write',
				array( 'woo_products', 'woo_customize_store', 'woo_woocommerce_payments', 'set_up_payments', 'stripe_connected', 'sensei_setup' ),
				array(),
			),
			'sell keeps commerce and loses the gallery' => array(
				'sell',
				array( 'add_gallery_page' ),
				array( 'woo_products', 'set_up_payments' ),
			),
			'subscriber tasks need the newsletter goal' => array(
				'build',
				array( 'add_10_email_subscribers', 'newsletter_plan_created', 'import_subscribers' ),
				array(),
			),
			'newsletter keeps the subscriber tasks'     => array(
				'newsletter',
				array(),
				array( 'add_10_email_subscribers' ),
			),
			'educate keeps the course task'             => array( 'educate', array(), array( 'sensei_setup' ) ),
			'portfolio keeps the gallery'               => array( 'portfolio', array(), array( 'add_gallery_page' ) ),
			'an unknown goal excludes every restricted task' => array(
				'',
				array( 'woo_products', 'add_10_email_subscribers' ),
				array(),
			),
		);
	}
}
