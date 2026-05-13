<?php
/**
 * Tests for the Blaze_Abilities Registrar subclass.
 *
 * @package automattic/jetpack-blaze
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

namespace Automattic\Jetpack\Blaze\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/class-blaze-abilities-test-stub.php';

/**
 * Unit tests for Blaze_Abilities registration and execution.
 *
 * Run from projects/packages/blaze:
 *
 *   composer phpunit -- --filter Blaze_Abilities_Test
 *
 * @covers \Automattic\Jetpack\Blaze\Abilities\Blaze_Abilities
 */
#[CoversClass( Blaze_Abilities::class )]
class Blaze_Abilities_Test extends BaseTestCase {

	/**
	 * Admin user id.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Subscriber user id.
	 *
	 * @var int
	 */
	private $subscriber_id;

	/**
	 * {@inheritDoc}
	 */
	public function set_up() {
		$this->admin_id      = wp_insert_user(
			array(
				'user_login' => 'blaze_abilities_admin_' . wp_generate_password( 8, false, false ),
				'user_pass'  => 'pw',
				'user_email' => 'admin_' . wp_generate_password( 6, false, false ) . '@example.test',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'blaze_abilities_sub_' . wp_generate_password( 8, false, false ),
				'user_pass'  => 'pw',
				'user_email' => 'sub_' . wp_generate_password( 6, false, false ) . '@example.test',
				'role'       => 'subscriber',
			)
		);

		// Default: gate open for most test cases.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );

		Blaze_Abilities_Test_Stub::reset();
	}

	/**
	 * {@inheritDoc}
	 */
	public function tear_down() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		remove_all_filters( 'jetpack_blaze_enabled' );
		wp_set_current_user( 0 );

		remove_action( Registrar::CATEGORIES_INIT_ACTION, array( Blaze_Abilities::class, 'register_category' ) );
		remove_action( Registrar::ABILITIES_INIT_ACTION, array( Blaze_Abilities::class, 'register_abilities' ) );

		// The Abilities API singleton registry persists across tests. Deregister
		// our category + abilities so per-test filter scenarios start from a clean
		// state (e.g. the allow-list test would otherwise see leftovers).
		if ( function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Blaze_Abilities::get_abilities() ) as $slug ) {
				wp_unregister_ability( $slug );
			}
		}
		if ( function_exists( 'wp_unregister_ability_category' ) ) {
			wp_unregister_ability_category( Blaze_Abilities::get_category_slug() );
		}

		Blaze_Abilities_Test_Stub::reset();
	}

	/**
	 * Hook the registrar callbacks and fire the Abilities API lifecycle actions
	 * so registrations happen inside the action callstack — wp_register_ability(_category)
	 * enforces doing_action(), so direct calls outside the hook are rejected.
	 */
	private function fire_abilities_lifecycle(): void {
		add_action( Registrar::CATEGORIES_INIT_ACTION, array( Blaze_Abilities::class, 'register_category' ) );
		add_action( Registrar::ABILITIES_INIT_ACTION, array( Blaze_Abilities::class, 'register_abilities' ) );
		do_action( Registrar::CATEGORIES_INIT_ACTION );
		do_action( Registrar::ABILITIES_INIT_ACTION );
	}

	// -------------------- Abstract getters --------------------

	/**
	 * Category slug must match the namespace shipped to the registry.
	 */
	public function test_category_slug_is_jetpack_blaze() {
		$this->assertSame( 'jetpack-blaze', Blaze_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description() {
		$def = Blaze_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertNotSame( '', $def['label'] );
		$this->assertNotSame( '', $def['description'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced() {
		$abilities = Blaze_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-blaze/', $slug );
		}
	}

	public function test_no_spec_sets_category_explicitly() {
		// Registrar auto-injects category; specs that set it are redundant and drift.
		foreach ( Blaze_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_surface_exposes_planned_abilities() {
		$abilities = Blaze_Abilities::get_abilities();
		$this->assertArrayHasKey( 'jetpack-blaze/list-campaigns', $abilities );
		$this->assertArrayHasKey( 'jetpack-blaze/get-campaign-eligibility', $abilities );
		$this->assertArrayHasKey( 'jetpack-blaze/get-dashboard-summary', $abilities );
	}

	public function test_every_spec_declares_annotations_permission_and_execute() {
		foreach ( Blaze_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'execute_callback', $spec, "Ability {$slug} missing execute_callback" );
			$this->assertIsCallable( $spec['execute_callback'], "Ability {$slug} execute_callback is not callable" );
			$this->assertArrayHasKey( 'permission_callback', $spec, "Ability {$slug} missing permission_callback" );
			$this->assertIsCallable( $spec['permission_callback'], "Ability {$slug} permission_callback is not callable" );
			$this->assertArrayHasKey( 'meta', $spec );
			$this->assertArrayHasKey( 'annotations', $spec['meta'] );
			foreach ( array( 'readonly', 'destructive', 'idempotent' ) as $flag ) {
				$this->assertArrayHasKey( $flag, $spec['meta']['annotations'], "Ability {$slug} missing annotation {$flag}" );
				$this->assertIsBool( $spec['meta']['annotations'][ $flag ], "Ability {$slug} annotation {$flag} must be bool" );
			}
		}
	}

	public function test_all_read_abilities_are_readonly_idempotent_non_destructive() {
		foreach ( Blaze_Abilities::get_abilities() as $slug => $spec ) {
			$ann = $spec['meta']['annotations'];
			$this->assertTrue( $ann['readonly'], "{$slug} should be readonly" );
			$this->assertFalse( $ann['destructive'], "{$slug} should not be destructive" );
			$this->assertTrue( $ann['idempotent'], "{$slug} should be idempotent" );
		}
	}

	// -------------------- Registrar wiring --------------------

	/**
	 * Gate filter false => init() short-circuits and hooks nothing.
	 */
	public function test_init_registers_nothing_when_gate_filter_is_false() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Blaze_Abilities::init();

		$this->assertFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Blaze_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Blaze_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true() {
		if ( did_action( Registrar::ABILITIES_INIT_ACTION ) || did_action( Registrar::CATEGORIES_INIT_ACTION ) ) {
			$this->markTestSkipped( 'Abilities API lifecycle already fired in this test run; late-load path covered elsewhere.' );
		}

		Blaze_Abilities::init();

		$this->assertNotFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Blaze_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Blaze_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_register_abilities_registers_every_slug_with_auto_injected_category() {
		if ( ! function_exists( 'wp_get_abilities' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		$this->fire_abilities_lifecycle();

		foreach ( array_keys( Blaze_Abilities::get_abilities() ) as $slug ) {
			$registered = wp_get_ability( $slug );
			$this->assertNotNull( $registered, "Ability {$slug} should be registered." );
			$this->assertSame(
				'jetpack-blaze',
				$registered->get_category(),
				"Ability {$slug} should have category auto-injected."
			);
		}
	}

	public function test_per_ability_allow_list_filter_is_respected() {
		if ( ! function_exists( 'wp_get_abilities' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Filter signature requires this parameter.
				if ( 'ability' === $type ) {
					return 'jetpack-blaze/get-dashboard-summary' === $slug;
				}
				return $enabled;
			},
			10,
			3
		);

		$this->fire_abilities_lifecycle();

		$this->assertNotNull( wp_get_ability( 'jetpack-blaze/get-dashboard-summary' ) );
		$this->assertNull( wp_get_ability( 'jetpack-blaze/list-campaigns' ) );
		$this->assertNull( wp_get_ability( 'jetpack-blaze/get-campaign-eligibility' ) );
	}

	// -------------------- Permission callbacks --------------------

	/**
	 * Admins clear the `manage_options` gate.
	 */
	public function test_can_manage_blaze_allows_admin() {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Blaze_Abilities::can_manage_blaze() );
	}

	public function test_can_manage_blaze_denies_subscriber() {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Blaze_Abilities::can_manage_blaze() );
	}

	public function test_can_manage_blaze_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( Blaze_Abilities::can_manage_blaze() );
	}

	// -------------------- get-campaign-eligibility --------------------

	/**
	 * Missing content_id => WP_Error with the documented error code.
	 */
	public function test_get_campaign_eligibility_rejects_missing_content_id() {
		wp_set_current_user( $this->admin_id );
		$result = Blaze_Abilities::get_campaign_eligibility( array() );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_blaze_missing_content_id', $result->get_error_code() );
	}

	public function test_get_campaign_eligibility_rejects_zero_content_id() {
		// Regression guard for the boundary: 0 is rejected before we look up the post.
		wp_set_current_user( $this->admin_id );
		$result = Blaze_Abilities::get_campaign_eligibility( array( 'content_id' => 0 ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_blaze_missing_content_id', $result->get_error_code() );
	}

	public function test_get_campaign_eligibility_reports_post_not_found() {
		wp_set_current_user( $this->admin_id );
		// A high ID guaranteed not to exist in WorDBless's empty DB.
		$result = Blaze_Abilities::get_campaign_eligibility( array( 'content_id' => 999999 ) );

		$this->assertIsArray( $result );
		$this->assertFalse( $result['eligible'] );
		$this->assertSame( 'unknown', $result['current_status'] );
		$this->assertContains( 'post_not_found', $result['reasons'] );
	}

	public function test_get_campaign_eligibility_reports_unpublished_post() {
		wp_set_current_user( $this->admin_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Draft post',
				'post_status' => 'draft',
				'post_type'   => 'post',
			)
		);

		$result = Blaze_Abilities::get_campaign_eligibility( array( 'content_id' => $post_id ) );

		$this->assertFalse( $result['eligible'] );
		$this->assertContains( 'post_not_published', $result['reasons'] );
		$this->assertSame( 'draft', $result['current_status'] );
	}

	public function test_get_campaign_eligibility_reports_password_protected_post() {
		wp_set_current_user( $this->admin_id );

		$post_id = wp_insert_post(
			array(
				'post_title'    => 'Protected post',
				'post_status'   => 'publish',
				'post_type'     => 'post',
				'post_password' => 'secret',
			)
		);

		$result = Blaze_Abilities::get_campaign_eligibility( array( 'content_id' => $post_id ) );

		$this->assertFalse( $result['eligible'] );
		$this->assertContains( 'post_password_protected', $result['reasons'] );
	}

	public function test_get_campaign_eligibility_reports_unsupported_post_type() {
		wp_set_current_user( $this->admin_id );

		register_post_type( 'blaze_no_promo', array( 'public' => true ) );
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Custom post',
				'post_status' => 'publish',
				'post_type'   => 'blaze_no_promo',
			)
		);

		$result = Blaze_Abilities::get_campaign_eligibility( array( 'content_id' => $post_id ) );

		$this->assertFalse( $result['eligible'] );
		$this->assertContains( 'post_type_not_supported', $result['reasons'] );

		unregister_post_type( 'blaze_no_promo' );
	}

	public function test_get_campaign_eligibility_eligible_for_published_post() {
		wp_set_current_user( $this->admin_id );

		// `should_initialize()` queries the live remote when no `jetpack_blaze_enabled`
		// filter is set; short-circuit it to a stable `true` so we test the post-level
		// branches in isolation.
		add_filter( 'jetpack_blaze_enabled', '__return_true' );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Eligible post',
				'post_status' => 'publish',
				'post_type'   => 'post',
			)
		);

		$result = Blaze_Abilities::get_campaign_eligibility( array( 'content_id' => $post_id ) );

		$this->assertTrue( $result['eligible'] );
		$this->assertSame( array(), $result['reasons'] );
		$this->assertSame( 'publish', $result['current_status'] );
	}

	public function test_get_campaign_eligibility_reports_site_not_eligible() {
		wp_set_current_user( $this->admin_id );

		// Force the site-level gate closed; published post should still see a `site_not_eligible` reason.
		add_filter( 'jetpack_blaze_enabled', '__return_false' );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Eligible-post-but-disabled-site',
				'post_status' => 'publish',
				'post_type'   => 'post',
			)
		);

		$result = Blaze_Abilities::get_campaign_eligibility( array( 'content_id' => $post_id ) );

		$this->assertFalse( $result['eligible'] );
		$this->assertContains( 'site_not_eligible', $result['reasons'] );
	}

	// -------------------- list-campaigns (via test stub) --------------------

	/**
	 * Happy path: each campaign row is projected into the documented public shape.
	 */
	public function test_list_campaigns_returns_projected_rows() {
		wp_set_current_user( $this->admin_id );

		Blaze_Abilities_Test_Stub::$site_id  = 12345;
		Blaze_Abilities_Test_Stub::$response = array(
			'campaigns' => array(
				array(
					'campaign_id'       => 42,
					'post_id'           => 100,
					'status'            => 'approved',
					'spent_budget'      => 12.5,
					'total_budget'      => 50,
					'currency'          => 'USD',
					'start_date'        => '2026-01-01',
					'end_date'          => '2026-01-31',
					'target_url'        => 'https://example.test/promoted',
					'impressions_total' => 1000,
					'clicks_total'      => 25,
				),
			),
		);

		$result = Blaze_Abilities_Test_Stub::list_campaigns( array() );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );
		$this->assertSame( 42, $result[0]['id'] );
		$this->assertSame( 100, $result[0]['content_id'] );
		$this->assertSame( 'approved', $result[0]['status'] );
		$this->assertSame( 12.5, $result[0]['spent_budget'] );
		$this->assertSame( 50.0, $result[0]['total_budget'] );
		$this->assertSame( 'USD', $result[0]['currency'] );
		$this->assertSame( 'https://example.test/promoted', $result[0]['target_url'] );
		$this->assertSame( 1000, $result[0]['impressions'] );
		$this->assertSame( 25, $result[0]['clicks'] );
	}

	public function test_list_campaigns_consolidated_read_returns_single_element_when_found() {
		wp_set_current_user( $this->admin_id );

		Blaze_Abilities_Test_Stub::$site_id  = 12345;
		Blaze_Abilities_Test_Stub::$response = array(
			'campaign_id'  => 42,
			'post_id'      => 7,
			'status'       => 'approved',
			'total_budget' => 25,
		);

		$result = Blaze_Abilities_Test_Stub::list_campaigns( array( 'campaign_id' => 42 ) );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );
		$this->assertSame( 42, $result[0]['id'] );
		// Verify the request path used the campaign_id segment, not the list endpoint.
		$this->assertStringContainsString( '/campaigns/42', Blaze_Abilities_Test_Stub::$last_path );
	}

	public function test_list_campaigns_consolidated_read_returns_empty_array_on_404() {
		wp_set_current_user( $this->admin_id );

		Blaze_Abilities_Test_Stub::$site_id        = 12345;
		Blaze_Abilities_Test_Stub::$response_error = new \WP_Error(
			'jetpack_blaze_remote_request_failed',
			'Not found',
			404
		);

		$result = Blaze_Abilities_Test_Stub::list_campaigns( array( 'campaign_id' => 999 ) );

		// Consolidated-read contract: missing record collapses to empty array, NOT to WP_Error.
		$this->assertSame( array(), $result );
	}

	public function test_list_campaigns_passes_pagination_and_status_filter() {
		wp_set_current_user( $this->admin_id );

		Blaze_Abilities_Test_Stub::$site_id  = 99;
		Blaze_Abilities_Test_Stub::$response = array( 'campaigns' => array() );

		Blaze_Abilities_Test_Stub::list_campaigns(
			array(
				'page'     => 3,
				'per_page' => 50,
				'status'   => 'draft',
			)
		);

		$this->assertStringContainsString( 'page=3', Blaze_Abilities_Test_Stub::$last_path );
		$this->assertStringContainsString( 'size=50', Blaze_Abilities_Test_Stub::$last_path );
		$this->assertStringContainsString( 'status=draft', Blaze_Abilities_Test_Stub::$last_path );
	}

	public function test_list_campaigns_clamps_per_page_to_max_100() {
		wp_set_current_user( $this->admin_id );

		Blaze_Abilities_Test_Stub::$site_id  = 99;
		Blaze_Abilities_Test_Stub::$response = array( 'campaigns' => array() );

		Blaze_Abilities_Test_Stub::list_campaigns( array( 'per_page' => 500 ) );

		$this->assertStringContainsString( 'size=100', Blaze_Abilities_Test_Stub::$last_path );
	}

	public function test_list_campaigns_drops_unknown_status_silently() {
		wp_set_current_user( $this->admin_id );

		Blaze_Abilities_Test_Stub::$site_id  = 99;
		Blaze_Abilities_Test_Stub::$response = array( 'campaigns' => array() );

		Blaze_Abilities_Test_Stub::list_campaigns( array( 'status' => 'bogus' ) );

		$this->assertStringNotContainsString( 'status=', Blaze_Abilities_Test_Stub::$last_path );
	}

	// -------------------- get-dashboard-summary (via test stub) --------------------

	/**
	 * Happy path: sums spent budget across campaigns and counts only active ones.
	 */
	public function test_get_dashboard_summary_aggregates_active_and_spent() {
		wp_set_current_user( $this->admin_id );

		Blaze_Abilities_Test_Stub::$site_id        = 7;
		Blaze_Abilities_Test_Stub::$site_supports  = true;
		Blaze_Abilities_Test_Stub::$path_responses = array(
			'/sites/7/wordads/dsp/api/v1/sites/7/campaigns' => array(
				'campaigns' => array(
					array(
						'status'       => 'approved',
						'spent_budget' => 10,
						'currency'     => 'USD',
					),
					array(
						'status'       => 'completed',
						'spent_budget' => 25,
						'currency'     => 'USD',
					),
				),
			),
			'/sites/7/wordads/dsp/api/v1/credits' => array(
				'balance' => 42.75,
			),
		);

		$result = Blaze_Abilities_Test_Stub::get_dashboard_summary();

		$this->assertSame( 2, $result['total_campaigns'] );
		$this->assertSame( 1, $result['active_campaigns'] );
		$this->assertSame( 35.0, $result['total_spent_30d'] );
		$this->assertSame( 'USD', $result['currency'] );
		$this->assertTrue( $result['supports_blaze'] );
		$this->assertSame( 42.75, $result['account_credit_balance'] );
	}

	public function test_get_dashboard_summary_degrades_to_zero_and_null_on_remote_failure() {
		wp_set_current_user( $this->admin_id );

		Blaze_Abilities_Test_Stub::$site_id        = 7;
		Blaze_Abilities_Test_Stub::$site_supports  = false;
		Blaze_Abilities_Test_Stub::$response_error = new \WP_Error( 'jetpack_blaze_remote_request_failed', 'oops', 500 );

		$result = Blaze_Abilities_Test_Stub::get_dashboard_summary();

		$this->assertSame( 0, $result['total_campaigns'] );
		$this->assertSame( 0, $result['active_campaigns'] );
		$this->assertSame( 0.0, $result['total_spent_30d'] );
		$this->assertFalse( $result['supports_blaze'] );
		$this->assertNull( $result['account_credit_balance'] );
	}
}
