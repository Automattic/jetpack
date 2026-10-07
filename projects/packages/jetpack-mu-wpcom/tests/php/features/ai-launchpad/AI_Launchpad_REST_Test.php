<?php
/**
 * Test class for AI_Launchpad_REST.
 *
 * @package automattic/jetpack-mu-wpcom
 */

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/launchpad/launchpad.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';
require_once __DIR__ . '/fixtures/memberships-stubs.php';
require_once __DIR__ . '/fixtures/trait-registers-test-task.php';
require_once __DIR__ . '/fixtures/trait-stubs-marker-draft.php';
require_once __DIR__ . '/fixtures/trait-uses-block-theme.php';
// Loaded up front: the file registers the routes on rest_api_init as it loads.
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-rest.php';

// Real Logstash dispatch would fire from a shutdown function, after teardown; tests invoke the event builder instead.
add_filter( 'wpcom_ai_launchpad_tailoring_log_enabled', '__return_false' );

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WpOrg\Requests\Requests;

/**
 * Test class for AI_Launchpad_REST.
 *
 * @covers \AI_Launchpad_REST
 */
#[CoversClass( AI_Launchpad_REST::class )]
class AI_Launchpad_REST_Test extends \WorDBless\BaseTestCase {

	use AI_Launchpad_Registers_Test_Task;
	use AI_Launchpad_Stubs_Marker_Draft;
	use AI_Launchpad_Uses_Block_Theme;

	/**
	 * Subscriber user ID.
	 *
	 * @var int
	 */
	private $subscriber_id;

	/**
	 * Server-side analytics events captured by capture_tracks_events(), as `[ name, props ]` pairs.
	 *
	 * @var array
	 */
	private $events = array();

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		\Brain\Monkey\setUp();
		\Brain\Monkey\Functions\when( 'wpcom_ai_launchpad_is_eligible' )->justReturn( true );

		$admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_admin',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);

		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'dummy_subscriber',
				'user_pass'  => 'dummy_pass',
				'role'       => 'subscriber',
			)
		);

		wp_set_current_user( $admin_id );

		// Before the REST server exists, so the legacy launchpad route registers its args from a populated registry.
		wpcom_register_default_launchpad_checklists();
		do_action( 'rest_api_init' );
	}

	/**
	 * Reverting the testing environment to its original state.
	 */
	public function tear_down() {
		\Brain\Monkey\tearDown();
		$this->flush_marker_drafts();
		$this->restore_theme_directories();
		AI_Launchpad_Stub_Jetpack_Memberships::reset();
	}

	/**
	 * A schema-valid `PUT /tailored` body with six catalog task IDs ending on a launch task.
	 *
	 * @return array
	 */
	private static function valid_payload() {
		$tasks = array();
		foreach (
			array(
				'first_post_published' => 'Share your first trail story.',
				'design_edited'        => 'Make the design fit your hikes.',
				'site_title'           => 'Name your alpine journal.',
				'setup_free'           => 'Personalize your site basics.',
				'site_theme_selected'  => 'Pick a theme for mountain photos.',
				'site_launched'        => 'Go live and share your journey.',
			) as $id => $subtitle
		) {
			$tasks[] = array(
				'id'       => $id,
				'subtitle' => $subtitle,
			);
		}

		return array(
			'tasks'            => $tasks,
			'inferred'         => array(
				'goal'       => 'write',
				'brand_name' => 'Alpine Notes',
			),
			'first_post_draft' => array(
				'title'      => 'First steps on the trail',
				'paragraphs' => array( 'First paragraph.', 'Second paragraph.' ),
			),
			'about_page_draft' => array(
				'title'      => 'About',
				'paragraphs' => array( 'Who writes this journal.', 'What readers will find here.' ),
			),
		);
	}

	/**
	 * Performs a REST request against an AI Launchpad route.
	 *
	 * @param string     $method The HTTP method.
	 * @param string     $route  Route suffix, e.g. '' or '/wizard'.
	 * @param null|array $body   JSON body.
	 * @param null|array $query  Query params.
	 * @return WP_REST_Response
	 */
	private function call_api( $method, $route = '', $body = null, $query = null ) {
		$request = new WP_REST_Request( $method, '/wpcom/v2/ai-launchpad' . $route );
		$request->set_header( 'content_type', 'application/json' );

		if ( null !== $body ) {
			$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		}

		if ( null !== $query ) {
			$request->set_query_params( $query );
		}

		return rest_do_request( $request );
	}

	/**
	 * The rendered task cards, keyed by task id (insertion order preserved).
	 *
	 * @param null|array $query Optional query params, e.g. `array( 'all_tasks' => '1' )`.
	 * @return array<string, array>
	 */
	private function rendered_tasks( $query = null ) {
		return array_column( $this->call_api( Requests::GET, '', null, $query )->get_data()['tasks'], null, 'id' );
	}

	/**
	 * The rendered task ids, in display order.
	 *
	 * @param null|array $query Optional query params.
	 * @return string[]
	 */
	private function rendered_ids( $query = null ) {
		return array_column( $this->call_api( Requests::GET, '', null, $query )->get_data()['tasks'], 'id' );
	}

	/**
	 * A single rendered task card, failing the test when the task did not render at all.
	 *
	 * @param string     $task_id The task id.
	 * @param null|array $query   Optional query params.
	 * @return array
	 */
	private function rendered_task( $task_id, $query = null ) {
		$tasks = $this->rendered_tasks( $query );
		$this->assertArrayHasKey( $task_id, $tasks, $task_id . ' did not render' );
		return $tasks[ $task_id ];
	}

	/**
	 * The rendered CTA paths, keyed by task id.
	 *
	 * @param null|array $query Optional query params.
	 * @return array<string, string|null>
	 */
	private function rendered_paths( $query = null ) {
		return array_column( $this->call_api( Requests::GET, '', null, $query )->get_data()['tasks'], 'calypso_path', 'id' );
	}

	/**
	 * The `/available-tasks` payload for a goal.
	 *
	 * @param string $goal The goal slug.
	 * @return array The `available_task_ids` / `renderable_task_ids` pair.
	 */
	private function available_tasks( $goal ) {
		return $this->call_api( Requests::GET, '/available-tasks', null, array( 'goal' => $goal ) )->get_data();
	}

	/**
	 * Seeds a persisted wizard + AI output (Alpine Notes, write goal) so GET renders the six-task list.
	 */
	private function seed_tailored_site() {
		update_option(
			'wpcom_ai_launchpad_wizard',
			array(
				'version'      => 1,
				'goal'         => 'write',
				'site_name'    => 'Alpine Notes',
				'description'  => 'Personal blog about long-distance hiking in the Alps.',
				'locale'       => 'en',
				'generated_at' => 1717000000,
			),
			false
		);

		update_option(
			'wpcom_ai_launchpad_ai_output',
			array(
				'version'      => 1,
				'source'       => 'ai',
				'generated_at' => 1717000000,
				'payload'      => self::valid_payload(),
			),
			false
		);
	}

	/**
	 * Seeds the AI output option with the given tasks so wpcom_ai_launchpad_get_ai_task_ids() reports them.
	 *
	 * @param array        $tasks    Task ids, or an id => subtitle map when the subtitle matters.
	 * @param string|array $inferred The inferred goal slug, or the whole `inferred` block.
	 */
	private function seed_ai_output_with_tasks( array $tasks, $inferred = array() ) {
		if ( is_string( $inferred ) ) {
			$inferred = '' === $inferred ? array() : array( 'goal' => $inferred );
		}

		$list = array();
		foreach ( $tasks as $key => $value ) {
			$id     = is_int( $key ) ? $value : $key;
			$list[] = array(
				'id'       => $id,
				'subtitle' => is_int( $key ) ? 'Subtitle for ' . $id . '.' : $value,
			);
		}

		$payload = array( 'tasks' => $list );
		if ( ! empty( $inferred ) ) {
			$payload['inferred'] = $inferred;
		}

		update_option(
			'wpcom_ai_launchpad_ai_output',
			array(
				'version'      => 1,
				'source'       => 'ai',
				'generated_at' => 1717000000,
				'payload'      => $payload,
			),
			false
		);
	}

	/**
	 * Starts capturing server-side analytics events into $this->events.
	 */
	private function capture_tracks_events() {
		add_action(
			'wpcom_ai_launchpad_tracks_event',
			function ( $name, $props ) {
				$this->events[] = array( $name, $props );
			},
			10,
			2
		);
	}

	/**
	 * Asserts a CTA path contains a fragment, or is null when no fragment is expected.
	 *
	 * @param string|null $fragment The expected fragment, or null for no CTA.
	 * @param string|null $path     The rendered CTA path.
	 */
	private function assert_cta( $fragment, $path ) {
		if ( null === $fragment ) {
			$this->assertNull( $path );
		} else {
			$this->assertStringContainsString( $fragment, (string) $path );
		}
	}

	/**
	 * Test that GET returns the composite shape with enriched tasks.
	 */
	public function test_get_returns_composite_shape() {
		$this->seed_tailored_site();
		update_option( 'launchpad_checklist_tasks_statuses', array( 'first_post_published' => true ) );
		$ai_output = get_option( 'wpcom_ai_launchpad_ai_output' );

		$result = $this->call_api( Requests::GET );

		$this->assertSame( 200, $result->get_status() );

		$data = $result->get_data();
		$this->assertSame( get_option( 'wpcom_ai_launchpad_wizard' ), $data['wizard'] );
		$this->assertSame( $ai_output, $data['ai_output'] );
		$this->assertSame( array( 'first_post_published' => true ), $data['checklist_statuses'] );
		$this->assertFalse( $data['dismissed'] );
		$this->assertTrue( $data['is_eligible'] );
		$this->assertSame( home_url(), $data['site']['url'] );
		$this->assertSame( get_bloginfo( 'name' ), $data['site']['title'] );
		$this->assertSame( get_bloginfo( 'description' ), $data['site']['description'] );
		// The site's language for page content; the reader's for the task subtitles.
		$this->assertSame( wpcom_ai_launchpad_site_locale(), $data['site']['language'] );
		$this->assertSame( determine_locale(), $data['user_language'] );
		$this->assertSame( wpcom_ai_launchpad_site_copy(), $data['site']['copy'] );

		$this->assertCount( 6, $data['tasks'] );

		$first_task = $data['tasks'][0];
		$this->assertSame( 'first_post_published', $first_task['id'] );
		$this->assertSame( 'Share your first trail story.', $first_task['subtitle'] );
		$this->assertSame( 'Write your first post', $first_task['title'] );
		$this->assertTrue( $first_task['completed'] );
		$this->assertFalse( $first_task['in_progress'] );
		$this->assertSame( admin_url( 'post-new.php' ), $first_task['calypso_path'] );

		$last_task = $data['tasks'][5];
		$this->assertSame( 'site_launched', $last_task['id'] );
		$this->assertSame( 'Launch your site', $last_task['title'] );
		$this->assertFalse( $last_task['completed'] );
		$this->assertFalse( $last_task['in_progress'] );
		$this->assertNull( $last_task['calypso_path'] );
	}

	/**
	 * A task's own unpublished AI draft puts its card in progress, with a "Continue…" title and a CTA that
	 * reopens the draft; the persisted subtitle survives.
	 *
	 * @param string $task_id  The id the card renders as.
	 * @param array  $seeded   The task ids seeded into the AI output.
	 * @param string $goal     The inferred goal to seed.
	 * @param string $meta_key The listener marker meta key the draft lookup queries.
	 * @param int    $draft_id The draft post id the stubbed lookup resolves to.
	 * @param string $title    The card title before the draft exists.
	 * @param string $continue The card title once the draft exists.
	 * @dataProvider provide_marker_draft_tasks
	 */
	#[DataProvider( 'provide_marker_draft_tasks' )]
	public function test_get_marks_task_in_progress_with_marker_draft( $task_id, $seeded, $goal, $meta_key, $draft_id, $title, $continue ) {
		$this->seed_ai_output_with_tasks( $seeded, $goal );

		$before = $this->rendered_task( $task_id );
		$this->assertFalse( $before['in_progress'] );
		$this->assertSame( $title, $before['title'] );
		$this->assertSame( 'Subtitle for ' . $seeded[0] . '.', $before['subtitle'] );

		$this->stub_marker_draft( $meta_key, $draft_id );

		$after = $this->rendered_task( $task_id );
		$this->assertTrue( $after['in_progress'] );
		$this->assertSame( $continue, $after['title'] );
		$this->assertSame( admin_url( 'post.php?post=' . $draft_id . '&action=edit' ), $after['calypso_path'] );
	}

	/**
	 * Marker-draft cases for test_get_marks_task_in_progress_with_marker_draft.
	 *
	 * @return array
	 */
	public static function provide_marker_draft_tasks() {
		return array(
			'about page'                            => array(
				'add_about_page',
				array( 'add_about_page', 'site_launched' ),
				'',
				AI_Launchpad_About_Page_Listener::META_KEY,
				4242,
				'Add your About page',
				'Continue working on the About page',
			),
			'first post, seeded as its id_map twin' => array(
				'first_post_published',
				array( 'first_post_published_newsletter', 'site_launched' ),
				'',
				AI_Launchpad_First_Post_Listener::META_KEY,
				5151,
				'Write your first post',
				'Continue to write your first post',
			),
			'gallery page, built from the registry' => array(
				'add_gallery_page',
				array( 'add_gallery_page', 'site_launched' ),
				'portfolio',
				AI_Launchpad_Gallery_Page_Listener::META_KEY,
				4343,
				'Create your first gallery',
				'Continue working on your gallery',
			),
		);
	}

	/**
	 * Test that GET drops tasks the catalog would hide on this site (woo_products needs WooCommerce).
	 */
	public function test_get_excludes_non_visible_tasks() {
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'woo_products', 'site_launched' ) );

		$ids = $this->rendered_ids();
		$this->assertContains( 'first_post_published', $ids );
		$this->assertContains( 'site_launched', $ids );
		$this->assertNotContains( 'woo_products', $ids );
	}

	/**
	 * A short rendered list is topped back up toward six, keeping the launch task last, without the read
	 * rewriting the persisted payload.
	 */
	public function test_get_backfills_a_short_list_to_six_with_launch_last() {
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'site_launched' ), 'write' );
		$before = get_option( 'wpcom_ai_launchpad_ai_output' );

		$ids = $this->rendered_ids();

		$this->assertCount( 6, $ids, 'a two-task list is backfilled to six' );
		$this->assertSame( 'first_post_published', $ids[0], 'the AI tasks keep their lead position' );
		$this->assertSame( 'site_launched', end( $ids ), 'the launch task stays last' );
		$this->assertSame( array_values( array_unique( $ids ) ), $ids, 'no duplicate task cards' );

		// Only the analytics baseline key may be added to the envelope.
		$after = get_option( 'wpcom_ai_launchpad_ai_output' );
		unset( $after['tracked_completed'] );
		$this->assertSame( $before, $after );
	}

	/**
	 * The gallery renders only when the AI picked it: a portfolio list without it gets none injected.
	 */
	public function test_get_does_not_inject_the_gallery_task() {
		$this->seed_ai_output_with_tasks( array( 'site_title', 'site_launched' ), 'portfolio' );

		$this->assertNotContains( 'add_gallery_page', $this->rendered_ids() );
	}

	/**
	 * A sell menu keeps the WooCommerce tasks as available previews even before WooCommerce is installed.
	 */
	public function test_available_tasks_keep_woo_previews_on_sell() {
		$this->assertContains( 'woo_products', $this->available_tasks( 'sell' )['available_task_ids'] );
	}

	/**
	 * The goal filter, not the catalog gate, keeps a goal-restricted task off both menus; a force-visible task
	 * is offered on the goals that allow it.
	 */
	public function test_available_tasks_applies_the_goal_filter_over_a_force_visible_task() {
		$newsletter = $this->available_tasks( 'newsletter' );
		$write      = $this->available_tasks( 'write' );

		$this->assertContains( 'add_10_email_subscribers', $newsletter['available_task_ids'] );
		$this->assertNotContains( 'add_10_email_subscribers', $write['available_task_ids'] );
		$this->assertNotContains( 'add_10_email_subscribers', $write['renderable_task_ids'] );
		$this->assertContains( 'add_about_page', $write['available_task_ids'] );
		$this->assertContains( 'first_post_published', $write['available_task_ids'] );
	}

	/**
	 * A completed task drops off the actionable ids but stays renderable; a launch task stays actionable, since
	 * every tailored list must end on one.
	 *
	 * @param array  $options    Options to write to complete the task.
	 * @param string $goal       The goal to ask the endpoint about.
	 * @param string $task_id    The task id.
	 * @param bool   $actionable Whether the task stays actionable once complete.
	 * @dataProvider provide_completed_availability_cases
	 */
	#[DataProvider( 'provide_completed_availability_cases' )]
	public function test_available_tasks_drop_completed_tasks( $options, $goal, $task_id, $actionable ) {
		$before = $this->available_tasks( $goal );
		$this->assertContains( $task_id, $before['available_task_ids'], 'the premise: it is actionable while incomplete' );

		foreach ( $options as $name => $value ) {
			update_option( $name, $value );
		}

		$this->assertTrue(
			AI_Launchpad_Task_Registry::has( $task_id )
				? AI_Launchpad_Task_Registry::is_complete( $task_id )
				: wpcom_launchpad_checklists()->is_task_id_complete( $task_id ),
			'the premise: the task really is complete now'
		);

		$after = $this->available_tasks( $goal );
		$this->assertSame( $actionable, in_array( $task_id, $after['available_task_ids'], true ) );
		$this->assertContains( $task_id, $after['renderable_task_ids'], 'a completed task stays renderable' );
	}

	/**
	 * Completed-task availability cases for test_available_tasks_drop_completed_tasks.
	 *
	 * @return array
	 */
	public static function provide_completed_availability_cases() {
		return array(
			'a completed catalog task'  => array(
				array( 'launchpad_checklist_tasks_statuses' => array( 'first_post_published' => true ) ),
				'write',
				'first_post_published',
				false,
			),
			'a completed registry task' => array(
				array( 'launchpad_checklist_tasks_statuses' => array( 'add_gallery_page' => true ) ),
				'portfolio',
				'add_gallery_page',
				false,
			),
			'a completed launch task, exempt so a launched site can still fill a list' => array(
				array( 'launch-status' => 'launched' ),
				'write',
				'site_launched',
				true,
			),
		);
	}

	/**
	 * The sell goal's exclusion withholds the registry gallery task from both menus.
	 */
	public function test_available_tasks_withhold_the_gallery_on_sell() {
		$sell = $this->available_tasks( 'sell' );

		$this->assertNotContains( 'add_gallery_page', $sell['available_task_ids'] );
		$this->assertNotContains( 'add_gallery_page', $sell['renderable_task_ids'] );
	}

	/**
	 * A registry task its own definition hides is offered on neither menu, since the client relaxes from the
	 * actionable list to the renderable one.
	 *
	 * @param bool|null $is_visible The injected definition's `is_visible` return, or null to omit the key.
	 * @param bool      $offered    Whether the task should reach the offered menu.
	 * @dataProvider provide_registry_visibility_cases
	 */
	#[DataProvider( 'provide_registry_visibility_cases' )]
	public function test_available_tasks_honor_registry_visibility( $is_visible, $offered ) {
		$task_id = $this->register_test_task( $is_visible );

		$data = $this->available_tasks( 'write' );

		$this->assertSame( $offered, in_array( $task_id, $data['available_task_ids'], true ) );
		$this->assertSame( $offered, in_array( $task_id, $data['renderable_task_ids'], true ) );
		$this->assertContains( 'add_gallery_page', $data['renderable_task_ids'], 'the premise: the registry pass ran' );
	}

	/**
	 * A persisted registry task its own definition now hides is dropped on read, as the catalog gate does.
	 *
	 * @param bool|null $is_visible The injected definition's `is_visible` return, or null to omit the key.
	 * @param bool      $rendered   Whether the persisted task should still render.
	 * @dataProvider provide_registry_visibility_cases
	 */
	#[DataProvider( 'provide_registry_visibility_cases' )]
	public function test_persisted_registry_tasks_honor_visibility_on_read( $is_visible, $rendered ) {
		$task_id = $this->register_test_task( $is_visible );
		$this->seed_ai_output_with_tasks( array( 'first_post_published', $task_id, 'site_launched' ), 'write' );

		$ids = $this->rendered_ids();

		$this->assertSame( $rendered, in_array( $task_id, $ids, true ) );
		$this->assertContains( 'first_post_published', $ids, 'the premise: the rest of the persisted list still renders' );
	}

	/**
	 * Visibility cases for the two registry-visibility tests above.
	 *
	 * @return array
	 */
	public static function provide_registry_visibility_cases() {
		return array(
			'a definition with no is_visible' => array( null, true ),
			'an is_visible returning false'   => array( false, false ),
		);
	}

	/**
	 * The availability sweep, hit on every wizard prewarm, must not run the gallery's draft lookup query.
	 */
	public function test_available_tasks_do_not_resolve_the_gallery_draft() {
		$resolved = false;
		add_filter(
			'posts_pre_query',
			function ( $posts, $query ) use ( &$resolved ) {
				if ( AI_Launchpad_Gallery_Page_Listener::META_KEY === $query->get( 'meta_key' ) ) {
					$resolved = true;
				}
				return $posts;
			},
			10,
			2
		);

		$data = $this->available_tasks( 'portfolio' );

		$this->assertContains( 'add_gallery_page', $data['available_task_ids'], 'the premise: the gallery is on the menu' );
		$this->assertFalse( $resolved, 'the availability sweep must not run the gallery draft lookup' );
	}

	/**
	 * The short-list backfill never tops the list up with already-completed filler, including one completed
	 * under the id_map twin the pool task renders from.
	 */
	public function test_backfill_skips_already_completed_pool_tasks() {
		update_option(
			'launchpad_checklist_tasks_statuses',
			array(
				'add_new_page'  => true,
				'drive_traffic' => true,
			)
		);
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'site_launched' ), 'write' );

		$ids = $this->rendered_ids();

		$this->assertNotContains( 'add_new_page', $ids, 'a completed pool task is not backfilled' );
		$this->assertNotContains( 'connect_social_media', $ids, 'nor one completed under its twin id' );
		$this->assertContains( 'design_edited', $ids, 'incomplete pool tasks still backfill' );
	}

	/**
	 * The tailoring observation event reports the inferred details minus the user's own brand name, the raw
	 * picks, the rendered list and the delta between them, plus the client's telemetry when sent.
	 */
	public function test_update_tailored_logs_observation_event() {
		$payload             = self::valid_payload();
		$payload['inferred'] = array(
			'goal'       => 'write',
			'brand_name' => 'Alpine Notes',
			'niche'      => 'hiking',
		);
		// A hallucinated id, a goal-dropped pick and a remapped pick, swapped in mid-list to keep the schema's six.
		$payload['tasks'][2] = array(
			'id'       => 'imaginary_task',
			'subtitle' => 'A task the catalog does not know.',
		);
		$payload['tasks'][3] = array(
			'id'       => 'woo_products',
			'subtitle' => 'Add your first products.',
		);
		$payload['tasks'][4] = array(
			'id'       => 'post_sharing_enabled',
			'subtitle' => 'Share posts automatically.',
		);

		$this->assertSame( 200, $this->call_api( 'PUT', '/tailored', $payload )->get_status() );

		$builder  = new \ReflectionMethod( AI_Launchpad_REST::class, 'tailoring_log_extra' );
		$envelope = get_option( 'wpcom_ai_launchpad_ai_output' );
		$this->assertSame(
			array(
				'source'   => 'ai',
				'inferred' => array(
					'goal'  => 'write',
					'niche' => 'hiking',
				),
				'selected' => array_column( $payload['tasks'], 'id' ),
				'rendered' => array( 'first_post_published', 'design_edited', 'connect_social_media', 'add_new_page', 'mobile_app_installed', 'site_launched' ),
				'dropped'  => array( 'imaginary_task', 'woo_products' ),
				'added'    => array( 'add_new_page', 'mobile_app_installed' ),
			),
			$builder->invoke( new AI_Launchpad_REST(), $envelope, array_column( $payload['tasks'], 'id' ) )
		);

		$telemetry = $builder->invoke( new AI_Launchpad_REST(), $envelope, array(), 4200, 2, null, array( 'http: 503' ) );
		$this->assertSame( 4200, $telemetry['duration_ms'] );
		$this->assertSame( 2, $telemetry['attempts'] );
		$this->assertSame( array( 'http: 503' ), $telemetry['validation_errors'] );
	}

	/**
	 * Completions are reported by diffing the rendered list on read: tasks already complete at the first read
	 * are baselined silently, a later one is reported once, and the bookkeeping never reaches the response.
	 */
	public function test_task_completed_is_reported_once_via_diff_on_read() {
		$this->seed_tailored_site();
		update_option( 'launchpad_checklist_tasks_statuses', array( 'first_post_published' => true ) );
		$this->capture_tracks_events();

		$this->call_api( Requests::GET );
		$this->assertSame( array(), $this->events );
		$this->assertSame( array( 'first_post_published' ), get_option( 'wpcom_ai_launchpad_ai_output' )['tracked_completed'] );

		update_option(
			'launchpad_checklist_tasks_statuses',
			array(
				'first_post_published' => true,
				'site_title'           => true,
			)
		);
		$data = $this->call_api( Requests::GET )->get_data();
		$this->call_api( Requests::GET );

		$this->assertCount( 1, $this->events );
		list( $name, $props ) = $this->events[0];
		$this->assertSame( 'jetpack_ai_launchpad_task_completed', $name );
		$this->assertSame( 'site_title', $props['task_id'] );
		$this->assertContains( 'site_title', json_decode( $props['rendered_list'], true ) );
		$this->assertSame( array( 'first_post_published', 'site_title' ), get_option( 'wpcom_ai_launchpad_ai_output' )['tracked_completed'] );
		$this->assertArrayNotHasKey( 'tracked_completed', $data['ai_output'] );
	}

	/**
	 * Finishing the list records all_tasks_completed exactly once, after the final task_completed, and skips
	 * count toward it without being reported as completions.
	 */
	public function test_all_tasks_completed_fires_once_at_the_latch() {
		$this->seed_tailored_site();
		$this->capture_tracks_events();

		$this->call_api( Requests::GET );
		foreach ( array( 'design_edited', 'site_title', 'setup_free', 'site_theme_selected', 'site_launched' ) as $task_id ) {
			$this->assertSame( 200, $this->call_api( 'POST', '/skip-task', array( 'task_id' => $task_id ) )->get_status() );
		}
		$this->assertSame( array(), $this->events );

		update_option( 'launchpad_checklist_tasks_statuses', array( 'first_post_published' => true ) );
		$this->call_api( Requests::GET );

		$this->assertSame(
			array( 'jetpack_ai_launchpad_task_completed', 'jetpack_ai_launchpad_all_tasks_completed' ),
			array_column( $this->events, 0 )
		);

		$this->call_api( Requests::GET );
		$this->assertCount( 2, $this->events );
	}

	/**
	 * `PUT /tailored` enforces the goal rules against the wizard goal (the payload's echo only when the wizard
	 * option has not landed), judging and persisting each pick under the id it renders as.
	 *
	 * @param string|null $wizard_goal  The wizard goal to persist, or null to leave the option unwritten.
	 * @param string|null $payload_goal The goal the payload echoes, or null to keep the fixture's.
	 * @param array       $swaps        Task ids to swap into the fixture payload, keyed by list index.
	 * @param array       $present      Ids that must survive into the persisted list.
	 * @param array       $absent       Ids that must not.
	 * @dataProvider provide_goal_enforcement_cases
	 */
	#[DataProvider( 'provide_goal_enforcement_cases' )]
	public function test_update_tailored_enforces_the_goal( $wizard_goal, $payload_goal, $swaps, $present, $absent ) {
		if ( null !== $wizard_goal ) {
			update_option( 'wpcom_ai_launchpad_wizard', array( 'goal' => $wizard_goal ), false );
		}

		$payload = self::valid_payload();
		if ( null !== $payload_goal ) {
			$payload['inferred']['goal'] = $payload_goal;
		}
		foreach ( $swaps as $index => $task_id ) {
			$payload['tasks'][ $index ] = array(
				'id'       => $task_id,
				'subtitle' => 'Subtitle for ' . $task_id . '.',
			);
		}

		$this->assertSame( 200, $this->call_api( 'PUT', '/tailored', $payload )->get_status() );

		$persisted = array_column( get_option( 'wpcom_ai_launchpad_ai_output' )['payload']['tasks'], 'id' );
		foreach ( $present as $id ) {
			$this->assertContains( $id, $persisted );
		}
		foreach ( $absent as $id ) {
			$this->assertNotContains( $id, $persisted );
		}
	}

	/**
	 * Goal-enforcement cases for test_update_tailored_enforces_the_goal.
	 *
	 * @return array
	 */
	public static function provide_goal_enforcement_cases() {
		return array(
			'a sell-only task is dropped on a newsletter goal, the newsletter one is not' => array(
				'newsletter',
				'newsletter',
				array(
					2 => 'add_10_email_subscribers',
					3 => 'woo_products',
				),
				array( 'add_10_email_subscribers' ),
				array( 'woo_products' ),
			),
			'the payload goal stands in when the wizard option has not landed' => array(
				null,
				'sell',
				array( 3 => 'woo_products' ),
				array( 'woo_products' ),
				array(),
			),
			'the wizard goal outranks the goal the model echoed back' => array(
				'newsletter',
				'sell',
				array( 3 => 'woo_products' ),
				array(),
				array( 'woo_products' ),
			),
			'a restricted task cannot enter under its id_map twin' => array(
				'write',
				null,
				array( 3 => 'subscribers_added' ),
				array(),
				array( 'subscribers_added', 'import_subscribers' ),
			),
			'a survivor is persisted under the id it renders as' => array(
				'write',
				null,
				array( 3 => 'drive_traffic' ),
				array( 'connect_social_media' ),
				array( 'drive_traffic' ),
			),
			'a registry task the catalog does not define is kept' => array(
				'portfolio',
				null,
				array( 1 => 'add_gallery_page' ),
				array( 'add_gallery_page' ),
				array(),
			),
			'a registry task excluded on its goal is dropped'     => array(
				'sell',
				null,
				array( 1 => 'add_gallery_page' ),
				array(),
				array( 'add_gallery_page' ),
			),
		);
	}

	/**
	 * PUT /tailored baselines the fresh list's born-completed tasks, so a completion landing before any GET is
	 * still reported and the born-completed one never is.
	 */
	public function test_update_tailored_baselines_the_born_completed_tasks() {
		update_option( 'launchpad_checklist_tasks_statuses', array( 'first_post_published' => true ) );

		$result = $this->call_api( 'PUT', '/tailored', self::valid_payload() );
		$this->assertSame( 200, $result->get_status() );
		$this->assertSame(
			array( 'first_post_published' ),
			get_option( 'wpcom_ai_launchpad_ai_output' )['tracked_completed']
		);
		$this->assertArrayNotHasKey( 'tracked_completed', $result->get_data()['ai_output'] );

		$this->capture_tracks_events();
		update_option(
			'launchpad_checklist_tasks_statuses',
			array(
				'first_post_published' => true,
				'site_title'           => true,
			)
		);
		$this->call_api( Requests::GET );

		$this->assertCount( 1, $this->events );
		$this->assertSame( 'site_title', $this->events[0][1]['task_id'] );
	}

	/**
	 * PUT /tailored sanitizes the validation_errors diagnostic rather than rejecting it, so a malformed one
	 * never costs the user their tailored list.
	 */
	public function test_update_tailored_sanitizes_the_validation_errors_param() {
		$captured = null;
		add_filter(
			'rest_request_before_callbacks',
			function ( $response, $handler, $request ) use ( &$captured ) {
				$captured = $request->get_param( 'validation_errors' );
				return $response;
			},
			10,
			3
		);

		$result = $this->call_api(
			'PUT',
			'/tailored',
			self::valid_payload(),
			array( 'validation_errors' => array( 'first_post_draft.subtitle: expected string', array( 'nested' ), 42 ) )
		);

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( array( 'first_post_draft.subtitle: expected string' ), $captured );
	}

	/**
	 * The sanitizer keeps only strings, strips every character a path or rule never uses, and caps both the
	 * count and the length.
	 *
	 * @param mixed    $raw      The raw param value.
	 * @param string[] $expected The sanitized reasons.
	 *
	 * @dataProvider provide_validation_errors
	 */
	#[DataProvider( 'provide_validation_errors' )]
	public function test_sanitize_validation_errors( $raw, $expected ) {
		$this->assertSame( $expected, AI_Launchpad_REST::sanitize_validation_errors( $raw ) );
	}

	/**
	 * Data provider for test_sanitize_validation_errors.
	 *
	 * @return array
	 */
	public static function provide_validation_errors() {
		return array(
			'a valid reason passes through'      => array(
				array( 'tasks[5].subtitle: length 0 < minLength 1; $: invalid JSON' ),
				array( 'tasks[5].subtitle: length 0 < minLength 1; $: invalid JSON' ),
			),
			'a bare string becomes a list'       => array( 'http: 503', array( 'http: 503' ) ),
			'non-strings and blanks are dropped' => array( array( 42, null, array( 'x' ), '   ', 'content: empty' ), array( 'content: empty' ) ),
			'quotes and other characters go'     => array( array( 'inferred.goal: "Café" not in enum' ), array( 'inferred.goal: Caf not in enum' ) ),
			'a non-array, non-string is empty'   => array( 42, array() ),
			'the count is capped'                => array( array_fill( 0, 10, 'http: 503' ), array_fill( 0, AI_Launchpad_REST::MAX_VALIDATION_ERRORS, 'http: 503' ) ),
			'the length is capped'               => array( array( str_repeat( 'a', 1000 ) ), array( str_repeat( 'a', AI_Launchpad_REST::MAX_VALIDATION_ERROR_LENGTH ) ) ),
		);
	}

	/**
	 * The tailoring run's session id is persisted on the envelope, and a write without one leaves the key off.
	 *
	 * @param array       $query    Query params for the PUT.
	 * @param string|null $expected The persisted session id, or null for no key.
	 * @dataProvider provide_session_ids
	 */
	#[DataProvider( 'provide_session_ids' )]
	public function test_tailored_persists_the_ai_session_id( $query, $expected ) {
		$this->assertSame( 200, $this->call_api( 'PUT', '/tailored', self::valid_payload(), $query )->get_status() );

		$this->assertSame( $expected, get_option( 'wpcom_ai_launchpad_ai_output' )['ai_session_id'] ?? null );
	}

	/**
	 * Data provider for test_tailored_persists_the_ai_session_id.
	 *
	 * @return array
	 */
	public static function provide_session_ids() {
		return array(
			'a session id is persisted' => array( array( 'ai_session_id' => 'a755f9e8-8e0a-45be-81bc-524aaf8e2703' ), 'a755f9e8-8e0a-45be-81bc-524aaf8e2703' ),
			'none sent, no key'         => array( array( 'source' => 'ai' ), null ),
		);
	}

	/**
	 * The route's arg schema rejects bad query args before anything is persisted, rather than truncating them.
	 *
	 * @param array $query The offending query params.
	 * @dataProvider provide_rejected_query_args
	 */
	#[DataProvider( 'provide_rejected_query_args' )]
	public function test_put_tailored_rejects_invalid_query_args( $query ) {
		$this->assertSame( 400, $this->call_api( 'PUT', '/tailored', self::valid_payload(), $query )->get_status() );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_ai_output' ) );
	}

	/**
	 * Data provider for test_put_tailored_rejects_invalid_query_args.
	 *
	 * @return array
	 */
	public static function provide_rejected_query_args() {
		return array(
			'an oversized session id' => array( array( 'ai_session_id' => str_repeat( 'a', 65 ) ) ),
			'a negative duration'     => array( array( 'duration_ms' => -1 ) ),
		);
	}

	/**
	 * GET recomputes a membership task's completion from Jetpack_Memberships' local signals, which the catalog
	 * callback cannot read on Atomic, and checklist_statuses agrees.
	 */
	public function test_get_overrides_membership_task_completion() {
		AI_Launchpad_Stub_Jetpack_Memberships::$connected = true;
		$this->seed_ai_output_with_tasks( array( 'stripe_connected', 'site_launched' ) );

		$data = $this->call_api( Requests::GET )->get_data();

		$this->assertTrue( array_column( $data['tasks'], null, 'id' )['stripe_connected']['completed'] );
		$this->assertTrue( $data['checklist_statuses']['stripe_connected'] );
	}

	/**
	 * GET repoints CTAs the catalog sends somewhere unhelpful: connect-social to the Jetpack Social page, and the
	 * Subscribe block to the editor that can add it (the widget editor on this classic theme).
	 */
	public function test_get_overrides_ctas_with_wp_admin_targets() {
		$paths = $this->rendered_paths( array( 'all_tasks' => '1' ) );

		$this->assertSame( admin_url( 'admin.php?page=jetpack-social' ), $paths['connect_social_media'] );
		$this->assertSame( admin_url( 'widgets.php' ), $paths['add_subscribe_block'] );
	}

	/**
	 * The theme task lands on the Calypso showcase, filtered by the inferred category only when it is one the
	 * showcase knows.
	 *
	 * @param array  $inferred The inferred block to seed.
	 * @param string $prefix   The expected showcase path, minus the site slug.
	 * @dataProvider provide_theme_cta_categories
	 */
	#[DataProvider( 'provide_theme_cta_categories' )]
	public function test_get_points_theme_cta_at_the_showcase( $inferred, $prefix ) {
		$this->seed_ai_output_with_tasks( array( 'site_theme_selected', 'site_launched' ), $inferred );

		$this->assertSame( $prefix . rawurlencode( wpcom_get_site_slug() ), $this->rendered_paths()['site_theme_selected'] );
	}

	/**
	 * Theme-CTA cases for test_get_points_theme_cta_at_the_showcase.
	 *
	 * @return array
	 */
	public static function provide_theme_cta_categories() {
		return array(
			'a showcase subject filters the showcase' => array(
				array(
					'goal'           => 'build',
					'theme_category' => 'art-design',
				),
				'/themes/filter/art-design/',
			),
			'a category outside the subject taxonomy falls back to the plain showcase' => array(
				array(
					'goal'           => 'write',
					'theme_category' => 'space-tourism',
				),
				'/themes/',
			),
			'no inferred category at all'             => array( array(), '/themes/' ),
		);
	}

	/**
	 * The sell list's store tasks track WooCommerce's real state, each state carrying the CTA that advances it;
	 * store setup stays a disabled preview until WooCommerce is active.
	 *
	 * @param bool  $active        Whether WooCommerce is active.
	 * @param bool  $installed     Whether WooCommerce is installed (but inactive).
	 * @param bool  $profiler_done Whether WooCommerce's onboarding profiler is done.
	 * @param array $install       Expected install card: in_progress, completed, subtitle fragment, CTA fragment.
	 * @param array $setup         Expected setup card: disabled, completed, CTA fragment.
	 * @dataProvider provide_woocommerce_states
	 */
	#[DataProvider( 'provide_woocommerce_states' )]
	public function test_get_tracks_the_woocommerce_state( $active, $installed, $profiler_done, $install, $setup ) {
		update_option( 'active_plugins', $active ? array( 'woocommerce/woocommerce.php' ) : array() );
		if ( $installed ) {
			wp_cache_set( 'plugins', array( '' => array( 'woocommerce/woocommerce.php' => array( 'Name' => 'WooCommerce' ) ) ), 'plugins' );
		}
		if ( $profiler_done ) {
			update_option( 'woocommerce_onboarding_profile', array( 'skipped' => true ) );
		}
		$this->seed_ai_output_with_tasks( array( 'site_title', 'site_launched' ), 'sell' );

		$tasks = $this->rendered_tasks();
		wp_cache_delete( 'plugins', 'plugins' );

		list( $in_progress, $completed, $subtitle, $cta ) = $install;
		$this->assertSame( $in_progress, $tasks['install_woocommerce']['in_progress'] );
		$this->assertSame( $completed, $tasks['install_woocommerce']['completed'] );
		$this->assertStringContainsString( $subtitle, $tasks['install_woocommerce']['subtitle'] );
		$this->assert_cta( $cta, $tasks['install_woocommerce']['calypso_path'] );

		list( $disabled, $completed, $cta ) = $setup;
		$this->assertSame( $disabled, $tasks['setup_woocommerce_store']['disabled'] );
		$this->assertSame( $completed, $tasks['setup_woocommerce_store']['completed'] );
		$this->assert_cta( $cta, $tasks['setup_woocommerce_store']['calypso_path'] );
	}

	/**
	 * WooCommerce states for test_get_tracks_the_woocommerce_state.
	 *
	 * @return array
	 */
	public static function provide_woocommerce_states() {
		return array(
			'not installed'                 => array(
				false,
				false,
				false,
				array( false, false, 'Add the WooCommerce plugin', 'plugin-install.php?s=woocommerce' ),
				array( true, false, null ),
			),
			'installed but inactive'        => array(
				false,
				true,
				false,
				array( true, false, 'Activate the WooCommerce plugin', 'plugins.php?plugin_status=inactive' ),
				array( true, false, null ),
			),
			'active'                        => array(
				true,
				false,
				false,
				array( false, true, 'Add the WooCommerce plugin', null ),
				array( false, false, 'page=wc-admin&path=%2Fsetup-wizard' ),
			),
			'active with the profiler done' => array(
				true,
				false,
				true,
				array( false, true, 'Add the WooCommerce plugin', null ),
				array( false, true, null ),
			),
		);
	}

	/**
	 * On a sell site without WooCommerce the gated commerce tasks stay as disabled previews: no CTA, never
	 * completed and never writing a status, while a non-commerce task stays actionable.
	 */
	public function test_get_keeps_commerce_tasks_as_disabled_previews() {
		// A completion WooCommerce recorded during an earlier active period.
		update_option( 'woocommerce_task_list_tracked_completed_tasks', array( 'products' ) );
		$this->seed_ai_output_with_tasks( array( 'woo_customize_store', 'woo_products', 'set_up_payments', 'site_theme_selected', 'site_launched' ), 'sell' );

		$tasks = $this->rendered_tasks();

		foreach ( array( 'woo_customize_store', 'woo_products', 'set_up_payments' ) as $id ) {
			$this->assertTrue( $tasks[ $id ]['disabled'], "$id should be disabled" );
			$this->assertNull( $tasks[ $id ]['calypso_path'], "$id should have no CTA" );
			$this->assertFalse( $tasks[ $id ]['completed'], "$id should not be completed" );
		}
		$this->assertFalse( $tasks['site_theme_selected']['disabled'] );
		$this->assertArrayNotHasKey( 'woo_products', (array) get_option( 'launchpad_checklist_tasks_statuses', array() ) );
	}

	/**
	 * Persisted ids are normalized on read onto the task the launchpad actually renders, and a list holding
	 * both a twin and its target collapses to one card.
	 *
	 * @param array|null $seeded     Task ids to seed, or null to render the whole catalog.
	 * @param array|null $query      Query params for the GET.
	 * @param array      $absent     Ids that must not survive the remap.
	 * @param array      $single     Ids that must render exactly once.
	 * @param array      $incomplete Ids that must render not-completed.
	 * @dataProvider provide_remapped_task_lists
	 */
	#[DataProvider( 'provide_remapped_task_lists' )]
	public function test_get_remaps_persisted_task_ids( $seeded, $query, $absent, $single, $incomplete ) {
		if ( null !== $seeded ) {
			$this->seed_ai_output_with_tasks( $seeded );
		}

		$cards = $this->call_api( Requests::GET, '', null, $query )->get_data()['tasks'];
		$ids   = array_column( $cards, 'id' );
		$tasks = array_column( $cards, null, 'id' );

		foreach ( $absent as $id ) {
			$this->assertNotContains( $id, $ids );
		}
		foreach ( $single as $id ) {
			$this->assertCount( 1, array_keys( $ids, $id, true ), 'exactly one ' . $id . ' card' );
		}
		foreach ( $incomplete as $id ) {
			$this->assertFalse( $tasks[ $id ]['completed'], $id . ' reads a real signal, so it is not born-complete' );
		}
	}

	/**
	 * Remap cases for test_get_remaps_persisted_task_ids.
	 *
	 * @return array
	 */
	public static function provide_remapped_task_lists() {
		return array(
			'a list carrying the launch task and its stray twin collapses to one' => array(
				array( 'woo_launch_site', 'site_theme_selected', 'site_launched' ),
				null,
				array( 'woo_launch_site' ),
				array( 'site_launched' ),
				array(),
			),
			'the ?all_tasks=1 catalog view collapses it too' => array(
				null,
				array( 'all_tasks' => '1' ),
				array( 'woo_launch_site' ),
				array( 'site_launched' ),
				array(),
			),
			'post_sharing_enabled folds onto connect_social_media' => array(
				array( 'post_sharing_enabled', 'connect_social_media', 'first_post_published', 'site_launched' ),
				null,
				array( 'post_sharing_enabled' ),
				array( 'connect_social_media' ),
				array(),
			),
			'id_map twins render as the ids the menu still offers' => array(
				array( 'subscribers_added', 'first_post_published', 'link_in_bio_launched', 'videopress_launched', 'site_launched' ),
				null,
				array( 'subscribers_added', 'link_in_bio_launched', 'videopress_launched' ),
				array( 'import_subscribers', 'site_launched' ),
				array(),
			),
			'the legacy design tasks consolidate onto the theme task' => array(
				array( 'design_selected', 'design_completed', 'site_launched' ),
				null,
				array( 'design_selected', 'design_completed' ),
				array( 'site_theme_selected' ),
				array( 'site_theme_selected' ),
			),
		);
	}

	/**
	 * On a Simple site, which has no wp-admin plugin screens, plugin CTAs (the WooCommerce install task's and a
	 * catalog task's) route to Calypso. Runs in a separate process so IS_WPCOM does not leak.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_get_routes_plugin_ctas_to_calypso_on_simple() {
		define( 'IS_WPCOM', true );
		// Resolves install_custom_plugin's catalog CTA to plugins.php.
		update_option( 'wpcom_admin_interface', 'wp-admin' );
		$this->seed_ai_output_with_tasks( array( 'install_custom_plugin', 'site_launched' ), 'sell' );

		$paths = $this->rendered_paths();

		$site = rawurlencode( wpcom_get_site_slug() );
		$this->assertSame( '/plugins/woocommerce/' . $site, $paths['install_woocommerce'] );
		$this->assertSame( '/plugins/' . $site, $paths['install_custom_plugin'] );
	}

	/**
	 * The store sequence and the sell theme guarantee follow the goal the user chose in the wizard, never the
	 * one the model echoed back.
	 *
	 * @param string $wizard_goal  The wizard goal.
	 * @param string $payload_goal The goal the payload echoes.
	 * @param bool   $store        Whether the store sequence is expected.
	 * @dataProvider provide_store_injection_goals
	 */
	#[DataProvider( 'provide_store_injection_goals' )]
	public function test_get_injects_the_store_sequence_on_the_wizard_goal( $wizard_goal, $payload_goal, $store ) {
		update_option( 'wpcom_ai_launchpad_wizard', array( 'goal' => $wizard_goal ), false );
		$this->seed_ai_output_with_tasks( array( 'site_title', 'site_launched' ), $payload_goal );

		$ids = $this->rendered_ids();

		foreach ( array( 'install_woocommerce', 'setup_woocommerce_store', 'site_theme_selected' ) as $id ) {
			$this->assertSame( $store, in_array( $id, $ids, true ), $id );
		}
		$this->assertSame( $store, in_array( 'site_theme_selected', wpcom_ai_launchpad_get_ai_task_ids(), true ) );
	}

	/**
	 * Goal-authority cases for test_get_injects_the_store_sequence_on_the_wizard_goal.
	 *
	 * @return array
	 */
	public static function provide_store_injection_goals() {
		return array(
			'the wizard says newsletter, the model echoed sell' => array( 'newsletter', 'sell', false ),
			'the wizard says sell, the model echoed write' => array( 'sell', 'write', true ),
		);
	}

	/**
	 * GET with ?all_tasks=1 (a testing aid) returns the full catalog, bypassing per-site visibility.
	 */
	public function test_get_all_tasks_param_returns_full_catalog() {
		$this->assertContains( 'woo_products', $this->rendered_ids( array( 'all_tasks' => '1' ) ) );
	}

	/**
	 * The Jetpack Social task is hidden on a private site, where wpcom does not load the page its CTA opens.
	 */
	public function test_get_hides_social_tasks_on_private_site() {
		update_option( 'blog_public', '-1' );
		$this->seed_ai_output_with_tasks( array( 'connect_social_media', 'first_post_published', 'site_launched' ) );

		$ids = $this->rendered_ids();

		$this->assertNotContains( 'connect_social_media', $ids );
		$this->assertContains( 'first_post_published', $ids );
	}

	/**
	 * Test that ineligible sites get a 404.
	 */
	public function test_ineligible_site_gets_404() {
		\Brain\Monkey\Functions\when( 'wpcom_ai_launchpad_is_eligible' )->justReturn( false );

		$result = $this->call_api( Requests::GET );

		$this->assertSame( 404, $result->get_status() );
		$this->assertSame( 'ai_launchpad_not_eligible', $result->get_data()['code'] );
	}

	/**
	 * PUT /wizard persists the wizard option, both languages included, and writes the site's own identity.
	 */
	public function test_put_wizard_persists_option() {
		$result = $this->call_api(
			'PUT',
			'/wizard',
			array(
				'goal'        => 'write',
				'site_name'   => 'Alpine Notes',
				'description' => 'Personal blog about long-distance hiking in the Alps.',
				'locale'      => 'fr_FR',
				'ui_locale'   => 'it_IT',
			)
		);

		$this->assertSame( 200, $result->get_status() );

		$option = get_option( 'wpcom_ai_launchpad_wizard' );
		$this->assertSame( 1, $option['version'] );
		$this->assertSame( 'write', $option['goal'] );
		$this->assertSame( 'Alpine Notes', $option['site_name'] );
		$this->assertSame( 'Personal blog about long-distance hiking in the Alps.', $option['description'] );
		$this->assertSame( 'fr_FR', $option['locale'] );
		$this->assertSame( 'it_IT', $option['ui_locale'] );
		$this->assertIsInt( $option['generated_at'] );
		$this->assertSame( 'Alpine Notes', get_option( 'blogname' ) );
		$this->assertSame( 'Personal blog about long-distance hiking in the Alps.', get_option( 'blogdescription' ) );
	}

	/**
	 * Empty wizard fields leave an existing title/tagline alone, and the tagline is collapsed to one line.
	 *
	 * @param string $site_name   The Name the wizard submits.
	 * @param string $description The Brief description the wizard submits.
	 * @param string $blogname    The expected site title afterwards.
	 * @param string $tagline     The expected tagline afterwards.
	 * @dataProvider provide_wizard_site_identity_cases
	 */
	#[DataProvider( 'provide_wizard_site_identity_cases' )]
	public function test_put_wizard_writes_site_identity( $site_name, $description, $blogname, $tagline ) {
		update_option( 'blogname', 'Existing Title' );
		update_option( 'blogdescription', 'Existing Tagline' );

		$result = $this->call_api(
			'PUT',
			'/wizard',
			array(
				'goal'        => 'write',
				'site_name'   => $site_name,
				'description' => $description,
				'locale'      => 'en',
			)
		);

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( $blogname, get_option( 'blogname' ) );
		$this->assertSame( $tagline, get_option( 'blogdescription' ) );
	}

	/**
	 * Site-identity cases for test_put_wizard_writes_site_identity.
	 *
	 * @return array
	 */
	public static function provide_wizard_site_identity_cases() {
		return array(
			'empty fields leave the existing identity alone' => array( '', '', 'Existing Title', 'Existing Tagline' ),
			'a multi-line description collapses to a single-line tagline' => array(
				'Alpine Notes',
				"Line one.\nLine two.",
				'Alpine Notes',
				'Line one. Line two.',
			),
		);
	}

	/**
	 * Test that PUT /wizard rejects an unknown goal.
	 */
	public function test_put_wizard_rejects_unknown_goal() {
		$result = $this->call_api(
			'PUT',
			'/wizard',
			array(
				'goal'        => 'world-domination',
				'site_name'   => 'Alpine Notes',
				'description' => 'A blog.',
			)
		);

		$this->assertSame( 400, $result->get_status() );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_wizard' ) );
	}

	/**
	 * PUT /tailored persists the payload, optional fields included, in a versioned envelope tagged with its
	 * source.
	 *
	 * @param array  $query  Query params for the PUT.
	 * @param string $source The expected source.
	 * @dataProvider provide_tailored_sources
	 */
	#[DataProvider( 'provide_tailored_sources' )]
	public function test_put_tailored_persists_wrapped_envelope( $query, $source ) {
		$payload                               = self::valid_payload();
		$payload['inferred']['inferred_goal']  = 'portfolio';
		$payload['inferred']['theme_category'] = 'travel-lifestyle';
		$payload['page_intros']                = array(
			'add_contact_page' => 'Ask about a commission.',
			'add_events_page'  => 'Come and throw a pot with us.',
			'add_video_page'   => 'Every glaze test, filmed start to finish.',
			'add_gallery_page' => 'A year of finished pieces in one place.',
		);

		$result = $this->call_api( 'PUT', '/tailored', $payload, $query );

		$this->assertSame( 200, $result->get_status() );

		$option = get_option( 'wpcom_ai_launchpad_ai_output' );
		$this->assertSame( 1, $option['version'] );
		$this->assertSame( $source, $option['source'] );
		$this->assertIsInt( $option['generated_at'] );
		$this->assertSame( $payload, $option['payload'] );
	}

	/**
	 * Data provider for test_put_tailored_persists_wrapped_envelope.
	 *
	 * @return array
	 */
	public static function provide_tailored_sources() {
		return array(
			'an AI list by default' => array( array(), 'ai' ),
			'the fallback'          => array( array( 'source' => 'fallback' ), 'fallback' ),
		);
	}

	/**
	 * A payload that breaks the output contract is rejected whole, with the code naming the broken rule, and
	 * nothing is persisted.
	 *
	 * @param callable $break    Applies the contract violation to the fixture payload.
	 * @param string   $code     The expected error code.
	 * @dataProvider provide_invalid_payloads
	 */
	#[DataProvider( 'provide_invalid_payloads' )]
	public function test_put_tailored_rejects_invalid_payload( $break, $code ) {
		$result = $this->call_api( 'PUT', '/tailored', $break( self::valid_payload() ) );

		$this->assertSame( 422, $result->get_status() );
		$this->assertSame( $code, $result->get_data()['code'] );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_ai_output' ) );
	}

	/**
	 * Contract violations for test_put_tailored_rejects_invalid_payload.
	 *
	 * @return array
	 */
	public static function provide_invalid_payloads() {
		return array(
			'a seventh task'                         => array(
				static function ( $payload ) {
					$payload['tasks'][] = array(
						'id'       => 'drive_traffic',
						'subtitle' => 'One task too many.',
					);
					return $payload;
				},
				'ai_launchpad_invalid_payload',
			),
			'a missing required field'               => array(
				static function ( $payload ) {
					unset( $payload['first_post_draft'] );
					return $payload;
				},
				'ai_launchpad_invalid_payload',
			),
			'an inferred_goal outside its enum'      => array(
				static function ( $payload ) {
					$payload['inferred']['inferred_goal'] = 'cook';
					return $payload;
				},
				'ai_launchpad_invalid_payload',
			),
			'a theme_category outside its enum'      => array(
				static function ( $payload ) {
					$payload['inferred']['theme_category'] = 'hiking';
					return $payload;
				},
				'ai_launchpad_invalid_payload',
			),
			'a page intro for an unknown page task'  => array(
				static function ( $payload ) {
					$payload['page_intros'] = array( 'add_faq_page' => 'Answers to what people ask most.' );
					return $payload;
				},
				'ai_launchpad_invalid_payload',
			),
			'fewer than four catalog-valid task ids' => array(
				static function ( $payload ) {
					$payload['tasks'][1]['id'] = 'made_up_task_one';
					$payload['tasks'][2]['id'] = 'made_up_task_two';
					$payload['tasks'][3]['id'] = 'made_up_task_three';
					return $payload;
				},
				'ai_launchpad_unknown_tasks',
			),
			'a last task that is not a launch task'  => array(
				static function ( $payload ) {
					$payload['tasks'][5]['id'] = 'drive_traffic';
					return $payload;
				},
				'ai_launchpad_missing_launch_task',
			),
			'a subtitle that is only a script tag'   => array(
				static function ( $payload ) {
					$payload['tasks'][0]['subtitle'] = '<script>alert(1)</script>';
					return $payload;
				},
				'ai_launchpad_invalid_subtitle',
			),
			'a subtitle containing a URL'            => array(
				static function ( $payload ) {
					$payload['tasks'][0]['subtitle'] = 'Visit https://example.com for tips.';
					return $payload;
				},
				'ai_launchpad_subtitle_contains_url',
			),
			'a subtitle containing template syntax'  => array(
				static function ( $payload ) {
					$payload['tasks'][0]['subtitle'] = 'Write about {{brand_name}} today.';
					return $payload;
				},
				'ai_launchpad_subtitle_contains_template',
			),
		);
	}

	/**
	 * PUT /tailored strips HTML from subtitles rather than rejecting the whole list over stray markup.
	 */
	public function test_put_tailored_strips_html_from_subtitles() {
		$payload                         = self::valid_payload();
		$payload['tasks'][0]['subtitle'] = 'Share your <b>first</b> trail story.';

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 200, $result->get_status() );

		$option = get_option( 'wpcom_ai_launchpad_ai_output' );
		$this->assertSame( 'Share your first trail story.', $option['payload']['tasks'][0]['subtitle'] );
	}

	/**
	 * Test that PUT /tailored drops unknown task IDs but persists when enough survive.
	 */
	public function test_put_tailored_drops_unknown_task_ids() {
		$payload                   = self::valid_payload();
		$payload['tasks'][1]['id'] = 'made_up_task';

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 200, $result->get_status() );

		$persisted_tasks = get_option( 'wpcom_ai_launchpad_ai_output' )['payload']['tasks'];
		$this->assertCount( 5, $persisted_tasks );
		$this->assertNotContains( 'made_up_task', array_column( $persisted_tasks, 'id' ) );
	}

	/**
	 * Test that subscriber-role users are denied on every endpoint.
	 */
	public function test_subscriber_is_denied() {
		wp_set_current_user( $this->subscriber_id );

		$result = $this->call_api(
			'PUT',
			'/wizard',
			array(
				'goal'        => 'write',
				'site_name'   => 'Alpine Notes',
				'description' => 'A blog.',
			)
		);
		$this->assertSame( 403, $result->get_status() );

		$result = $this->call_api( 'PUT', '/tailored', self::valid_payload() );
		$this->assertSame( 403, $result->get_status() );

		$result = $this->call_api( 'POST', '/complete-task', array( 'task_id' => 'complete_profile' ) );
		$this->assertSame( 403, $result->get_status() );

		$result = $this->call_api( 'POST', '/skip-task', array( 'task_id' => 'complete_profile' ) );
		$this->assertSame( 403, $result->get_status() );

		$result = $this->call_api( Requests::DELETE );
		$this->assertSame( 403, $result->get_status() );

		$result = $this->call_api( Requests::GET );
		$this->assertSame( 403, $result->get_status() );

		$this->assertFalse( get_option( 'wpcom_ai_launchpad_wizard' ) );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_ai_output' ) );
	}

	/**
	 * A sell list carries exactly one theme task, placed right after the store-setup lead tasks and pointed at
	 * the showcase's Store category, whether the AI ranked it, picked a legacy design task, or picked none.
	 *
	 * @param array $seeded The task ids seeded into the sell AI output.
	 * @param array $absent Ids that must not survive into the rendered list.
	 * @dataProvider provide_sell_theme_task_sources
	 */
	#[DataProvider( 'provide_sell_theme_task_sources' )]
	public function test_get_sell_places_one_theme_task_after_store_setup( $seeded, $absent ) {
		$this->seed_ai_output_with_tasks( $seeded, 'sell' );

		$tasks = $this->rendered_tasks();
		$ids   = array_keys( $tasks );

		$this->assertSame(
			array( 'install_woocommerce', 'setup_woocommerce_store', 'site_theme_selected' ),
			array_slice( $ids, 0, 3 )
		);
		$this->assertSame(
			'/themes/filter/store/' . rawurlencode( wpcom_get_site_slug() ),
			$tasks['site_theme_selected']['calypso_path']
		);
		foreach ( $absent as $id ) {
			$this->assertNotContains( $id, $ids );
		}
	}

	/**
	 * The ways a sell list can come by its theme task, for test_get_sell_places_one_theme_task_after_store_setup.
	 *
	 * @return array
	 */
	public static function provide_sell_theme_task_sources() {
		return array(
			'the AI ranked it mid-list'                  => array(
				array( 'woo_customize_store', 'woo_products', 'site_theme_selected', 'woo_launch_site' ),
				array(),
			),
			'a legacy design task remaps onto it'        => array(
				array( 'woo_products', 'design_selected', 'site_launched' ),
				array( 'design_selected' ),
			),
			'the AI picked none, so it is guaranteed in' => array(
				array( 'woo_products', 'woo_marketing', 'site_launched' ),
				array(),
			),
		);
	}

	/**
	 * A skip recorded under a task's raw id before that id was remapped still applies to the card it renders as.
	 */
	public function test_get_applies_pre_remap_skips_to_remapped_task() {
		$this->seed_ai_output_with_tasks( array( 'post_sharing_enabled', 'site_launched' ) );
		update_option( 'wpcom_ai_launchpad_skipped_tasks', array( 'post_sharing_enabled' ), false );

		$tasks = $this->rendered_tasks();

		$this->assertTrue( $tasks['connect_social_media']['skipped'] );
		$this->assertTrue( $tasks['connect_social_media']['completed'] );
	}

	/**
	 * POST /complete-task marks an allowlisted task complete when its real signal is unreachable from wp-admin.
	 *
	 * @param string $task_id The complete-on-click task id.
	 * @dataProvider provide_complete_on_click_task_ids
	 */
	#[DataProvider( 'provide_complete_on_click_task_ids' )]
	public function test_complete_task_marks_complete_on_click_task( $task_id ) {
		$this->seed_ai_output_with_tasks( array( $task_id, 'site_launched' ) );

		$result = $this->call_api( 'POST', '/complete-task', array( 'task_id' => $task_id ) );

		$this->assertSame( 200, $result->get_status() );
		$this->assertTrue( $result->get_data()['completed'] );
		$statuses = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertTrue( ! empty( $statuses[ $task_id ] ) );
	}

	/**
	 * Complete-on-click task ids for test_complete_task_marks_complete_on_click_task.
	 *
	 * @return array
	 */
	public static function provide_complete_on_click_task_ids() {
		return array(
			'an acknowledgment task'           => array( 'complete_profile' ),
			'setup_ssh, ticked optimistically' => array( 'setup_ssh' ),
			'share_site, which has no CTA'     => array( 'share_site' ),
		);
	}

	/**
	 * A registry task completed on click reads back as completed, though the catalog's completion writer
	 * ignores ids it does not define.
	 */
	public function test_complete_task_completes_a_registry_task_on_read() {
		$this->use_block_theme();
		$this->seed_ai_output_with_tasks( array( 'pick_fonts_colors', 'site_launched' ) );

		$this->assertFalse( $this->rendered_task( 'pick_fonts_colors' )['completed'] );

		$this->call_api( 'POST', '/complete-task', array( 'task_id' => 'pick_fonts_colors' ) );

		$this->assertTrue( $this->rendered_task( 'pick_fonts_colors' )['completed'] );
	}

	/**
	 * POST /complete-task rejects a non-allowlisted task even on the list, and an allowlisted one off it.
	 */
	public function test_complete_task_rejects_invalid_tasks() {
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'complete_profile', 'site_launched' ) );

		$not_allowlisted = $this->call_api( 'POST', '/complete-task', array( 'task_id' => 'first_post_published' ) );
		$this->assertSame( 400, $not_allowlisted->get_status() );
		$this->assertSame( 'ai_launchpad_task_not_completable', $not_allowlisted->get_data()['code'] );

		$not_selected = $this->call_api( 'POST', '/complete-task', array( 'task_id' => 'earn_money' ) );
		$this->assertSame( 404, $not_selected->get_status() );
		$this->assertSame( 'ai_launchpad_task_not_selected', $not_selected->get_data()['code'] );

		$this->assertFalse( get_option( 'launchpad_checklist_tasks_statuses' ) );
	}

	/**
	 * Reading the launchpad maintains the cached "every task is done" flag: unset while any task is incomplete,
	 * set once every task is completed or skipped, and latched until an explicit reset.
	 *
	 * @param array $seeded   The task ids to seed.
	 * @param array $skipped  The task ids to record as skipped.
	 * @param bool  $preset   Whether the flag is already set before the read.
	 * @param bool  $expected The expected flag after the read.
	 * @dataProvider provide_completed_flag_states
	 */
	#[DataProvider( 'provide_completed_flag_states' )]
	public function test_get_maintains_the_completed_flag( $seeded, $skipped, $preset, $expected ) {
		$this->seed_ai_output_with_tasks( $seeded );
		if ( ! empty( $skipped ) ) {
			update_option( 'wpcom_ai_launchpad_skipped_tasks', $skipped, false );
		}
		if ( $preset ) {
			update_option( 'wpcom_ai_launchpad_completed', true, true );
		}

		$this->call_api( Requests::GET );

		$this->assertSame( $expected, (bool) get_option( 'wpcom_ai_launchpad_completed' ) );
	}

	/**
	 * Completion-flag states for test_get_maintains_the_completed_flag. The "all done" case seeds a full
	 * six-task list so the backfill cannot add incomplete tasks.
	 *
	 * @return array
	 */
	public static function provide_completed_flag_states() {
		$full = array( 'first_post_published', 'design_edited', 'site_title', 'setup_general', 'site_theme_selected', 'site_launched' );

		return array(
			'unset while any task is incomplete'     => array( array( 'first_post_published', 'site_launched' ), array(), false, false ),
			'set once every task is done or skipped' => array( $full, $full, false, true ),
			'latched once set, even when a task reads incomplete again' => array( array( 'first_post_published', 'site_launched' ), array(), true, true ),
		);
	}

	/**
	 * Skipping the final task refreshes the cached flag immediately, without waiting for another read.
	 */
	public function test_skip_final_task_sets_completed_flag() {
		$non_launch = array( 'first_post_published', 'design_edited', 'site_title', 'setup_general', 'site_theme_selected' );
		$this->seed_ai_output_with_tasks( array_merge( $non_launch, array( 'site_launched' ) ) );
		update_option( 'wpcom_ai_launchpad_skipped_tasks', $non_launch, false );

		$this->call_api( 'POST', '/skip-task', array( 'task_id' => 'site_launched' ) );

		$this->assertTrue( (bool) get_option( 'wpcom_ai_launchpad_completed' ) );
	}

	/**
	 * Test that skipping the same task twice stores it once.
	 */
	public function test_skip_task_is_idempotent() {
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'site_launched' ) );

		$this->call_api( 'POST', '/skip-task', array( 'task_id' => 'first_post_published' ) );
		$repeat = $this->call_api( 'POST', '/skip-task', array( 'task_id' => 'first_post_published' ) );
		$this->assertSame( 200, $repeat->get_status(), 'skipping an already-skipped task still succeeds' );

		$this->assertSame( array( 'first_post_published' ), get_option( 'wpcom_ai_launchpad_skipped_tasks' ) );
	}

	/**
	 * Every card the site renders is skippable however its id got there, and the skip renders it completed
	 * without touching its siblings or the shared statuses option.
	 *
	 * @param array  $seeded  The task ids to seed.
	 * @param string $goal    The inferred goal to seed.
	 * @param string $task_id The rendered card id to skip.
	 * @dataProvider provide_skippable_rendered_ids
	 */
	#[DataProvider( 'provide_skippable_rendered_ids' )]
	public function test_skip_task_accepts_every_rendered_card( $seeded, $goal, $task_id ) {
		$this->seed_ai_output_with_tasks( $seeded, $goal );

		$result = $this->call_api( 'POST', '/skip-task', array( 'task_id' => $task_id ) );
		$this->assertSame( 200, $result->get_status() );
		$this->assertTrue( $result->get_data()['skipped'] );

		$tasks = $this->rendered_tasks();
		$this->assertTrue( $tasks[ $task_id ]['skipped'] );
		$this->assertTrue( $tasks[ $task_id ]['completed'] );
		$this->assertFalse( $tasks['site_launched']['skipped'] );
		$this->assertFalse( get_option( 'launchpad_checklist_tasks_statuses' ) );
	}

	/**
	 * Rendered-card ids for test_skip_task_accepts_every_rendered_card.
	 *
	 * @return array
	 */
	public static function provide_skippable_rendered_ids() {
		return array(
			'a plain AI-selected task'                 => array( array( 'first_post_published', 'site_launched' ), '', 'first_post_published' ),
			'a card rendered under its remapped id'    => array( array( 'post_sharing_enabled', 'site_launched' ), '', 'connect_social_media' ),
			'a registry task the model picked'         => array( array( 'add_gallery_page', 'site_launched' ), 'portfolio', 'add_gallery_page' ),
			'a synthetic store task the server minted' => array( array( 'woo_products', 'site_launched' ), 'sell', 'install_woocommerce' ),
			'a backfilled filler'                      => array( array( 'first_post_published', 'site_launched' ), 'write', 'design_edited' ),
		);
	}

	/**
	 * Test that POST /skip-task rejects a task that is neither on the site's AI list nor synthetic.
	 */
	public function test_skip_task_rejects_task_not_on_list() {
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'site_launched' ) );

		$result = $this->call_api( 'POST', '/skip-task', array( 'task_id' => 'earn_money' ) );

		$this->assertSame( 404, $result->get_status() );
		$this->assertSame( 'ai_launchpad_task_not_skippable', $result->get_data()['code'] );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_skipped_tasks' ) );
	}

	/**
	 * Writing a fresh tailored list clears the previous list's skips and the cached completion flag.
	 */
	public function test_tailored_write_clears_skips_and_completed_flag() {
		update_option( 'wpcom_ai_launchpad_skipped_tasks', array( 'first_post_published' ), false );
		update_option( 'wpcom_ai_launchpad_completed', true, true );

		$result = $this->call_api( 'PUT', '/tailored', self::valid_payload() );

		$this->assertSame( 200, $result->get_status() );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_skipped_tasks' ) );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_completed' ) );
	}

	/**
	 * Test that DELETE removes the AI output, sets dismissed, and leaves statuses untouched.
	 */
	public function test_delete_dismisses_and_keeps_statuses() {
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'site_launched' ) );
		update_option( 'launchpad_checklist_tasks_statuses', array( 'first_post_published' => true ) );
		update_option( 'wpcom_ai_launchpad_skipped_tasks', array( 'site_launched' ), false );
		update_option( 'wpcom_ai_launchpad_completed', true, true );

		$result = $this->call_api( Requests::DELETE );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( array( 'dismissed' => true ), $result->get_data() );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_ai_output' ) );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_skipped_tasks' ) );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_completed' ) );
		$this->assertTrue( (bool) get_option( 'wpcom_ai_launchpad_dismissed' ) );
		$this->assertSame( array( 'first_post_published' => true ), get_option( 'launchpad_checklist_tasks_statuses' ) );
	}
}
