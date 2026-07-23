<?php
/**
 * Test class for AI_Launchpad_Gallery_Page_Listener.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

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
	 * Publishing a page completes add_gallery_page only when the page carries the marker meta and
	 * the site is eligible — an unmarked page is somebody else's page, and an ineligible site must
	 * never write launchpad status at all.
	 *
	 * @dataProvider provide_publish_cases
	 *
	 * @param bool $marked   Whether the page carries the marker meta.
	 * @param bool $eligible Whether the site is eligible for the AI Launchpad.
	 * @param bool $expected Whether the task should complete.
	 */
	#[DataProvider( 'provide_publish_cases' )]
	public function test_publishing_page_completes_task_only_when_marked_and_eligible( $marked, $eligible, $expected ) {
		\Brain\Monkey\Functions\when( 'wpcom_ai_launchpad_is_eligible' )->justReturn( $eligible );
		AI_Launchpad_Gallery_Page_Listener::register();
		do_action( 'init' );

		$page_id = wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'draft',
				'post_title'  => 'My gallery',
			)
		);
		if ( $marked ) {
			update_post_meta( $page_id, AI_Launchpad_Gallery_Page_Listener::META_KEY, true );
		}

		wp_update_post(
			array(
				'ID'          => $page_id,
				'post_status' => 'publish',
			)
		);

		$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertSame( $expected, ! empty( $statuses['add_gallery_page'] ) );
	}

	/**
	 * Data provider for test_publishing_page_completes_task_only_when_marked_and_eligible.
	 *
	 * @return array
	 */
	public static function provide_publish_cases() {
		return array(
			'marked page on an eligible site'   => array( true, true, true ),
			'unmarked page on an eligible site' => array( false, true, false ),
			'marked page on an ineligible site' => array( true, false, false ),
		);
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
