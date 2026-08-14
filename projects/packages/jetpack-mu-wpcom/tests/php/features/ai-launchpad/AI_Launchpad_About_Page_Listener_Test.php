<?php
/**
 * Test class for AI_Launchpad_About_Page_Listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once __DIR__ . '/fixtures/trait-seeds-ai-output.php';
require_once __DIR__ . '/../../../../src/features/ai-launchpad/helpers.php';
require_once __DIR__ . '/../../../../src/features/ai-launchpad/class-ai-launchpad-about-page-listener.php';

/**
 * Test class for AI_Launchpad_About_Page_Listener.
 *
 * @covers \AI_Launchpad_About_Page_Listener
 */
#[CoversClass( AI_Launchpad_About_Page_Listener::class )]
class AI_Launchpad_About_Page_Listener_Test extends \WorDBless\BaseTestCase {
	use AI_Launchpad_Seeds_AI_Output;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		wpcom_register_default_launchpad_checklists();
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
	 * The marked AI About page completes add_about_page on its first publish and
	 * update_about_page when the already-published page is edited again. An unmarked page is
	 * somebody else's page, and a task the AI did not select never completes.
	 *
	 * @dataProvider provide_transitions
	 *
	 * @param bool        $marked         Whether the page carries the marker meta.
	 * @param string[]    $selected       The AI-selected task IDs.
	 * @param string      $old_status     The status the page is transitioning from.
	 * @param string|null $completed_task The task expected to complete, or null for neither.
	 */
	#[DataProvider( 'provide_transitions' )]
	public function test_completes_about_tasks_on_marked_page_transitions( $marked, $selected, $old_status, $completed_task ) {
		$this->seed_ai_output( $selected );
		$page = $this->make_page( $marked );

		AI_Launchpad_About_Page_Listener::maybe_complete( 'publish', $old_status, $page );

		$task_lists = wpcom_launchpad_checklists();
		$this->assertSame( 'add_about_page' === $completed_task, $task_lists->is_task_id_complete( 'add_about_page' ) );
		$this->assertSame( 'update_about_page' === $completed_task, $task_lists->is_task_id_complete( 'update_about_page' ) );
	}

	/**
	 * Data provider for test_completes_about_tasks_on_marked_page_transitions.
	 *
	 * @return array
	 */
	public static function provide_transitions() {
		$both = array( 'add_about_page', 'update_about_page' );

		return array(
			'first publish of the marked page'   => array( true, $both, 'draft', 'add_about_page' ),
			'later edit of the published page'   => array( true, $both, 'publish', 'update_about_page' ),
			'an unmarked page completes nothing' => array( false, $both, 'draft', null ),
			'the task was not ai-selected'       => array( true, array( 'site_launched' ), 'draft', null ),
		);
	}
}
