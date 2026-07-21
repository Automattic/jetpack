<?php
/**
 * Test class for AI_Launchpad_Social_Listener.
 *
 * @package automattic/jetpack-mu-wpcom
 *
 * @phan-file-suppress PhanUndeclaredClassStaticProperty -- The Publicize stubs are aliased onto the real (Jetpack-plugin) class names at runtime; phan can't see the aliased static props.
 */

use Automattic\Jetpack\Publicize\Connections;
use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/fixtures/social-stubs.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-social-listener.php';

/**
 * Test class for AI_Launchpad_Social_Listener.
 *
 * @covers \AI_Launchpad_Social_Listener
 */
#[CoversClass( AI_Launchpad_Social_Listener::class )]
class AI_Launchpad_Social_Listener_Test extends \WorDBless\BaseTestCase {

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		wpcom_register_default_launchpad_checklists();
		Connections::$all = array();
		$_GET['page']     = 'site-setup-wp-admin';
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		unset( $_GET['page'] );
		parent::tear_down();
	}

	/**
	 * Seeds the AI output option so the given task IDs are reported as selected.
	 *
	 * @param string[] $task_ids Task IDs to seed.
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
		update_option(
			'wpcom_ai_launchpad_ai_output',
			array( 'payload' => array( 'tasks' => $tasks ) ),
			false
		);
	}

	/**
	 * Test that a social task completes only when it is AI-selected, its local
	 * signal is true, and the request is the AI Launchpad page — and not otherwise.
	 */
	public function test_completes_only_when_selected_signalled_and_on_page() {
		$task_lists = wpcom_launchpad_checklists();

		// Selected + on-page, but no connection yet: nothing completes.
		$this->seed_tasks( array( 'connect_social_media', 'drive_traffic' ) );
		AI_Launchpad_Social_Listener::maybe_complete_social_tasks();
		$this->assertFalse( $task_lists->is_task_id_complete( 'connect_social_media' ) );

		// Turn the signal on for the remaining cases.
		Connections::$all = array( array( 'connection_id' => '1' ) );

		// Signalled + selected, but off the launchpad page: still nothing.
		$_GET['page'] = 'some-other-page';
		AI_Launchpad_Social_Listener::maybe_complete_social_tasks();
		$this->assertFalse( $task_lists->is_task_id_complete( 'connect_social_media' ) );

		// Signalled + on-page, but the tasks are not AI-selected: still nothing.
		$_GET['page'] = 'site-setup-wp-admin';
		$this->seed_tasks( array( 'site_launched' ) );
		AI_Launchpad_Social_Listener::maybe_complete_social_tasks();
		$this->assertFalse( $task_lists->is_task_id_complete( 'connect_social_media' ) );

		// All three conditions met: the selected social tasks complete.
		$this->seed_tasks( array( 'connect_social_media', 'drive_traffic' ) );
		AI_Launchpad_Social_Listener::maybe_complete_social_tasks();
		$this->assertTrue( $task_lists->is_task_id_complete( 'connect_social_media' ) );
		$this->assertTrue( $task_lists->is_task_id_complete( 'drive_traffic' ) );
	}

	/**
	 * Test that an output persisted before the post_sharing_enabled remap counts as
	 * selecting connect_social_media: the always-true module-active signal completes
	 * nothing anymore, and the connection signal completes the remapped task.
	 */
	public function test_pre_remap_post_sharing_output_completes_connection_task() {
		$task_lists = wpcom_launchpad_checklists();

		// A pre-remap output that selected post_sharing_enabled, but no connection exists:
		// nothing may complete — post_sharing_enabled used to be born-completed here off the
		// always-on module-active signal, which the listener no longer consults.
		$this->seed_tasks( array( 'post_sharing_enabled' ) );
		AI_Launchpad_Social_Listener::maybe_complete_social_tasks();
		$this->assertFalse( $task_lists->is_task_id_complete( 'post_sharing_enabled' ) );
		$this->assertFalse( $task_lists->is_task_id_complete( 'connect_social_media' ) );

		// A connection appears: the task the card actually renders as completes.
		Connections::$all = array( array( 'connection_id' => '1' ) );
		AI_Launchpad_Social_Listener::maybe_complete_social_tasks();
		$this->assertTrue( $task_lists->is_task_id_complete( 'connect_social_media' ) );
	}
}
