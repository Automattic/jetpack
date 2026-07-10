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
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-memberships.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-about-page-listener.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-gallery-page-listener.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-first-post-listener.php';
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

		wp_set_current_user( 0 );
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
	}

	/**
	 * A schema-valid `PUT /tailored` body with six catalog task IDs ending on a launch task.
	 *
	 * @return array
	 */
	private static function valid_payload() {
		return array(
			'tasks'            => array(
				array(
					'id'       => 'first_post_published',
					'subtitle' => 'Share your first trail story.',
				),
				array(
					'id'       => 'design_edited',
					'subtitle' => 'Make the design fit your hikes.',
				),
				array(
					'id'       => 'site_title',
					'subtitle' => 'Name your alpine journal.',
				),
				array(
					'id'       => 'setup_free',
					'subtitle' => 'Personalize your site basics.',
				),
				array(
					'id'       => 'site_theme_selected',
					'subtitle' => 'Pick a theme for mountain photos.',
				),
				array(
					'id'       => 'site_launched',
					'subtitle' => 'Go live and share your journey.',
				),
			),
			'inferred'         => array(
				'goal'       => 'write',
				'brand_name' => 'Alpine Notes',
			),
			'first_post_draft' => array(
				'title'      => 'First steps on the trail',
				'paragraphs' => array( 'First paragraph.', 'Second paragraph.' ),
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
	 * Test that GET returns the composite shape with enriched tasks.
	 */
	public function test_get_returns_composite_shape() {
		wp_set_current_user( $this->admin_id );

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
	 * Test that an unpublished, AI-created About page draft puts the add_about_page task "in progress": the task
	 * surfaces the `in_progress` flag, a "Continue…" title, and a calypso_path that reopens the existing draft rather
	 * than creating a new one.
	 *
	 * The marker-meta draft lookup runs through WP_Query, which WorDBless can't execute, so it's short-circuited with
	 * core's `posts_pre_query` filter to return the seeded draft id.
	 */
	public function test_get_marks_about_page_in_progress_with_unpublished_draft() {
		wp_set_current_user( $this->admin_id );

		// add_about_page's catalog visibility gate requires this meta to be registered on pages (as on WoA).
		register_post_meta( 'page', '_wpcom_template_layout_category', array( 'show_in_rest' => true ) );

		$this->seed_ai_output_with_tasks( array( 'add_about_page', 'site_launched' ) );

		$get_about = function () {
			foreach ( $this->call_api( Requests::GET )->get_data()['tasks'] as $task ) {
				if ( 'add_about_page' === $task['id'] ) {
					return $task;
				}
			}
			return null;
		};

		// No draft yet: the task renders in its plain, not-started state.
		$before = $get_about();
		$this->assertNotNull( $before );
		$this->assertFalse( $before['in_progress'] );
		$this->assertSame( 'Add your About page', $before['title'] );

		// Stand in for a saved-but-unpublished AI About page draft by short-circuiting its marker-meta lookup.
		$draft_id = 4242;
		add_filter(
			'posts_pre_query',
			static function ( $posts, $query ) use ( $draft_id ) {
				if ( AI_Launchpad_About_Page_Listener::META_KEY === $query->get( 'meta_key' ) ) {
					return array( $draft_id );
				}
				return $posts;
			},
			10,
			2
		);

		$after = $get_about();
		$this->assertNotNull( $after );
		$this->assertTrue( $after['in_progress'] );
		$this->assertSame( 'Continue working on the About page', $after['title'] );
		$this->assertSame( admin_url( 'post.php?post=' . $draft_id . '&action=edit' ), $after['calypso_path'] );
	}

	/**
	 * Test that an unpublished AI-created first-post draft puts the newsletter first-post task "in progress": it's
	 * detected through the first-post marker meta (not any latest draft), gets the drafts-aware "Continue writing"
	 * title override, and reopens that draft. The marker query is short-circuited via `posts_pre_query` (WorDBless
	 * can't run WP_Query).
	 */
	public function test_get_marks_first_post_in_progress_with_marked_draft() {
		wp_set_current_user( $this->admin_id );

		$this->seed_ai_output_with_tasks( array( 'first_post_published_newsletter', 'site_launched' ) );

		$get_first_post = function () {
			foreach ( $this->call_api( Requests::GET )->get_data()['tasks'] as $task ) {
				if ( 'first_post_published_newsletter' === $task['id'] ) {
					return $task;
				}
			}
			return null;
		};

		// No marked draft: the task renders in its plain, not-started state.
		$before = $get_first_post();
		$this->assertNotNull( $before );
		$this->assertFalse( $before['in_progress'] );

		// Stand in for the AI-created first-post draft by short-circuiting its marker-meta lookup.
		$draft_id = 5151;
		add_filter(
			'posts_pre_query',
			static function ( $posts, $query ) use ( $draft_id ) {
				if ( AI_Launchpad_First_Post_Listener::META_KEY === $query->get( 'meta_key' ) ) {
					return array( $draft_id );
				}
				return $posts;
			},
			10,
			2
		);

		$after = $get_first_post();
		$this->assertNotNull( $after );
		$this->assertTrue( $after['in_progress'] );
		$this->assertSame( 'Continue writing your first post', $after['title'] );
		$this->assertSame( admin_url( 'post.php?post=' . $draft_id . '&action=edit' ), $after['calypso_path'] );
	}

	/**
	 * Test that GET drops tasks the catalog would hide on this site (is_visible_callback),
	 * while keeping the visible ones. WooCommerce tasks are gated to WoA sites with
	 * WooCommerce active, so woo_products is not visible in the test environment.
	 */
	public function test_get_excludes_non_visible_tasks() {
		wp_set_current_user( $this->admin_id );

		$payload          = self::valid_payload();
		$payload['tasks'] = array(
			array(
				'id'       => 'first_post_published',
				'subtitle' => 'Share your first trail story.',
			),
			array(
				'id'       => 'woo_products',
				'subtitle' => 'Add your first product.',
			),
			array(
				'id'       => 'site_launched',
				'subtitle' => 'Go live and share your journey.',
			),
		);

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

		$result = $this->call_api( Requests::GET );

		$this->assertSame( 200, $result->get_status() );

		$ids = array_column( $result->get_data()['tasks'], 'id' );
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
		wp_set_current_user( $this->admin_id );
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'site_launched' ), 'write' );

		$tasks = $this->call_api( Requests::GET )->get_data()['tasks'];
		$ids   = array_column( $tasks, 'id' );

		$this->assertCount( 6, $tasks, 'a two-task list is backfilled to six' );
		$this->assertSame( 'first_post_published', $ids[0], 'the AI tasks keep their lead position' );
		$this->assertSame( 'site_launched', end( $ids ), 'the launch task stays last' );
		$this->assertSame( array_values( array_unique( $ids ) ), $ids, 'no duplicate task cards' );
	}

	/**
	 * A backfilled filler card must be skippable so it can never strand the launchpad, and GET must stay a read: it
	 * must not rewrite the persisted AI output. The skip route accepts a backfilled id (via the pool allowlist), and
	 * the persisted payload is untouched by the read.
	 */
	public function test_backfilled_task_is_skippable_and_get_does_not_mutate_ai_output() {
		wp_set_current_user( $this->admin_id );
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'site_launched' ), 'write' );
		$before = get_option( 'wpcom_ai_launchpad_ai_output' );

		$rendered = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], 'id' );
		$this->assertCount( 6, $rendered, 'the short list is backfilled to six' );

		// GET is a pure read: the persisted AI output is unchanged.
		$this->assertSame( $before, get_option( 'wpcom_ai_launchpad_ai_output' ) );

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
		wp_set_current_user( $this->admin_id );

		$write = $this->call_api( Requests::GET, '/available-tasks', null, array( 'goal' => 'write' ) )->get_data();
		$this->assertArrayHasKey( 'available_task_ids', $write );
		$this->assertContains( 'first_post_published', $write['available_task_ids'] );
		$this->assertNotContains( 'woo_products', $write['available_task_ids'], 'woo tasks are not available without a store on a write site' );

		$sell = $this->call_api( Requests::GET, '/available-tasks', null, array( 'goal' => 'sell' ) )->get_data();
		$this->assertContains( 'woo_products', $sell['available_task_ids'], 'sell keeps woo tasks as previews, so they are available' );
	}

	/**
	 * The add_about_page task is hidden only by a REST-context quirk (its gate needs a page-template meta key that is
	 * not registered during the request). It is force-visible, so it is offered as available.
	 */
	public function test_available_tasks_include_rescued_add_about_page() {
		wp_set_current_user( $this->admin_id );

		$data = $this->call_api( Requests::GET, '/available-tasks', null, array( 'goal' => 'write' ) )->get_data();

		$this->assertContains( 'add_about_page', $data['available_task_ids'] );
	}

	/**
	 * A task that is already complete offers nothing to do, so it is excluded from the actionable ids offered to the
	 * tailoring AI — but stays in the renderable ids, the client's relaxation set for heavily-completed sites.
	 */
	public function test_available_tasks_exclude_already_completed_tasks() {
		wp_set_current_user( $this->admin_id );

		$before = $this->call_api( Requests::GET, '/available-tasks', null, array( 'goal' => 'write' ) )->get_data();
		$this->assertContains( 'first_post_published', $before['available_task_ids'] );

		update_option( 'launchpad_checklist_tasks_statuses', array( 'first_post_published' => true ) );

		$after = $this->call_api( Requests::GET, '/available-tasks', null, array( 'goal' => 'write' ) )->get_data();
		$this->assertNotContains( 'first_post_published', $after['available_task_ids'] );
		$this->assertContains( 'first_post_published', $after['renderable_task_ids'] );
	}

	/**
	 * The launch tasks are exempt from the already-completed filter: the output contract requires the tailored list
	 * to end on one, so a site that already launched must still be able to produce a valid list.
	 */
	public function test_available_tasks_keep_completed_launch_tasks() {
		wp_set_current_user( $this->admin_id );

		update_option( 'launch-status', 'launched' );

		$data = $this->call_api( Requests::GET, '/available-tasks', null, array( 'goal' => 'write' ) )->get_data();

		// Guard against the premise going stale: the launch task really is complete on this site, so its presence
		// below proves the exemption rather than mere incompleteness.
		$this->assertTrue( wpcom_launchpad_checklists()->is_task_id_complete( 'site_launched' ) );
		$this->assertContains( 'site_launched', $data['available_task_ids'] );
	}

	/**
	 * The short-list backfill must not top the list up with already-completed filler: a pre-checked card the user
	 * never chose offers nothing to do. A shorter list is preferable.
	 */
	public function test_backfill_skips_already_completed_pool_tasks() {
		wp_set_current_user( $this->admin_id );
		update_option( 'launchpad_checklist_tasks_statuses', array( 'drive_traffic' => true ) );
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'site_launched' ), 'write' );

		$ids = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], 'id' );

		$this->assertNotContains( 'drive_traffic', $ids, 'a completed pool task is not backfilled' );
		$this->assertContains( 'add_new_page', $ids, 'incomplete pool tasks still backfill' );
	}

	/**
	 * The tailoring observation event reports the AI-inferred details (minus brand_name, which echoes the
	 * user-typed site title), the ids the AI selected, the ids the site will actually render, and the delta
	 * between them. The event is built (via reflection) against the state `PUT /tailored` just persisted —
	 * the same envelope and timing the gated logger uses; real dispatch stays blocked by the file-level
	 * `__return_false`, which short-circuits before the event is built.
	 */
	public function test_update_tailored_logs_observation_event() {
		wp_set_current_user( $this->admin_id );

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
	 * Test that GET keeps add_10_email_subscribers even though its catalog
	 * visibility callback (wpcom_launchpad_are_newsletter_subscriber_counts_available)
	 * is false off WordPress.com: the AI Launchpad retrieves the subscriber count
	 * on Atomic via the subscribers/stats endpoint, so the legacy IS_WPCOM-only
	 * visibility gate must not hide the task there.
	 */
	public function test_get_keeps_subscriber_count_task_despite_wpcom_only_visibility() {
		wp_set_current_user( $this->admin_id );

		// Sanity check: the catalog visibility gate is indeed false in this
		// (non-WordPress.com) environment, so the assertion below proves the override.
		$this->assertFalse( wpcom_launchpad_are_newsletter_subscriber_counts_available() );

		$payload          = self::valid_payload();
		$payload['tasks'] = array(
			array(
				'id'       => 'add_10_email_subscribers',
				'subtitle' => 'Grow your list to ten subscribers.',
			),
		);

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

		$result = $this->call_api( Requests::GET );

		$this->assertSame( 200, $result->get_status() );
		$ids = array_column( $result->get_data()['tasks'], 'id' );
		$this->assertContains( 'add_10_email_subscribers', $ids );
	}

	/**
	 * Test that GET recomputes the membership tasks' completion from
	 * Jetpack_Memberships' local signals, since their catalog callbacks are always
	 * false on Atomic (membership settings are null there).
	 */
	public function test_get_overrides_membership_task_completion() {
		wp_set_current_user( $this->admin_id );
		AI_Launchpad_Stub_Jetpack_Memberships::$connected        = false;
		AI_Launchpad_Stub_Jetpack_Memberships::$plans            = false;
		AI_Launchpad_Stub_Jetpack_Memberships::$newsletter_plans = false;
		$this->seed_ai_output_with_tasks( array( 'stripe_connected', 'paid_offer_created', 'site_launched' ) );

		$get = function () {
			$data = $this->call_api( Requests::GET )->get_data();
			$map  = array();
			foreach ( $data['tasks'] as $task ) {
				$map[ $task['id'] ] = $task['completed'];
			}
			return array( $map, $data['checklist_statuses'] );
		};

		// No connected account / no plans: both incomplete.
		list( $map, $statuses ) = $get();
		$this->assertFalse( $map['stripe_connected'] );
		$this->assertFalse( $map['paid_offer_created'] );

		// Turn the local signals on: both complete, via the override (the catalog
		// callback would still report false on Atomic).
		AI_Launchpad_Stub_Jetpack_Memberships::$connected = true;
		AI_Launchpad_Stub_Jetpack_Memberships::$plans     = true;
		list( $map, $statuses )                           = $get();
		$this->assertTrue( $map['stripe_connected'] );
		$this->assertTrue( $map['paid_offer_created'] );

		// checklist_statuses agrees with tasks[].completed for the overridden tasks.
		$this->assertTrue( $statuses['stripe_connected'] );
		$this->assertTrue( $statuses['paid_offer_created'] );
	}

	/**
	 * Test that GET repoints the connect-social CTA to its wp-admin target, since the
	 * catalog sends it to a Calypso flow that is a poor fit for the wp-admin AI
	 * Launchpad (and connect_social_media completes on the wp-admin Jetpack Social
	 * page, where its CTA should land).
	 */
	public function test_get_overrides_calypso_ctas_with_wp_admin_targets() {
		wp_set_current_user( $this->admin_id );
		$this->seed_ai_output_with_tasks( array( 'connect_social_media', 'first_post_published', 'site_launched' ) );

		$paths = array();
		foreach ( $this->call_api( Requests::GET )->get_data()['tasks'] as $task ) {
			$paths[ $task['id'] ] = $task['calypso_path'];
		}

		$this->assertSame( admin_url( 'admin.php?page=jetpack-social' ), $paths['connect_social_media'] );
		// A task without an override keeps its catalog path unchanged (null for the
		// launch task, which routes to the wordpress.com launch flow client-side).
		$this->assertArrayHasKey( 'site_launched', $paths );
		$this->assertNull( $paths['site_launched'] );
	}

	/**
	 * Test that GET points the theme task at the Calypso themes showcase pre-filtered
	 * by the AI-inferred niche, so the theme list feels relevant to what the user is
	 * building. This overrides the plain wp-admin themes.php target, which can only
	 * filter already-installed themes.
	 *
	 * The showcase search ANDs its terms, so a multi-word niche is reduced to its first
	 * keyword — 'ceramics and pottery' matches no theme, but 'ceramics' does.
	 */
	public function test_get_filters_theme_ctas_by_inferred_niche() {
		wp_set_current_user( $this->admin_id );

		update_option(
			'wpcom_ai_launchpad_ai_output',
			array(
				'version'      => 1,
				'source'       => 'ai',
				'generated_at' => 1717000000,
				'payload'      => array(
					'tasks'    => array(
						array(
							'id'       => 'site_theme_selected',
							'subtitle' => 'Pick a gallery-style theme.',
						),
						array(
							'id'       => 'site_launched',
							'subtitle' => 'Go live.',
						),
					),
					'inferred' => array(
						'goal'  => 'build',
						'niche' => 'ceramics and pottery',
					),
				),
			),
			false
		);

		$paths = array();
		foreach ( $this->call_api( Requests::GET )->get_data()['tasks'] as $task ) {
			$paths[ $task['id'] ] = $task['calypso_path'];
		}

		$expected = '/themes/all/' . rawurlencode( wpcom_get_site_slug() ) . '?s=ceramics';
		$this->assertSame( $expected, $paths['site_theme_selected'] );
		// A non-theme task is untouched by the niche filter.
		$this->assertNull( $paths['site_launched'] );
	}

	/**
	 * Test that when the AI supplied a dedicated theme_keyword, the theme CTAs search
	 * by it instead of the first-word niche heuristic — "weekend hiking trips" should
	 * surface hiking themes, not "weekend" ones.
	 */
	public function test_get_prefers_inferred_theme_keyword_for_theme_ctas() {
		wp_set_current_user( $this->admin_id );

		update_option(
			'wpcom_ai_launchpad_ai_output',
			array(
				'version'      => 1,
				'source'       => 'ai',
				'generated_at' => 1717000000,
				'payload'      => array(
					'tasks'    => array(
						array(
							'id'       => 'site_theme_selected',
							'subtitle' => 'Pick a theme.',
						),
						array(
							'id'       => 'site_launched',
							'subtitle' => 'Go live.',
						),
					),
					'inferred' => array(
						'goal'          => 'write',
						'niche'         => 'weekend hiking trips',
						'theme_keyword' => 'hiking',
					),
				),
			),
			false
		);

		$paths = array();
		foreach ( $this->call_api( Requests::GET )->get_data()['tasks'] as $task ) {
			$paths[ $task['id'] ] = $task['calypso_path'];
		}

		$this->assertSame( '/themes/all/' . rawurlencode( wpcom_get_site_slug() ) . '?s=hiking', $paths['site_theme_selected'] );
	}

	/**
	 * Test that a multi-word niche is reduced to a single search keyword: connective
	 * words are dropped and the first meaningful keyword is kept, so the showcase's
	 * term-ANDing search still returns matching themes.
	 *
	 * @dataProvider provider_niche_search_terms
	 *
	 * @param string $niche    The inferred niche.
	 * @param string $expected The expected `?s=` search term.
	 */
	#[DataProvider( 'provider_niche_search_terms' )]
	public function test_get_reduces_multiword_niche_to_single_keyword( $niche, $expected ) {
		wp_set_current_user( $this->admin_id );

		update_option(
			'wpcom_ai_launchpad_ai_output',
			array(
				'version'      => 1,
				'source'       => 'ai',
				'generated_at' => 1717000000,
				'payload'      => array(
					'tasks'    => array(
						array(
							'id'       => 'site_theme_selected',
							'subtitle' => 'Pick a theme.',
						),
						array(
							'id'       => 'site_launched',
							'subtitle' => 'Go live.',
						),
					),
					'inferred' => array(
						'goal'  => 'build',
						'niche' => $niche,
					),
				),
			),
			false
		);

		$path = null;
		foreach ( $this->call_api( Requests::GET )->get_data()['tasks'] as $task ) {
			if ( 'site_theme_selected' === $task['id'] ) {
				$path = $task['calypso_path'];
			}
		}

		$this->assertSame( '/themes/all/' . rawurlencode( wpcom_get_site_slug() ) . '?s=' . rawurlencode( $expected ), $path );
	}

	/**
	 * Niche → single search keyword expectations.
	 *
	 * @return array
	 */
	public static function provider_niche_search_terms() {
		return array(
			'strips "and" connective'      => array( 'ceramics and pottery', 'ceramics' ),
			'keeps first of two subjects'  => array( 'photography and travel', 'photography' ),
			'drops leading adjective-only' => array( 'handmade ceramics', 'handmade' ),
			'drops ampersand connective'   => array( 'arts & crafts', 'arts' ),
			'single word is unchanged'     => array( 'cooking', 'cooking' ),
			'skips leading stop word'      => array( 'the great outdoors', 'great' ),
		);
	}

	/**
	 * Test that without an inferred niche the theme task keeps its catalog target, so
	 * the showcase filter is purely additive.
	 */
	public function test_get_leaves_theme_ctas_unfiltered_without_niche() {
		wp_set_current_user( $this->admin_id );
		// seed_ai_output_with_tasks writes no `inferred` block, so there is no niche.
		$this->seed_ai_output_with_tasks( array( 'site_theme_selected', 'site_launched' ) );

		$paths = array();
		foreach ( $this->call_api( Requests::GET )->get_data()['tasks'] as $task ) {
			$paths[ $task['id'] ] = $task['calypso_path'];
		}

		// The load_calypso_path branch keeps the catalog's default theme path.
		$this->assertSame( '/themes/' . rawurlencode( wpcom_get_site_slug() ) . '#theme-selected', $paths['site_theme_selected'] );
	}

	/**
	 * The gallery task is injected before the launch task for a portfolio goal, defaulting to todo.
	 */
	public function test_get_injects_gallery_task_for_portfolio_goal() {
		wp_set_current_user( $this->admin_id );
		// seed_gallery_output seeds [ site_title, site_launched ] — both reliably visible in the test env
		// (unlike add_about_page, whose visibility gate needs extra meta registered).
		$this->seed_gallery_output( 'portfolio', 'freelance work' );

		$ids = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], 'id' );

		$this->assertContains( 'add_gallery_page', $ids );
		// Injected immediately after the AI task and before the launch task; any backfill filler follows it.
		$this->assertSame( array( 'site_title', 'add_gallery_page' ), array_slice( $ids, 0, 2 ), 'gallery follows the AI task' );
		$this->assertSame( 'site_launched', end( $ids ), 'launch stays last' );

		$gallery = null;
		foreach ( $this->call_api( Requests::GET )->get_data()['tasks'] as $task ) {
			if ( 'add_gallery_page' === $task['id'] ) {
				$gallery = $task;
			}
		}
		$this->assertSame( 'Create your first gallery', $gallery['title'] );
		$this->assertFalse( $gallery['completed'] );
		$this->assertFalse( $gallery['in_progress'] );
	}

	/**
	 * The gallery task is injected for a photo/visual niche even when the goal is not portfolio.
	 */
	public function test_get_injects_gallery_task_for_photo_niche() {
		wp_set_current_user( $this->admin_id );
		$this->seed_gallery_output( 'build', 'wedding photography' );
		$ids = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], 'id' );
		$this->assertContains( 'add_gallery_page', $ids );
	}

	/**
	 * A hyphenated/compound niche still matches on its keyword tokens.
	 */
	public function test_get_injects_gallery_task_for_hyphenated_niche() {
		wp_set_current_user( $this->admin_id );
		$this->seed_gallery_output( 'build', 'wildlife-photography' );
		$ids = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], 'id' );
		$this->assertContains( 'add_gallery_page', $ids );
	}

	/**
	 * The gallery task is NOT injected for an unrelated goal + niche.
	 */
	public function test_get_omits_gallery_task_for_unrelated_site() {
		wp_set_current_user( $this->admin_id );
		$this->seed_gallery_output( 'sell', 'organic coffee beans' );
		$ids = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], 'id' );
		$this->assertNotContains( 'add_gallery_page', $ids );
	}

	/**
	 * A completed gallery page marks the injected task done.
	 */
	public function test_get_marks_gallery_task_complete_from_status_option() {
		wp_set_current_user( $this->admin_id );
		$this->seed_gallery_output( 'portfolio', 'sculpture' );
		update_option( 'launchpad_checklist_tasks_statuses', array( 'add_gallery_page' => true ) );

		$gallery = null;
		foreach ( $this->call_api( Requests::GET )->get_data()['tasks'] as $task ) {
			if ( 'add_gallery_page' === $task['id'] ) {
				$gallery = $task;
			}
		}
		$this->assertTrue( $gallery['completed'] );
	}

	/**
	 * An unpublished gallery draft puts the injected task in progress and reopens that draft.
	 */
	public function test_get_marks_gallery_task_in_progress_with_draft() {
		wp_set_current_user( $this->admin_id );
		$this->seed_gallery_output( 'portfolio', 'sculpture' );

		// The marker-meta draft lookup runs through WP_Query, which WorDBless can't execute, so short-circuit it with
		// core's posts_pre_query filter to return a seeded draft id (mirrors the About-page in-progress test).
		$draft_id = 4343;
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

		$gallery = null;
		foreach ( $this->call_api( Requests::GET )->get_data()['tasks'] as $task ) {
			if ( 'add_gallery_page' === $task['id'] ) {
				$gallery = $task;
			}
		}
		$this->assertTrue( $gallery['in_progress'] );
		$this->assertSame( admin_url( 'post.php?post=' . $draft_id . '&action=edit' ), $gallery['calypso_path'] );
	}

	/**
	 * Returns the sell task list keyed by id (WooCommerce state controlled by the caller beforehand).
	 *
	 * @param string $niche The inferred niche.
	 * @return array<string, array> Tasks keyed by id.
	 */
	private function sell_tasks_by_id( $niche = 'organic coffee beans' ) {
		$this->seed_gallery_output( 'sell', $niche );
		$tasks = $this->call_api( Requests::GET )->get_data()['tasks'];
		return array_column( $tasks, null, 'id' );
	}

	/**
	 * With WooCommerce missing, the install task leads with the plugin-install CTA and stays actionable, while the
	 * setup task follows as a disabled preview.
	 */
	public function test_get_leads_sell_with_install_task_when_woocommerce_missing() {
		wp_set_current_user( $this->admin_id );
		update_option( 'active_plugins', array() );

		$tasks = $this->sell_tasks_by_id();
		$this->assertSame( 'install_woocommerce', array_key_first( $tasks ) );

		$install = $tasks['install_woocommerce'];
		$this->assertFalse( $install['completed'] );
		$this->assertFalse( $install['in_progress'] );
		$this->assertFalse( $install['disabled'] );
		$this->assertStringContainsString( 'Add the WooCommerce plugin', $install['subtitle'] );
		$this->assertStringContainsString( 'plugin-install.php?s=woocommerce', $install['calypso_path'] );

		// The setup task is still listed, but as a disabled preview with no CTA until WooCommerce is active.
		$this->assertArrayHasKey( 'setup_woocommerce_store', $tasks );
		$setup = $tasks['setup_woocommerce_store'];
		$this->assertTrue( $setup['disabled'] );
		$this->assertFalse( $setup['completed'] );
		$this->assertNull( $setup['calypso_path'] );
	}

	/**
	 * On a fresh sell site the gated commerce tasks are kept as disabled previews (with no CTA) instead of being
	 * dropped, so the full store roadmap is visible.
	 */
	public function test_get_keeps_commerce_tasks_disabled_when_woocommerce_inactive() {
		wp_set_current_user( $this->admin_id );
		update_option( 'active_plugins', array() );

		$this->seed_sell_output_with_commerce_tasks();
		$tasks = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], null, 'id' );

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
	 * A stray `woo_launch_site` (whose CTA dead-ends in the WC onboarding task list and whose completion depends on a
	 * WC option the skipped setup never writes) is normalized on read to the canonical `site_launched` launch task.
	 */
	public function test_get_remaps_woo_launch_site_to_site_launched() {
		wp_set_current_user( $this->admin_id );
		$this->seed_ai_output_with_tasks( array( 'site_theme_selected', 'woo_launch_site' ) );

		$tasks = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], null, 'id' );

		$this->assertArrayNotHasKey( 'woo_launch_site', $tasks );
		$this->assertArrayHasKey( 'site_launched', $tasks );
		// The canonical launch task has no wc-admin deeplink CTA.
		$this->assertStringNotContainsString( 'wc-admin', (string) $tasks['site_launched']['calypso_path'] );
	}

	/**
	 * The remap must not produce two `site_launched` cards when a list already carries it alongside a stray
	 * `woo_launch_site`: the tailored list keys cards by id, so a repeat has to collapse to a single card.
	 */
	public function test_get_dedupes_site_launched_when_remap_collides() {
		wp_set_current_user( $this->admin_id );
		$this->seed_ai_output_with_tasks( array( 'woo_launch_site', 'site_theme_selected', 'site_launched' ) );

		$ids = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], 'id' );

		$this->assertCount( 1, array_keys( $ids, 'site_launched', true ), 'exactly one site_launched card' );
		$this->assertNotContains( 'woo_launch_site', $ids );
	}

	/**
	 * The full-catalog testing view (?all_tasks=1) enumerates every id, so it builds both `site_launched` and the
	 * remapped `woo_launch_site`. The result must still contain a single `site_launched` card.
	 */
	public function test_all_tasks_view_has_single_site_launched_despite_remap() {
		wp_set_current_user( $this->admin_id );

		$ids = array_column( $this->call_api( Requests::GET, '', null, array( 'all_tasks' => '1' ) )->get_data()['tasks'], 'id' );

		$this->assertCount( 1, array_keys( $ids, 'site_launched', true ), 'exactly one site_launched card' );
		$this->assertNotContains( 'woo_launch_site', $ids );
	}

	/**
	 * A commerce task previously completed in WooCommerce renders as a disabled preview (not "done") while
	 * WooCommerce is inactive, and building the list must not persist a launchpad completion as a side effect.
	 */
	public function test_get_disabled_commerce_task_is_not_completed_and_does_not_write_status() {
		wp_set_current_user( $this->admin_id );
		update_option( 'active_plugins', array() );
		// Simulate a task WooCommerce recorded as complete during a prior active period.
		update_option( 'woocommerce_task_list_tracked_completed_tasks', array( 'products' ) );
		delete_option( 'launchpad_checklist_tasks_statuses' );

		$this->seed_sell_output_with_commerce_tasks();
		$tasks = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], null, 'id' );

		$this->assertTrue( $tasks['woo_products']['disabled'] );
		$this->assertFalse( $tasks['woo_products']['completed'] );

		// The completion callback (which writes launchpad status) must not have fired for the disabled preview.
		$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		$this->assertArrayNotHasKey( 'woo_products', $statuses );
	}

	/**
	 * With WooCommerce installed but not active, the install task is in progress and points at the plugins screen.
	 */
	public function test_get_marks_install_task_in_progress_when_inactive() {
		wp_set_current_user( $this->admin_id );
		update_option( 'active_plugins', array() );
		wp_cache_set( 'plugins', array( '' => array( 'woocommerce/woocommerce.php' => array( 'Name' => 'WooCommerce' ) ) ), 'plugins' );

		$install = $this->sell_tasks_by_id()['install_woocommerce'];
		wp_cache_delete( 'plugins', 'plugins' );

		$this->assertTrue( $install['in_progress'] );
		$this->assertFalse( $install['completed'] );
		$this->assertStringContainsString( 'Activate the WooCommerce plugin', $install['subtitle'] );
		$this->assertStringContainsString( 'plugins.php?plugin_status=inactive', $install['calypso_path'] );
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
		wp_set_current_user( $this->admin_id );
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
		wp_set_current_user( $this->admin_id );
		// Force the catalog's plugin task to resolve to plugins.php (its wp-admin-interface branch).
		update_option( 'wpcom_admin_interface', 'wp-admin' );
		$this->seed_ai_output_with_tasks( array( 'install_custom_plugin', 'site_launched' ) );

		$tasks = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], null, 'id' );

		$this->assertArrayHasKey( 'install_custom_plugin', $tasks );
		$this->assertSame( '/plugins/' . rawurlencode( wpcom_get_site_slug() ), $tasks['install_custom_plugin']['calypso_path'] );
	}

	/**
	 * Once WooCommerce is active the install task shows complete and the setup task appears with the wizard CTA.
	 */
	public function test_get_completes_install_and_offers_setup_when_active() {
		wp_set_current_user( $this->admin_id );
		update_option( 'active_plugins', array( 'woocommerce/woocommerce.php' ) );

		$tasks = $this->sell_tasks_by_id();
		update_option( 'active_plugins', array() );

		$this->assertTrue( $tasks['install_woocommerce']['completed'] );
		$this->assertArrayHasKey( 'setup_woocommerce_store', $tasks );
		$setup = $tasks['setup_woocommerce_store'];
		$this->assertFalse( $setup['completed'] );
		$this->assertStringContainsString( 'page=wc-admin&path=%2Fsetup-wizard', $setup['calypso_path'] );
	}

	/**
	 * The setup task completes once the WooCommerce core profiler is completed or skipped.
	 */
	public function test_get_completes_setup_when_profiler_done() {
		wp_set_current_user( $this->admin_id );
		update_option( 'active_plugins', array( 'woocommerce/woocommerce.php' ) );
		update_option( 'woocommerce_onboarding_profile', array( 'skipped' => true ) );

		$setup = $this->sell_tasks_by_id()['setup_woocommerce_store'];
		update_option( 'active_plugins', array() );

		$this->assertTrue( $setup['completed'] );
		$this->assertNull( $setup['calypso_path'] );
	}

	/**
	 * The store tasks are not injected for a non-sell goal.
	 */
	public function test_get_omits_store_tasks_for_non_sell_goal() {
		wp_set_current_user( $this->admin_id );
		$this->seed_gallery_output( 'build', 'organic coffee beans' );
		$ids = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], 'id' );
		$this->assertNotContains( 'install_woocommerce', $ids );
		$this->assertNotContains( 'setup_woocommerce_store', $ids );
	}

	/**
	 * A sell site whose niche matches a gallery keyword gets the store tasks, not the off-target gallery task.
	 */
	public function test_get_prefers_store_over_gallery_for_sell_goal() {
		wp_set_current_user( $this->admin_id );
		update_option( 'active_plugins', array() );

		$ids = array_keys( $this->sell_tasks_by_id( 'handmade art' ) );
		$this->assertContains( 'install_woocommerce', $ids );
		$this->assertNotContains( 'add_gallery_page', $ids );
	}

	/**
	 * The gallery task is not injected on the ?all_tasks=1 catalog view.
	 */
	public function test_get_all_tasks_param_omits_gallery_task() {
		wp_set_current_user( $this->admin_id );
		$this->seed_gallery_output( 'portfolio', 'sculpture' );
		$ids = array_column( $this->call_api( Requests::GET, '', null, array( 'all_tasks' => '1' ) )->get_data()['tasks'], 'id' );
		$this->assertNotContains( 'add_gallery_page', $ids );
	}

	/**
	 * Test that GET with ?all_tasks=1 returns the full catalog (a testing aid),
	 * bypassing per-site visibility and not depending on any persisted AI output.
	 */
	public function test_get_all_tasks_param_returns_full_catalog() {
		wp_set_current_user( $this->admin_id );
		// No ai_output seeded — all-tasks mode is independent of the tailored output.

		$result = $this->call_api( Requests::GET, '', null, array( 'all_tasks' => '1' ) );

		$this->assertSame( 200, $result->get_status() );
		$ids = array_column( $result->get_data()['tasks'], 'id' );
		// Far more than a tailored list (~6 tasks): the whole catalog.
		$this->assertGreaterThan( 40, count( $ids ) );
		// Includes a task normally hidden by the visibility gate (woo_products needs
		// WooCommerce, absent in the test env) — proving the bypass.
		$this->assertContains( 'woo_products', $ids );
		$this->assertContains( 'first_post_published', $ids );
	}

	/**
	 * Test that the Jetpack Social tasks are hidden on a private site, where wpcom
	 * doesn't load the Social admin page their CTA points to.
	 */
	public function test_get_hides_social_tasks_on_private_site() {
		wp_set_current_user( $this->admin_id );
		$this->seed_ai_output_with_tasks(
			array( 'connect_social_media', 'drive_traffic', 'first_post_published', 'site_launched' )
		);

		$ids = function () {
			return array_column( $this->call_api( Requests::GET )->get_data()['tasks'], 'id' );
		};

		// Public site: the Social tasks show.
		update_option( 'blog_public', '1' );
		$public_ids = $ids();
		$this->assertContains( 'connect_social_media', $public_ids );
		$this->assertContains( 'drive_traffic', $public_ids );

		// Private site: the Social tasks are gone, the rest remain.
		update_option( 'blog_public', '-1' );
		$private_ids = $ids();
		$this->assertNotContains( 'connect_social_media', $private_ids );
		$this->assertNotContains( 'drive_traffic', $private_ids );
		$this->assertContains( 'first_post_published', $private_ids );

		update_option( 'blog_public', '1' );
	}

	/**
	 * Test that a persisted post_sharing_enabled task renders as connect_social_media.
	 * The sharing module is active by default on wpcom, so the original task was born
	 * completed; the connection task is the meaningful version of the same intent. A
	 * payload holding both collapses to one card.
	 */
	public function test_get_remaps_post_sharing_enabled_to_connect_social_media() {
		wp_set_current_user( $this->admin_id );
		$this->seed_ai_output_with_tasks(
			array( 'post_sharing_enabled', 'connect_social_media', 'first_post_published', 'site_launched' )
		);

		$ids = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], 'id' );

		$this->assertNotContains( 'post_sharing_enabled', $ids );
		$this->assertSame( 1, array_count_values( $ids )['connect_social_media'] );
	}

	/**
	 * Test that the rendered id of a remapped task is skippable: an output persisted
	 * before the post_sharing_enabled remap renders a connect_social_media card, and
	 * skipping that card must validate against the remapped ids, not the raw payload.
	 */
	public function test_skip_task_accepts_remapped_task_id() {
		wp_set_current_user( $this->admin_id );
		$this->seed_ai_output_with_tasks( array( 'post_sharing_enabled', 'site_launched' ) );

		$result = $this->call_api( 'POST', '/skip-task', array( 'task_id' => 'connect_social_media' ) );

		$this->assertSame( 200, $result->get_status() );
		$this->assertTrue( $result->get_data()['skipped'] );
	}

	/**
	 * Test that GET requires authentication.
	 */
	public function test_get_requires_authentication() {
		$result = $this->call_api( Requests::GET );

		$this->assertSame( 401, $result->get_status() );
	}

	/**
	 * Test that ineligible sites get a 404.
	 */
	public function test_ineligible_site_gets_404() {
		\Brain\Monkey\Functions\when( 'wpcom_ai_launchpad_is_eligible' )->justReturn( false );
		wp_set_current_user( $this->admin_id );

		$result = $this->call_api( Requests::GET );

		$this->assertSame( 404, $result->get_status() );
		$this->assertSame( 'ai_launchpad_not_eligible', $result->get_data()['code'] );
	}

	/**
	 * Test that PUT /wizard persists the wizard option.
	 */
	public function test_put_wizard_persists_option() {
		wp_set_current_user( $this->admin_id );

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

		// The entered Name and Brief description are written back to the site's
		// identity options so the wizard reflects and updates the real site.
		$this->assertSame( 'Alpine Notes', get_option( 'blogname' ) );
		$this->assertSame( 'Personal blog about long-distance hiking in the Alps.', get_option( 'blogdescription' ) );
	}

	/**
	 * Test that PUT /wizard does not blank an existing site title/tagline when the
	 * Name and Brief description come through empty.
	 */
	public function test_put_wizard_keeps_site_identity_when_fields_empty() {
		wp_set_current_user( $this->admin_id );

		update_option( 'blogname', 'Existing Title' );
		update_option( 'blogdescription', 'Existing Tagline' );

		$result = $this->call_api(
			'PUT',
			'/wizard',
			array(
				'goal'        => 'write',
				'site_name'   => '',
				'description' => '',
				'locale'      => 'en',
			)
		);

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( 'Existing Title', get_option( 'blogname' ) );
		$this->assertSame( 'Existing Tagline', get_option( 'blogdescription' ) );
	}

	/**
	 * Test that a multi-line Brief description is collapsed to a single-line tagline.
	 */
	public function test_put_wizard_collapses_multiline_description_for_tagline() {
		wp_set_current_user( $this->admin_id );

		$result = $this->call_api(
			'PUT',
			'/wizard',
			array(
				'goal'        => 'write',
				'site_name'   => 'Alpine Notes',
				'description' => "Line one.\nLine two.",
				'locale'      => 'en',
			)
		);

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( 'Line one. Line two.', get_option( 'blogdescription' ) );
	}

	/**
	 * Test that PUT /wizard rejects an unknown goal.
	 */
	public function test_put_wizard_rejects_unknown_goal() {
		wp_set_current_user( $this->admin_id );

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
		wp_set_current_user( $this->admin_id );

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
		wp_set_current_user( $this->admin_id );

		$result = $this->call_api( 'PUT', '/tailored', self::valid_payload(), array( 'source' => 'fallback' ) );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( 'fallback', get_option( 'wpcom_ai_launchpad_ai_output' )['source'] );
	}

	/**
	 * Test that PUT /tailored rejects a seventh task.
	 */
	public function test_put_tailored_rejects_extra_task() {
		wp_set_current_user( $this->admin_id );

		$payload            = self::valid_payload();
		$payload['tasks'][] = array(
			'id'       => 'drive_traffic',
			'subtitle' => 'One task too many.',
		);

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 422, $result->get_status() );
		$this->assertSame( 'ai_launchpad_invalid_payload', $result->get_data()['code'] );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_ai_output' ) );
	}

	/**
	 * Test that PUT /tailored rejects a payload missing a required field.
	 */
	public function test_put_tailored_rejects_missing_required_field() {
		wp_set_current_user( $this->admin_id );

		$payload = self::valid_payload();
		unset( $payload['first_post_draft'] );

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 422, $result->get_status() );
		$this->assertSame( 'ai_launchpad_invalid_payload', $result->get_data()['code'] );
	}

	/**
	 * Test that PUT /tailored strips HTML from subtitles before persisting.
	 */
	public function test_put_tailored_strips_html_from_subtitles() {
		wp_set_current_user( $this->admin_id );

		$payload                         = self::valid_payload();
		$payload['tasks'][0]['subtitle'] = 'Share your <b>first</b> trail story.';

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 200, $result->get_status() );

		$option = get_option( 'wpcom_ai_launchpad_ai_output' );
		$this->assertSame( 'Share your first trail story.', $option['payload']['tasks'][0]['subtitle'] );
	}

	/**
	 * Test that PUT /tailored rejects a subtitle that is only a script tag.
	 */
	public function test_put_tailored_rejects_script_only_subtitle() {
		wp_set_current_user( $this->admin_id );

		$payload                         = self::valid_payload();
		$payload['tasks'][0]['subtitle'] = '<script>alert(1)</script>';

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 422, $result->get_status() );
		$this->assertSame( 'ai_launchpad_invalid_subtitle', $result->get_data()['code'] );
	}

	/**
	 * Test that PUT /tailored rejects a subtitle containing a URL.
	 */
	public function test_put_tailored_rejects_subtitle_with_url() {
		wp_set_current_user( $this->admin_id );

		$payload                         = self::valid_payload();
		$payload['tasks'][0]['subtitle'] = 'Visit https://example.com for tips.';

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 422, $result->get_status() );
		$this->assertSame( 'ai_launchpad_subtitle_contains_url', $result->get_data()['code'] );
	}

	/**
	 * Test that PUT /tailored rejects a subtitle containing template syntax.
	 */
	public function test_put_tailored_rejects_subtitle_with_template_syntax() {
		wp_set_current_user( $this->admin_id );

		$payload                         = self::valid_payload();
		$payload['tasks'][0]['subtitle'] = 'Write about {{brand_name}} today.';

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 422, $result->get_status() );
		$this->assertSame( 'ai_launchpad_subtitle_contains_template', $result->get_data()['code'] );
	}

	/**
	 * Test that PUT /tailored rejects a payload with fewer than four catalog-valid task IDs.
	 */
	public function test_put_tailored_rejects_too_few_catalog_valid_tasks() {
		wp_set_current_user( $this->admin_id );

		$payload                   = self::valid_payload();
		$payload['tasks'][1]['id'] = 'made_up_task_one';
		$payload['tasks'][2]['id'] = 'made_up_task_two';
		$payload['tasks'][3]['id'] = 'made_up_task_three';

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 422, $result->get_status() );
		$this->assertSame( 'ai_launchpad_unknown_tasks', $result->get_data()['code'] );
	}

	/**
	 * Test that PUT /tailored drops unknown task IDs but persists when enough survive.
	 */
	public function test_put_tailored_drops_unknown_task_ids() {
		wp_set_current_user( $this->admin_id );

		$payload                   = self::valid_payload();
		$payload['tasks'][1]['id'] = 'made_up_task';

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 200, $result->get_status() );

		$persisted_tasks = get_option( 'wpcom_ai_launchpad_ai_output' )['payload']['tasks'];
		$this->assertCount( 5, $persisted_tasks );
		$this->assertNotContains( 'made_up_task', array_column( $persisted_tasks, 'id' ) );
	}

	/**
	 * Test that PUT /tailored rejects a payload whose last task is not a launch task.
	 */
	public function test_put_tailored_rejects_when_last_task_is_not_launch_task() {
		wp_set_current_user( $this->admin_id );

		$payload                   = self::valid_payload();
		$payload['tasks'][5]['id'] = 'drive_traffic';

		$result = $this->call_api( 'PUT', '/tailored', $payload );

		$this->assertSame( 422, $result->get_status() );
		$this->assertSame( 'ai_launchpad_missing_launch_task', $result->get_data()['code'] );
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
	 * Seeds the AI output option with the given task IDs (launch task last) so
	 * wpcom_ai_launchpad_get_ai_task_ids() reports them as on the site's list.
	 *
	 * @param string[] $task_ids The task IDs to seed.
	 * @param string   $goal     Optional inferred goal to record (drives sell-specific behavior).
	 */
	private function seed_ai_output_with_tasks( array $task_ids, $goal = '' ) {
		$tasks = array();
		foreach ( $task_ids as $id ) {
			$tasks[] = array(
				'id'       => $id,
				'subtitle' => 'Subtitle for ' . $id . '.',
			);
		}
		$payload = array( 'tasks' => $tasks );
		if ( '' !== $goal ) {
			$payload['inferred'] = array( 'goal' => $goal );
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
	private function seed_gallery_output( $goal, $niche ) {
		update_option(
			'wpcom_ai_launchpad_ai_output',
			array(
				'version'      => 1,
				'source'       => 'ai',
				'generated_at' => 1717000000,
				'payload'      => array(
					'tasks'    => array(
						array(
							'id'       => 'site_title',
							'subtitle' => 'Name it.',
						),
						array(
							'id'       => 'site_launched',
							'subtitle' => 'Go live.',
						),
					),
					'inferred' => array(
						'goal'  => $goal,
						'niche' => $niche,
					),
				),
			),
			false
		);
	}

	/**
	 * Seeds a sell payload whose tasks include the WooCommerce-gated commerce tasks plus a non-commerce task, so the
	 * disabled-preview behavior can be asserted.
	 */
	private function seed_sell_output_with_commerce_tasks() {
		update_option(
			'wpcom_ai_launchpad_ai_output',
			array(
				'version'      => 1,
				'source'       => 'ai',
				'generated_at' => 1717000000,
				'payload'      => array(
					'tasks'    => array(
						array(
							'id'       => 'woo_customize_store',
							'subtitle' => 'Make it yours.',
						),
						array(
							'id'       => 'woo_products',
							'subtitle' => 'Add products.',
						),
						array(
							'id'       => 'set_up_payments',
							'subtitle' => 'Get paid.',
						),
						array(
							'id'       => 'site_theme_selected',
							'subtitle' => 'Pick a theme.',
						),
						array(
							'id'       => 'woo_launch_site',
							'subtitle' => 'Go live.',
						),
					),
					'inferred' => array(
						'goal'  => 'sell',
						'niche' => 'organic coffee beans',
					),
				),
			),
			false
		);
	}

	/**
	 * Test that the sell list places the theme task right after the store-setup lead
	 * tasks, wherever the AI ranked it: pick the store's look once the store exists.
	 */
	public function test_get_sell_moves_theme_task_after_store_setup() {
		wp_set_current_user( $this->admin_id );
		update_option( 'active_plugins', array() );
		$this->seed_sell_output_with_commerce_tasks();

		$ids = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], 'id' );

		$this->assertSame(
			array( 'install_woocommerce', 'setup_woocommerce_store', 'site_theme_selected' ),
			array_slice( $ids, 0, 3 )
		);
	}

	/**
	 * Test that on a sell site the theme CTAs point at the showcase's Store category
	 * instead of the niche search, so users land on shop-ready templates.
	 */
	public function test_get_sell_theme_cta_uses_store_filter() {
		wp_set_current_user( $this->admin_id );
		update_option( 'active_plugins', array() );
		$this->seed_sell_output_with_commerce_tasks();

		$tasks = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], null, 'id' );

		$this->assertSame(
			'/themes/filter/store/' . rawurlencode( wpcom_get_site_slug() ),
			$tasks['site_theme_selected']['calypso_path']
		);
	}

	/**
	 * Test that a persisted design_selected task renders as the actionable
	 * site_theme_selected and is repositioned after the store-setup lead tasks:
	 * the legacy "Select a design" task is always-complete and has no wp-admin
	 * completion path, so it is consolidated onto the theme task.
	 */
	public function test_get_sell_remaps_and_repositions_design_selected() {
		wp_set_current_user( $this->admin_id );
		update_option( 'active_plugins', array() );
		update_option(
			'wpcom_ai_launchpad_ai_output',
			array(
				'version'      => 1,
				'source'       => 'ai',
				'generated_at' => 1717000000,
				'payload'      => array(
					'tasks'    => array(
						array(
							'id'       => 'woo_products',
							'subtitle' => 'Add products.',
						),
						array(
							'id'       => 'design_selected',
							'subtitle' => 'Pick a look.',
						),
						array(
							'id'       => 'site_launched',
							'subtitle' => 'Go live.',
						),
					),
					'inferred' => array( 'goal' => 'sell' ),
				),
			),
			false
		);

		$ids = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], 'id' );

		$this->assertNotContains( 'design_selected', $ids );
		$this->assertSame(
			array( 'install_woocommerce', 'setup_woocommerce_store', 'site_theme_selected' ),
			array_slice( $ids, 0, 3 )
		);
	}

	/**
	 * Test that the legacy design tasks are consolidated onto site_theme_selected on
	 * read: both remap to the one actionable theme task (deduped), and it is not the
	 * always-complete "Select a design" card.
	 */
	public function test_get_remaps_design_tasks_to_site_theme_selected() {
		wp_set_current_user( $this->admin_id );
		$this->seed_ai_output_with_tasks( array( 'design_selected', 'design_completed', 'site_launched' ), 'build' );

		$tasks = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], null, 'id' );

		$this->assertArrayNotHasKey( 'design_selected', $tasks );
		$this->assertArrayNotHasKey( 'design_completed', $tasks );
		$this->assertArrayHasKey( 'site_theme_selected', $tasks );
		// site_theme_selected reads a real signal, so it is not born-complete like design_selected was.
		$this->assertFalse( $tasks['site_theme_selected']['completed'] );
	}

	/**
	 * Test that a sell list always includes a Choose-a-theme task even when the AI
	 * did not pick one, positioned right after the store-setup lead tasks and
	 * pointed at the showcase Store category.
	 */
	public function test_get_guarantees_theme_task_on_sell() {
		wp_set_current_user( $this->admin_id );
		update_option( 'active_plugins', array() );
		update_option(
			'wpcom_ai_launchpad_ai_output',
			array(
				'version'      => 1,
				'source'       => 'ai',
				'generated_at' => 1717000000,
				'payload'      => array(
					'tasks'    => array(
						array(
							'id'       => 'woo_products',
							'subtitle' => 'Add products.',
						),
						array(
							'id'       => 'woo_marketing',
							'subtitle' => 'Promote it.',
						),
						array(
							'id'       => 'site_launched',
							'subtitle' => 'Go live.',
						),
					),
					'inferred' => array( 'goal' => 'sell' ),
				),
			),
			false
		);

		$tasks = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], null, 'id' );

		$this->assertArrayHasKey( 'site_theme_selected', $tasks );
		$ids = array_keys( $tasks );
		$this->assertSame(
			array( 'install_woocommerce', 'setup_woocommerce_store', 'site_theme_selected' ),
			array_slice( $ids, 0, 3 )
		);
		$this->assertSame(
			'/themes/filter/store/' . rawurlencode( wpcom_get_site_slug() ),
			$tasks['site_theme_selected']['calypso_path']
		);
	}

	/**
	 * Test that a non-sell list is not given a theme task it did not ask for.
	 */
	public function test_get_does_not_inject_theme_task_for_non_sell() {
		wp_set_current_user( $this->admin_id );
		// The theme task is sell-only (ensure_theme_task) and is not in the short-list backfill pool, so even a short
		// non-sell list never gains one.
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'site_launched' ), 'write' );

		$ids = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], 'id' );

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
		wp_set_current_user( $this->admin_id );
		$this->seed_ai_output_with_tasks( array( 'post_sharing_enabled', 'site_launched' ) );
		// As written by skip_task() before the remap existed.
		update_option( 'wpcom_ai_launchpad_skipped_tasks', array( 'post_sharing_enabled' ), false );

		$tasks = array_column( $this->call_api( Requests::GET )->get_data()['tasks'], null, 'id' );

		$this->assertTrue( $tasks['connect_social_media']['skipped'] );
		$this->assertTrue( $tasks['connect_social_media']['completed'] );
	}

	/**
	 * Test that POST /complete-task marks an allowlisted acknowledgment task complete.
	 */
	public function test_complete_task_marks_acknowledgment_task() {
		wp_set_current_user( $this->admin_id );
		$this->seed_ai_output_with_tasks( array( 'complete_profile', 'site_launched' ) );

		$result = $this->call_api( 'POST', '/complete-task', array( 'task_id' => 'complete_profile' ) );

		$this->assertSame( 200, $result->get_status() );
		$this->assertTrue( $result->get_data()['completed'] );
		$statuses = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertTrue( ! empty( $statuses['complete_profile'] ) );
	}

	/**
	 * Test that setup_ssh completes via the complete-on-click route, reusing
	 * Calypso's optimistic completion strategy (its hosting form marks setup_ssh
	 * complete when the user creates SFTP credentials; the real SSH-user signal is
	 * unreachable from the launchpad's Atomic context).
	 */
	public function test_complete_task_marks_setup_ssh() {
		wp_set_current_user( $this->admin_id );
		$this->seed_ai_output_with_tasks( array( 'setup_ssh', 'site_launched' ) );

		$result = $this->call_api( 'POST', '/complete-task', array( 'task_id' => 'setup_ssh' ) );

		$this->assertSame( 200, $result->get_status() );
		$this->assertTrue( $result->get_data()['completed'] );
		$statuses = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertTrue( ! empty( $statuses['setup_ssh'] ) );
	}

	/**
	 * Test that share_site completes via the complete-on-click route. It has no CTA
	 * destination, so the tailored list offers a "Mark as complete" button that
	 * hits this route; sharing is a transient client action with no real signal.
	 */
	public function test_complete_task_marks_share_site() {
		wp_set_current_user( $this->admin_id );
		$this->seed_ai_output_with_tasks( array( 'share_site', 'site_launched' ) );

		$result = $this->call_api( 'POST', '/complete-task', array( 'task_id' => 'share_site' ) );

		$this->assertSame( 200, $result->get_status() );
		$this->assertTrue( $result->get_data()['completed'] );
		$statuses = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertTrue( ! empty( $statuses['share_site'] ) );
	}

	/**
	 * Test that POST /complete-task rejects ids that are not completable this way:
	 * a non-allowlisted task (even if on the list) and an allowlisted task that is
	 * not on the site's AI-selected list.
	 */
	public function test_complete_task_rejects_invalid_tasks() {
		wp_set_current_user( $this->admin_id );
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
		wp_set_current_user( $this->admin_id );
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'site_launched' ) );

		$result = $this->call_api( 'POST', '/skip-task', array( 'task_id' => 'first_post_published' ) );

		$this->assertSame( 200, $result->get_status() );
		$this->assertTrue( $result->get_data()['skipped'] );

		$tasks = array();
		foreach ( $this->call_api( Requests::GET )->get_data()['tasks'] as $task ) {
			$tasks[ $task['id'] ] = $task;
		}

		$this->assertTrue( $tasks['first_post_published']['skipped'] );
		$this->assertTrue( $tasks['first_post_published']['completed'] );
		$this->assertFalse( $tasks['site_launched']['skipped'] );
		$this->assertFalse( $tasks['site_launched']['completed'] );
		// The skip lives in its own option, never in the shared statuses (several catalog tasks
		// recompute completion live and would ignore a status write).
		$this->assertFalse( get_option( 'launchpad_checklist_tasks_statuses' ) );
	}

	/**
	 * Test that reading the launchpad leaves the cached completion flag unset while any task is incomplete, so the
	 * menu keeps showing.
	 */
	public function test_get_leaves_completed_flag_unset_while_incomplete() {
		wp_set_current_user( $this->admin_id );
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'site_launched' ) );

		$this->call_api( Requests::GET );

		$this->assertFalse( get_option( 'wpcom_ai_launchpad_completed' ) );
	}

	/**
	 * Test that reading the launchpad sets the cached completion flag once every task is completed or skipped, so the
	 * menu gate can hide the screen without rebuilding the list.
	 */
	public function test_get_sets_completed_flag_when_all_done() {
		wp_set_current_user( $this->admin_id );
		// A full six-task list so the short-list backfill does not add tasks that would keep it incomplete.
		$ids = array( 'first_post_published', 'design_edited', 'site_title', 'setup_general', 'site_theme_selected', 'site_launched' );
		$this->seed_ai_output_with_tasks( $ids );
		// Skipping every task coerces each to completed, so the list reads as done.
		update_option( 'wpcom_ai_launchpad_skipped_tasks', $ids, false );

		$this->call_api( Requests::GET );

		$this->assertTrue( (bool) get_option( 'wpcom_ai_launchpad_completed' ) );
	}

	/**
	 * Test that the completion flag latches: once set, reading the launchpad keeps it set even if a task now reads
	 * incomplete, so a task that un-completes does not bring the launchpad back (only an explicit reset does).
	 */
	public function test_completed_flag_is_latched() {
		wp_set_current_user( $this->admin_id );
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'site_launched' ) );
		update_option( 'wpcom_ai_launchpad_completed', true, true );

		$this->call_api( Requests::GET );

		$this->assertTrue( (bool) get_option( 'wpcom_ai_launchpad_completed' ) );
	}

	/**
	 * Test that skipping the final task refreshes the cached flag immediately, so the menu hides on the next page
	 * load without waiting for another launchpad read.
	 */
	public function test_skip_final_task_sets_completed_flag() {
		wp_set_current_user( $this->admin_id );
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
		wp_set_current_user( $this->admin_id );
		$this->seed_ai_output_with_tasks( array( 'first_post_published', 'site_launched' ) );

		$this->call_api( 'POST', '/skip-task', array( 'task_id' => 'first_post_published' ) );
		$repeat = $this->call_api( 'POST', '/skip-task', array( 'task_id' => 'first_post_published' ) );
		$this->assertSame( 200, $repeat->get_status(), 'skipping an already-skipped task still succeeds' );

		$this->assertSame( array( 'first_post_published' ), get_option( 'wpcom_ai_launchpad_skipped_tasks' ) );
	}

	/**
	 * Test that the synthetic tasks (absent from the AI payload by design) are skippable too.
	 */
	public function test_skip_task_accepts_synthetic_gallery_task() {
		wp_set_current_user( $this->admin_id );
		$this->seed_gallery_output( 'portfolio', 'wildlife photography' );

		$result = $this->call_api( 'POST', '/skip-task', array( 'task_id' => 'add_gallery_page' ) );
		$this->assertSame( 200, $result->get_status() );

		$tasks = array();
		foreach ( $this->call_api( Requests::GET )->get_data()['tasks'] as $task ) {
			$tasks[ $task['id'] ] = $task;
		}

		$this->assertTrue( $tasks['add_gallery_page']['skipped'] );
		$this->assertTrue( $tasks['add_gallery_page']['completed'] );
	}

	/**
	 * Test that POST /skip-task rejects a task that is neither on the site's AI list nor synthetic.
	 */
	public function test_skip_task_rejects_task_not_on_list() {
		wp_set_current_user( $this->admin_id );
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
		wp_set_current_user( $this->admin_id );
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
		wp_set_current_user( $this->admin_id );

		$paths = array();
		foreach ( $this->call_api( Requests::GET, '', null, array( 'all_tasks' => '1' ) )->get_data()['tasks'] as $task ) {
			$paths[ $task['id'] ] = $task['calypso_path'];
		}

		$this->assertSame( admin_url( 'widgets.php' ), $paths['add_subscribe_block'] );
	}

	/**
	 * Test that DELETE removes the AI output, sets dismissed, and leaves statuses untouched.
	 */
	public function test_delete_dismisses_and_keeps_statuses() {
		wp_set_current_user( $this->admin_id );

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
