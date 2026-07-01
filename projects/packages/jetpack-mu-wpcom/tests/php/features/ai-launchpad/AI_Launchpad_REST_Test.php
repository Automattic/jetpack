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

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
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
	 * Test that GET repoints the social/design CTAs to wp-admin targets, since the
	 * catalog sends them to Calypso flows that are a poor fit for the wp-admin AI
	 * Launchpad (and connect_social_media completes on the wp-admin Jetpack Social
	 * page, where its CTA should land).
	 */
	public function test_get_overrides_calypso_ctas_with_wp_admin_targets() {
		wp_set_current_user( $this->admin_id );
		$this->seed_ai_output_with_tasks( array( 'connect_social_media', 'design_selected', 'site_launched' ) );

		$paths = array();
		foreach ( $this->call_api( Requests::GET )->get_data()['tasks'] as $task ) {
			$paths[ $task['id'] ] = $task['calypso_path'];
		}

		$this->assertSame( admin_url( 'admin.php?page=jetpack-social' ), $paths['connect_social_media'] );
		$this->assertSame( admin_url( 'themes.php' ), $paths['design_selected'] );
		// A task without an override keeps its catalog path unchanged (null for the
		// launch task, which routes to the wordpress.com launch flow client-side).
		$this->assertArrayHasKey( 'site_launched', $paths );
		$this->assertNull( $paths['site_launched'] );
	}

	/**
	 * Test that GET points the theme tasks at the Calypso themes showcase pre-filtered
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
							'id'       => 'design_selected',
							'subtitle' => 'Make it yours.',
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

		$expected = '/themes/' . rawurlencode( wpcom_get_site_slug() ) . '?s=ceramics';
		$this->assertSame( $expected, $paths['site_theme_selected'] );
		$this->assertSame( $expected, $paths['design_selected'] );
		// A non-theme task is untouched by the niche filter.
		$this->assertNull( $paths['site_launched'] );
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

		$this->assertSame( '/themes/' . rawurlencode( wpcom_get_site_slug() ) . '?s=' . rawurlencode( $expected ), $path );
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
	 * Test that without an inferred niche the theme CTAs keep their existing targets
	 * (the wp-admin override for design_selected), so the filter is purely additive.
	 */
	public function test_get_leaves_theme_ctas_unfiltered_without_niche() {
		wp_set_current_user( $this->admin_id );
		// seed_ai_output_with_tasks writes no `inferred` block, so there is no niche.
		$this->seed_ai_output_with_tasks( array( 'site_theme_selected', 'design_selected', 'site_launched' ) );

		$paths = array();
		foreach ( $this->call_api( Requests::GET )->get_data()['tasks'] as $task ) {
			$paths[ $task['id'] ] = $task['calypso_path'];
		}

		// The CTA_OVERRIDES branch keeps its wp-admin target.
		$this->assertSame( admin_url( 'themes.php' ), $paths['design_selected'] );
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
		// Injected immediately before the launch task.
		$this->assertSame( array( 'site_title', 'add_gallery_page', 'site_launched' ), $ids );

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
			array( 'connect_social_media', 'drive_traffic', 'post_sharing_enabled', 'first_post_published', 'site_launched' )
		);

		$ids = function () {
			return array_column( $this->call_api( Requests::GET )->get_data()['tasks'], 'id' );
		};

		// Public site: the Social tasks show.
		update_option( 'blog_public', '1' );
		$public_ids = $ids();
		$this->assertContains( 'connect_social_media', $public_ids );
		$this->assertContains( 'drive_traffic', $public_ids );
		$this->assertContains( 'post_sharing_enabled', $public_ids );

		// Private site: the Social tasks are gone, the rest remain.
		update_option( 'blog_public', '-1' );
		$private_ids = $ids();
		$this->assertNotContains( 'connect_social_media', $private_ids );
		$this->assertNotContains( 'drive_traffic', $private_ids );
		$this->assertNotContains( 'post_sharing_enabled', $private_ids );
		$this->assertContains( 'first_post_published', $private_ids );

		update_option( 'blog_public', '1' );
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
	 */
	private function seed_ai_output_with_tasks( array $task_ids ) {
		$tasks = array();
		foreach ( $task_ids as $id ) {
			$tasks[] = array(
				'id'       => $id,
				'subtitle' => 'Subtitle for ' . $id . '.',
			);
		}
		update_option(
			'wpcom_ai_launchpad_ai_output',
			array(
				'version'      => 1,
				'source'       => 'ai',
				'generated_at' => 1717000000,
				'payload'      => array( 'tasks' => $tasks ),
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

		$result = $this->call_api( Requests::DELETE );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( array( 'dismissed' => true ), $result->get_data() );
		$this->assertFalse( get_option( 'wpcom_ai_launchpad_ai_output' ) );
		$this->assertTrue( (bool) get_option( 'wpcom_ai_launchpad_dismissed' ) );
		$this->assertSame( array( 'first_post_published' => true ), get_option( 'launchpad_checklist_tasks_statuses' ) );
	}
}
