<?php
/**
 * Tests for the Sitemaps_Abilities Registrar subclass.
 *
 * @package automattic/jetpack
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

// The Sitemaps_Abilities class lives under modules/sitemaps/abilities/ rather
// than src/, so Composer's classmap autoloader does not see it. Pull it in
// explicitly — mirrors the Newsletter_Abilities test convention.
require_once __DIR__ . '/../../../modules/sitemaps/abilities/class-sitemaps-abilities.php';
require_once __DIR__ . '/class-sitemaps-abilities-test-stub.php';

use Automattic\Jetpack\Plugin\Abilities\Sitemaps_Abilities;
use Automattic\Jetpack\WP_Abilities\Registrar;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\Plugin\Abilities\Sitemaps_Abilities
 */
#[CoversClass( Sitemaps_Abilities::class )]
class Sitemaps_Abilities_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Administrator user id, created once per test.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Editor user id (manages content but not options) for permission tests.
	 *
	 * @var int
	 */
	private $editor_id;

	/**
	 * Subscriber user id, created once per test.
	 *
	 * @var int
	 */
	private $subscriber_id;

	public function set_up() {
		parent::set_up();

		// Defensive isolation: cron events / sitemap state can leak across
		// tests within a shared process if a prior test's tear_down did not
		// run (fatal/out-of-order). Mirror tear_down's cleanup at the start of
		// every test so request_rebuild assertions on wp_next_scheduled()
		// start from a known-empty state regardless of run order.
		delete_transient( 'jetpack-sitemap-state-lock' );
		delete_option( 'jetpack-sitemap-state' );
		wp_clear_scheduled_hook( 'jp_sitemap_cron_hook' );

		$this->admin_id      = wp_insert_user(
			array(
				'user_login' => 'sitemaps_abilities_admin_' . wp_generate_password( 8, false, false ),
				'user_pass'  => 'pw',
				'user_email' => 'admin_' . wp_generate_password( 6, false, false ) . '@example.test',
				'role'       => 'administrator',
			)
		);
		$this->editor_id     = wp_insert_user(
			array(
				'user_login' => 'sitemaps_abilities_editor_' . wp_generate_password( 8, false, false ),
				'user_pass'  => 'pw',
				'user_email' => 'editor_' . wp_generate_password( 6, false, false ) . '@example.test',
				'role'       => 'editor',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'sitemaps_abilities_sub_' . wp_generate_password( 8, false, false ),
				'user_pass'  => 'pw',
				'user_email' => 'sub_' . wp_generate_password( 6, false, false ) . '@example.test',
				'role'       => 'subscriber',
			)
		);

		// Default: gate open for most test cases.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
	}

	public function tear_down() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		remove_all_filters( 'jetpack_active_modules' );
		remove_all_filters( 'jetpack_news_sitemap_include_in_robotstxt' );
		wp_set_current_user( 0 );

		remove_action( Registrar::CATEGORIES_INIT_ACTION, array( Sitemaps_Abilities::class, 'register_category' ) );
		remove_action( Registrar::ABILITIES_INIT_ACTION, array( Sitemaps_Abilities::class, 'register_abilities' ) );

		// Unregister anything this test left behind so the singleton registry stays clean
		// between tests (the WP Abilities Registry persists across tests within a process).
		if ( function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Sitemaps_Abilities::get_abilities() ) as $slug ) {
				wp_unregister_ability( $slug );
			}
		}
		// Note: we intentionally do NOT unregister the category here — Sitemaps
		// abilities live under the WordPress core `site` category, which this
		// registrar never registers and must never tear down.

		delete_transient( 'jetpack-sitemap-state-lock' );
		delete_option( 'jetpack-sitemap-state' );
		wp_clear_scheduled_hook( 'jp_sitemap_cron_hook' );

		Sitemaps_Abilities_Test_Stub::reset();

		parent::tear_down();
	}

	/**
	 * Hook the registrar callbacks and fire the API lifecycle actions so registrations
	 * happen inside the action callstack — `wp_register_ability(_category)` enforces
	 * `doing_action()`, so direct invocation outside the hook is rejected.
	 */
	private function fire_abilities_lifecycle(): void {
		// Sitemaps abilities live under the core `site` category, which in
		// production is registered by WordPress core on the
		// `wp_abilities_api_categories_init` action. The isolated unit-test
		// lifecycle does not carry core's registration over, so without this
		// the category is absent when `register_abilities()` runs and
		// `wp_register_ability()` rejects every ability ("category not
		// registered"). Register the `site` category here, scoped to the
		// categories-init action (where `wp_register_ability_category()` is
		// permitted) and guarded so a re-fire — or a build where core already
		// registered it — does not trigger an "already registered" notice.
		$ensure_site_category = static function () {
			if (
				function_exists( 'wp_has_ability_category' )
				&& function_exists( 'wp_register_ability_category' )
				&& ! wp_has_ability_category( 'site' )
			) {
				wp_register_ability_category(
					'site',
					array(
						'label'       => 'Site',
						'description' => 'Abilities that retrieve or modify site information and settings.',
					)
				);
			}
		};
		add_action( Registrar::CATEGORIES_INIT_ACTION, $ensure_site_category, 1 );

		add_action( Registrar::CATEGORIES_INIT_ACTION, array( Sitemaps_Abilities::class, 'register_category' ) );
		add_action( Registrar::ABILITIES_INIT_ACTION, array( Sitemaps_Abilities::class, 'register_abilities' ) );
		do_action( Registrar::CATEGORIES_INIT_ACTION );
		do_action( Registrar::ABILITIES_INIT_ACTION );

		remove_action( Registrar::CATEGORIES_INIT_ACTION, $ensure_site_category, 1 );
	}

	/**
	 * Helper: pretend the Sitemaps module is active. Mirrors the pattern used
	 * by Monitor_Abilities_Test — filter the active modules list rather than
	 * reaching into the Jetpack option directly.
	 */
	private function activate_sitemaps_module(): void {
		add_filter(
			'jetpack_active_modules',
			static function ( $mods ) {
				$mods   = is_array( $mods ) ? $mods : array();
				$mods[] = 'sitemaps';
				return array_values( array_unique( $mods ) );
			}
		);
	}

	/**
	 * Section: Abstract getters
	 */
	public function test_category_slug_is_core_site_category() {
		$this->assertSame( 'site', Sitemaps_Abilities::get_category_slug() );
	}

	public function test_register_category_is_a_noop() {
		// The `site` category is owned by WordPress core; this registrar must
		// not register a plugin-scoped category of its own.
		if ( ! function_exists( 'wp_has_ability_category' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		add_action( Registrar::CATEGORIES_INIT_ACTION, array( Sitemaps_Abilities::class, 'register_category' ) );
		do_action( Registrar::CATEGORIES_INIT_ACTION );

		// Firing the registrar's (no-op) category callback must not have created
		// a legacy `jetpack-sitemaps` category. `wp_has_ability_category()`
		// returns a clean bool (no `_doing_it_wrong`), unlike
		// `wp_get_ability_category()` which flags an unregistered lookup.
		$this->assertFalse( wp_has_ability_category( 'jetpack-sitemaps' ) );
	}

	public function test_abilities_map_is_non_empty_and_namespaced() {
		$abilities = Sitemaps_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-sitemaps/', $slug );
		}
	}

	public function test_no_spec_sets_category_explicitly() {
		// Registrar auto-injects category; specs that set it are redundant and drift.
		foreach ( Sitemaps_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_surface_exposes_get_status_and_request_rebuild() {
		$abilities = Sitemaps_Abilities::get_abilities();
		$this->assertArrayHasKey( 'jetpack-sitemaps/get-status', $abilities );
		$this->assertArrayHasKey( 'jetpack-sitemaps/request-rebuild', $abilities );
	}

	public function test_get_status_is_annotated_readonly_idempotent() {
		$spec = Sitemaps_Abilities::get_abilities()['jetpack-sitemaps/get-status'];
		$this->assertTrue( $spec['meta']['annotations']['readonly'] );
		$this->assertFalse( $spec['meta']['annotations']['destructive'] );
		$this->assertTrue( $spec['meta']['annotations']['idempotent'] );
	}

	public function test_request_rebuild_is_annotated_non_readonly_idempotent() {
		$spec = Sitemaps_Abilities::get_abilities()['jetpack-sitemaps/request-rebuild'];
		$this->assertFalse( $spec['meta']['annotations']['readonly'] );
		$this->assertFalse( $spec['meta']['annotations']['destructive'] );
		$this->assertTrue( $spec['meta']['annotations']['idempotent'] );
	}

	/**
	 * Section: Registrar wiring
	 */
	public function test_init_registers_nothing_when_gate_filter_is_false() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Sitemaps_Abilities::init();

		$this->assertFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Sitemaps_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Sitemaps_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true() {
		Sitemaps_Abilities::init();

		$this->assertNotFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Sitemaps_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Sitemaps_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_register_abilities_registers_every_slug() {
		if ( ! function_exists( 'wp_get_abilities' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		$this->fire_abilities_lifecycle();

		$registered_slugs = array();
		foreach ( wp_get_abilities() as $ability ) {
			$name = $ability->get_name();
			if ( str_starts_with( $name, 'jetpack-sitemaps/' ) ) {
				$registered_slugs[] = $name;
			}
		}

		foreach ( array_keys( Sitemaps_Abilities::get_abilities() ) as $slug ) {
			$this->assertContains( $slug, $registered_slugs, "Ability {$slug} should be registered." );
		}
	}

	public function test_per_ability_allow_list_filter_is_respected() {
		if ( ! function_exists( 'wp_get_ability' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Filter signature requires this parameter even when we don't branch on it.
				if ( 'ability' === $type ) {
					return false;
				}
				return $enabled;
			},
			10,
			3
		);

		$this->fire_abilities_lifecycle();

		$registered_slugs = array_map(
			static function ( $a ) {
				return $a->get_name();
			},
			wp_get_abilities()
		);
		foreach ( array_keys( Sitemaps_Abilities::get_abilities() ) as $slug ) {
			$this->assertNotContains( $slug, $registered_slugs, "Ability {$slug} must be filtered out." );
		}
	}

	public function test_register_abilities_auto_injects_category() {
		if ( ! function_exists( 'wp_get_ability' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		$this->fire_abilities_lifecycle();

		foreach ( array_keys( Sitemaps_Abilities::get_abilities() ) as $slug ) {
			$registered = wp_get_ability( $slug );
			$this->assertNotNull( $registered, "Ability {$slug} should be registered." );
			$this->assertSame(
				'site',
				$registered->get_category(),
				"Ability {$slug} should be assigned the core `site` category."
			);
		}
	}

	/**
	 * Section: Permission callbacks
	 *
	 * Status reads are gated on `edit_posts` (anyone managing content can see
	 * sitemap state). Rebuild dispatch is gated on `manage_options` — admin only.
	 */
	public function test_can_view_sitemaps_allows_admin() {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Sitemaps_Abilities::can_view_sitemaps() );
	}

	public function test_can_view_sitemaps_allows_editor() {
		// Editors have edit_posts but not manage_options.
		wp_set_current_user( $this->editor_id );
		$this->assertTrue( Sitemaps_Abilities::can_view_sitemaps() );
	}

	public function test_can_view_sitemaps_denies_subscriber() {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Sitemaps_Abilities::can_view_sitemaps() );
	}

	public function test_can_view_sitemaps_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( Sitemaps_Abilities::can_view_sitemaps() );
	}

	public function test_can_manage_sitemaps_allows_admin() {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Sitemaps_Abilities::can_manage_sitemaps() );
	}

	public function test_can_manage_sitemaps_denies_editor() {
		// Editors can read sitemap state but cannot dispatch a rebuild —
		// manage_options is admin-only.
		wp_set_current_user( $this->editor_id );
		$this->assertFalse( Sitemaps_Abilities::can_manage_sitemaps() );
	}

	public function test_can_manage_sitemaps_denies_subscriber() {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Sitemaps_Abilities::can_manage_sitemaps() );
	}

	public function test_can_manage_sitemaps_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( Sitemaps_Abilities::can_manage_sitemaps() );
	}

	/**
	 * Section: get_status execute callback
	 */

	/**
	 * Module inactive: returns the simplified shape with `active=false` and an
	 * empty `sitemaps` list. Status reads are not gated on the module — agents
	 * should be able to see "sitemaps are off" without an error.
	 */
	public function test_get_status_returns_inactive_when_module_off() {
		wp_set_current_user( $this->admin_id );

		Sitemaps_Abilities_Test_Stub::$master_sitemap_url = 'https://example.test/sitemap.xml';

		$result = Sitemaps_Abilities_Test_Stub::get_status();

		$this->assertIsArray( $result );
		$this->assertFalse( $result['active'] );
		$this->assertSame( 'https://example.test/sitemap.xml', $result['url'] );
		$this->assertSame( 0, $result['post_count'] );
		$this->assertSame( 0, $result['page_count'] );
		$this->assertTrue( $result['news_sitemap_enabled'] );
		$this->assertSame( array(), $result['sitemaps'] );

		// Simplified shape: no URL duplication, no synthetic last-build
		// scalar, no reserved-but-always-null error field.
		$this->assertArrayNotHasKey( 'master_sitemap_url', $result );
		$this->assertArrayNotHasKey( 'last_build_at', $result );
		$this->assertArrayNotHasKey( 'last_error', $result );
	}

	/**
	 * Happy path: module active, a master sitemap exists, and `sitemaps`
	 * reflects the child-sitemap entries actually present in the served
	 * sitemap.xml (loc + lastmod), parsed from the stored master.
	 */
	public function test_get_status_returns_full_shape_when_module_active() {
		wp_set_current_user( $this->admin_id );
		$this->activate_sitemaps_module();

		Sitemaps_Abilities_Test_Stub::$master_sitemap_url = 'https://example.test/sitemap.xml';
		Sitemaps_Abilities_Test_Stub::$master_sitemap_xml = self::sample_sitemapindex();
		Sitemaps_Abilities_Test_Stub::$counts             = array(
			'post' => 42,
			'page' => 7,
		);

		$result = Sitemaps_Abilities_Test_Stub::get_status();

		$this->assertIsArray( $result );
		$this->assertTrue( $result['active'] );
		$this->assertSame( 'https://example.test/sitemap.xml', $result['url'] );
		$this->assertSame( 42, $result['post_count'] );
		$this->assertSame( 7, $result['page_count'] );
		$this->assertTrue( $result['news_sitemap_enabled'] );
		$this->assertSame(
			array(
				array(
					'loc'     => 'https://example.test/sitemap-1.xml',
					'lastmod' => '2026-04-19T14:09:16Z',
				),
				array(
					'loc'     => 'https://example.test/image-sitemap-1.xml',
					'lastmod' => '2026-03-19T14:48:36Z',
				),
			),
			$result['sitemaps']
		);
	}

	/**
	 * News filter false → reflected in the read.
	 */
	public function test_get_status_reflects_news_sitemap_filter_disabled() {
		wp_set_current_user( $this->admin_id );
		$this->activate_sitemaps_module();
		add_filter( 'jetpack_news_sitemap_include_in_robotstxt', '__return_false' );

		Sitemaps_Abilities_Test_Stub::$master_sitemap_url = 'https://example.test/sitemap.xml';

		$result = Sitemaps_Abilities_Test_Stub::get_status();

		$this->assertFalse( $result['news_sitemap_enabled'] );
	}

	/**
	 * Section: get_sitemap_entries — reflect the real served sitemap.xml
	 *
	 * `get-status` surfaces the child-sitemap entries actually present in the
	 * stored master sitemap (the same document the public sitemap.xml router
	 * serves), rather than a synthetic last-build timestamp derived from the
	 * `jetpack-sitemap-state` option (which reads null even while a real
	 * sitemap.xml is being served).
	 */
	public function test_get_sitemap_entries_parses_sitemapindex() {
		Sitemaps_Abilities_Test_Stub::$master_sitemap_xml = self::sample_sitemapindex();

		$this->assertSame(
			array(
				array(
					'loc'     => 'https://example.test/sitemap-1.xml',
					'lastmod' => '2026-04-19T14:09:16Z',
				),
				array(
					'loc'     => 'https://example.test/image-sitemap-1.xml',
					'lastmod' => '2026-03-19T14:48:36Z',
				),
			),
			Sitemaps_Abilities_Test_Stub::call_get_sitemap_entries()
		);
	}

	public function test_get_sitemap_entries_returns_empty_array_when_no_master() {
		Sitemaps_Abilities_Test_Stub::$master_sitemap_xml = '';
		$this->assertSame( array(), Sitemaps_Abilities_Test_Stub::call_get_sitemap_entries() );
	}

	public function test_get_sitemap_entries_returns_empty_array_for_malformed_xml() {
		Sitemaps_Abilities_Test_Stub::$master_sitemap_xml = '<sitemapindex><sitemap><loc>broken';
		$this->assertSame( array(), Sitemaps_Abilities_Test_Stub::call_get_sitemap_entries() );
	}

	public function test_get_sitemap_entries_tolerates_missing_lastmod() {
		Sitemaps_Abilities_Test_Stub::$master_sitemap_xml =
			'<?xml version="1.0" encoding="UTF-8"?>'
			. '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
			. '<sitemap><loc>https://example.test/sitemap-1.xml</loc></sitemap>'
			. '</sitemapindex>';

		$this->assertSame(
			array(
				array(
					'loc'     => 'https://example.test/sitemap-1.xml',
					'lastmod' => null,
				),
			),
			Sitemaps_Abilities_Test_Stub::call_get_sitemap_entries()
		);
	}

	/**
	 * Two-entry sitemapindex fixture mirroring the real master sitemap shape
	 * (default sitemaps.org namespace, loc + lastmod per child).
	 */
	private static function sample_sitemapindex(): string {
		return '<?xml version="1.0" encoding="UTF-8"?>'
			. '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
			. '<sitemap><loc>https://example.test/sitemap-1.xml</loc><lastmod>2026-04-19T14:09:16Z</lastmod></sitemap>'
			. '<sitemap><loc>https://example.test/image-sitemap-1.xml</loc><lastmod>2026-03-19T14:48:36Z</lastmod></sitemap>'
			. '</sitemapindex>';
	}

	/**
	 * Section: request_rebuild execute callback
	 */

	/**
	 * Lock transient present → status=running, no new cron event.
	 */
	public function test_request_rebuild_returns_running_when_build_in_flight() {
		wp_set_current_user( $this->admin_id );
		set_transient( 'jetpack-sitemap-state-lock', true, 15 * MINUTE_IN_SECONDS );

		$result = Sitemaps_Abilities::request_rebuild();

		$this->assertIsArray( $result );
		$this->assertFalse( $result['dispatched'] );
		$this->assertSame( 'running', $result['status'] );
		$this->assertFalse(
			wp_next_scheduled( 'jp_sitemap_cron_hook' ),
			'No new cron event should be scheduled when a build is in flight.'
		);
		// Nothing queued → no next run time to report.
		$this->assertNull( $result['next_scheduled_at'] );
	}

	/**
	 * Existing scheduled cron event → status=queued, no duplicate scheduling.
	 */
	public function test_request_rebuild_returns_queued_when_cron_already_scheduled() {
		wp_set_current_user( $this->admin_id );

		$future = time() + 600;
		wp_schedule_single_event( $future, 'jp_sitemap_cron_hook' );

		$result = Sitemaps_Abilities::request_rebuild();

		$this->assertIsArray( $result );
		$this->assertFalse( $result['dispatched'] );
		$this->assertSame( 'queued', $result['status'] );
		// The previously-scheduled tick should still be the next one (i.e. we
		// didn't stack a new one at time() that would overshadow it).
		$this->assertSame( $future, wp_next_scheduled( 'jp_sitemap_cron_hook' ) );
		// next_scheduled_at reflects that pending tick as an ISO 8601 UTC string.
		$this->assertSame( gmdate( 'Y-m-d\TH:i:s\Z', $future ), $result['next_scheduled_at'] );
	}

	/**
	 * Nothing running, nothing queued → schedule a single-event cron tick
	 * and return dispatched=true.
	 */
	public function test_request_rebuild_dispatches_when_nothing_running_or_queued() {
		wp_set_current_user( $this->admin_id );

		$this->assertFalse( wp_next_scheduled( 'jp_sitemap_cron_hook' ) );

		$result = Sitemaps_Abilities::request_rebuild();

		$this->assertIsArray( $result );
		$this->assertTrue( $result['dispatched'] );
		$this->assertSame( 'queued', $result['status'] );
		$scheduled = wp_next_scheduled( 'jp_sitemap_cron_hook' );
		$this->assertNotFalse(
			$scheduled,
			'A cron event should be scheduled after a successful dispatch.'
		);
		// The freshly-scheduled tick is reported as an ISO 8601 UTC string.
		$this->assertSame( gmdate( 'Y-m-d\TH:i:s\Z', $scheduled ), $result['next_scheduled_at'] );
	}

	/**
	 * Idempotency: a second call right after a successful dispatch returns
	 * `status=queued` and `dispatched=false` (because the first call's cron
	 * event is still pending).
	 */
	public function test_request_rebuild_is_idempotent_after_dispatch() {
		wp_set_current_user( $this->admin_id );

		$first = Sitemaps_Abilities::request_rebuild();
		$this->assertTrue( $first['dispatched'] );

		$second = Sitemaps_Abilities::request_rebuild();
		$this->assertFalse( $second['dispatched'] );
		$this->assertSame( 'queued', $second['status'] );
	}

	/**
	 * Section: Real bootstrap path
	 *
	 * When the Sitemaps module is inactive, modules/sitemaps.php is never
	 * loaded by Jetpack, so Sitemaps_Abilities::init() never runs and the
	 * abilities are not registered. This codifies the gated-registration
	 * contract.
	 */
	public function test_abilities_are_not_registered_when_sitemaps_module_is_inactive() {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		// Do NOT fire the lifecycle or call init() — this mirrors the real
		// bootstrap path when modules/sitemaps.php has not been included.
		$registered_slugs = array();
		foreach ( wp_get_abilities() as $ability ) {
			$name = $ability->get_name();
			if ( str_starts_with( $name, 'jetpack-sitemaps/' ) ) {
				$registered_slugs[] = $name;
			}
		}

		$this->assertSame(
			array(),
			$registered_slugs,
			'Sitemaps abilities must not be registered while the Sitemaps module is inactive (modules/sitemaps.php not loaded).'
		);
	}

	public function test_every_ability_opts_into_mcp_as_public_tool() {
		foreach ( Sitemaps_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'mcp', $spec['meta'], "{$slug} must publish meta.mcp." );
			$this->assertTrue( $spec['meta']['mcp']['public'], "{$slug} must opt into MCP." );
			$this->assertSame( 'tool', $spec['meta']['mcp']['type'], "{$slug} must be exposed as an MCP tool." );
		}
	}
}
