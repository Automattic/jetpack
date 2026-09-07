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
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-gallery-page-listener.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-contact-page-listener.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-events-page-listener.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-video-page-listener.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-portfolio-piece-listener.php';

/**
 * Tests the marker listeners behind the registry's hand-authored page tasks.
 *
 * These tasks belong to AI_Launchpad_Task_Registry, not the shared catalog, so completion is a registry
 * write gated on the page's marker meta plus eligibility.
 *
 * One provider-driven class rather than one file per listener: the listeners are the same code with a
 * different constant, and byte-identical test files would drift apart the first time one of them gained
 * a case. A page task that forgets to list itself in provide_page_listeners() is caught by
 * AI_Launchpad_Task_Registry_Test, which asserts every registry task resolves a draft id.
 *
 * The gallery joined this class when its page stopped being built from the WordPress.com pattern library:
 * it was the last page task creating its content some other way, and it kept its own smaller test file
 * for as long as that was true. Nothing about its listener was ever different, and folding it in gains it
 * the three checks its own file never had — the publish-once guard, the own-marker draft lookup, and the
 * distinct-marker check.
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
	 * The listeners under test, with the task each completes and the page it is created as.
	 *
	 * @return array
	 */
	public static function provide_page_listeners() {
		return array(
			'the gallery page'    => array( AI_Launchpad_Gallery_Page_Listener::class, 'add_gallery_page', 'Gallery', 6161 ),
			'the contact page'    => array( AI_Launchpad_Contact_Page_Listener::class, 'add_contact_page', 'Contact', 7171 ),
			'the events page'     => array( AI_Launchpad_Events_Page_Listener::class, 'add_events_page', 'Events', 8181 ),
			'the video page'      => array( AI_Launchpad_Video_Page_Listener::class, 'add_video_page', 'Videos', 9191 ),
			// The empty title is this page's own: a portfolio piece is titled with the project's name, which
			// only the user has, so createPortfolioPiece leaves the field blank for them to fill. Carried
			// through the provider so every listener case exercises the page as it is really created.
			'the portfolio piece' => array( AI_Launchpad_Portfolio_Piece_Listener::class, 'add_portfolio_piece', '', 10101 ),
		);
	}

	/**
	 * The same cases, trimmed to what each test actually takes. Derived rather than repeated, so a listener
	 * can never be listed for one of these checks and forgotten by another.
	 *
	 * @return array
	 */
	public static function provide_page_listener_pages() {
		return array_map(
			static function ( $case ) {
				return array( $case[0], $case[1], $case[2] );
			},
			self::provide_page_listeners()
		);
	}

	/**
	 * The listener classes with the draft id their stubbed lookup resolves to.
	 *
	 * @return array
	 */
	public static function provide_page_listener_drafts() {
		return array_map(
			static function ( $case ) {
				return array( $case[0], $case[3] );
			},
			self::provide_page_listeners()
		);
	}

	/**
	 * The listener classes alone.
	 *
	 * @return array
	 */
	public static function provide_page_listener_classes() {
		return array_map(
			static function ( $case ) {
				return array( $case[0] );
			},
			self::provide_page_listeners()
		);
	}

	/**
	 * The same cases crossed with the publish gate, since a data provider cannot be nested.
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
				$cases[ $page_label . ', ' . $gate_label ] = array( $page[0], $page[1], $page[2], $gate[0], $gate[1], $gate[2] );
			}
		}

		return $cases;
	}

	/**
	 * Publishing a page completes its task only when the page carries the marker meta and the site is
	 * eligible — an unmarked page is somebody else's page, and an ineligible site must never write launchpad
	 * status at all.
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
		do_action( 'init' );

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
	 * A page already published stays complete-once: a later edit re-fires the transition, and the task must not
	 * be re-written from a state that only the first publish is supposed to reach.
	 *
	 * @param string $listener The listener class under test.
	 * @param string $task_id  The registry task it completes.
	 * @param string $title    The page title the client creates it with.
	 * @dataProvider provide_page_listener_pages
	 */
	#[DataProvider( 'provide_page_listener_pages' )]
	public function test_a_later_edit_of_a_published_page_does_not_complete_again( $listener, $task_id, $title ) {
		$listener::register();
		do_action( 'init' );

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

	/**
	 * Test that register_meta registers the marker meta for pages, which is what lets the block editor
	 * preserve it and the create request set it.
	 *
	 * @param string $listener The listener class under test.
	 * @dataProvider provide_page_listener_classes
	 */
	#[DataProvider( 'provide_page_listener_classes' )]
	public function test_registers_marker_meta( $listener ) {
		$listener::register();
		do_action( 'init' );

		$this->assertTrue( registered_meta_key_exists( 'post', $listener::META_KEY, 'page' ) );
	}

	/**
	 * The in-progress draft lookup finds a page by this listener's own marker, and nothing else: every page
	 * task creates a draft page, so a card that queried anything looser would reopen another task's draft.
	 *
	 * @param string $listener The listener class under test.
	 * @param int    $draft_id The draft post id the stubbed lookup resolves to.
	 * @dataProvider provide_page_listener_drafts
	 */
	#[DataProvider( 'provide_page_listener_drafts' )]
	public function test_get_draft_id_queries_its_own_marker_meta( $listener, $draft_id ) {
		$queried = array();
		add_filter(
			'posts_pre_query',
			static function ( $posts, $query ) use ( &$queried, $draft_id ) {
				$queried[] = $query->get( 'meta_key' );
				return array( $draft_id );
			},
			10,
			2
		);

		$this->assertSame( $draft_id, $listener::get_draft_id() );
		$this->assertSame( array( $listener::META_KEY ), $queried );
	}

	/**
	 * No two page tasks share a marker, which is the premise every "its own marker" assertion above rests on.
	 */
	public function test_every_page_listener_has_a_distinct_marker() {
		$markers = array();
		foreach ( self::provide_page_listeners() as $case ) {
			$markers[] = $case[0]::META_KEY;
		}

		$this->assertSame( $markers, array_unique( $markers ) );
	}
}
