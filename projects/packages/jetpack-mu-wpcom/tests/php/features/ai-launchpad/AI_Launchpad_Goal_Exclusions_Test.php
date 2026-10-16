<?php
/**
 * Covers the deterministic goal rules that replaced prose rules in the tailoring prompt.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Goal-specific tasks must be unreachable for the goals they do not belong to.
 */
class AI_Launchpad_Goal_Exclusions_Test extends \WorDBless\BaseTestCase {

	/**
	 * A restricted task is excluded off its goal and kept on it; an excluded task is the reverse.
	 *
	 * @dataProvider provide_goal_exclusions
	 *
	 * @param string $goal     The goal slug.
	 * @param string $task_id  The task id.
	 * @param bool   $excluded Whether the task must be excluded for this goal.
	 */
	#[DataProvider( 'provide_goal_exclusions' )]
	public function test_excluded_task_ids_for_goal( $goal, $task_id, $excluded ) {
		$this->assertSame( $excluded, in_array( $task_id, AI_Launchpad_REST::excluded_task_ids_for_goal( $goal ), true ) );
	}

	/**
	 * Data provider for test_excluded_task_ids_for_goal.
	 *
	 * @return array
	 */
	public static function provide_goal_exclusions() {
		return array(
			'a restricted task off its goal' => array( 'write', 'woo_products', true ),
			'a restricted task on its goal'  => array( 'newsletter', 'add_10_email_subscribers', false ),
			'an excluded task on its goal'   => array( 'sell', 'add_gallery_page', true ),
			'an excluded task off its goal'  => array( 'portfolio', 'add_gallery_page', false ),
			'a page task is never excluded'  => array( 'sell', 'add_contact_page', false ),
		);
	}
}
