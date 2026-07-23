<?php
/**
 * Covers the AI Launchpad's own task registry.
 *
 * @package automattic/jetpack-mu-wpcom
 */

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-gallery-page-listener.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-task-registry.php';
require_once __DIR__ . '/fixtures/trait-registers-test-task.php';
require_once __DIR__ . '/fixtures/trait-uses-block-theme.php';

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

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
	 * @param int $draft_id The post id the lookup should return.
	 */
	private function seed_marker_draft( $draft_id ) {
		add_filter(
			'posts_pre_query',
			static function ( $posts, $query ) use ( $draft_id ) {
				if ( AI_Launchpad_Gallery_Page_Listener::META_KEY === $query->get( 'meta_key' ) ) {
					return array( $draft_id );
				}
				return $posts;
			},
			10,
			2
		);
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
			'the site icon'        => array( 'add_site_icon' ),
			'the style variations' => array( 'pick_fonts_colors' ),
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
		$card = AI_Launchpad_Task_Registry::build( 'add_gallery_page', 'Show off your ceramics.' );

		$this->assertSame( 'add_gallery_page', $card['id'] );
		$this->assertSame( 'Show off your ceramics.', $card['subtitle'] );
		$this->assertSame( 'Create your first gallery', $card['title'] );
		$this->assertFalse( $card['completed'] );
		$this->assertFalse( $card['in_progress'] );
		$this->assertFalse( $card['disabled'] );
		$this->assertNull( $card['calypso_path'] );

		$default = AI_Launchpad_Task_Registry::build( 'add_gallery_page', '' );
		$this->assertSame( 'Show your work in a beautiful photo gallery.', $default['subtitle'] );
	}

	/**
	 * An unpublished marker draft puts the task in progress and points the card at that draft.
	 */
	public function test_build_reports_an_in_progress_draft() {
		$draft_id = 4343;
		$this->seed_marker_draft( $draft_id );

		$card = AI_Launchpad_Task_Registry::build( 'add_gallery_page', 'Show your work.' );

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

		$card = AI_Launchpad_Task_Registry::build( 'add_gallery_page', 'Show your work.' );

		$this->assertTrue( $card['completed'] );
		$this->assertFalse( $card['in_progress'] );
		$this->assertSame( 'Create your first gallery', $card['title'] );
		$this->assertNull( $card['calypso_path'] );
	}

	/**
	 * A registry task that declares a `calypso_path` renders its CTA from it, so a task with a fixed
	 * destination needs no marker draft to be actionable.
	 *
	 * The gallery is the counter-case in the same provider: its CTA is built client-side (it creates the
	 * pattern page), so it deliberately ships no path and the card carries none.
	 *
	 * @param string      $task_id  The registry task id.
	 * @param string|null $expected The expected CTA path, relative to admin_url().
	 * @dataProvider provide_registry_ctas
	 */
	#[DataProvider( 'provide_registry_ctas' )]
	public function test_build_resolves_the_declared_cta( $task_id, $expected ) {
		$this->use_block_theme();

		$card = AI_Launchpad_Task_Registry::build( $task_id, 'A subtitle.' );

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
		$this->assertSame( $expected, AI_Launchpad_Task_Registry::build( 'add_site_icon', '' )['completed'] );
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

		$card = AI_Launchpad_Task_Registry::build( $task_id, '' );

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
		);
	}
}
