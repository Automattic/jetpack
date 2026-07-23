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
	 * The registry knows the gallery task, and does not claim catalog tasks.
	 */
	public function test_registry_owns_the_gallery_task_only() {
		$this->assertTrue( AI_Launchpad_Task_Registry::has( 'add_gallery_page' ) );
		$this->assertContains( 'add_gallery_page', AI_Launchpad_Task_Registry::task_ids() );
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
}
