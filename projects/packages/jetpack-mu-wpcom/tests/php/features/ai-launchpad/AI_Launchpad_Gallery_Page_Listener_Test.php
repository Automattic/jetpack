<?php
/**
 * Test class for AI_Launchpad_Gallery_Page_Listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/launchpad/launchpad.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-gallery-page-listener.php';

/**
 * Tests the gallery-page marker listener.
 *
 * @covers \AI_Launchpad_Gallery_Page_Listener
 */
#[CoversClass( AI_Launchpad_Gallery_Page_Listener::class )]
class AI_Launchpad_Gallery_Page_Listener_Test extends \WorDBless\BaseTestCase {

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		\Brain\Monkey\setUp();
		// This test suite never loads eligibility.php (same as AI_Launchpad_REST_Test), so stub the gate directly.
		\Brain\Monkey\Functions\when( 'wpcom_ai_launchpad_is_eligible' )->justReturn( true );
	}

	/**
	 * Reverting the testing environment to its original state.
	 */
	public function tear_down() {
		\Brain\Monkey\tearDown();
		parent::tear_down();
	}

	/**
	 * Publishing a page carrying the gallery marker completes add_gallery_page.
	 */
	public function test_publishing_marked_page_completes_task() {
		AI_Launchpad_Gallery_Page_Listener::register();
		do_action( 'init' );

		$page_id = wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'draft',
				'post_title'  => 'My gallery',
			)
		);
		update_post_meta( $page_id, AI_Launchpad_Gallery_Page_Listener::META_KEY, true );

		wp_update_post(
			array(
				'ID'          => $page_id,
				'post_status' => 'publish',
			)
		);

		$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertTrue( ! empty( $statuses['add_gallery_page'] ) );
	}

	/**
	 * Publishing an unmarked page does not complete the task.
	 */
	public function test_publishing_unmarked_page_does_not_complete_task() {
		AI_Launchpad_Gallery_Page_Listener::register();
		do_action( 'init' );

		$page_id = wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'draft',
				'post_title'  => 'Plain page',
			)
		);
		wp_update_post(
			array(
				'ID'          => $page_id,
				'post_status' => 'publish',
			)
		);

		$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertArrayNotHasKey( 'add_gallery_page', $statuses );
	}

	/**
	 * An ineligible site never completes the task, even for a marked page.
	 */
	public function test_ineligible_site_does_not_complete_task() {
		\Brain\Monkey\Functions\when( 'wpcom_ai_launchpad_is_eligible' )->justReturn( false );
		AI_Launchpad_Gallery_Page_Listener::register();
		do_action( 'init' );

		$page_id = wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'draft',
				'post_title'  => 'Gallery',
			)
		);
		update_post_meta( $page_id, AI_Launchpad_Gallery_Page_Listener::META_KEY, true );
		wp_update_post(
			array(
				'ID'          => $page_id,
				'post_status' => 'publish',
			)
		);

		$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertArrayNotHasKey( 'add_gallery_page', $statuses );
	}

	/**
	 * Test that register_meta registers the marker meta for pages.
	 */
	public function test_registers_marker_meta() {
		AI_Launchpad_Gallery_Page_Listener::register();
		do_action( 'init' );

		$this->assertTrue(
			registered_meta_key_exists( 'post', AI_Launchpad_Gallery_Page_Listener::META_KEY, 'page' )
		);
	}
}
