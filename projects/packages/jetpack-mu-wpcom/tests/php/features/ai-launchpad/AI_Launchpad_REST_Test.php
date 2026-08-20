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
require_once __DIR__ . '/fixtures/trait-uses-block-theme.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-memberships.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-about-page-listener.php';
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
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-first-post-listener.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-task-registry.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-rest.php';

// Block real Logstash dispatch of the tailoring observation event for the entire phpunit
// process (its HTTP fallback fires from a shutdown function, i.e. after teardown). The
// event payload itself is asserted by invoking the builder directly.
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
	use AI_Launchpad_Uses_Block_Theme;

	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Subscriber user ID.
	 *
	 * @var int
	 */
	private $subscriber_id;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		\Brain\Monkey\setUp();
		\Brain\Monkey\Functions\when( 'wpcom_ai_launchpad_is_eligible' )->justReturn( true );

		$this->admin_id = wp_insert_user(
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

		// Nearly every test drives the endpoints as an administrator; the few that need another identity
		// (anonymous, subscriber) set it themselves.
		wp_set_current_user( $this->admin_id );

		// Register the launchpad checklists before the REST server is created, so the legacy
		// launchpad endpoint registers its route args from a populated task registry.
		wpcom_register_default_launchpad_checklists();
		do_action( 'rest_api_init' );
	}

	/**
	 * Reverting the testing environment to its original state.
	 */
	public function tear_down() {
		\Brain\Monkey\tearDown();
		// A `posts_pre_query` short-circuit still writes its result to the `post-queries` cache group, which
		// WorDBless never flushes — leaving a stubbed draft id visible to every later test.
		wp_cache_flush_group( 'post-queries' );
		$this->restore_theme_directories();
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
	 * Stands in for a saved-but-unpublished AI draft by short-circuiting its marker-meta lookup: the lookup runs
	 * through WP_Query, which WorDBless can't execute.
	 *
	 * @param string $meta_key The listener's marker meta key.
	 * @param int    $draft_id The draft post id the lookup should resolve to.
	 */
	private function stub_marker_draft( $meta_key, $draft_id ) {
		add_filter(
			'posts_pre_query',
			static function ( $posts, $query ) use ( $meta_key, $draft_id ) {
				return $meta_key === $query->get( 'meta_key' ) ? array( $draft_id ) : $posts;
			},
			10,
			2
		);
	}

	/**
	 * Test that GET returns the composite shape with enriched tasks.
	 */
	public function test_get_returns_composite_shape() {
		$wizard = array(
			'version'      => 1,
			'goal'         => 'write',
			'site_name'    => 'Alpine Notes',
			'description'  => 'Personal blog about long-distance hiking in the Alps.',
			'locale'       => 'en',
			'generated_at' => 1717000000,
		);
		update_option( 'wpcom_ai_launchpad_wizard', $wizard, false );

		$ai_output = array(
			'version'      => 1,
			'source'       => 'ai',
			'generated_at' => 1717000000,
			'payload'      => self::valid_payload(),
		);
		update_option( 'wpcom_ai_launchpad_ai_output', $ai_output, false );
		update_option( 'launchpad_checklist_tasks_statuses', array( 'first_post_published' => true ) );

		$result = $this->call_api( Requests::GET );

		$this->assertSame( 200, $result->get_status() );

		$data = $result->get_data();
		$this->assertSame( $wizard, $data['wizard'] );
		$this->assertSame( $ai_output, $data['ai_output'] );
		$this->assertSame( array( 'first_post_published' => true ), $data['checklist_statuses'] );
		$this->assertFalse( $data['dismissed'] );
		$this->assertTrue( $data['is_eligible'] );
		// Site context for the client (launch CTA slug + preview thumbnail/label
		// + wizard Name/Brief-description pre-fill).
		$this->assertSame( home_url(), $data['site']['url'] );
		$this->assertSame( get_bloginfo( 'name' ), $data['site']['title'] );
		$this->assertSame( get_bloginfo( 'description' ), $data['site']['description'] );

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
	 * An unpublished, AI-created draft puts its task "in progress": the card surfaces the `in_progress` flag, a
	 * "Continue…" title, and a calypso_path that reopens the existing draft rather than creating a new one.
	 *
	 * Detection runs through each listener's own marker meta, so an unrelated draft never counts (the catalog's
	 * looser "any draft exists" signal would otherwise show a "Continue…" title beside the not-started icon). The
	 * first-post case seeds the `first_post_published_newsletter` id_map twin, which must render as the canonical
	 * `first_post_published` with the in-progress treatment intact; the gallery case runs through the registry
	 * rather than the catalog.
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
		// add_about_page's catalog visibility gate requires this meta to be registered on pages (as on WoA).
		register_post_meta( 'page', '_wpcom_template_layout_category', array( 'show_in_rest' => true ) );
		$this->seed_ai_output_with_tasks( $seeded, $goal );

		// No marked draft yet: the task renders in its plain, not-started state.
		$before = $this->rendered_task( $task_id );
		$this->assertFalse( $before['in_progress'] );
		$this->assertSame( $title, $before['title'] );

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
			'about page'                               => array(
				'add_about_page',
				array( 'add_about_page', 'site_launched' ),
				'',
				AI_Launchpad_About_Page_Listener::META_KEY,
				4242,
				'Add your About page',
				'Continue working on the About page',
			),
			'first post, seeded as its id_map twin'    => array(
				'first_post_published',
				array( 'first_post_published_newsletter', 'site_launched' ),
				'',
				AI_Launchpad_First_Post_Listener::META_KEY,
				5151,
				'Write your first post',
				'Continue to write your first post',
			),
			'gallery page, built from the registry'    => array(
				'add_gallery_page',
				array( 'add_gallery_page', 'site_launched' ),
				'portfolio',
				AI_Launchpad_Gallery_Page_Listener::META_KEY,
				4343,
				'Create your first gallery',
				'Continue working on your gallery',
			),
			'contact page, built from the registry'    => array(
				'add_contact_page',
				array( 'add_contact_page', 'site_launched' ),
				'build',
				AI_Launchpad_Contact_Page_Listener::META_KEY,
				7171,
				'Add a contact page',
				'Continue working on your contact page',
			),
			'events page, built from the registry'     => array(
				'add_events_page',
				array( 'add_events_page', 'site_launched' ),
				'build',
				AI_Launchpad_Events_Page_Listener::META_KEY,
				8181,
				'Add an events page',
				'Continue working on your events page',
			),
			'video page, built from the registry'      => array(
				'add_video_page',
				array( 'add_video_page', 'site_launched' ),
				'build',
				AI_Launchpad_Video_Page_Listener::META_KEY,
				9191,
				'Add a video page',
				'Continue working on your video page',
			),
			'portfolio piece, built from the registry' => array(
				'add_portfolio_piece',
				array( 'add_portfolio_piece', 'site_launched' ),
				'portfolio',
				AI_Launchpad_Portfolio_Piece_Listener::META_KEY,
				10101,
				'Add your first portfolio piece',
				'Continue working on your portfolio piece',
			),
		);
	}

	/**
	 * Test that GET drops tasks the catalog would hide on this site (is_visible_callback),
	 * while keeping the visible ones. WooCommerce tasks are gated to WoA sites with
	 * WooCommerce active, so woo_products is not visible in the test environment.
	 */
	public function test_get_excludes_non_visible_tasks() {
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'woo_products', 'site_launched' ) );

		$ids = $this->rendered_ids();
		$this->assertContains( 'first_post_published', $ids );
		$this->assertContains( 'site_launched', $ids );
		$this->assertNotContains( 'woo_products', $ids );
	}

	/**
	 * The catalog visibility gate can hide several AI-picked tasks on a given site (e.g. add_about_page needs a
	 * page-template meta key that is not registered during a REST request), which collapses the rendered list.
	 * A short list is topped back up toward six from a pool of broadly-useful tasks, keeping the launch task last.
	 */
	public function test_get_backfills_a_short_list_to_six_with_launch_last() {
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'site_launched' ), 'write' );

		$tasks = $this->call_api( Requests::GET )->get_data()['tasks'];
		$ids   = array_column( $tasks, 'id' );

		$this->assertCount( 6, $tasks, 'a two-task list is backfilled to six' );
		$this->assertSame( 'first_post_published', $ids[0], 'the AI tasks keep their lead position' );
		$this->assertSame( 'site_launched', end( $ids ), 'the launch task stays last' );
		$this->assertSame( array_values( array_unique( $ids ) ), $ids, 'no duplicate task cards' );
	}

	/**
	 * A backfilled filler card must be skippable so it can never strand the launchpad, and GET must never rewrite
	 * the persisted AI payload. (The read does add the `tracked_completed` analytics bookkeeping key to the
	 * envelope — that's the completion-reporting baseline, not a payload mutation.) The skip route accepts a
	 * backfilled id (via the pool allowlist).
	 */
	public function test_backfilled_task_is_skippable_and_get_does_not_mutate_ai_output() {
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'site_launched' ), 'write' );
		$before = get_option( 'wpcom_ai_launchpad_ai_output' );

		$rendered = $this->rendered_ids();
		$this->assertCount( 6, $rendered, 'the short list is backfilled to six' );

		// The read must not rewrite the AI payload; only the analytics baseline key may appear.
		$after = get_option( 'wpcom_ai_launchpad_ai_output' );
		$this->assertArrayHasKey( 'tracked_completed', $after );
		unset( $after['tracked_completed'] );
		$this->assertSame( $before, $after );

		// A backfilled filler card (one not in the seeded AI list) can be skipped.
		$backfilled = array_values( array_diff( $rendered, array( 'first_post_published', 'site_launched' ) ) );
		$this->assertNotEmpty( $backfilled );
		$result = $this->call_api( 'POST', '/skip-task', array( 'task_id' => $backfilled[0] ) );
		$this->assertSame( 200, $result->get_status(), $backfilled[0] . ' is skippable' );
	}

	/**
	 * The available-tasks endpoint advertises the tasks that will actually render on this site+goal, so tailoring can
	 * pick only from renderable tasks. Woo tasks are gated off without WooCommerce, so a write list excludes them,
	 * while a sell list keeps them (as previews) and so lists them as available.
	 */
	public function test_available_tasks_endpoint_is_goal_aware() {
		$write = $this->available_tasks( 'write' );
		$this->assertArrayHasKey( 'available_task_ids', $write );
		$this->assertContains( 'first_post_published', $write['available_task_ids'] );
		$this->assertNotContains( 'woo_products', $write['available_task_ids'], 'woo tasks are not available without a store on a write site' );

		$sell = $this->available_tasks( 'sell' );
		$this->assertContains( 'woo_products', $sell['available_task_ids'], 'sell keeps woo tasks as previews, so they are available' );
	}

	/**
	 * The goal filter, not the catalog gate, is what keeps a goal-restricted task off the offered menu.
	 *
	 * Uses `add_10_email_subscribers` because it needs no setup to prove the point: it is in
	 * FORCE_VISIBLE_TASK_IDS, so the catalog gate is bypassed and it is renderable on every goal, leaving the
	 * newsletter restriction as the only thing that can remove it from a write menu.
	 *
	 * The woo ids prove the same thing but need a WoA site with WooCommerce active — see
	 * test_available_tasks_excludes_commerce_on_a_woa_site_with_woocommerce_active(). Plain
	 * test_available_tasks_endpoint_is_goal_aware() proves less than it appears to, because in the default
	 * harness state (`is_woa_site()` false, no WooCommerce) the catalog gate hides the woo ids on every goal.
	 */
	public function test_available_tasks_applies_the_goal_filter_over_a_force_visible_task() {
		$newsletter = $this->available_tasks( 'newsletter' );
		$write      = $this->available_tasks( 'write' );

		$this->assertContains( 'add_10_email_subscribers', $newsletter['available_task_ids'], 'force-visible, so it renders on its own goal' );
		$this->assertNotContains( 'add_10_email_subscribers', $write['available_task_ids'], 'the goal filter is the only thing that can drop it here' );
		$this->assertNotContains( 'add_10_email_subscribers', $write['renderable_task_ids'], 'the relaxed fallback menu is filtered too' );
		$this->assertContains( 'first_post_published', $write['available_task_ids'] );
	}

	/**
	 * On the site shape this feature actually ships to, the goal filter is the only thing keeping commerce
	 * tasks off a blog's menu.
	 *
	 * `wpcom_launchpad_is_woocommerce_setup_visible()` is goal-agnostic: it asks whether the site is WoA and
	 * WooCommerce is active, nothing more. AI Launchpad runs on Atomic, so on any such site with the plugin on,
	 * every task behind that gate is catalog-visible on a hiking blog just as much as on a store — including
	 * "Collect sales tax". Only GOAL_RESTRICTED_TASK_IDS stands between them and the menu.
	 *
	 * The default harness reports `is_woa_site()` false, which is why this needs the Status cache stubbed and
	 * why the plain goal-aware test cannot reach this path.
	 */
	public function test_available_tasks_excludes_commerce_on_a_woa_site_with_woocommerce_active() {
		\Automattic\Jetpack\Status\Cache::set( 'is_woa_site', true );
		update_option( 'active_plugins', array( 'woocommerce/woocommerce.php' ) );

		$write = $this->available_tasks( 'write' );
		$sell  = $this->available_tasks( 'sell' );

		update_option( 'active_plugins', array() );
		\Automattic\Jetpack\Status\Cache::clear();

		// The gate really is open in this state, so the write assertions below are not passing vacuously.
		$this->assertContains( 'woo_tax', $sell['renderable_task_ids'], 'the woo gate passes on a WoA site with WooCommerce active' );

		foreach ( array( 'woo_tax', 'woo_marketing', 'woo_add_domain', 'woo_products', 'woo_customize_store' ) as $id ) {
			$this->assertNotContains( $id, $write['available_task_ids'], $id . ' must not reach a write menu' );
			$this->assertNotContains( $id, $write['renderable_task_ids'], $id . ' must not reach the relaxed write menu' );
		}
	}

	/**
	 * The add_about_page task is hidden only by a REST-context quirk (its gate needs a page-template meta key that is
	 * not registered during the request). It is force-visible, so it is offered as available.
	 */
	public function test_available_tasks_include_rescued_add_about_page() {
		$data = $this->available_tasks( 'write' );

		$this->assertContains( 'add_about_page', $data['available_task_ids'] );
	}

	/**
	 * A task that is already complete offers nothing to do, so it drops off the actionable ids offered to the
	 * tailoring AI — but stays in the renderable ids, the client's relaxation set for heavily-completed sites.
	 * The launch tasks are the one exemption: the output contract requires the tailored list to end on one, so a
	 * site that already launched must still be able to produce a valid list.
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

		// Guard against the premise going stale: the task really is complete now, so the assertions below are
		// about the completed filter rather than mere incompleteness.
		$this->assertTrue(
			AI_Launchpad_Task_Registry::has( $task_id )
				? AI_Launchpad_Task_Registry::is_complete( $task_id )
				: wpcom_launchpad_checklists()->is_task_id_complete( $task_id )
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
	 * The registry's tasks reach the offered menu, and the sell exclusion still withholds the gallery there.
	 *
	 * The availability sweep runs over the shared catalog, which does not define add_gallery_page, so without the
	 * registry pass the menu filter in buildTailorPrompt would drop the gallery again and the model could never
	 * pick it. On sell the store sequence leads instead, so the gallery must be off both lists.
	 */
	public function test_available_tasks_offer_the_registry_gallery_task_except_on_sell() {
		$portfolio = $this->available_tasks( 'portfolio' );
		$this->assertContains( 'add_gallery_page', $portfolio['available_task_ids'] );
		$this->assertContains( 'add_gallery_page', $portfolio['renderable_task_ids'] );

		$sell = $this->available_tasks( 'sell' );
		$this->assertNotContains( 'add_gallery_page', $sell['available_task_ids'] );
		$this->assertNotContains( 'add_gallery_page', $sell['renderable_task_ids'] );
	}

	/**
	 * The registry's page tasks reach the offered menu on any goal, including sell.
	 *
	 * Unlike the gallery, none carries a goal exclusion: a store needs a way to answer "do you ship to…?" as
	 * much as a studio needs one for commissions, a shop that runs a monthly market has dates to list just as a
	 * yoga studio does, and a site that films what it sells is not a different goal from one that photographs
	 * it. Checked on two unrelated goals, since a goal-keyed exclusion would still pass a single-goal
	 * assertion.
	 *
	 * @param string $goal The goal slug.
	 * @dataProvider provide_unrelated_goals
	 */
	#[DataProvider( 'provide_unrelated_goals' )]
	public function test_available_tasks_offer_the_registry_page_tasks( $goal ) {
		$data = $this->available_tasks( $goal );

		foreach ( array( 'add_contact_page', 'add_events_page', 'add_video_page', 'add_portfolio_piece' ) as $task_id ) {
			$this->assertContains( $task_id, $data['available_task_ids'], $task_id . ' is not offered on ' . $goal );
			$this->assertContains( $task_id, $data['renderable_task_ids'], $task_id . ' is not renderable on ' . $goal );
		}
	}

	/**
	 * The two foundation registry tasks reach the offered menu on any goal.
	 *
	 * They exist to widen what the model can reach for on a site with no niche angle, so a goal filter
	 * withholding either of them would defeat the point. Checked on two unrelated goals rather than one,
	 * since a goal-keyed exclusion would still pass a single-goal assertion.
	 *
	 * @param string $goal The goal slug.
	 * @dataProvider provide_unrelated_goals
	 */
	#[DataProvider( 'provide_unrelated_goals' )]
	public function test_available_tasks_offer_the_foundation_registry_tasks( $goal ) {
		$this->use_block_theme();

		$data = $this->available_tasks( $goal );

		foreach ( array( 'add_site_icon', 'pick_fonts_colors' ) as $task_id ) {
			$this->assertContains( $task_id, $data['available_task_ids'], $task_id . ' is not offered on ' . $goal );
			$this->assertContains( $task_id, $data['renderable_task_ids'], $task_id . ' is not renderable on ' . $goal );
		}
	}

	/**
	 * Goals for test_available_tasks_offer_the_foundation_registry_tasks.
	 *
	 * @return array
	 */
	public static function provide_unrelated_goals() {
		return array(
			'a writing site' => array( 'write' ),
			'a store'        => array( 'sell' ),
		);
	}

	/**
	 * The plugin-discovery task reaches the offered menu on any goal.
	 *
	 * Its whole value is that the *pick* is the personalization — Sensei only makes sense for a site that
	 * teaches — and the niche that decides is not tracked by any goal slug: a tutor picks `educate` or
	 * `build` or `sell` with equal likelihood. A goal filter would suppress it for the sites it exists to
	 * reach, so there is deliberately no restriction to bypass here.
	 *
	 * @param string $goal The goal slug.
	 * @dataProvider provide_unrelated_goals
	 */
	#[DataProvider( 'provide_unrelated_goals' )]
	public function test_available_tasks_offer_the_plugin_discovery_task( $goal ) {
		$data = $this->available_tasks( $goal );

		$this->assertContains( 'install_sensei_lms', $data['available_task_ids'], 'not offered on ' . $goal );
		$this->assertContains( 'install_sensei_lms', $data['renderable_task_ids'], 'not renderable on ' . $goal );
	}

	/**
	 * A site that already runs the plugin is not offered its discovery task — there is nothing left to
	 * discover — but the task stays renderable.
	 *
	 * This is the completion-over-visibility decision paying off: the task is complete rather than hidden, so
	 * the actionable filter withholds it exactly as it withholds any other finished task, without the
	 * read-time drop an `is_visible` gate would also bring. The other registry tasks stay offered, so the
	 * drop is this plugin's state rather than registry tasks leaving the menu.
	 */
	public function test_available_tasks_drop_a_discovery_task_whose_plugin_is_active() {
		update_option( 'active_plugins', array( 'sensei-lms/sensei-lms.php' ) );

		$data = $this->available_tasks( 'write' );

		$this->assertNotContains( 'install_sensei_lms', $data['available_task_ids'] );
		$this->assertContains( 'install_sensei_lms', $data['renderable_task_ids'] );
		$this->assertContains( 'add_site_icon', $data['available_task_ids'], 'the premise: registry tasks do reach this menu' );
	}

	/**
	 * A persisted discovery task renders, and ticks itself once its plugin is active.
	 *
	 * Completion is resolved on every read, so the card the user was given at tailoring time reports the
	 * install whenever it happens, with no listener and nothing written at click time. That live read is also
	 * what feeds the `task_completed` diff, which is the only measure of whether a recommendation landed.
	 */
	public function test_get_completes_a_persisted_discovery_task_from_the_plugin_state() {
		$this->seed_ai_output_with_tasks( array( 'install_sensei_lms', 'site_launched' ), 'write' );

		$this->assertFalse( $this->rendered_task( 'install_sensei_lms' )['completed'] );

		update_option( 'active_plugins', array( 'sensei-lms/sensei-lms.php' ) );

		$this->assertTrue( $this->rendered_task( 'install_sensei_lms' )['completed'] );
	}

	/**
	 * The style-variations task is withheld from the menu on a classic theme, where the Styles screen its
	 * CTA points at does not exist. The site-icon task, which asks nothing of the site, stays.
	 */
	public function test_available_tasks_withhold_the_style_task_without_a_block_theme() {
		$data = $this->available_tasks( 'write' );

		$this->assertNotContains( 'pick_fonts_colors', $data['available_task_ids'] );
		$this->assertNotContains( 'pick_fonts_colors', $data['renderable_task_ids'] );
		$this->assertContains( 'add_site_icon', $data['available_task_ids'], 'the premise: registry tasks do reach this menu' );
	}

	/**
	 * A registry task its own definition hides must not be offered to the model, on either list.
	 *
	 * Both lists matter: the client relaxes from `available_task_ids` to `renderable_task_ids` when completion
	 * leaves the actionable list too thin, so gating only the actionable one would let the exclusion evaporate
	 * exactly when the menu is already weak. An offered-but-unrenderable task spends one of the model's six
	 * picks on a card the site then drops.
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
		// The premise: the registry pass really did run, so an absent id is the visibility gate rather than
		// registry tasks missing from this menu altogether.
		$this->assertContains( 'add_gallery_page', $data['renderable_task_ids'] );
	}

	/**
	 * A registry task its own definition hides must not render, even when an earlier tailoring already
	 * persisted it — the same read-time drop the catalog gate performs, since site state can change under a
	 * saved list.
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
			'an is_visible returning true'    => array( true, true ),
			'an is_visible returning false'   => array( false, false ),
		);
	}

	/**
	 * The availability sweep must not resolve the gallery's in-progress draft.
	 *
	 * It only needs the completed flag, and the endpoint is hit on every wizard prewarm — which fires on every
	 * 1500ms typing pause — so a marker-meta WP_Query here is paid repeatedly for a result that is discarded.
	 * Pinned by failing the test if the draft lookup's query runs at all.
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

		// The premise: the gallery really is on the menu here, so the absent query is a saved lookup rather
		// than a task that was never considered.
		$this->assertContains( 'add_gallery_page', $data['available_task_ids'] );
		$this->assertFalse( $resolved, 'the availability sweep must not run the gallery draft lookup' );

		// posts_pre_query seeds the post-queries cache group, which WorDBless does not flush between tests.
		wp_cache_flush_group( 'post-queries' );
	}

	/**
	 * The short-list backfill must not top the list up with already-completed filler: a pre-checked card the user
	 * never chose offers nothing to do. A shorter list is preferable.
	 */
	public function test_backfill_skips_already_completed_pool_tasks() {
		// Complete two of the four pool tasks: one directly, one under the id_map twin the pool task renders from,
		// since the backfill judges the built card and so has to see through the remap too.
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
		$this->assertNotContains( 'drive_traffic', $ids );
		$this->assertContains( 'design_edited', $ids, 'incomplete pool tasks still backfill' );
	}

	/**
	 * The tailoring observation event reports the AI-inferred details (minus brand_name, which echoes the
	 * user-typed site title), the ids the AI selected, the ids the site will actually render, and the delta
	 * between them. The event is built (via reflection) against the state `PUT /tailored` just persisted —
	 * the same envelope and timing the gated logger uses; real dispatch stays blocked by the file-level
	 * `__return_false`, which short-circuits before the event is built.
	 */
	public function test_update_tailored_logs_observation_event() {
		$payload             = self::valid_payload();
		$payload['inferred'] = array(
			'goal'       => 'write',
			'brand_name' => 'Alpine Notes',
			'tagline'    => 'Hiking stories from Jane Doe of 12 Elm Street.',
			'niche'      => 'hiking',
		);
		// A gate-hidden pick (woo without WooCommerce), a remapped pick, and a hallucinated id the write path
		// silently filters, to exercise the delta reporting. Swapped in mid-list: the schema requires exactly six
		// tasks, launch task last.
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

		$result = $this->call_api( 'PUT', '/tailored', $payload );
		$this->assertSame( 200, $result->get_status() );

		// Build the event exactly as log_tailoring would: from the persisted envelope and the raw pre-filter ids.
		$builder  = new \ReflectionMethod( AI_Launchpad_REST::class, 'tailoring_log_extra' );
		$captured = $builder->invoke(
			new AI_Launchpad_REST(),
			get_option( 'wpcom_ai_launchpad_ai_output' ),
			array_column( $payload['tasks'], 'id' )
		);
		$this->assertIsArray( $captured );

		// Only the intended fields, and never the user's own words: brand_name (echoes the title) and tagline
		// (drafted from the description) are stripped from inferred.
		$this->assertSame( array( 'source', 'inferred', 'selected', 'rendered', 'dropped', 'added' ), array_keys( $captured ) );
		$this->assertSame( 'ai', $captured['source'] );
		$this->assertArrayNotHasKey( 'brand_name', $captured['inferred'] );
		$this->assertArrayNotHasKey( 'tagline', $captured['inferred'] );
		$this->assertSame( 'write', $captured['inferred']['goal'] );
		$this->assertSame( 'hiking', $captured['inferred']['niche'] );

		// Selected reports the AI's raw picks — including the hallucinated id the write path filtered out.
		$this->assertContains( 'woo_products', $captured['selected'] );
		$this->assertContains( 'post_sharing_enabled', $captured['selected'] );
		$this->assertContains( 'imaginary_task', $captured['selected'] );
		$this->assertContains( 'first_post_published', $captured['rendered'] );
		$this->assertNotContains( 'woo_products', $captured['rendered'] );

		// The gate-hidden and hallucinated picks are drops; the remapped pick is not (it renders as its working
		// equivalent).
		$this->assertContains( 'woo_products', $captured['dropped'] );
		$this->assertContains( 'imaginary_task', $captured['dropped'] );
		$this->assertNotContains( 'post_sharing_enabled', $captured['dropped'] );
		$this->assertContains( 'connect_social_media', $captured['rendered'] );

		// Additions (synthetics/backfill) are reported so list inflation is observable: dropping two of six picks
		// leaves a short list, and the backfill tops it up from the pool.
		$this->assertContains( 'add_new_page', $captured['added'] );
	}

	/**
	 * Seeds a persisted wizard + AI output (Alpine Notes, write goal) so GET renders the six-task list.
	 *
	 * @param array $inferred_overrides Extra/overriding `inferred` fields for the payload.
	 * @return void
	 */
	private function seed_tailored_site( $inferred_overrides = array() ) {
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

		$payload             = self::valid_payload();
		$payload['inferred'] = array_merge( $payload['inferred'], $inferred_overrides );
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
	 * The captured event at an index. Exists so static analysis sees a typed read:
	 * the capture array is filled by reference from a hook closure, which Phan
	 * cannot track (it otherwise infers the array stays empty).
	 *
	 * @param array $events The captured events.
	 * @param int   $index  The event index.
	 * @return array{0: string, 1: array} The `[ name, props ]` pair.
	 */
	private static function captured_event( $events, $index = 0 ) {
		return $events[ $index ];
	}

	/**
	 * Starts capturing server-side analytics events via the observation action.
	 *
	 * @param array $events Reference to the array capture appends `[ name, props ]` pairs to.
	 */
	private function capture_tracks_events( &$events ) {
		add_action(
			'wpcom_ai_launchpad_tracks_event',
			static function ( $name, $props ) use ( &$events ) {
				$events[] = array( $name, $props );
			},
			10,
			2
		);
	}

	/**
	 * Test that task completions are reported by diffing the rendered list on read: the first read baselines
	 * born-completed tasks silently, a task that completes later is reported exactly once (with the shared
	 * context props), and repeat reads report nothing new.
	 */
	public function test_task_completed_is_reported_once_via_diff_on_read() {
		$this->seed_tailored_site( array( 'niche' => 'hiking' ) );

		$events = array();
		$this->capture_tracks_events( $events );

		// First read: no tracked_completed key yet, so it only baselines (nothing is completed here anyway).
		$this->call_api( Requests::GET );
		$this->assertSame( array(), $events );
		$envelope = get_option( 'wpcom_ai_launchpad_ai_output' );
		$this->assertSame( array(), $envelope['tracked_completed'] );

		// A listener-style completion lands between reads.
		update_option( 'launchpad_checklist_tasks_statuses', array( 'first_post_published' => true ) );

		$this->call_api( Requests::GET );
		$this->assertCount( 1, $events );
		list( $name, $props ) = self::captured_event( $events );
		$this->assertSame( 'jetpack_ai_launchpad_task_completed', $name );
		$this->assertSame( 'first_post_published', $props['task_id'] );
		// The shared context rides along, populated from the persisted options.
		$this->assertSame( 'write', $props['goal'] );
		$this->assertSame( 'hiking', $props['niche'] );
		// Null context values are omitted from the recorded event, never "null" strings.
		$this->assertArrayNotHasKey( 'inferred_goal', $props );
		$this->assertJson( $props['rendered_list'] );
		$this->assertContains( 'first_post_published', json_decode( $props['rendered_list'], true ) );

		// Reported ids persist inside the existing envelope — no new option.
		$envelope = get_option( 'wpcom_ai_launchpad_ai_output' );
		$this->assertSame( array( 'first_post_published' ), $envelope['tracked_completed'] );

		// A repeat read reports nothing new, and the bookkeeping key stays out of the response even now that the
		// persisted envelope carries it.
		$data = $this->call_api( Requests::GET )->get_data();
		$this->assertCount( 1, $events );
		$this->assertArrayNotHasKey( 'tracked_completed', $data['ai_output'] );
	}

	/**
	 * Test that tasks completed before the first read are baselined silently: the user never triggered them,
	 * so only completions that happen after the baseline are reported.
	 */
	public function test_born_completed_tasks_are_baselined_not_reported() {
		$this->seed_tailored_site();
		update_option( 'launchpad_checklist_tasks_statuses', array( 'first_post_published' => true ) );

		$events = array();
		$this->capture_tracks_events( $events );

		$this->call_api( Requests::GET );
		$this->assertSame( array(), $events );
		$envelope = get_option( 'wpcom_ai_launchpad_ai_output' );
		$this->assertSame( array( 'first_post_published' ), $envelope['tracked_completed'] );

		update_option(
			'launchpad_checklist_tasks_statuses',
			array(
				'first_post_published' => true,
				'site_title'           => true,
			)
		);
		$this->call_api( Requests::GET );
		$this->assertCount( 1, $events );
		$this->assertSame( 'jetpack_ai_launchpad_task_completed', self::captured_event( $events )[0] );
		$this->assertSame( 'site_title', self::captured_event( $events )[1]['task_id'] );
	}

	/**
	 * Test that a skipped task renders as completed but is never reported as a completion — it already
	 * emitted `task_skipped` client-side.
	 */
	public function test_skipped_tasks_are_never_reported_as_completed() {
		$this->seed_tailored_site();

		$events = array();
		$this->capture_tracks_events( $events );

		$this->call_api( Requests::GET );
		$result = $this->call_api( 'POST', '/skip-task', array( 'task_id' => 'site_title' ) );
		$this->assertSame( 200, $result->get_status() );
		$this->call_api( Requests::GET );

		$this->assertSame( array(), $events );
	}

	/**
	 * Test that finishing the list records all_tasks_completed exactly once, at the latch, after the final
	 * task_completed report — and that skips count toward completion.
	 */
	public function test_all_tasks_completed_fires_once_at_the_latch() {
		$this->seed_tailored_site();

		$events = array();
		$this->capture_tracks_events( $events );

		// Baseline read, then skip everything except the first task.
		$this->call_api( Requests::GET );
		foreach ( array( 'design_edited', 'site_title', 'setup_free', 'site_theme_selected', 'site_launched' ) as $task_id ) {
			$this->assertSame( 200, $this->call_api( 'POST', '/skip-task', array( 'task_id' => $task_id ) )->get_status() );
		}
		$this->assertSame( array(), $events );

		// The last real completion finishes the list.
		update_option( 'launchpad_checklist_tasks_statuses', array( 'first_post_published' => true ) );
		$this->call_api( Requests::GET );

		$names = array_column( $events, 0 );
		$this->assertSame(
			array( 'jetpack_ai_launchpad_task_completed', 'jetpack_ai_launchpad_all_tasks_completed' ),
			$names
		);

		// The latch prevents a re-fire on later reads.
		$this->call_api( Requests::GET );
		$this->assertCount( 2, $events );
	}

	/**
	 * `PUT /tailored` is where the goal rules are actually enforced: the menu filter that shapes the prompt is
	 * only advisory (a failed availability lookup leaves the model on the full menu), so a task the goal forbids
	 * is dropped as the list is persisted, and one it allows is kept — the drop is goal-aware, not blanket.
	 *
	 * The authority is the wizard goal, the user's own choice. The payload's goal is only what the prompt asked
	 * the model to echo back, so enforcing against it would let a wrong echo unlock exactly the tasks the rule
	 * exists to withhold; it is the fallback for one race only, the fire-and-forget wizard PUT that a prewarmed
	 * tailor can beat. Without that fallback the goal resolves to '', which matches no restriction and therefore
	 * strips the store sequence from precisely the site built around it.
	 *
	 * The judged id is the id that renders (after wpcom_ai_launchpad_remap_task_id), which is what stops a
	 * restricted task walking past the exclusion under its id_map twin's name — `subscribers_added` is a catalog
	 * id absent from GOAL_RESTRICTED_TASK_IDS that renders as the newsletter-restricted `import_subscribers`:
	 * the same task, the same card, spelled the other way. Survivors are persisted under that same id, so a
	 * later reader never has to re-derive the mapping.
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
		if ( null === $wizard_goal ) {
			$this->assertFalse( get_option( 'wpcom_ai_launchpad_wizard' ), 'the fallback case only means anything with no wizard option' );
		} else {
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

		$result = $this->call_api( 'PUT', '/tailored', $payload );
		$this->assertSame( 200, $result->get_status() );

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
				array( 'add_10_email_subscribers', 'site_launched' ),
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
			'the gallery is excluded on a sell goal, keeping the store and the gallery mutually exclusive' => array(
				'sell',
				'sell',
				array( 1 => 'add_gallery_page' ),
				array(),
				array( 'add_gallery_page' ),
			),
		);
	}

	/**
	 * Test that PUT /tailored seeds the reported set with the fresh list's born-completed tasks: a re-tailor
	 * re-baselines (in lockstep with the skip/completed option resets), a still-complete task is not re-reported
	 * afterwards, and — because the baseline exists from birth — a completion landing before any GET is still
	 * reported instead of being swallowed as baseline.
	 */
	public function test_update_tailored_baselines_the_born_completed_tasks() {
		update_option( 'launchpad_checklist_tasks_statuses', array( 'first_post_published' => true ) );

		$result = $this->call_api( 'PUT', '/tailored', self::valid_payload() );
		$this->assertSame( 200, $result->get_status() );
		$this->assertSame(
			array( 'first_post_published' ),
			get_option( 'wpcom_ai_launchpad_ai_output' )['tracked_completed']
		);
		// The bookkeeping key is persisted only — responses stay clean of it, like GET.
		$this->assertArrayNotHasKey( 'tracked_completed', $result->get_data()['ai_output'] );

		$events = array();
		$this->capture_tracks_events( $events );

		// The born-completed task is never reported; a completion that lands before any GET is.
		update_option(
			'launchpad_checklist_tasks_statuses',
			array(
				'first_post_published' => true,
				'site_title'           => true,
			)
		);
		$this->call_api( Requests::GET );
		$this->assertCount( 1, $events );
		$this->assertSame( 'jetpack_ai_launchpad_task_completed', self::captured_event( $events )[0] );
		$this->assertSame( 'site_title', self::captured_event( $events )[1]['task_id'] );
	}

	/**
	 * Test that PUT /tailored accepts the client's timing telemetry as query params and the tailored
	 * Logstash record carries it (replacing the retired ai_response_received Tracks event).
	 */
	public function test_update_tailored_carries_timing_telemetry_into_the_log() {
		$result = $this->call_api(
			'PUT',
			'/tailored',
			self::valid_payload(),
			array(
				'source'      => 'ai',
				'duration_ms' => 4200,
				'attempts'    => 2,
			)
		);
		$this->assertSame( 200, $result->get_status() );

		$builder  = new \ReflectionMethod( AI_Launchpad_REST::class, 'tailoring_log_extra' );
		$captured = $builder->invoke(
			new AI_Launchpad_REST(),
			get_option( 'wpcom_ai_launchpad_ai_output' ),
			array(),
			4200,
			2
		);
		$this->assertSame( 4200, $captured['duration_ms'] );
		$this->assertSame( 2, $captured['attempts'] );

		// Without telemetry the record keeps its original shape.
		$captured = $builder->invoke( new AI_Launchpad_REST(), get_option( 'wpcom_ai_launchpad_ai_output' ), array() );
		$this->assertArrayNotHasKey( 'duration_ms', $captured );
		$this->assertArrayNotHasKey( 'attempts', $captured );

		// The route's arg schema rejects out-of-range telemetry before the callback runs.
		$result = $this->call_api( 'PUT', '/tailored', self::valid_payload(), array( 'duration_ms' => -1 ) );
		$this->assertSame( 400, $result->get_status() );
	}

	/**
	 * Test that the schema accepts the analytics-only inferred_goal (persisting it into the envelope, where
	 * the Tracks context readers find it) and rejects an out-of-enum value.
	 */
	public function test_update_tailored_accepts_inferred_goal_and_rejects_bad_enum() {
		$payload                              = self::valid_payload();
		$payload['inferred']['inferred_goal'] = 'portfolio';
		$result                               = $this->call_api( 'PUT', '/tailored', $payload );
		$this->assertSame( 200, $result->get_status() );
		$envelope = get_option( 'wpcom_ai_launchpad_ai_output' );
		$this->assertSame( 'portfolio', $envelope['payload']['inferred']['inferred_goal'] );

		$payload['inferred']['inferred_goal'] = 'cook';
		$result                               = $this->call_api( 'PUT', '/tailored', $payload );
		$this->assertSame( 422, $result->get_status() );
	}

	/**
	 * Test that PUT /tailored enforces the theme_category enum: a showcase subject slug
	 * persists, anything else is rejected, so the read side can trust the stored value.
	 */
	public function test_update_tailored_accepts_theme_category_and_rejects_bad_enum() {
		$payload                               = self::valid_payload();
		$payload['inferred']['theme_category'] = 'travel-lifestyle';
		$result                                = $this->call_api( 'PUT', '/tailored', $payload );
		$this->assertSame( 200, $result->get_status() );
		$envelope = get_option( 'wpcom_ai_launchpad_ai_output' );
		$this->assertSame( 'travel-lifestyle', $envelope['payload']['inferred']['theme_category'] );

		$payload['inferred']['theme_category'] = 'hiking';
		$result                                = $this->call_api( 'PUT', '/tailored', $payload );
		$this->assertSame( 422, $result->get_status() );
	}

	/**
	 * Test the shared server-side Tracks context: all-null with no persisted state, populated from the
	 * options once they exist, with the wizard goal as the pre-tailoring fallback.
	 */
	public function test_tracks_context_reads_the_persisted_options() {
		$this->assertSame(
			array(
				'goal'           => null,
				'niche'          => null,
				'theme_category' => null,
				'vibe'           => null,
				'audience'       => null,
				'rendered_list'  => null,
				'inferred_goal'  => null,
			),
			wpcom_ai_launchpad_tracks_context()
		);

		// Wizard persisted, tailoring not yet: the wizard goal fills in.
		update_option( 'wpcom_ai_launchpad_wizard', array( 'goal' => 'sell' ), false );
		$this->assertSame( 'sell', wpcom_ai_launchpad_tracks_context()['goal'] );

		$this->seed_tailored_site(
			array(
				'niche'          => 'hiking',
				'theme_category' => 'travel-lifestyle',
				'inferred_goal'  => 'portfolio',
			)
		);
		$context = wpcom_ai_launchpad_tracks_context( array( 'a', 'b' ) );
		$this->assertSame( 'write', $context['goal'] );
		$this->assertSame( 'hiking', $context['niche'] );
		$this->assertSame( 'travel-lifestyle', $context['theme_category'] );
		$this->assertSame( 'portfolio', $context['inferred_goal'] );
		$this->assertNull( $context['vibe'] );
		$this->assertSame( '["a","b"]', $context['rendered_list'] );
	}

	/**
	 * Test that GET keeps add_10_email_subscribers even though its catalog
	 * visibility callback (wpcom_launchpad_are_newsletter_subscriber_counts_available)
	 * is false off WordPress.com: the AI Launchpad retrieves the subscriber count
	 * on Atomic via the subscribers/stats endpoint, so the legacy IS_WPCOM-only
	 * visibility gate must not hide the task there.
	 */
	public function test_get_keeps_subscriber_count_task_despite_wpcom_only_visibility() {
		// Sanity check: the catalog visibility gate is indeed false in this
		// (non-WordPress.com) environment, so the assertion below proves the override.
		$this->assertFalse( wpcom_launchpad_are_newsletter_subscriber_counts_available() );

		$this->seed_ai_output_with_tasks( array( 'add_10_email_subscribers' ) );

		$this->assertContains( 'add_10_email_subscribers', $this->rendered_ids() );
	}

	/**
	 * Test that GET recomputes the membership tasks' completion from
	 * Jetpack_Memberships' local signals, since their catalog callbacks are always
	 * false on Atomic (membership settings are null there).
	 */
	public function test_get_overrides_membership_task_completion() {
		AI_Launchpad_Stub_Jetpack_Memberships::$connected        = false;
		AI_Launchpad_Stub_Jetpack_Memberships::$plans            = false;
		AI_Launchpad_Stub_Jetpack_Memberships::$newsletter_plans = false;
		$this->seed_ai_output_with_tasks( array( 'stripe_connected', 'paid_offer_created', 'site_launched' ) );

		// No connected account / no plans: both incomplete.
		$tasks = $this->rendered_tasks();
		$this->assertFalse( $tasks['stripe_connected']['completed'] );
		$this->assertFalse( $tasks['paid_offer_created']['completed'] );

		// Turn the local signals on: both complete, via the override (the catalog
		// callback would still report false on Atomic).
		AI_Launchpad_Stub_Jetpack_Memberships::$connected = true;
		AI_Launchpad_Stub_Jetpack_Memberships::$plans     = true;

		$data  = $this->call_api( Requests::GET )->get_data();
		$tasks = array_column( $data['tasks'], null, 'id' );
		$this->assertTrue( $tasks['stripe_connected']['completed'] );
		$this->assertTrue( $tasks['paid_offer_created']['completed'] );

		// checklist_statuses agrees with tasks[].completed for the overridden tasks.
		$this->assertTrue( $data['checklist_statuses']['stripe_connected'] );
		$this->assertTrue( $data['checklist_statuses']['paid_offer_created'] );
	}

	/**
	 * Test that GET repoints the connect-social CTA to its wp-admin target, since the
	 * catalog sends it to a Calypso flow that is a poor fit for the wp-admin AI
	 * Launchpad (and connect_social_media completes on the wp-admin Jetpack Social
	 * page, where its CTA should land).
	 */
	public function test_get_overrides_calypso_ctas_with_wp_admin_targets() {
		$this->seed_ai_output_with_tasks( array( 'connect_social_media', 'first_post_published', 'site_launched' ) );

		$paths = $this->rendered_paths();

		$this->assertSame( admin_url( 'admin.php?page=jetpack-social' ), $paths['connect_social_media'] );
		// A task without an override keeps its catalog path unchanged (null for the
		// launch task, which routes to the wordpress.com launch flow client-side).
		$this->assertArrayHasKey( 'site_launched', $paths );
		$this->assertNull( $paths['site_launched'] );
	}

	/**
	 * The theme task always lands on the Calypso themes showcase, pre-filtered by the AI-inferred category when
	 * that category is one the showcase knows.
	 *
	 * A category filter (unlike the free-text search used previously) always surfaces free themes, and it
	 * overrides the catalog CTA, which can resolve to wp-admin's themes.php — a screen that only filters
	 * already-installed themes. The envelope is stored data, so an unknown category is re-checked against the
	 * allowlist on read and degrades to the unfiltered showcase, never back to the catalog CTA. A sell site
	 * overrides the inferred category entirely: shop-ready templates beat a topical match.
	 *
	 * @param array  $inferred The inferred block to seed.
	 * @param string $prefix   The expected showcase path, minus the site slug.
	 * @dataProvider provide_theme_cta_categories
	 */
	#[DataProvider( 'provide_theme_cta_categories' )]
	public function test_get_points_theme_cta_at_the_showcase( $inferred, $prefix ) {
		$this->seed_ai_output_with_tasks( array( 'site_theme_selected', 'site_launched' ), $inferred );

		$paths = $this->rendered_paths();

		$this->assertSame( $prefix . rawurlencode( wpcom_get_site_slug() ), $paths['site_theme_selected'] );
		// A non-theme task is untouched by the theme CTA rewrite.
		$this->assertNull( $paths['site_launched'] );
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
			'sell overrides the category with the store filter' => array(
				array(
					'goal'           => 'sell',
					'theme_category' => 'art-design',
				),
				'/themes/filter/store/',
			),
		);
	}

	/**
	 * The gallery task is no longer injected on the goal/niche gate that used to surface it.
	 *
	 * It is on the model's menu now, so a portfolio site whose AI list does not name it gets no gallery — the
	 * deterministic coverage this replaced is the accepted cost of letting the model judge instead.
	 */
	public function test_get_does_not_inject_the_gallery_task() {
		// seed_output_for_goal seeds [ site_title, site_launched ] — both reliably visible in the test env
		// (unlike add_about_page, whose visibility gate needs extra meta registered).
		$this->seed_output_for_goal( 'portfolio', 'wildlife photography' );

		$this->assertNotContains( 'add_gallery_page', $this->rendered_ids() );
	}

	/**
	 * A persisted list carrying the gallery id builds it from the registry (not the catalog, which does not define
	 * it), keeps the persisted subtitle over the registry default, and reads its completion from the status option.
	 */
	public function test_get_renders_a_persisted_gallery_task() {
		$this->seed_ai_output_with_tasks(
			array(
				'add_gallery_page' => 'Show off your ceramics.',
				'site_launched'    => 'Go live.',
			),
			array(
				'goal'  => 'portfolio',
				'niche' => 'ceramics',
			)
		);

		$gallery = $this->rendered_task( 'add_gallery_page' );
		$this->assertSame( 'Show off your ceramics.', $gallery['subtitle'], 'the persisted subtitle wins over the registry default' );
		$this->assertSame( 'Create your first gallery', $gallery['title'] );
		$this->assertFalse( $gallery['completed'] );

		update_option( 'launchpad_checklist_tasks_statuses', array( 'add_gallery_page' => true ) );
		$this->assertTrue( $this->rendered_task( 'add_gallery_page' )['completed'] );
	}

	/**
	 * Returns the sell task list keyed by id (WooCommerce state controlled by the caller beforehand).
	 *
	 * @return array<string, array> Tasks keyed by id.
	 */
	private function sell_tasks_by_id() {
		$this->seed_output_for_goal( 'sell', 'organic coffee beans' );
		$tasks = $this->call_api( Requests::GET )->get_data()['tasks'];
		return array_column( $tasks, null, 'id' );
	}

	/**
	 * Marks WooCommerce as installed-but-inactive for the duration of one read, by seeding the plugins cache.
	 */
	private function stub_woocommerce_installed() {
		wp_cache_set( 'plugins', array( '' => array( 'woocommerce/woocommerce.php' => array( 'Name' => 'WooCommerce' ) ) ), 'plugins' );
	}

	/**
	 * The sell list always leads with the install task, which tracks the plugin's real state: to-do while
	 * WooCommerce is missing, in progress while it is installed but inactive, complete once it is active. Each
	 * state carries the CTA that advances it, so the card is never a dead end.
	 *
	 * @param bool        $active      Whether WooCommerce is active.
	 * @param bool        $installed   Whether WooCommerce is installed (but inactive).
	 * @param bool        $in_progress The expected in_progress flag.
	 * @param bool        $completed   The expected completed flag.
	 * @param string|null $subtitle    A fragment the subtitle must contain, or null to skip.
	 * @param string|null $cta         A fragment the CTA must contain, or null to skip.
	 * @dataProvider provide_woocommerce_install_states
	 */
	#[DataProvider( 'provide_woocommerce_install_states' )]
	public function test_get_tracks_the_woocommerce_install_state( $active, $installed, $in_progress, $completed, $subtitle, $cta ) {
		update_option( 'active_plugins', $active ? array( 'woocommerce/woocommerce.php' ) : array() );
		if ( $installed ) {
			$this->stub_woocommerce_installed();
		}

		$tasks = $this->sell_tasks_by_id();
		update_option( 'active_plugins', array() );
		wp_cache_delete( 'plugins', 'plugins' );

		$this->assertSame( 'install_woocommerce', array_key_first( $tasks ), 'the store sequence leads the sell list' );
		$install = $tasks['install_woocommerce'];
		$this->assertSame( $in_progress, $install['in_progress'] );
		$this->assertSame( $completed, $install['completed'] );
		$this->assertFalse( $install['disabled'], 'the install task is always actionable' );
		if ( null !== $subtitle ) {
			$this->assertStringContainsString( $subtitle, $install['subtitle'] );
			$this->assertStringContainsString( $cta, $install['calypso_path'] );
		}
	}

	/**
	 * WooCommerce install states for test_get_tracks_the_woocommerce_install_state.
	 *
	 * @return array
	 */
	public static function provide_woocommerce_install_states() {
		return array(
			'not installed'          => array( false, false, false, false, 'Add the WooCommerce plugin', 'plugin-install.php?s=woocommerce' ),
			'installed but inactive' => array( false, true, true, false, 'Activate the WooCommerce plugin', 'plugins.php?plugin_status=inactive' ),
			'active'                 => array( true, false, false, true, null, null ),
		);
	}

	/**
	 * The store-setup task follows the install task through the same states: a disabled preview with no CTA while
	 * WooCommerce is inactive (so the roadmap is visible without offering a dead CTA), the setup-wizard CTA once
	 * it is active, and complete once WooCommerce's own profiler is completed or skipped.
	 *
	 * @param bool        $active        Whether WooCommerce is active.
	 * @param bool        $profiler_done Whether the WooCommerce onboarding profiler is done.
	 * @param bool        $disabled      The expected disabled flag.
	 * @param bool        $completed     The expected completed flag.
	 * @param string|null $cta           A fragment the CTA must contain, or null when there must be no CTA.
	 * @dataProvider provide_store_setup_states
	 */
	#[DataProvider( 'provide_store_setup_states' )]
	public function test_get_offers_the_store_setup_task( $active, $profiler_done, $disabled, $completed, $cta ) {
		update_option( 'active_plugins', $active ? array( 'woocommerce/woocommerce.php' ) : array() );
		if ( $profiler_done ) {
			update_option( 'woocommerce_onboarding_profile', array( 'skipped' => true ) );
		}

		$tasks = $this->sell_tasks_by_id();
		update_option( 'active_plugins', array() );

		$this->assertArrayHasKey( 'setup_woocommerce_store', $tasks );
		$setup = $tasks['setup_woocommerce_store'];
		$this->assertSame( $disabled, $setup['disabled'] );
		$this->assertSame( $completed, $setup['completed'] );
		if ( null === $cta ) {
			$this->assertNull( $setup['calypso_path'] );
		} else {
			$this->assertStringContainsString( $cta, $setup['calypso_path'] );
		}
	}

	/**
	 * Store-setup states for test_get_offers_the_store_setup_task.
	 *
	 * @return array
	 */
	public static function provide_store_setup_states() {
		return array(
			'WooCommerce inactive: a disabled preview' => array( false, false, true, false, null ),
			'WooCommerce active: the setup wizard CTA' => array( true, false, false, false, 'page=wc-admin&path=%2Fsetup-wizard' ),
			'the profiler is done: complete'           => array( true, true, false, true, null ),
		);
	}

	/**
	 * On a fresh sell site the gated commerce tasks are kept as disabled previews (with no CTA) instead of being
	 * dropped, so the full store roadmap is visible.
	 */
	public function test_get_keeps_commerce_tasks_disabled_when_woocommerce_inactive() {
		update_option( 'active_plugins', array() );

		$this->seed_sell_output_with_commerce_tasks();
		$tasks = $this->rendered_tasks();

		foreach ( array( 'woo_customize_store', 'woo_products', 'set_up_payments' ) as $id ) {
			$this->assertArrayHasKey( $id, $tasks, "$id should be kept as a disabled preview" );
			$this->assertTrue( $tasks[ $id ]['disabled'], "$id should be disabled" );
			$this->assertNull( $tasks[ $id ]['calypso_path'], "$id should have no CTA" );
		}

		// The WooCommerce launch task is normalized to the canonical site-launch task, which is not WooCommerce-gated.
		$this->assertArrayNotHasKey( 'woo_launch_site', $tasks );
		$this->assertArrayHasKey( 'site_launched', $tasks );
		$this->assertFalse( $tasks['site_launched']['disabled'] );

		// A non-commerce task in the same list stays actionable, not swept into the disabled treatment.
		$this->assertArrayHasKey( 'site_theme_selected', $tasks );
		$this->assertFalse( $tasks['site_theme_selected']['disabled'] );
	}

	/**
	 * Persisted task ids are normalized on read onto the task the launchpad actually renders, and a list holding
	 * both a twin and its target collapses to a single card (the tailored list keys cards by id, so a repeat has
	 * to fold).
	 *
	 * `woo_launch_site`'s CTA dead-ends in the WooCommerce onboarding task list and its completion depends on a WC
	 * option the skipped setup never writes; `post_sharing_enabled` is born completed (the sharing module is active
	 * by default on wpcom), so the connection task is the meaningful version of the same intent; the legacy design
	 * tasks are always-complete or have no wp-admin completion path, so both consolidate onto the actionable theme
	 * task; the remaining pairs are catalog `id_map` twins. The `?all_tasks=1` view enumerates every catalog id, so
	 * it builds both sides of the launch remap and has to collapse them too.
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
		if ( isset( $tasks['site_launched'] ) ) {
			// The canonical launch task has no wc-admin deeplink CTA.
			$this->assertStringNotContainsString( 'wc-admin', (string) $tasks['site_launched']['calypso_path'] );
		}
	}

	/**
	 * Remap cases for test_get_remaps_persisted_task_ids.
	 *
	 * @return array
	 */
	public static function provide_remapped_task_lists() {
		return array(
			'woo_launch_site becomes the canonical launch task' => array(
				array( 'site_theme_selected', 'woo_launch_site' ),
				null,
				array( 'woo_launch_site' ),
				array( 'site_launched' ),
				array(),
			),
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
	 * A commerce task previously completed in WooCommerce renders as a disabled preview (not "done") while
	 * WooCommerce is inactive, and building the list must not persist a launchpad completion as a side effect.
	 */
	public function test_get_disabled_commerce_task_is_not_completed_and_does_not_write_status() {
		update_option( 'active_plugins', array() );
		// Simulate a task WooCommerce recorded as complete during a prior active period.
		update_option( 'woocommerce_task_list_tracked_completed_tasks', array( 'products' ) );
		delete_option( 'launchpad_checklist_tasks_statuses' );

		$this->seed_sell_output_with_commerce_tasks();
		$tasks = $this->rendered_tasks();

		$this->assertTrue( $tasks['woo_products']['disabled'] );
		$this->assertFalse( $tasks['woo_products']['completed'] );

		// The completion callback (which writes launchpad status) must not have fired for the disabled preview.
		$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertArrayNotHasKey( 'woo_products', $statuses );
	}

	/**
	 * On a Simple site, where the wp-admin plugin screens aren't reachable, both the install (not-installed) and
	 * activate (installed-but-inactive) CTAs point at the Calypso WooCommerce plugin page. Runs in a separate
	 * process so defining IS_WPCOM doesn't leak into the rest of the suite.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_get_woocommerce_ctas_target_calypso_on_simple() {
		define( 'IS_WPCOM', true );
		$calypso = '/plugins/woocommerce/' . rawurlencode( wpcom_get_site_slug() );

		// Not installed: the install CTA routes to Calypso instead of plugin-install.php.
		update_option( 'active_plugins', array() );
		$install = $this->sell_tasks_by_id()['install_woocommerce'];
		$this->assertFalse( $install['in_progress'] );
		$this->assertSame( $calypso, $install['calypso_path'] );

		// Installed but inactive: the activate CTA routes to Calypso instead of plugins.php.
		wp_cache_set( 'plugins', array( '' => array( 'woocommerce/woocommerce.php' => array( 'Name' => 'WooCommerce' ) ) ), 'plugins' );
		$install = $this->sell_tasks_by_id()['install_woocommerce'];
		wp_cache_delete( 'plugins', 'plugins' );

		$this->assertTrue( $install['in_progress'] );
		$this->assertSame( $calypso, $install['calypso_path'] );
	}

	/**
	 * Any catalog task whose CTA resolves to a wp-admin plugins screen is routed to the Calypso plugins page on
	 * Simple. Uses `install_custom_plugin`, whose catalog path is `plugins.php` under the wp-admin interface.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_get_routes_catalog_plugin_ctas_to_calypso_on_simple() {
		define( 'IS_WPCOM', true );
		// Force the catalog's plugin task to resolve to plugins.php (its wp-admin-interface branch).
		update_option( 'wpcom_admin_interface', 'wp-admin' );
		$this->seed_ai_output_with_tasks( array( 'install_custom_plugin', 'site_launched' ) );

		$tasks = $this->rendered_tasks();

		$this->assertArrayHasKey( 'install_custom_plugin', $tasks );
		$this->assertSame( '/plugins/' . rawurlencode( wpcom_get_site_slug() ), $tasks['install_custom_plugin']['calypso_path'] );
	}

	/**
	 * The store sequence is injected on the goal the user chose, never on the one the model echoed back.
	 *
	 * The write path already keys enforcement off the wizard option, so a payload echoing `sell` on a newsletter
	 * site has every commerce task stripped from it. If the read path then injected the store sequence off that
	 * same echo, the site would be told to install WooCommerce with nothing commercial to follow it — the two
	 * paths must resolve the goal the same way, or they contradict each other. The echo is diagnostic, never the
	 * thing that decides, in either direction.
	 *
	 * @param string|null $wizard_goal  The wizard goal, or null to leave the option unwritten.
	 * @param string      $payload_goal The goal the payload echoes.
	 * @param bool        $store        Whether the store sequence is expected.
	 * @dataProvider provide_store_injection_goals
	 */
	#[DataProvider( 'provide_store_injection_goals' )]
	public function test_get_injects_the_store_sequence_on_the_wizard_goal( $wizard_goal, $payload_goal, $store ) {
		if ( null !== $wizard_goal ) {
			update_option( 'wpcom_ai_launchpad_wizard', array( 'goal' => $wizard_goal ), false );
		}
		$this->seed_output_for_goal( $payload_goal, 'organic coffee beans' );

		$ids = $this->rendered_ids();

		if ( ! $store ) {
			$this->assertNotContains( 'install_woocommerce', $ids );
			$this->assertNotContains( 'setup_woocommerce_store', $ids );
			return;
		}

		$this->assertContains( 'install_woocommerce', $ids );
		$this->assertContains( 'setup_woocommerce_store', $ids );
		// The sell branch's theme guarantee comes with it, and the id list listeners read must agree.
		$this->assertContains( 'site_theme_selected', $ids );
		$this->assertContains( 'site_theme_selected', wpcom_ai_launchpad_get_ai_task_ids() );
	}

	/**
	 * Goal-authority cases for test_get_injects_the_store_sequence_on_the_wizard_goal.
	 *
	 * @return array
	 */
	public static function provide_store_injection_goals() {
		return array(
			'no wizard yet, and the payload is not selling' => array( null, 'build', false ),
			'the wizard says newsletter, the model echoed sell' => array( 'newsletter', 'sell', false ),
			'the wizard says sell, the model echoed write' => array( 'sell', 'write', true ),
		);
	}

	/**
	 * Test that GET with ?all_tasks=1 returns the full catalog (a testing aid),
	 * bypassing per-site visibility and not depending on any persisted AI output.
	 */
	public function test_get_all_tasks_param_returns_full_catalog() {
		// No ai_output seeded — all-tasks mode is independent of the tailored output.

		$ids = $this->rendered_ids( array( 'all_tasks' => '1' ) );

		// Far more than a tailored list (~6 tasks): the whole catalog.
		$this->assertGreaterThan( 40, count( $ids ) );
		// Includes a task normally hidden by the visibility gate (woo_products needs
		// WooCommerce, absent in the test env) — proving the bypass.
		$this->assertContains( 'woo_products', $ids );
		$this->assertContains( 'first_post_published', $ids );
		// The gallery is not a catalog task, so the catalog view does not show it.
		$this->assertNotContains( 'add_gallery_page', $ids );
	}

	/**
	 * Test that the Jetpack Social task is hidden on a private site, where wpcom
	 * doesn't load the Social admin page its CTA points to. A persisted
	 * `drive_traffic` (the id_map twin) folds into the same single card first.
	 */
	public function test_get_hides_social_tasks_on_private_site() {
		$this->seed_ai_output_with_tasks(
			array( 'connect_social_media', 'drive_traffic', 'first_post_published', 'site_launched' )
		);

		// Public site: one social card — the drive_traffic twin collapses into connect_social_media.
		update_option( 'blog_public', '1' );
		$public_ids = $this->rendered_ids();
		$this->assertContains( 'connect_social_media', $public_ids );
		$this->assertNotContains( 'drive_traffic', $public_ids );

		// Private site: the Social task is gone, the rest remain.
		update_option( 'blog_public', '-1' );
		$private_ids = $this->rendered_ids();
		$this->assertNotContains( 'connect_social_media', $private_ids );
		$this->assertContains( 'first_post_published', $private_ids );

		update_option( 'blog_public', '1' );
	}

	/**
	 * Test that GET requires authentication.
	 */
	public function test_get_requires_authentication() {
		wp_set_current_user( 0 );

		$result = $this->call_api( Requests::GET );

		$this->assertSame( 401, $result->get_status() );
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
	 * Test that PUT /wizard persists the wizard option.
	 */
	public function test_put_wizard_persists_option() {
		$result = $this->call_api(
			'PUT',
			'/wizard',
			array(
				'goal'        => 'write',
				'site_name'   => 'Alpine Notes',
				'description' => 'Personal blog about long-distance hiking in the Alps.',
				'locale'      => 'en',
			)
		);

		$this->assertSame( 200, $result->get_status() );

		$option = get_option( 'wpcom_ai_launchpad_wizard' );
		$this->assertIsArray( $option );
		$this->assertSame( 1, $option['version'] );
		$this->assertSame( 'write', $option['goal'] );
		$this->assertSame( 'Alpine Notes', $option['site_name'] );
		$this->assertSame( 'Personal blog about long-distance hiking in the Alps.', $option['description'] );
		$this->assertSame( 'en', $option['locale'] );
		$this->assertIsInt( $option['generated_at'] );
	}

	/**
	 * The wizard's Name and Brief description are written back to the site's own identity options, so the wizard
	 * reflects and updates the real site: entered values land verbatim (the tagline collapsed to one line, since
	 * blogdescription is single-line), and empty fields leave an existing title/tagline alone rather than
	 * blanking it.
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
			'entered values overwrite the site identity' => array(
				'Alpine Notes',
				'Personal blog about long-distance hiking in the Alps.',
				'Alpine Notes',
				'Personal blog about long-distance hiking in the Alps.',
			),
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
	 * Test that PUT /tailored persists the wrapped envelope.
	 */
	public function test_put_tailored_persists_wrapped_envelope() {
		$payload = self::valid_payload();
		$result  = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 200, $result->get_status() );

		$option = get_option( 'wpcom_ai_launchpad_ai_output' );
		$this->assertIsArray( $option );
		$this->assertSame( 1, $option['version'] );
		$this->assertSame( 'ai', $option['source'] );
		$this->assertIsInt( $option['generated_at'] );
		$this->assertSame( $payload, $option['payload'] );
	}

	/**
	 * Test that PUT /tailored records the fallback source from the query param.
	 */
	public function test_put_tailored_records_fallback_source() {
		$result = $this->call_api( 'PUT', '/tailored', self::valid_payload(), array( 'source' => 'fallback' ) );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( 'fallback', get_option( 'wpcom_ai_launchpad_ai_output' )['source'] );
	}

	/**
	 * A payload that breaks the output contract is rejected whole, with the code that says which rule it broke,
	 * and nothing is persisted — a bad tailoring attempt must leave the previous list (or none) untouched.
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
	 * Test that PUT /tailored strips HTML from subtitles rather than rejecting them, so a little stray markup
	 * does not cost the user their whole tailored list.
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
	 * PUT /tailored accepts the optional page intros and persists them verbatim.
	 *
	 * The server never reads them — the client places them into the page it creates — but it does validate the
	 * whole payload against the shared contract, whose objects are closed. A field missing from the contract
	 * would therefore 422 the entire tailoring run rather than be quietly dropped, so this pins that the
	 * server-side copy of the schema knows about the field the prompt now asks for.
	 *
	 * Every key gets a case: a page task whose id the server-side schema does not list would 422 every run that
	 * selected it, which is the whole tailoring lost over one optional sentence.
	 *
	 * @param array $page_intros The page_intros object to send.
	 * @dataProvider provide_page_intros
	 */
	#[DataProvider( 'provide_page_intros' )]
	public function test_put_tailored_persists_the_optional_page_intros( $page_intros ) {
		$payload                = self::valid_payload();
		$payload['page_intros'] = $page_intros;

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame(
			$payload['page_intros'],
			get_option( 'wpcom_ai_launchpad_ai_output' )['payload']['page_intros']
		);
	}

	/**
	 * Data provider for test_put_tailored_persists_the_optional_page_intros.
	 *
	 * @return array
	 */
	public static function provide_page_intros() {
		return array(
			'a contact-page intro' => array( array( 'add_contact_page' => 'Ask about a commission or a wholesale order.' ) ),
			'an events-page intro' => array( array( 'add_events_page' => 'Come and throw a pot with us.' ) ),
			'a video-page intro'   => array( array( 'add_video_page' => 'Every glaze test, filmed start to finish.' ) ),
			'a gallery-page intro' => array( array( 'add_gallery_page' => 'A year of finished pieces in one place.' ) ),
			'all at once'          => array(
				array(
					'add_contact_page' => 'Ask about a commission.',
					'add_events_page'  => 'Come and throw a pot with us.',
					'add_video_page'   => 'Every glaze test, filmed start to finish.',
					'add_gallery_page' => 'A year of finished pieces in one place.',
				),
			),
			'none, chosen'         => array( array() ),
		);
	}

	/**
	 * An intro for a page task nothing knows how to create is rejected with the rest of the payload.
	 *
	 * The keys are task ids the client places by name, so an invented one is content for a page that will never
	 * be built. Rejecting it is the same call every other object in the contract already makes, and it is what
	 * keeps the field from becoming a free-text bag.
	 */
	public function test_put_tailored_rejects_a_page_intro_for_an_unknown_task() {
		$payload                = self::valid_payload();
		$payload['page_intros'] = array( 'add_faq_page' => 'Answers to what people ask most.' );

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 422, $result->get_status() );
		$this->assertSame( 'ai_launchpad_invalid_payload', $result->get_data()['code'] );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_ai_output' ) );
	}

	/**
	 * Test that PUT /tailored keeps registry ids, which the shared catalog does not define.
	 */
	public function test_put_tailored_keeps_registry_task_ids() {
		$payload                   = self::valid_payload();
		$payload['tasks'][1]['id'] = 'add_gallery_page';

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 200, $result->get_status() );

		$persisted_tasks = get_option( 'wpcom_ai_launchpad_ai_output' )['payload']['tasks'];
		$this->assertContains( 'add_gallery_page', array_column( $persisted_tasks, 'id' ) );
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
	 * Seeds the AI output option with the given tasks (launch task last) so
	 * wpcom_ai_launchpad_get_ai_task_ids() reports them as on the site's list.
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
	 * Seed an AI output whose tasks end on a launch task, with the given inferred goal/niche.
	 *
	 * @param string $goal  The inferred goal.
	 * @param string $niche The inferred niche.
	 */
	private function seed_output_for_goal( $goal, $niche ) {
		$this->seed_ai_output_with_tasks(
			array( 'site_title', 'site_launched' ),
			array(
				'goal'  => $goal,
				'niche' => $niche,
			)
		);
	}

	/**
	 * Seeds a sell payload whose tasks include the WooCommerce-gated commerce tasks plus a non-commerce task, so the
	 * disabled-preview behavior can be asserted.
	 */
	private function seed_sell_output_with_commerce_tasks() {
		$this->seed_ai_output_with_tasks(
			array( 'woo_customize_store', 'woo_products', 'set_up_payments', 'site_theme_selected', 'woo_launch_site' ),
			array(
				'goal'  => 'sell',
				'niche' => 'organic coffee beans',
			)
		);
	}

	/**
	 * A sell list always carries exactly one theme task, placed right after the store-setup lead tasks —
	 * pick the store's look once the store exists — and pointed at the showcase's Store category so users
	 * land on shop-ready templates.
	 *
	 * The three cases are the three ways that task can arise: ranked somewhere else by the AI, arriving as a
	 * legacy design task that remaps onto it (the always-complete "Select a design" has no wp-admin completion
	 * path, so it is consolidated onto the actionable theme task), or missing entirely and guaranteed in.
	 *
	 * @param array $seeded The task ids seeded into the sell AI output.
	 * @param array $absent Ids that must not survive into the rendered list.
	 * @dataProvider provide_sell_theme_task_sources
	 */
	#[DataProvider( 'provide_sell_theme_task_sources' )]
	public function test_get_sell_places_one_theme_task_after_store_setup( $seeded, $absent ) {
		update_option( 'active_plugins', array() );
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
	 * Test that a non-sell list is not given a theme task it did not ask for.
	 */
	public function test_get_does_not_inject_theme_task_for_non_sell() {
		// The theme task is sell-only (ensure_theme_task) and is not in the short-list backfill pool, so even a short
		// non-sell list never gains one.
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'site_launched' ), 'write' );

		$ids = $this->rendered_ids();

		$this->assertNotContains( 'site_theme_selected', $ids );
	}

	/**
	 * Test that the AI-selected id list counts the sell theme guarantee, so the
	 * switch_theme listener and skip validation see the card the site renders.
	 */
	public function test_ai_task_ids_include_guaranteed_sell_theme() {
		$this->seed_ai_output_with_tasks( array( 'woo_products', 'site_launched' ), 'sell' );

		$this->assertContains( 'site_theme_selected', wpcom_ai_launchpad_get_ai_task_ids() );
	}

	/**
	 * Test that a skip recorded under a task's raw id before the id was remapped
	 * still applies to the card the id now renders as — a skip must never pop
	 * back open after a deploy.
	 */
	public function test_get_applies_pre_remap_skips_to_remapped_task() {
		$this->seed_ai_output_with_tasks( array( 'post_sharing_enabled', 'site_launched' ) );
		// As written by skip_task() before the remap existed.
		update_option( 'wpcom_ai_launchpad_skipped_tasks', array( 'post_sharing_enabled' ), false );

		$tasks = $this->rendered_tasks();

		$this->assertTrue( $tasks['connect_social_media']['skipped'] );
		$this->assertTrue( $tasks['connect_social_media']['completed'] );
	}

	/**
	 * POST /complete-task marks an allowlisted complete-on-click task complete, because its real signal is
	 * unreachable from the launchpad's wp-admin context: `complete_profile` is a plain acknowledgment;
	 * `setup_ssh` reuses Calypso's optimistic strategy (its hosting form ticks the task when the user creates
	 * SFTP credentials); `share_site` has no CTA destination at all, so the card offers a "Mark as complete"
	 * button that hits this route.
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
			'an acknowledgment task'                => array( 'complete_profile' ),
			'setup_ssh, ticked optimistically'      => array( 'setup_ssh' ),
			'share_site, which has no CTA'          => array( 'share_site' ),
			'a registry task the catalog never saw' => array( 'pick_fonts_colors' ),
		);
	}

	/**
	 * A completed registry task must read back as completed, not just write a status the read path ignores.
	 *
	 * This is the whole reason complete-on-click needed work for the registry: the route's write went
	 * through wpcom_mark_launchpad_task_complete(), which resolves ids against the shared catalog and
	 * silently drops anything it does not define — every registry id, by design. The route would have
	 * answered 200 with `completed: true` while the next GET still rendered the card as to-do.
	 */
	public function test_complete_task_completes_a_registry_task_on_read() {
		$this->use_block_theme();
		$this->seed_ai_output_with_tasks( array( 'pick_fonts_colors', 'site_launched' ) );

		$this->assertFalse( $this->rendered_task( 'pick_fonts_colors' )['completed'] );

		$this->call_api( 'POST', '/complete-task', array( 'task_id' => 'pick_fonts_colors' ) );

		$this->assertTrue( $this->rendered_task( 'pick_fonts_colors' )['completed'] );
	}

	/**
	 * The site-icon task needs no listener and no completion write: it reads the live `site_icon` option, so
	 * uploading an icon anywhere in wp-admin ticks the card on the next read.
	 */
	public function test_get_completes_the_site_icon_task_from_the_option() {
		$this->seed_ai_output_with_tasks( array( 'add_site_icon', 'site_launched' ) );

		$this->assertFalse( $this->rendered_task( 'add_site_icon' )['completed'] );

		update_option( 'site_icon', 4242 );

		$this->assertTrue( $this->rendered_task( 'add_site_icon' )['completed'] );
	}

	/**
	 * A persisted registry task renders its declared CTA, so the card is actionable straight away rather
	 * than only once a marker draft exists (the only way a registry card could carry a path before).
	 */
	public function test_get_renders_the_registry_deeplinks() {
		$this->use_block_theme();
		$this->seed_ai_output_with_tasks( array( 'add_site_icon', 'pick_fonts_colors', 'site_launched' ) );

		$paths = $this->rendered_paths();

		$this->assertSame( admin_url( 'options-general.php' ), $paths['add_site_icon'] );
		$this->assertSame( admin_url( 'site-editor.php?p=/styles&section=/variations' ), $paths['pick_fonts_colors'] );
	}

	/**
	 * Test that POST /complete-task rejects ids that are not completable this way:
	 * a non-allowlisted task (even if on the list) and an allowlisted task that is
	 * not on the site's AI-selected list.
	 */
	public function test_complete_task_rejects_invalid_tasks() {
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'complete_profile', 'site_launched' ) );

		// On the list, but not an acknowledgment task.
		$not_allowlisted = $this->call_api( 'POST', '/complete-task', array( 'task_id' => 'first_post_published' ) );
		$this->assertSame( 400, $not_allowlisted->get_status() );
		$this->assertSame( 'ai_launchpad_task_not_completable', $not_allowlisted->get_data()['code'] );

		// Allowlisted, but not on this site's list.
		$not_selected = $this->call_api( 'POST', '/complete-task', array( 'task_id' => 'earn_money' ) );
		$this->assertSame( 404, $not_selected->get_status() );
		$this->assertSame( 'ai_launchpad_task_not_selected', $not_selected->get_data()['code'] );

		$this->assertFalse( get_option( 'launchpad_checklist_tasks_statuses' ) );
	}

	/**
	 * Test that POST /skip-task persists the skip and GET renders the task as skipped and completed, so a
	 * skip survives reloads and counts toward completion.
	 */
	public function test_skip_task_persists_and_renders_completed() {
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'site_launched' ) );

		$result = $this->call_api( 'POST', '/skip-task', array( 'task_id' => 'first_post_published' ) );

		$this->assertSame( 200, $result->get_status() );
		$this->assertTrue( $result->get_data()['skipped'] );

		$tasks = $this->rendered_tasks();

		$this->assertTrue( $tasks['first_post_published']['skipped'] );
		$this->assertTrue( $tasks['first_post_published']['completed'] );
		$this->assertFalse( $tasks['site_launched']['skipped'] );
		$this->assertFalse( $tasks['site_launched']['completed'] );
		// The skip lives in its own option, never in the shared statuses (several catalog tasks
		// recompute completion live and would ignore a status write).
		$this->assertFalse( get_option( 'launchpad_checklist_tasks_statuses' ) );
	}

	/**
	 * Reading the launchpad maintains the cached "every task is done" flag the menu gate reads: unset while any
	 * task is incomplete (so the menu keeps showing), set once every task is completed or skipped (so the gate can
	 * hide the screen without rebuilding the list), and latched thereafter — a task that un-completes must not
	 * bring the launchpad back; only an explicit reset does.
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
			// Skipping coerces a task to completed, so a fully-skipped list reads as done.
			update_option( 'wpcom_ai_launchpad_skipped_tasks', $skipped, false );
		}
		if ( $preset ) {
			update_option( 'wpcom_ai_launchpad_completed', true, true );
		}

		$this->call_api( Requests::GET );

		$this->assertSame( $expected, (bool) get_option( 'wpcom_ai_launchpad_completed' ) );
	}

	/**
	 * Completion-flag states for test_get_maintains_the_completed_flag. The "all done" case seeds a full six-task
	 * list so the short-list backfill cannot add tasks that would keep it incomplete.
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
	 * Test that skipping the final task refreshes the cached flag immediately, so the menu hides on the next page
	 * load without waiting for another launchpad read.
	 */
	public function test_skip_final_task_sets_completed_flag() {
		// A full six-task list so the short-list backfill does not add tasks beyond the ones skipped below.
		$non_launch = array( 'first_post_published', 'design_edited', 'site_title', 'setup_general', 'site_theme_selected' );
		$this->seed_ai_output_with_tasks( array_merge( $non_launch, array( 'site_launched' ) ) );

		foreach ( $non_launch as $id ) {
			$this->call_api( 'POST', '/skip-task', array( 'task_id' => $id ) );
		}
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_completed' ), 'still incomplete while the launch task remains' );

		$this->call_api( 'POST', '/skip-task', array( 'task_id' => 'site_launched' ) );
		$this->assertTrue( (bool) get_option( 'wpcom_ai_launchpad_completed' ), 'complete after skipping the last task' );
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
	 * Every card the site renders is skippable, however its id got there — a card with a Skip button whose write
	 * the route rejects would strand the launchpad.
	 *
	 * The three ways an id can differ from the raw AI payload: a persisted id that renders under its remapped
	 * name (validation must judge the remapped ids, not the raw payload), a registry task the model picked (out
	 * of SYNTHETIC_TASK_IDS, so only its presence in the payload makes the route accept it), and a synthetic
	 * store task the server minted, which is in no payload at all.
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

		$task = $this->rendered_task( $task_id );
		$this->assertTrue( $task['skipped'] );
		$this->assertTrue( $task['completed'] );
	}

	/**
	 * Rendered-card ids for test_skip_task_accepts_every_rendered_card.
	 *
	 * @return array
	 */
	public static function provide_skippable_rendered_ids() {
		return array(
			'a card rendered under its remapped id'    => array( array( 'post_sharing_enabled', 'site_launched' ), '', 'connect_social_media' ),
			'a registry task the model picked'         => array( array( 'add_gallery_page', 'site_launched' ), 'portfolio', 'add_gallery_page' ),
			'a synthetic store task the server minted' => array( array( 'woo_products', 'site_launched' ), 'sell', 'install_woocommerce' ),
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
	 * Test that writing a fresh tailored list clears the previous list's skips and the cached completion flag (a new
	 * all-incomplete list is never done).
	 */
	public function test_tailored_write_clears_skips_and_completed_flag() {
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'site_launched' ) );
		$this->call_api( 'POST', '/skip-task', array( 'task_id' => 'first_post_published' ) );
		$this->assertNotFalse( get_option( 'wpcom_ai_launchpad_skipped_tasks' ) );
		update_option( 'wpcom_ai_launchpad_completed', true, true );

		$result = $this->call_api( 'PUT', '/tailored', self::valid_payload() );

		$this->assertSame( 200, $result->get_status() );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_skipped_tasks' ) );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_completed' ) );
	}

	/**
	 * Test that the add_subscribe_block CTA is repointed to the editor surface where the Subscribe block
	 * can actually be added (the catalog sends it to Newsletter settings, where it cannot). On the test
	 * environment's classic theme that surface is the block-based widget editor.
	 */
	public function test_get_overrides_subscribe_block_cta() {
		$paths = $this->rendered_paths( array( 'all_tasks' => '1' ) );

		$this->assertSame( admin_url( 'widgets.php' ), $paths['add_subscribe_block'] );
	}

	/**
	 * Test that DELETE removes the AI output, sets dismissed, and leaves statuses untouched.
	 */
	public function test_delete_dismisses_and_keeps_statuses() {
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
		update_option( 'launchpad_checklist_tasks_statuses', array( 'first_post_published' => true ) );
		update_option( 'wpcom_ai_launchpad_skipped_tasks', array( 'site_title' ), false );
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
