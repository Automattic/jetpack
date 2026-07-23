<?php
/**
 * Test class for AI_Launchpad_Contact_Page_Listener.
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
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-contact-page-listener.php';

/**
 * Tests the contact-page marker listener.
 *
 * The task belongs to AI_Launchpad_Task_Registry, not the shared catalog, so completion is a registry
 * write gated on the page's marker meta plus eligibility — the same shape as the gallery listener.
 *
 * @covers \AI_Launchpad_Contact_Page_Listener
 */
#[CoversClass( AI_Launchpad_Contact_Page_Listener::class )]
class AI_Launchpad_Contact_Page_Listener_Test extends \WorDBless\BaseTestCase {

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
	 *
	 * The draft lookup runs through WP_Query, whose result WorDBless caches in the `post-queries` group and
	 * never flushes, so a seeded id would otherwise outlive the filter that produced it.
	 */
	public function tear_down() {
		wp_cache_flush_group( 'post-queries' );
		\Brain\Monkey\tearDown();
		parent::tear_down();
	}

	/**
	 * Publishing a page completes add_contact_page only when the page carries the marker meta and the site is
	 * eligible — an unmarked page is somebody else's page, and an ineligible site must never write launchpad
	 * status at all.
	 *
	 * @param bool $marked   Whether the page carries the marker meta.
	 * @param bool $eligible Whether the site is eligible for the AI Launchpad.
	 * @param bool $expected Whether the task should complete.
	 * @dataProvider provide_publish_cases
	 */
	#[DataProvider( 'provide_publish_cases' )]
	public function test_publishing_page_completes_task_only_when_marked_and_eligible( $marked, $eligible, $expected ) {
		\Brain\Monkey\Functions\when( 'wpcom_ai_launchpad_is_eligible' )->justReturn( $eligible );
		AI_Launchpad_Contact_Page_Listener::register();
		do_action( 'init' );

		$page_id = wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'draft',
				'post_title'  => 'Contact',
			)
		);
		if ( $marked ) {
			update_post_meta( $page_id, AI_Launchpad_Contact_Page_Listener::META_KEY, true );
		}

		wp_update_post(
			array(
				'ID'          => $page_id,
				'post_status' => 'publish',
			)
		);

		$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertSame( $expected, ! empty( $statuses['add_contact_page'] ) );
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
	 * A page already published stays complete-once: a later edit re-fires the transition, and the task must not
	 * be re-written from a state that only the first publish is supposed to reach.
	 */
	public function test_a_later_edit_of_a_published_page_does_not_complete_again() {
		AI_Launchpad_Contact_Page_Listener::register();
		do_action( 'init' );

		$page_id = wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => 'Contact',
			)
		);
		update_post_meta( $page_id, AI_Launchpad_Contact_Page_Listener::META_KEY, true );

		AI_Launchpad_Contact_Page_Listener::maybe_complete( 'publish', 'publish', get_post( $page_id ) );

		$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertArrayNotHasKey( 'add_contact_page', $statuses );
	}

	/**
	 * Test that register_meta registers the marker meta for pages, which is what lets the block editor
	 * preserve it and the create request set it.
	 */
	public function test_registers_marker_meta() {
		AI_Launchpad_Contact_Page_Listener::register();
		do_action( 'init' );

		$this->assertTrue(
			registered_meta_key_exists( 'post', AI_Launchpad_Contact_Page_Listener::META_KEY, 'page' )
		);
	}

	/**
	 * The in-progress draft lookup finds a page by this listener's own marker, and nothing else: the gallery and
	 * About pages carry their own markers, and a contact card must never reopen one of those drafts.
	 */
	public function test_get_draft_id_queries_its_own_marker_meta() {
		$queried = array();
		add_filter(
			'posts_pre_query',
			static function ( $posts, $query ) use ( &$queried ) {
				$queried[] = $query->get( 'meta_key' );
				return array( 7171 );
			},
			10,
			2
		);

		$this->assertSame( 7171, AI_Launchpad_Contact_Page_Listener::get_draft_id() );
		$this->assertSame( array( AI_Launchpad_Contact_Page_Listener::META_KEY ), $queried );
	}
}
