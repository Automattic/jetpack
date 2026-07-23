<?php
/**
 * Test class for AI_Launchpad_About_Page_Listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/../../../../src/features/ai-launchpad/helpers.php';
require_once __DIR__ . '/../../../../src/features/ai-launchpad/class-ai-launchpad-about-page-listener.php';

/**
 * Test class for AI_Launchpad_About_Page_Listener.
 *
 * @covers \AI_Launchpad_About_Page_Listener
 */
#[CoversClass( AI_Launchpad_About_Page_Listener::class )]
class AI_Launchpad_About_Page_Listener_Test extends \WorDBless\BaseTestCase {

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
	private function seed_tasks( array $task_ids ) {
		$tasks = array_map(
			static function ( $id ) {
				return array(
					'id'       => $id,
					'subtitle' => 'Subtitle.',
				);
			},
			$task_ids
		);
		update_option( 'wpcom_ai_launchpad_ai_output', array( 'payload' => array( 'tasks' => $tasks ) ), false );
	}

	/**
	 * Creates a page, optionally tagged with the AI About-page marker.
	 *
	 * @param bool $marked Whether to set the marker meta.
	 * @return WP_Post
	 */
	private function make_page( $marked ) {
		$page_id = wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => 'About',
			)
		);
		if ( $marked ) {
			update_post_meta( $page_id, AI_Launchpad_About_Page_Listener::META_KEY, true );
		}
		return get_post( $page_id );
	}

	/**
	 * Test that register_meta registers the marker meta for pages.
	 */
	public function test_registers_marker_meta() {
		AI_Launchpad_About_Page_Listener::register_meta();

		$this->assertTrue(
			registered_meta_key_exists( 'post', AI_Launchpad_About_Page_Listener::META_KEY, 'page' )
		);
	}

	/**
	 * Test that the marked AI About page completes add_about_page on first publish
	 * and update_about_page on a later edit — and that an unmarked page or an
	 * unselected task completes nothing.
	 */
	public function test_completes_about_tasks_on_marked_page_transitions() {
		$this->seed_tasks( array( 'add_about_page', 'update_about_page' ) );
		$task_lists = wpcom_launchpad_checklists();

		// An unmarked page: nothing completes.
		$plain = $this->make_page( false );
		AI_Launchpad_About_Page_Listener::maybe_complete( 'publish', 'draft', $plain );
		$this->assertFalse( $task_lists->is_task_id_complete( 'add_about_page' ) );

		$page = $this->make_page( true );

		// First publish of the marked page completes add_about_page only.
		AI_Launchpad_About_Page_Listener::maybe_complete( 'publish', 'draft', $page );
		$this->assertTrue( $task_lists->is_task_id_complete( 'add_about_page' ) );
		$this->assertFalse( $task_lists->is_task_id_complete( 'update_about_page' ) );

		// A later edit of the already-published marked page completes update_about_page.
		AI_Launchpad_About_Page_Listener::maybe_complete( 'publish', 'publish', $page );
		$this->assertTrue( $task_lists->is_task_id_complete( 'update_about_page' ) );
	}

	/**
	 * Test that a marked page does not complete tasks the AI did not select.
	 */
	public function test_no_completion_when_task_not_selected() {
		$this->seed_tasks( array( 'site_launched' ) );
		$page = $this->make_page( true );

		AI_Launchpad_About_Page_Listener::maybe_complete( 'publish', 'draft', $page );

		$this->assertFalse( wpcom_launchpad_checklists()->is_task_id_complete( 'add_about_page' ) );
	}
}
