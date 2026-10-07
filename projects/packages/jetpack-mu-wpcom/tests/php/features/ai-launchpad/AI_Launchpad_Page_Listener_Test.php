<?php
/**
 * Test class for the AI Launchpad's hand-authored page listeners.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/launchpad/launchpad.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';

/**
 * The page listeners are the same code with a different marker and task id, so one provider drives them all.
 *
 * @covers \AI_Launchpad_Gallery_Page_Listener
 * @covers \AI_Launchpad_Contact_Page_Listener
 * @covers \AI_Launchpad_Events_Page_Listener
 * @covers \AI_Launchpad_Video_Page_Listener
 * @covers \AI_Launchpad_Portfolio_Piece_Listener
 */
#[CoversClass( AI_Launchpad_Gallery_Page_Listener::class )]
#[CoversClass( AI_Launchpad_Contact_Page_Listener::class )]
#[CoversClass( AI_Launchpad_Events_Page_Listener::class )]
#[CoversClass( AI_Launchpad_Video_Page_Listener::class )]
#[CoversClass( AI_Launchpad_Portfolio_Piece_Listener::class )]
class AI_Launchpad_Page_Listener_Test extends \WorDBless\BaseTestCase {

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		\Brain\Monkey\setUp();
	}

	/**
	 * Reverting the testing environment to its original state.
	 */
	public function tear_down() {
		\Brain\Monkey\tearDown();
		parent::tear_down();
	}

	/**
	 * The listeners under test, with the task each completes and the title its page is created with.
	 *
	 * @return array
	 */
	public static function provide_page_listeners() {
		return array(
			'the gallery page'    => array( AI_Launchpad_Gallery_Page_Listener::class, 'add_gallery_page', 'Gallery' ),
			'the contact page'    => array( AI_Launchpad_Contact_Page_Listener::class, 'add_contact_page', 'Contact' ),
			'the events page'     => array( AI_Launchpad_Events_Page_Listener::class, 'add_events_page', 'Events' ),
			'the video page'      => array( AI_Launchpad_Video_Page_Listener::class, 'add_video_page', 'Videos' ),
			// A portfolio piece is created untitled: only the user knows the project's name.
			'the portfolio piece' => array( AI_Launchpad_Portfolio_Piece_Listener::class, 'add_portfolio_piece', '' ),
		);
	}

	/**
	 * The listeners crossed with the publish gate, since a data provider cannot be nested.
	 *
	 * @return array
	 */
	public static function provide_publish_cases() {
		$gates = array(
			'marked page on an eligible site'   => array( true, true, true ),
			'unmarked page on an eligible site' => array( false, true, false ),
			'marked page on an ineligible site' => array( true, false, false ),
		);

		$cases = array();
		foreach ( self::provide_page_listeners() as $page_label => $page ) {
			foreach ( $gates as $gate_label => $gate ) {
				$cases[ $page_label . ', ' . $gate_label ] = array_merge( $page, $gate );
			}
		}

		return $cases;
	}

	/**
	 * Publishing a page completes its task only when the page carries the marker meta and the site is eligible.
	 *
	 * @param string $listener The listener class under test.
	 * @param string $task_id  The registry task it completes.
	 * @param string $title    The page title the client creates it with.
	 * @param bool   $marked   Whether the page carries the marker meta.
	 * @param bool   $eligible Whether the site is eligible for the AI Launchpad.
	 * @param bool   $expected Whether the task should complete.
	 * @dataProvider provide_publish_cases
	 */
	#[DataProvider( 'provide_publish_cases' )]
	public function test_publishing_page_completes_task_only_when_marked_and_eligible( $listener, $task_id, $title, $marked, $eligible, $expected ) {
		\Brain\Monkey\Functions\when( 'wpcom_ai_launchpad_is_eligible' )->justReturn( $eligible );
		$listener::register();

		$page_id = wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'draft',
				'post_title'  => $title,
			)
		);
		if ( $marked ) {
			update_post_meta( $page_id, $listener::META_KEY, true );
		}

		wp_update_post(
			array(
				'ID'          => $page_id,
				'post_status' => 'publish',
			)
		);

		$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertSame( $expected, ! empty( $statuses[ $task_id ] ) );
	}

	/**
	 * A later edit of an already-published page re-fires the transition but must not complete the task again.
	 *
	 * @param string $listener The listener class under test.
	 * @param string $task_id  The registry task it completes.
	 * @param string $title    The page title the client creates it with.
	 * @dataProvider provide_page_listeners
	 */
	#[DataProvider( 'provide_page_listeners' )]
	public function test_a_later_edit_of_a_published_page_does_not_complete_again( $listener, $task_id, $title ) {
		\Brain\Monkey\Functions\when( 'wpcom_ai_launchpad_is_eligible' )->justReturn( true );
		$page_id = wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => $title,
			)
		);
		update_post_meta( $page_id, $listener::META_KEY, true );

		$listener::maybe_complete( 'publish', 'publish', get_post( $page_id ) );

		$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertArrayNotHasKey( $task_id, $statuses );
	}
}
