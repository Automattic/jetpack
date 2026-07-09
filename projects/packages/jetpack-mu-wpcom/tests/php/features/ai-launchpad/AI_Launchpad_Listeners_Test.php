<?php
/**
 * Test class for AI_Launchpad_Listeners.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/../../../../src/features/ai-launchpad/helpers.php';
require_once __DIR__ . '/../../../../src/features/ai-launchpad/class-ai-launchpad-listeners.php';

/**
 * Test class for AI_Launchpad_Listeners.
 *
 * @covers \AI_Launchpad_Listeners
 */
#[CoversClass( AI_Launchpad_Listeners::class )]
class AI_Launchpad_Listeners_Test extends \WorDBless\BaseTestCase {
	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		wpcom_register_default_launchpad_checklists();
	}

	/**
	 * Reverting the testing environment to its original state.
	 */
	public function tear_down() {
		remove_action( 'publish_post', 'wpcom_launchpad_track_publish_first_post_task' );
		remove_action( 'rest_api_switched_to_blog', array( 'AI_Launchpad_Listeners', 'add_active_task_listeners' ) );
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
	 * Publishing a post marks an AI-selected first_post_published task complete.
	 */
	public function test_publishing_post_marks_ai_selected_task_complete() {
		update_option( 'site_intent', 'free' );
		$this->seed_ai_output( array( 'first_post_published' ) );

		AI_Launchpad_Listeners::add_listener_hooks_to_correct_action();

		$this->assertNotFalse( has_action( 'publish_post', 'wpcom_launchpad_track_publish_first_post_task' ) );

		wp_insert_post(
			array(
				'post_title'   => 'First post',
				'post_content' => 'Hello world.',
				'post_status'  => 'publish',
			)
		);

		$statuses = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertIsArray( $statuses );
		$this->assertTrue( $statuses['first_post_published'] );
	}

	/**
	 * An AI-selected task completes even when it is absent from the site's
	 * legacy site_intent task list (the GATED-completion gap): site_intent=build
	 * does not contain first_post_published, yet publishing must still complete it.
	 */
	public function test_ai_task_completes_when_absent_from_site_intent_list() {
		update_option( 'site_intent', 'build' );
		$this->seed_ai_output( array( 'first_post_published' ) );

		AI_Launchpad_Listeners::add_listener_hooks_to_correct_action();

		wp_insert_post(
			array(
				'post_title'   => 'First post',
				'post_content' => 'Hello world.',
				'post_status'  => 'publish',
			)
		);

		$statuses = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertIsArray( $statuses );
		$this->assertTrue( $statuses['first_post_published'] );
	}

	/**
	 * Without the AI output option, no listeners are registered and legacy
	 * launchpad sites see no behavior change.
	 */
	public function test_legacy_site_without_ai_output_is_unchanged() {
		update_option( 'site_intent', 'free' );
		update_option( 'launchpad_screen', 'off' );

		AI_Launchpad_Listeners::add_listener_hooks_to_correct_action();

		$this->assertFalse( has_action( 'publish_post', 'wpcom_launchpad_track_publish_first_post_task' ) );

		wp_insert_post(
			array(
				'post_title'   => 'First post',
				'post_content' => 'Hello world.',
				'post_status'  => 'publish',
			)
		);

		$this->assertFalse( get_option( 'launchpad_checklist_tasks_statuses' ) );
	}

	/**
	 * A malformed AI output option registers no listeners.
	 */
	public function test_malformed_ai_output_registers_nothing() {
		update_option( 'wpcom_ai_launchpad_ai_output', 'not-an-array', false );

		AI_Launchpad_Listeners::add_listener_hooks_to_correct_action();

		$this->assertFalse( has_action( 'publish_post', 'wpcom_launchpad_track_publish_first_post_task' ) );

		update_option( 'wpcom_ai_launchpad_ai_output', array( 'version' => 1 ), false );

		AI_Launchpad_Listeners::add_listener_hooks_to_correct_action();

		$this->assertFalse( has_action( 'publish_post', 'wpcom_launchpad_track_publish_first_post_task' ) );
	}

	/**
	 * Already-completed tasks do not get their listeners registered.
	 */
	public function test_completed_task_listener_is_not_registered() {
		update_option( 'launchpad_checklist_tasks_statuses', array( 'first_post_published' => true ) );
		$this->seed_ai_output( array( 'first_post_published' ) );

		AI_Launchpad_Listeners::add_listener_hooks_to_correct_action();

		$this->assertFalse( has_action( 'publish_post', 'wpcom_launchpad_track_publish_first_post_task' ) );
	}

	/**
	 * REST API requests defer listener registration to the blog switch.
	 */
	public function test_rest_api_requests_defer_to_blog_switch() {
		$public_api_home_url = function () {
			return 'https://public-api.wordpress.com';
		};
		add_filter( 'home_url', $public_api_home_url );
		$this->seed_ai_output( array( 'first_post_published' ) );

		AI_Launchpad_Listeners::add_listener_hooks_to_correct_action();

		remove_filter( 'home_url', $public_api_home_url );

		$this->assertFalse( has_action( 'publish_post', 'wpcom_launchpad_track_publish_first_post_task' ) );
		$this->assertNotFalse( has_action( 'rest_api_switched_to_blog', array( 'AI_Launchpad_Listeners', 'add_active_task_listeners' ) ) );

		do_action( 'rest_api_switched_to_blog' );

		$this->assertNotFalse( has_action( 'publish_post', 'wpcom_launchpad_track_publish_first_post_task' ) );
	}
}
