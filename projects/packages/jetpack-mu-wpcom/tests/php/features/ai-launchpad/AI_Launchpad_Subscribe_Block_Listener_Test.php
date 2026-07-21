<?php
/**
 * Test class for AI_Launchpad_Subscribe_Block_Listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/../../../../src/features/ai-launchpad/helpers.php';
require_once __DIR__ . '/../../../../src/features/ai-launchpad/class-ai-launchpad-subscribe-block-listener.php';

/**
 * Test class for AI_Launchpad_Subscribe_Block_Listener.
 *
 * @covers \AI_Launchpad_Subscribe_Block_Listener
 */
#[CoversClass( AI_Launchpad_Subscribe_Block_Listener::class )]
class AI_Launchpad_Subscribe_Block_Listener_Test extends \WorDBless\BaseTestCase {
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
	 * Inserts a post and runs it through the post watcher.
	 *
	 * @param string $post_type   The post type.
	 * @param string $post_status The post status.
	 * @param string $content     The post content.
	 * @return void
	 */
	private function save( $post_type, $post_status, $content ) {
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test',
				'post_content' => $content,
				'post_status'  => $post_status,
				'post_type'    => $post_type,
			)
		);
		AI_Launchpad_Subscribe_Block_Listener::maybe_complete_from_post( $post_id, get_post( $post_id ) );
	}

	/**
	 * A published, viewable post carrying the Subscribe block completes the AI-selected task.
	 */
	public function test_published_post_with_block_completes_task() {
		$this->seed_ai_output( array( 'add_subscribe_block' ) );

		$this->save( 'post', 'publish', '<!-- wp:jetpack/subscriptions /-->' );

		$statuses = get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertTrue( ! empty( $statuses['add_subscribe_block'] ) );
	}

	/**
	 * Drafts, blockless content, and non-viewable types (e.g. synced patterns) are ignored.
	 */
	public function test_ignores_drafts_blockless_and_nonviewable_content() {
		$this->seed_ai_output( array( 'add_subscribe_block' ) );

		$this->save( 'post', 'draft', '<!-- wp:jetpack/subscriptions /-->' );
		$this->save( 'page', 'publish', '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->' );
		$this->save( 'wp_block', 'publish', '<!-- wp:jetpack/subscriptions /-->' );

		$statuses = get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertArrayNotHasKey( 'add_subscribe_block', (array) $statuses );
	}

	/**
	 * A block widget carrying the Subscribe block completes the task; a widget without it does not.
	 */
	public function test_widget_with_block_completes_task() {
		$this->seed_ai_output( array( 'add_subscribe_block' ) );

		AI_Launchpad_Subscribe_Block_Listener::maybe_complete_from_widget(
			null,
			array(
				2              => array( 'content' => '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->' ),
				'_multiwidget' => 1,
			)
		);
		$this->assertArrayNotHasKey( 'add_subscribe_block', (array) get_option( 'launchpad_checklist_tasks_statuses', array() ) );

		AI_Launchpad_Subscribe_Block_Listener::maybe_complete_from_widget(
			null,
			array(
				2              => array( 'content' => '<!-- wp:jetpack/subscriptions /-->' ),
				'_multiwidget' => 1,
			)
		);
		$statuses = get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertTrue( ! empty( $statuses['add_subscribe_block'] ) );
	}

	/**
	 * When the task is not AI-selected, nothing is written — the legacy launchpad is untouched.
	 */
	public function test_does_nothing_when_task_not_ai_selected() {
		$this->seed_ai_output( array( 'first_post_published' ) );

		$this->save( 'post', 'publish', '<!-- wp:jetpack/subscriptions /-->' );
		AI_Launchpad_Subscribe_Block_Listener::maybe_complete_from_widget(
			null,
			array( 2 => array( 'content' => '<!-- wp:jetpack/subscriptions /-->' ) )
		);

		$this->assertFalse( get_option( 'launchpad_checklist_tasks_statuses' ) );
	}

	/**
	 * Without any AI output, nothing is written.
	 */
	public function test_does_nothing_without_ai_output() {
		$this->save( 'post', 'publish', '<!-- wp:jetpack/subscriptions /-->' );

		$this->assertFalse( get_option( 'launchpad_checklist_tasks_statuses' ) );
	}

	/**
	 * The listener self-registers its watchers at file load.
	 */
	public function test_listener_is_registered() {
		$this->assertNotFalse( has_action( 'save_post', array( 'AI_Launchpad_Subscribe_Block_Listener', 'maybe_complete_from_post' ) ) );
		$this->assertNotFalse( has_action( 'update_option_widget_block', array( 'AI_Launchpad_Subscribe_Block_Listener', 'maybe_complete_from_widget' ) ) );
	}
}
