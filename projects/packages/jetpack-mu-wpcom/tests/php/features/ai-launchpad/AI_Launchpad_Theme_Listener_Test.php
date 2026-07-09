<?php
/**
 * Test class for AI_Launchpad_Theme_Listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/../../../../src/features/ai-launchpad/helpers.php';
require_once __DIR__ . '/../../../../src/features/ai-launchpad/class-ai-launchpad-theme-listener.php';

/**
 * Test class for AI_Launchpad_Theme_Listener.
 *
 * @covers \AI_Launchpad_Theme_Listener
 */
#[CoversClass( AI_Launchpad_Theme_Listener::class )]
class AI_Launchpad_Theme_Listener_Test extends \WorDBless\BaseTestCase {
	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		wpcom_register_default_launchpad_checklists();
	}

	/**
	 * Seeds the AI output option with the given task IDs.
	 *
	 * @param string[] $task_ids Task IDs for the payload.
	 */
	private function seed_ai_output( $task_ids ) {
		update_option(
			'wpcom_ai_launchpad_ai_output',
			array(
				'version'      => 1,
				'source'       => 'ai',
				'generated_at' => 1717000000,
				'payload'      => array(
					'tasks' => array_map(
						function ( $task_id ) {
							return array(
								'id'       => $task_id,
								'subtitle' => 'Subtitle for ' . $task_id,
							);
						},
						$task_ids
					),
				),
			),
			false
		);
	}

	/**
	 * When site_theme_selected is AI-selected, switch_theme marks it complete.
	 */
	public function test_switch_theme_marks_ai_selected_theme_task_complete() {
		$this->seed_ai_output( array( 'site_theme_selected' ) );

		AI_Launchpad_Theme_Listener::mark_theme_selected_complete();

		$statuses = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertIsArray( $statuses );
		$this->assertTrue( $statuses['site_theme_selected'] );
	}

	/**
	 * Without the AI output option, switch_theme writes nothing.
	 */
	public function test_no_ai_output_writes_nothing() {
		AI_Launchpad_Theme_Listener::mark_theme_selected_complete();

		$this->assertFalse( get_option( 'launchpad_checklist_tasks_statuses' ) );
	}

	/**
	 * When site_theme_selected is not among the AI-selected tasks, nothing is written.
	 */
	public function test_theme_task_not_selected_writes_nothing() {
		$this->seed_ai_output( array( 'first_post_published' ) );

		AI_Launchpad_Theme_Listener::mark_theme_selected_complete();

		$this->assertFalse( get_option( 'launchpad_checklist_tasks_statuses' ) );
	}

	/**
	 * A sell list always shows a Choose-a-theme task, so switch_theme completes it
	 * even when the AI did not explicitly pick site_theme_selected.
	 */
	public function test_switch_theme_completes_guaranteed_sell_theme() {
		update_option(
			'wpcom_ai_launchpad_ai_output',
			array(
				'version' => 1,
				'payload' => array(
					'tasks'    => array(
						array(
							'id'       => 'woo_products',
							'subtitle' => 'Add products.',
						),
					),
					'inferred' => array( 'goal' => 'sell' ),
				),
			),
			false
		);

		AI_Launchpad_Theme_Listener::mark_theme_selected_complete();

		$statuses = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertIsArray( $statuses );
		$this->assertTrue( $statuses['site_theme_selected'] );
	}

	/**
	 * A sell output can carry an inferred goal but no task list (a partial write). The
	 * render side still shows the guaranteed Choose-a-theme task, so switch_theme must
	 * complete it here too.
	 */
	public function test_switch_theme_completes_guaranteed_sell_theme_without_task_list() {
		update_option(
			'wpcom_ai_launchpad_ai_output',
			array(
				'version' => 1,
				'payload' => array(
					'inferred' => array( 'goal' => 'sell' ),
				),
			),
			false
		);

		AI_Launchpad_Theme_Listener::mark_theme_selected_complete();

		$statuses = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertIsArray( $statuses );
		$this->assertTrue( $statuses['site_theme_selected'] );
	}

	/**
	 * The listener self-registers on the switch_theme action at file load.
	 */
	public function test_listener_is_registered_on_switch_theme() {
		$this->assertNotFalse( has_action( 'switch_theme', array( 'AI_Launchpad_Theme_Listener', 'mark_theme_selected_complete' ) ) );
	}
}
