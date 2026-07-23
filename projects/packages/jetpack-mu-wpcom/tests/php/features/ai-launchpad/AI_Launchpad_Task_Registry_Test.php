<?php
/**
 * Covers the AI Launchpad's own task registry.
 *
 * @package automattic/jetpack-mu-wpcom
 */

// The registry resolves its plugin CTAs through the shared helper, which ai-launchpad.php loads before it in
// production; a test running in its own process gets neither unless it asks.
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
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-task-registry.php';
require_once __DIR__ . '/fixtures/trait-registers-test-task.php';
require_once __DIR__ . '/fixtures/trait-uses-block-theme.php';

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * The registry holds task definitions the shared launchpad catalog does not own. It is
 * deliberately separate from wpcom_launchpad_get_task_definitions(): the catalog is shared with
 * the legacy launchpad and must stay untouched.
 *
 * @covers \AI_Launchpad_Task_Registry
 */
#[CoversClass( AI_Launchpad_Task_Registry::class )]
class AI_Launchpad_Task_Registry_Test extends \WorDBless\BaseTestCase {

	use AI_Launchpad_Registers_Test_Task;
	use AI_Launchpad_Uses_Block_Theme;

	/**
	 * Tear down.
	 *
	 * The id seeded by seed_marker_draft() outlives its filter: WP_Query caches the result in the
	 * `post-queries` group even when posts_pre_query short-circuits the database read, and WorDBless's own
	 * teardown clears posts and options but never the object cache. Removing the filter alone would
	 * therefore let a later test still resolve that draft id.
	 */
	public function tear_down() {
		wp_cache_flush_group( 'post-queries' );
		$this->restore_theme_directories();
		parent::tear_down();
	}

	/**
	 * Short-circuits the marker-meta draft lookup with a seeded post id.
	 *
	 * The lookup runs through WP_Query, which WorDBless cannot execute, so core's posts_pre_query filter
	 * stands in for it. WorDBless restores hooks after each test; tear_down() handles the cache.
	 *
	 * Keyed by marker meta, so a task only ever sees its own draft: every page task queries a different
	 * marker, and a seeded gallery draft must not put the contact card in progress.
	 *
	 * @param int    $draft_id The post id the lookup should return.
	 * @param string $meta_key The listener marker meta the lookup must be asking for.
	 */
	private function seed_marker_draft( $draft_id, $meta_key = AI_Launchpad_Gallery_Page_Listener::META_KEY ) {
		add_filter(
			'posts_pre_query',
			static function ( $posts, $query ) use ( $draft_id, $meta_key ) {
				if ( $meta_key === $query->get( 'meta_key' ) ) {
					return array( $draft_id );
				}
				return $posts;
			},
			10,
			2
		);
	}

	/**
	 * Build a registry card, failing the test rather than handing back null.
	 *
	 * `build()` is nullable because an id the registry does not define has no card, and every call here
	 * but one passes an id it does define. Asserting that up front says so, and turns a null into a
	 * named failure instead of an "array offset on null" several assertions later — which is also what
	 * stops static analysis reading each `$card['id']` as an unguarded nullable access.
	 *
	 * @param string $task_id  A task id the registry defines.
	 * @param string $subtitle The AI-written subtitle, or '' to take the registry default.
	 * @return array The built card.
	 */
	private function build_card( $task_id, $subtitle ) {
		$card = AI_Launchpad_Task_Registry::build( $task_id, $subtitle );
		$this->assertIsArray( $card, "the registry defines $task_id but built no card for it" );

		return (array) $card;
	}

	/**
	 * The registry knows its own tasks, and does not claim catalog tasks.
	 *
	 * @param string $task_id A task id the registry defines.
	 * @dataProvider provide_registry_task_ids
	 */
	#[DataProvider( 'provide_registry_task_ids' )]
	public function test_registry_owns_its_own_tasks( $task_id ) {
		$this->assertTrue( AI_Launchpad_Task_Registry::has( $task_id ) );
		$this->assertContains( $task_id, AI_Launchpad_Task_Registry::task_ids() );
	}

	/**
	 * The registry's shipped ids.
	 *
	 * @return array
	 */
	public static function provide_registry_task_ids() {
		return array(
			'the gallery page'     => array( 'add_gallery_page' ),
			'the contact page'     => array( 'add_contact_page' ),
			'the events page'      => array( 'add_events_page' ),
			'the video page'       => array( 'add_video_page' ),
			'the portfolio piece'  => array( 'add_portfolio_piece' ),
			'the site icon'        => array( 'add_site_icon' ),
			'the style variations' => array( 'pick_fonts_colors' ),
			'Sensei LMS'           => array( 'install_sensei_lms' ),
		);
	}

	/**
	 * A catalog task is not the registry's to claim, so build_tasks() keeps routing it through the catalog.
	 */
	public function test_registry_does_not_claim_catalog_tasks() {
		$this->assertFalse( AI_Launchpad_Task_Registry::has( 'first_post_published' ) );
	}

	/**
	 * An id the registry does not own is not complete and does not build, rather than fataling on a
	 * missing definition.
	 */
	public function test_unknown_ids_resolve_to_nothing() {
		$this->assertFalse( AI_Launchpad_Task_Registry::is_complete( 'first_post_published' ) );
		$this->assertFalse( AI_Launchpad_Task_Registry::is_visible( 'first_post_published' ) );
		$this->assertNull( AI_Launchpad_Task_Registry::build( 'not_a_task', 'x' ) );
	}

	/**
	 * `is_visible` is optional: a definition without one is visible, and one with a callable reports what
	 * that callable returns.
	 *
	 * Exercised through a test-only definition injected into the registry, because the only real entry
	 * (`add_gallery_page`) is universally renderable and deliberately declares no `is_visible` — see the
	 * fixture trait.
	 *
	 * @param bool|null $is_visible The `is_visible` return value, or null to omit the key.
	 * @param bool      $expected   Whether the task should report as visible.
	 * @dataProvider provide_registry_visibility_cases
	 */
	#[DataProvider( 'provide_registry_visibility_cases' )]
	public function test_is_visible_honors_the_optional_callable( $is_visible, $expected ) {
		$task_id = $this->register_test_task( $is_visible );

		$this->assertTrue( AI_Launchpad_Task_Registry::has( $task_id ), 'the premise: the definition is registered' );
		$this->assertSame( $expected, AI_Launchpad_Task_Registry::is_visible( $task_id ) );
	}

	/**
	 * Visibility cases for test_is_visible_honors_the_optional_callable.
	 *
	 * @return array
	 */
	public static function provide_registry_visibility_cases() {
		return array(
			'a definition with no is_visible' => array( null, true ),
			'an is_visible returning true'    => array( true, true ),
			'an is_visible returning false'   => array( false, false ),
		);
	}

	/**
	 * The gallery task declares no visibility and so is visible everywhere, which is what lets it be
	 * appended to the offered menu on any site.
	 */
	public function test_the_gallery_task_is_visible_everywhere() {
		$this->assertTrue( AI_Launchpad_Task_Registry::is_visible( 'add_gallery_page' ) );
	}

	/**
	 * Completion reads the same status option through is_complete() as it does through build().
	 */
	public function test_is_complete_tracks_the_status_option() {
		$this->assertFalse( AI_Launchpad_Task_Registry::is_complete( 'add_gallery_page' ) );

		update_option( 'launchpad_checklist_tasks_statuses', array( 'add_gallery_page' => true ) );

		$this->assertTrue( AI_Launchpad_Task_Registry::is_complete( 'add_gallery_page' ) );
	}

	/**
	 * A registry task builds into the same card shape build_tasks() emits for catalog tasks, and an
	 * empty subtitle falls back to the registry default rather than rendering a blank card.
	 */
	public function test_build_returns_a_complete_card() {
		$card = $this->build_card( 'add_gallery_page', 'Show off your ceramics.' );

		$this->assertSame( 'add_gallery_page', $card['id'] );
		$this->assertSame( 'Show off your ceramics.', $card['subtitle'] );
		$this->assertSame( 'Create your first gallery', $card['title'] );
		$this->assertFalse( $card['completed'] );
		$this->assertFalse( $card['in_progress'] );
		$this->assertFalse( $card['disabled'] );
		$this->assertNull( $card['calypso_path'] );

		$default = $this->build_card( 'add_gallery_page', '' );
		$this->assertSame( 'Show your work in a beautiful photo gallery.', $default['subtitle'] );
	}

	/**
	 * An unpublished marker draft puts the task in progress and points the card at that draft.
	 */
	public function test_build_reports_an_in_progress_draft() {
		$draft_id = 4343;
		$this->seed_marker_draft( $draft_id );

		$card = $this->build_card( 'add_gallery_page', 'Show your work.' );

		$this->assertTrue( $card['in_progress'] );
		$this->assertSame( 'Continue working on your gallery', $card['title'] );
		$this->assertSame( admin_url( 'post.php?post=' . $draft_id . '&action=edit' ), $card['calypso_path'] );
	}

	/**
	 * A completed task reports completion from the shared launchpad status option, and is never
	 * also in progress even while a marker draft is still lying around.
	 *
	 * Completing the gallery does not delete the draft that preceded it (nor any later one), so without the
	 * completion guard the card would claim "Continue working on your gallery" next to a done checkmark and
	 * send its CTA to the stale draft.
	 */
	public function test_build_does_not_report_a_completed_task_as_in_progress() {
		update_option( 'launchpad_checklist_tasks_statuses', array( 'add_gallery_page' => true ) );
		$this->seed_marker_draft( 4343 );

		$card = $this->build_card( 'add_gallery_page', 'Show your work.' );

		$this->assertTrue( $card['completed'] );
		$this->assertFalse( $card['in_progress'] );
		$this->assertSame( 'Create your first gallery', $card['title'] );
		$this->assertNull( $card['calypso_path'] );
	}

	/**
	 * The hand-authored page tasks get the same in-progress treatment as the gallery, each off its own marker: a
	 * saved but unpublished draft reopens rather than creating a second page.
	 *
	 * @param string $task_id        The registry task id.
	 * @param string $meta_key       The listener marker meta its draft lookup queries.
	 * @param int    $draft_id       The draft post id the stubbed lookup resolves to.
	 * @param string $continue_title The card title once the draft exists.
	 * @dataProvider provide_marker_page_tasks
	 */
	#[DataProvider( 'provide_marker_page_tasks' )]
	public function test_a_page_task_reports_its_own_in_progress_draft( $task_id, $meta_key, $draft_id, $continue_title ) {
		$this->seed_marker_draft( $draft_id, $meta_key );

		$card = $this->build_card( $task_id, 'Whatever the AI wrote.' );

		$this->assertTrue( $card['in_progress'] );
		$this->assertSame( $continue_title, $card['title'] );
		$this->assertSame( admin_url( 'post.php?post=' . $draft_id . '&action=edit' ), $card['calypso_path'] );
	}

	/**
	 * The registry's hand-authored page tasks: a marker meta of their own, and a client-built CTA.
	 *
	 * @return array
	 */
	public static function provide_marker_page_tasks() {
		return array(
			'the contact page'    => array(
				'add_contact_page',
				AI_Launchpad_Contact_Page_Listener::META_KEY,
				7171,
				'Continue working on your contact page',
			),
			'the events page'     => array(
				'add_events_page',
				AI_Launchpad_Events_Page_Listener::META_KEY,
				8181,
				'Continue working on your events page',
			),
			'the video page'      => array(
				'add_video_page',
				AI_Launchpad_Video_Page_Listener::META_KEY,
				9191,
				'Continue working on your video page',
			),
			'the portfolio piece' => array(
				'add_portfolio_piece',
				AI_Launchpad_Portfolio_Piece_Listener::META_KEY,
				10101,
				'Continue working on your portfolio piece',
			),
		);
	}

	/**
	 * The same cases, id only, for the tests that need nothing else. Derived rather than repeated so a page
	 * task can never be listed for one of these checks and forgotten by the other.
	 *
	 * @return array
	 */
	public static function provide_page_task_ids() {
		return array_map(
			static function ( $case ) {
				return array( $case[0] );
			},
			self::provide_marker_page_tasks()
		);
	}

	/**
	 * Each page task looks up its own marker and no other. Every one of them is a draft page, so a lookup keyed
	 * off "a draft exists" — or off another task's marker — would put the wrong card in progress and send its
	 * CTA to somebody else's draft.
	 */
	public function test_the_page_tasks_do_not_share_a_marker_draft() {
		$this->seed_marker_draft( 4343, AI_Launchpad_Gallery_Page_Listener::META_KEY );

		$this->assertTrue(
			$this->build_card( 'add_gallery_page', '' )['in_progress'],
			'the premise: this harness can produce an in-progress card at all'
		);
		$this->assertFalse( $this->build_card( 'add_contact_page', '' )['in_progress'] );
		$this->assertFalse( $this->build_card( 'add_events_page', '' )['in_progress'] );
		$this->assertFalse( $this->build_card( 'add_video_page', '' )['in_progress'] );
		$this->assertFalse( $this->build_card( 'add_portfolio_piece', '' )['in_progress'] );
	}

	/**
	 * A page task completes from the shared status option, which is what its listener writes when the marked
	 * page is first published.
	 *
	 * @param string $task_id The registry task id.
	 * @dataProvider provide_page_task_ids
	 */
	#[DataProvider( 'provide_page_task_ids' )]
	public function test_page_task_completion_reads_the_status_option( $task_id ) {
		$this->assertFalse( AI_Launchpad_Task_Registry::is_complete( $task_id ) );

		update_option( 'launchpad_checklist_tasks_statuses', array( $task_id => true ) );

		$this->assertTrue( AI_Launchpad_Task_Registry::is_complete( $task_id ) );
		$this->assertTrue( $this->build_card( $task_id, '' )['completed'] );
	}

	/**
	 * No page task asks anything of the site — the contact form ships with Jetpack, and the events and video
	 * pages are core blocks — so none declares a visibility gate, and all are offered everywhere, including on
	 * the classic theme this harness runs.
	 *
	 * The video page is the one where that was a real choice rather than a default. Built on VideoPress it
	 * would need a gate, because VideoPress is a plan-gated Jetpack module and the CTA would otherwise open a
	 * block the site has never been sold; built on core/video it needs none, because core/video is on every
	 * site and takes a URL as readily as an upload. A gate appearing here later means the block underneath
	 * changed, and the task started being withheld from the sites it was written for.
	 *
	 * @param string $task_id The registry task id.
	 * @dataProvider provide_page_task_ids
	 */
	#[DataProvider( 'provide_page_task_ids' )]
	public function test_the_page_tasks_are_visible_everywhere( $task_id ) {
		$this->assertFalse( wp_is_block_theme(), 'the premise: this is the theme that hides pick_fonts_colors' );
		$this->assertTrue( AI_Launchpad_Task_Registry::is_visible( $task_id ) );
	}

	/**
	 * A registry task that declares a `calypso_path` renders its CTA from it, so a task with a fixed
	 * destination needs no marker draft to be actionable.
	 *
	 * The gallery is the counter-case in the same provider: its CTA is built client-side (it creates the
	 * gallery page), so it deliberately ships no path and the card carries none.
	 *
	 * @param string      $task_id  The registry task id.
	 * @param string|null $expected The expected CTA path, relative to admin_url().
	 * @dataProvider provide_registry_ctas
	 */
	#[DataProvider( 'provide_registry_ctas' )]
	public function test_build_resolves_the_declared_cta( $task_id, $expected ) {
		$this->use_block_theme();

		$card = $this->build_card( $task_id, 'A subtitle.' );

		$this->assertSame( null === $expected ? null : admin_url( $expected ), $card['calypso_path'] );
	}

	/**
	 * CTA cases for test_build_resolves_the_declared_cta.
	 *
	 * The Site Editor path uses `p=` rather than `path=`: `p` is the @wordpress/router `pathArg` the
	 * editor is mounted with, and `section` is the Styles screen's own sub-route, which is how the CTA
	 * lands on the style variations rather than the Styles root.
	 *
	 * @return array
	 */
	public static function provide_registry_ctas() {
		return array(
			'the site icon settings screen' => array( 'add_site_icon', 'options-general.php' ),
			'the Styles variations screen'  => array( 'pick_fonts_colors', 'site-editor.php?p=/styles&section=/variations' ),
			'the gallery, built on click'   => array( 'add_gallery_page', null ),
			'the contact page, on click'    => array( 'add_contact_page', null ),
			'the events page, on click'     => array( 'add_events_page', null ),
			'the video page, on click'      => array( 'add_video_page', null ),
			'the piece, on click'           => array( 'add_portfolio_piece', null ),
			"Sensei LMS's installer"        => array( 'install_sensei_lms', 'plugin-install.php?tab=plugin-information&plugin=sensei-lms' ),
		);
	}

	/**
	 * The site-icon task completes off the live `site_icon` option, with no listener and no status write:
	 * the option holds the uploaded attachment id, and clearing the icon empties it again.
	 *
	 * `has_site_icon()` is deliberately not used — it resolves the attachment's URL, so it is false for an
	 * id whose attachment this harness never created, and it would be false in production for the window
	 * between the option write and the attachment being readable.
	 *
	 * @param mixed $option   The `site_icon` option value, or null to leave it unset.
	 * @param bool  $expected Whether the task should report complete.
	 * @dataProvider provide_site_icon_completion_cases
	 */
	#[DataProvider( 'provide_site_icon_completion_cases' )]
	public function test_site_icon_completion_reads_the_option( $option, $expected ) {
		if ( null !== $option ) {
			update_option( 'site_icon', $option );
		}

		$this->assertSame( $expected, AI_Launchpad_Task_Registry::is_complete( 'add_site_icon' ) );
		$this->assertSame( $expected, $this->build_card( 'add_site_icon', '' )['completed'] );
	}

	/**
	 * Completion cases for test_site_icon_completion_reads_the_option.
	 *
	 * @return array
	 */
	public static function provide_site_icon_completion_cases() {
		return array(
			'no icon has ever been set' => array( null, false ),
			'the icon was removed'      => array( 0, false ),
			'an uploaded attachment'    => array( 4242, true ),
		);
	}

	/**
	 * The style-variations task has no completion signal of its own — nothing in wp-admin fires when a
	 * variation is applied — so it completes from the status option the complete-on-click route writes.
	 */
	public function test_fonts_and_colors_completion_reads_the_status_option() {
		$this->assertFalse( AI_Launchpad_Task_Registry::is_complete( 'pick_fonts_colors' ) );

		AI_Launchpad_Task_Registry::mark_complete( 'pick_fonts_colors' );

		$this->assertTrue( AI_Launchpad_Task_Registry::is_complete( 'pick_fonts_colors' ) );
	}

	/**
	 * Completion is written to the shared status option directly, because wpcom_mark_launchpad_task_complete()
	 * cannot: wpcom_launchpad_update_task_status() skips any id the shared catalog does not define, and by
	 * design none of the registry's are. It refuses ids the registry does not own, so it cannot become a
	 * back door onto arbitrary catalog statuses.
	 */
	public function test_mark_complete_writes_only_for_registry_ids() {
		$this->assertTrue( AI_Launchpad_Task_Registry::mark_complete( 'pick_fonts_colors' ) );
		$this->assertFalse( AI_Launchpad_Task_Registry::mark_complete( 'first_post_published' ) );

		$this->assertSame( array( 'pick_fonts_colors' => true ), get_option( 'launchpad_checklist_tasks_statuses' ) );
	}

	/**
	 * The style-variations task is offered only where the Site Editor's Styles screen exists, which is a
	 * block theme. On a classic theme its CTA would land on an editor that has no Styles route to show,
	 * so the task is withheld rather than rendered as a dead end.
	 *
	 * Both branches are asserted from the same test so the false one cannot pass by accident: the harness
	 * has no theme on disk at all, and would report "not a block theme" for a gate keyed off anything.
	 */
	public function test_fonts_and_colors_needs_a_block_theme() {
		$this->assertFalse( AI_Launchpad_Task_Registry::is_visible( 'pick_fonts_colors' ) );

		$this->use_block_theme();

		$this->assertTrue( wp_is_block_theme(), 'the premise: the fixture theme really is a block theme' );
		$this->assertTrue( AI_Launchpad_Task_Registry::is_visible( 'pick_fonts_colors' ) );
	}

	/**
	 * The site-icon task asks nothing of the site — every site has the setting — so it declares no
	 * visibility and is offered everywhere, including on the classic theme this harness runs.
	 */
	public function test_the_site_icon_task_is_visible_everywhere() {
		$this->assertFalse( wp_is_block_theme(), 'the premise: this is the theme that hides pick_fonts_colors' );
		$this->assertTrue( AI_Launchpad_Task_Registry::is_visible( 'add_site_icon' ) );
	}

	/**
	 * Both new tasks build the full card shape, with a translated title and a default subtitle for when
	 * the AI supplies none.
	 *
	 * @param string $task_id  The registry task id.
	 * @param string $title    The expected card title.
	 * @param string $subtitle The expected fallback subtitle.
	 * @dataProvider provide_registry_card_copy
	 */
	#[DataProvider( 'provide_registry_card_copy' )]
	public function test_build_returns_the_declared_copy( $task_id, $title, $subtitle ) {
		$this->use_block_theme();

		$card = $this->build_card( $task_id, '' );

		$this->assertSame( $task_id, $card['id'] );
		$this->assertSame( $title, $card['title'] );
		$this->assertSame( $subtitle, $card['subtitle'] );
		$this->assertFalse( $card['in_progress'] );
		$this->assertFalse( $card['disabled'] );
	}

	/**
	 * Card copy for test_build_returns_the_declared_copy.
	 *
	 * @return array
	 */
	public static function provide_registry_card_copy() {
		return array(
			'the site icon'        => array(
				'add_site_icon',
				'Add your logo or site icon',
				'Upload your logo so your site is recognizable in browser tabs and search results.',
			),
			'the style variations' => array(
				'pick_fonts_colors',
				'Customize fonts and colors',
				'Try a style variation to set the mood of your whole site at once.',
			),
			'the contact page'     => array(
				'add_contact_page',
				'Add a contact page',
				'Give visitors a simple way to reach you, with a contact form ready to go.',
			),
			'the events page'      => array(
				'add_events_page',
				'Add an events page',
				'Give people one place to find out what is coming up and when.',
			),
			'the video page'       => array(
				'add_video_page',
				'Add a video page',
				'Give your videos a home on your site, ready for you to upload the first one.',
			),
			'the portfolio piece'  => array(
				'add_portfolio_piece',
				'Add your first portfolio piece',
				'Give one project a page of its own, with room for the work and the story behind it.',
			),
			'Sensei LMS'           => array(
				'install_sensei_lms',
				'Build your courses with Sensei LMS',
				'Install Sensei to turn what you teach into structured lessons, quizzes, and student progress.',
			),
		);
	}

	/**
	 * A plugin-discovery task is complete exactly while its plugin is active, read live from
	 * `is_plugin_active()` — so installing the plugin ticks the card with no listener, and deactivating
	 * it un-ticks it again.
	 *
	 * The round trip back to inactive is asserted deliberately: a definition that latched completion into
	 * an option on first read would pass the forward direction alone.
	 *
	 * @param string $task_id     The registry task id.
	 * @param string $plugin_file The plugin's `dir/file.php` entry in `active_plugins`.
	 * @dataProvider provide_plugin_discovery_tasks
	 */
	#[DataProvider( 'provide_plugin_discovery_tasks' )]
	public function test_plugin_discovery_completion_tracks_the_active_plugin( $task_id, $plugin_file ) {
		$this->assertFalse( AI_Launchpad_Task_Registry::is_complete( $task_id ) );
		$this->assertFalse( $this->build_card( $task_id, '' )['completed'] );

		update_option( 'active_plugins', array( $plugin_file ) );

		$this->assertTrue( AI_Launchpad_Task_Registry::is_complete( $task_id ) );
		$this->assertTrue( $this->build_card( $task_id, '' )['completed'] );

		update_option( 'active_plugins', array() );

		$this->assertFalse( AI_Launchpad_Task_Registry::is_complete( $task_id ) );
	}

	/**
	 * The plugin-discovery tasks and the plugin each one recommends.
	 *
	 * @return array
	 */
	public static function provide_plugin_discovery_tasks() {
		return array(
			'Sensei LMS' => array( 'install_sensei_lms', 'sensei-lms/sensei-lms.php' ),
		);
	}

	/**
	 * A discovery task watches its own plugin and nothing else.
	 *
	 * Guards the failure mode the case above cannot see — a completion callable keyed off "any plugin is
	 * active", or off a file this site happens to run — which would tick the card for a site that installed
	 * something else entirely. The unrelated plugin is deliberately one the harness genuinely has active
	 * state for, so the negative result is the callable discriminating rather than the option being empty.
	 */
	public function test_plugin_discovery_completion_keys_off_its_own_plugin() {
		update_option( 'active_plugins', array( 'woocommerce/woocommerce.php', 'akismet/akismet.php' ) );

		$this->assertFalse( AI_Launchpad_Task_Registry::is_complete( 'install_sensei_lms' ) );

		// The premise: this harness does report an active plugin, so the false above is the file being
		// compared rather than is_plugin_active() answering false for everything.
		$this->assertTrue( is_plugin_active( 'woocommerce/woocommerce.php' ) );

		update_option( 'active_plugins', array( 'woocommerce/woocommerce.php', 'sensei-lms/sensei-lms.php' ) );

		$this->assertTrue( AI_Launchpad_Task_Registry::is_complete( 'install_sensei_lms' ) );
	}

	/**
	 * A discovery task's completion comes from the site's plugin state alone, never from the shared
	 * launchpad status option.
	 *
	 * The option is what the complete-on-click route writes, and a discovery task must not be tickable that
	 * way: the point of the task is that the plugin ends up installed, which clicking a CTA does not achieve.
	 */
	public function test_plugin_discovery_completion_ignores_the_status_option() {
		update_option( 'launchpad_checklist_tasks_statuses', array( 'install_sensei_lms' => true ) );
		$this->assertFalse( AI_Launchpad_Task_Registry::is_complete( 'install_sensei_lms' ) );

		// The same write does complete a task that is defined against that option, so the assertion above is
		// about this definition rather than about the option never being read.
		AI_Launchpad_Task_Registry::mark_complete( 'pick_fonts_colors' );
		$this->assertTrue( AI_Launchpad_Task_Registry::is_complete( 'pick_fonts_colors' ) );
	}

	/**
	 * A plugin that is already active makes its discovery task *complete*, not invisible.
	 *
	 * The two were both defensible, and this pins the choice. Completion is what lets the card tick when the
	 * user acts on the recommendation — which is also the only signal that says whether the recommendation
	 * landed, since task completions are reported by diffing the rendered list on read. Withholding the task
	 * from a site that already has the plugin is handled elsewhere and for free: available_task_ids() drops
	 * every complete task from the actionable menu, so the model is not offered it anyway.
	 *
	 * @param string $task_id     The registry task id.
	 * @param string $plugin_file The plugin's `dir/file.php` entry in `active_plugins`.
	 * @dataProvider provide_plugin_discovery_tasks
	 */
	#[DataProvider( 'provide_plugin_discovery_tasks' )]
	public function test_an_active_plugin_completes_a_discovery_task_rather_than_hiding_it( $task_id, $plugin_file ) {
		update_option( 'active_plugins', array( $plugin_file ) );

		$this->assertTrue( AI_Launchpad_Task_Registry::is_complete( $task_id ) );
		$this->assertTrue( AI_Launchpad_Task_Registry::is_visible( $task_id ) );
	}

	/**
	 * On a Simple site the discovery CTA points at the Calypso page for that specific plugin, not at a
	 * wp-admin installer Simple has no route to.
	 *
	 * The registry resolves its own `calypso_path` and build_tasks() returns before the rewrite it applies to
	 * catalog CTAs, so a registry task carrying a wp-admin plugins path would dead-end on Simple. These are
	 * the first registry tasks to have one, so the rewrite has to happen here.
	 *
	 * The counterpart is test_build_resolves_the_declared_cta, which runs without IS_WPCOM and asserts the
	 * wp-admin installer URL for the same task — so the pair shows the rewrite firing on one host and not
	 * the other, rather than the CTA having been a Calypso path all along.
	 *
	 * Runs in a separate process so defining IS_WPCOM does not leak into the rest of the suite.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_plugin_discovery_ctas_target_calypso_on_simple() {
		define( 'IS_WPCOM', true );
		$site = rawurlencode( wpcom_get_site_slug() );

		$this->assertSame(
			'/plugins/sensei-lms/' . $site,
			$this->build_card( 'install_sensei_lms', '' )['calypso_path'],
			'install_sensei_lms must link to its Calypso plugin page on Simple'
		);
	}
}
