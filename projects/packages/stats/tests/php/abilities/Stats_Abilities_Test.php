<?php
/**
 * Tests for the Stats_Abilities Registrar subclass.
 *
 * @package automattic/jetpack-stats
 */

namespace Automattic\Jetpack\Stats\Abilities;

use Automattic\Jetpack\Stats\Main;
use Automattic\Jetpack\Stats\Options;
use Automattic\Jetpack\Stats\StatsBaseTestCase;
use Automattic\Jetpack\Stats\WPCOM_Stats;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Unit tests for Stats_Abilities registration and execution.
 *
 * Run from projects/packages/stats:
 *
 *   composer phpunit -- --filter Stats_Abilities_Test
 *
 * @covers \Automattic\Jetpack\Stats\Abilities\Stats_Abilities
 */
#[CoversClass( Stats_Abilities::class )]
class Stats_Abilities_Test extends StatsBaseTestCase {

	/**
	 * The admin user id.
	 *
	 * @var int
	 */
	private static $admin_id;

	/**
	 * The subscriber user id.
	 *
	 * @var int
	 */
	private static $subscriber_id;

	/**
	 * {@inheritDoc}
	 */
	protected function set_up() {
		parent::set_up();

		// Force Stats\Main to re-run its constructor each test. Main is a singleton —
		// its constructor adds the `map_meta_cap` filter that maps `view_stats` to
		// `read` for configured roles, but WorDBless's _restore_hooks() wipes all
		// filters back to the state captured before test #1. Without this reset,
		// only the first test sees the cap mapping.
		self::reset_static_property( Main::class, 'instance', null );
		Main::init();

		self::$admin_id      = wp_insert_user(
			array(
				'user_login' => 'stats_abilities_admin_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'role'       => 'administrator',
			)
		);
		self::$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'stats_abilities_sub_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'role'       => 'subscriber',
			)
		);

		// Most tests open the gate; the specific "disabled by default" test closes it explicitly.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );

		// Reset any hooks a prior test may have added for the Registrar lifecycle actions.
		// We do NOT touch the Abilities registry here — accessing it via wp_has_ability()
		// would fire wp_abilities_api_init as a side effect (WP_Abilities_Registry::get_instance()
		// does do_action() on first call), breaking the init()-hooked-correctly assertions below.
		remove_action( 'wp_abilities_api_categories_init', array( Stats_Abilities::class, 'register_category' ) );
		remove_action( 'wp_abilities_api_init', array( Stats_Abilities::class, 'register_abilities' ) );
	}

	/**
	 * {@inheritDoc}
	 */
	public function tear_down() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		remove_all_filters( 'jetpack_stats_abilities_wpcom_stats' );
		remove_action( 'wp_abilities_api_categories_init', array( Stats_Abilities::class, 'register_category' ) );
		remove_action( 'wp_abilities_api_init', array( Stats_Abilities::class, 'register_abilities' ) );
		wp_set_current_user( 0 );

		// Only touch the registry if it has already been instantiated by something
		// in this test (e.g., register_abilities / wp_has_ability). Otherwise this
		// would force-instantiate it and fire wp_abilities_api_init as a side effect.
		if ( did_action( 'wp_abilities_api_init' ) ) {
			$this->deregister_category_and_abilities();
		}

		// Reset Options static cache so config-writes don't leak across tests.
		self::reset_static_property( Options::class, 'options', array() );

		parent::tear_down();
	}

	/**
	 * Remove our category + abilities from the registry so tests don't bleed.
	 */
	private function deregister_category_and_abilities(): void {
		if ( function_exists( 'wp_has_ability' ) && function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Stats_Abilities::get_abilities() ) as $slug ) {
				if ( wp_has_ability( $slug ) ) {
					wp_unregister_ability( $slug );
				}
			}
		}
		if ( function_exists( 'wp_has_ability_category' ) && function_exists( 'wp_unregister_ability_category' ) ) {
			if ( wp_has_ability_category( Stats_Abilities::CATEGORY_SLUG ) ) {
				wp_unregister_ability_category( Stats_Abilities::CATEGORY_SLUG );
			}
		}
	}

	/**
	 * Run a callable while the given Abilities API lifecycle action appears to be firing.
	 *
	 * The Registrar guards its register_* methods with `doing_action()`. Pushing onto
	 * `$wp_current_filter` simulates that the action is currently running; we always
	 * pop the entry afterward so the simulated action doesn't leak into later tests
	 * (which would corrupt `current_filter()` / `doing_action()` state).
	 *
	 * @param string   $action Action name to simulate.
	 * @param callable $fn     Callable to run while the action is "firing".
	 */
	private function with_simulated_action( string $action, callable $fn ): void {
		global $wp_current_filter;
		$wp_current_filter[] = $action;
		try {
			$fn();
		} finally {
			// Defensive: pop only our own entry, in case the callback pushed/popped its own actions.
			for ( $i = count( $wp_current_filter ) - 1; $i >= 0; $i-- ) {
				if ( $wp_current_filter[ $i ] === $action ) {
					array_splice( $wp_current_filter, $i, 1 );
					break;
				}
			}
		}
	}

	public function test_category_slug_is_jetpack_stats(): void {
		$this->assertSame( 'jetpack-stats', Stats_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description(): void {
		$def = Stats_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertNotSame( '', $def['label'] );
		$this->assertNotSame( '', $def['description'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced(): void {
		$abilities = Stats_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-stats/', $slug );
		}
	}

	public function test_no_spec_sets_category_explicitly(): void {
		// Registrar auto-injects category; specs that set it are redundant and drift.
		foreach ( Stats_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_every_spec_declares_annotations_permission_and_execute(): void {
		foreach ( Stats_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'execute_callback', $spec, "Ability {$slug} missing execute_callback" );
			$this->assertIsCallable( $spec['execute_callback'], "Ability {$slug} execute_callback is not callable" );
			$this->assertArrayHasKey( 'permission_callback', $spec, "Ability {$slug} missing permission_callback" );
			$this->assertIsCallable( $spec['permission_callback'], "Ability {$slug} permission_callback is not callable" );
			$this->assertArrayHasKey( 'meta', $spec, "Ability {$slug} missing meta" );
			$this->assertArrayHasKey( 'annotations', $spec['meta'], "Ability {$slug} missing meta.annotations" );
			foreach ( array( 'readonly', 'destructive', 'idempotent' ) as $flag ) {
				$this->assertArrayHasKey( $flag, $spec['meta']['annotations'], "Ability {$slug} missing annotation {$flag}" );
				$this->assertIsBool( $spec['meta']['annotations'][ $flag ], "Ability {$slug} annotation {$flag} must be bool" );
			}
		}
	}

	public function test_read_abilities_declared_readonly_and_non_destructive(): void {
		$read_slugs = array(
			'jetpack-stats/get-site-overview',
			'jetpack-stats/get-top-content',
			'jetpack-stats/get-post-views',
			'jetpack-stats/get-visits',
			'jetpack-stats/get-followers',
			'jetpack-stats/get-settings',
		);
		$abilities  = Stats_Abilities::get_abilities();
		foreach ( $read_slugs as $slug ) {
			$this->assertArrayHasKey( $slug, $abilities );
			$ann = $abilities[ $slug ]['meta']['annotations'];
			$this->assertTrue( $ann['readonly'], "{$slug} should be readonly" );
			$this->assertFalse( $ann['destructive'], "{$slug} should not be destructive" );
			$this->assertTrue( $ann['idempotent'], "{$slug} should be idempotent" );
		}
	}

	public function test_read_abilities_without_required_input_have_empty_object_default(): void {
		$abilities = Stats_Abilities::get_abilities();

		foreach (
			array(
				'jetpack-stats/get-site-overview',
				'jetpack-stats/get-visits',
				'jetpack-stats/get-followers',
				'jetpack-stats/get-settings',
			) as $slug
		) {
			$schema = $abilities[ $slug ]['input_schema'];

			$this->assertSame( 'object', $schema['type'], "{$slug} input must remain an object schema." );
			$this->assertArrayNotHasKey( 'required', $schema, "{$slug} should continue to allow empty input." );
			$this->assertArrayHasKey( 'default', $schema, "{$slug} must default missing tunnel input to an empty object." );
			$this->assertSame( array(), $schema['default'], "{$slug} must default missing tunnel input to an empty object." );
		}
	}

	public function test_every_ability_opts_into_mcp_as_public_tool(): void {
		foreach ( Stats_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertSame( true, $spec['meta']['mcp']['public'], "{$slug} must opt into MCP." );
			$this->assertSame( 'tool', $spec['meta']['mcp']['type'], "{$slug} must be exposed as an MCP tool." );
		}
	}

	public function test_update_settings_is_not_readonly_but_idempotent(): void {
		$abilities = Stats_Abilities::get_abilities();
		$ann       = $abilities['jetpack-stats/update-settings']['meta']['annotations'];
		$this->assertFalse( $ann['readonly'] );
		$this->assertFalse( $ann['destructive'] );
		$this->assertTrue( $ann['idempotent'] );
	}

	public function test_init_registers_nothing_when_gate_filter_is_false(): void {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Stats_Abilities::init();

		$this->assertFalse(
			has_action(
				'wp_abilities_api_categories_init',
				array( Stats_Abilities::class, 'register_category' )
			)
		);
		$this->assertFalse(
			has_action(
				'wp_abilities_api_init',
				array( Stats_Abilities::class, 'register_abilities' )
			)
		);

		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true(): void {
		// Only valid when the Abilities API lifecycle actions have NOT yet fired.
		// WP_Abilities_Registry::get_instance() fires `wp_abilities_api_init` on first call
		// (in response to any wp_has_ability / wp_register_ability call elsewhere in the run),
		// which would push the Registrar down its synchronous late-load path and this test
		// would assert against a world it doesn't apply to.
		if ( did_action( 'wp_abilities_api_init' ) || did_action( 'wp_abilities_api_categories_init' ) ) {
			$this->markTestSkipped( 'Abilities API lifecycle already fired in this test run; late-load path covered elsewhere.' );
		}

		Stats_Abilities::init();

		$this->assertNotFalse(
			has_action(
				'wp_abilities_api_categories_init',
				array( Stats_Abilities::class, 'register_category' )
			)
		);
		$this->assertNotFalse(
			has_action(
				'wp_abilities_api_init',
				array( Stats_Abilities::class, 'register_abilities' )
			)
		);
	}

	public function test_register_abilities_registers_every_slug_with_auto_injected_category(): void {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		$this->with_simulated_action(
			'wp_abilities_api_categories_init',
			static function () {
				Stats_Abilities::register_category();
			}
		);
		$this->with_simulated_action(
			'wp_abilities_api_init',
			static function () {
				Stats_Abilities::register_abilities();
			}
		);

		foreach ( array_keys( Stats_Abilities::get_abilities() ) as $slug ) {
			$this->assertTrue( wp_has_ability( $slug ), "Ability {$slug} should be registered." );
		}
	}

	public function test_per_ability_allow_list_filter_is_respected(): void {
		if ( ! function_exists( 'wp_get_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) {
				// Allow only the zero-arg overview; deny the rest.
				if ( 'ability' === $type ) {
					return 'jetpack-stats/get-site-overview' === $slug;
				}
				return $enabled;
			},
			10,
			3
		);

		$this->with_simulated_action(
			'wp_abilities_api_categories_init',
			static function () {
				Stats_Abilities::register_category();
			}
		);
		$this->with_simulated_action(
			'wp_abilities_api_init',
			static function () {
				Stats_Abilities::register_abilities();
			}
		);

		$this->assertTrue( wp_has_ability( 'jetpack-stats/get-site-overview' ) );
		$this->assertFalse( wp_has_ability( 'jetpack-stats/get-top-content' ) );
		$this->assertFalse( wp_has_ability( 'jetpack-stats/update-settings' ) );
	}

	public function test_can_view_stats_allows_admin(): void {
		wp_set_current_user( self::$admin_id );
		$this->assertTrue( Stats_Abilities::can_view_stats() );
	}

	public function test_can_view_stats_denies_subscriber(): void {
		wp_set_current_user( self::$subscriber_id );
		$this->assertFalse( Stats_Abilities::can_view_stats() );
	}

	public function test_can_view_stats_denies_anonymous(): void {
		wp_set_current_user( 0 );
		$this->assertFalse( Stats_Abilities::can_view_stats() );
	}

	public function test_can_manage_settings_allows_admin(): void {
		wp_set_current_user( self::$admin_id );
		$this->assertTrue( Stats_Abilities::can_manage_settings() );
	}

	public function test_can_manage_settings_denies_subscriber(): void {
		wp_set_current_user( self::$subscriber_id );
		$this->assertFalse( Stats_Abilities::can_manage_settings() );
	}

	public function test_get_site_overview_returns_composed_shape(): void {
		$this->filter_wpcom_stats(
			array(
				'get_stats_summary' => array(
					'date'               => '2026-04-23',
					'period'             => 'day',
					'views'              => 120,
					'visitors'           => 90,
					'likes'              => 4,
					'comments'           => 2,
					'period_total_views' => 840,
				),
				'get_highlights'    => array(
					'today' => array(
						'date'          => '2026-04-23',
						'views_month'   => 3500,
						'top_post'      => array(
							'id'    => 7,
							'title' => 'Hello world',
							'views' => 42,
						),
						'top_referrers' => array(
							array(
								'name'  => 'wordpress.com',
								'views' => 60,
							),
							array(
								'name'  => 'google.com',
								'views' => 30,
							),
						),
					),
				),
				'get_streak'        => array(
					'streak' => array(
						'currentStreakLength' => 3,
						'longestStreakLength' => 12,
						'longestStreakStart'  => '2026-01-01',
						'longestStreakEnd'    => '2026-01-12',
					),
				),
			)
		);

		$result = Stats_Abilities::get_site_overview();

		$this->assertIsArray( $result );
		$this->assertSame( '2026-04-23', $result['date'] );
		$this->assertSame( 120, $result['views_today'] );
		$this->assertSame( 90, $result['visitors_today'] );
		$this->assertSame( 840, $result['views_week'] );
		$this->assertSame( 3500, $result['views_month'] );
		$this->assertSame( 3, $result['streak']['current_length'] );
		$this->assertSame( 12, $result['streak']['longest_length'] );
		$this->assertSame(
			array(
				'id'    => 7,
				'title' => 'Hello world',
				'views' => 42,
			),
			$result['top_post']
		);
		$this->assertSame(
			array(
				'name'  => 'wordpress.com',
				'views' => 60,
			),
			$result['top_referrer']
		);
		$this->assertFalse( $result['partial'] );
		$this->assertArrayNotHasKey( 'errors', $result );
	}

	public function test_get_site_overview_flags_partial_when_one_subcall_fails(): void {
		$this->filter_wpcom_stats(
			array(
				'get_stats_summary' => array(
					'date'  => '2026-04-23',
					'views' => 10,
				),
				'get_highlights'    => new \WP_Error( 'boom', 'nope' ),
				'get_streak'        => array( 'streak' => array( 'currentStreakLength' => 1 ) ),
			)
		);

		$result = Stats_Abilities::get_site_overview();

		$this->assertIsArray( $result );
		$this->assertTrue( $result['partial'] );
		$this->assertContains( 'highlights', $result['errors'] );
		$this->assertSame( 10, $result['views_today'] );
		$this->assertNull( $result['top_post'] );
	}

	public function test_get_site_overview_returns_wp_error_when_all_subcalls_fail(): void {
		$this->filter_wpcom_stats(
			array(
				'get_stats_summary' => new \WP_Error( 'boom', 'nope' ),
				'get_highlights'    => new \WP_Error( 'boom', 'nope' ),
				'get_streak'        => new \WP_Error( 'boom', 'nope' ),
			)
		);

		$result = Stats_Abilities::get_site_overview();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_data_unavailable', $result->get_error_code() );
	}

	public function test_get_top_content_rejects_missing_type(): void {
		$result = Stats_Abilities::get_top_content( array() );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_missing_type', $result->get_error_code() );
	}

	public function test_get_top_content_posts_uniform_shape(): void {
		$this->filter_wpcom_stats(
			array(
				'get_top_posts' => self::days_fixture(
					'postviews',
					array(
						array(
							'id'    => 1,
							'title' => 'Alpha',
							'views' => 100,
							'href'  => 'https://x/alpha',
						),
						array(
							'id'    => 2,
							'title' => 'Beta',
							'views' => 50,
							'href'  => 'https://x/beta',
						),
					)
				),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'posts',
				'date' => '2026-04-23',
				'max'  => 5,
			)
		);

		$this->assertSame( 'posts', $result['type'] );
		$this->assertSame( 'day', $result['period'] );
		$this->assertSame( '2026-04-23', $result['date'] );
		$this->assertCount( 2, $result['items'] );
		$this->assertSame( 1, $result['items'][0]['rank'] );
		$this->assertSame( 'Alpha', $result['items'][0]['label'] );
		$this->assertSame( 100, $result['items'][0]['value'] );
		$this->assertSame( 'https://x/alpha', $result['items'][0]['href'] );
		$this->assertSame( 2, $result['items'][1]['rank'] );
	}

	public function test_get_top_content_search_terms_uniform_shape(): void {
		$this->filter_wpcom_stats(
			array(
				'get_search_terms' => self::days_fixture(
					'search_terms',
					array(
						array(
							'term'  => 'jetpack',
							'views' => 20,
						),
						array(
							'term'  => 'stats',
							'views' => 7,
						),
					)
				),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'search-terms',
				'date' => '2026-04-23',
			)
		);

		$this->assertSame( 'search-terms', $result['type'] );
		$this->assertCount( 2, $result['items'] );
		$this->assertSame( 'jetpack', $result['items'][0]['label'] );
		$this->assertSame( 20, $result['items'][0]['value'] );
		// No href for search terms.
		$this->assertArrayNotHasKey( 'href', $result['items'][0] );
	}

	public function test_get_top_content_countries_uses_country_name(): void {
		$this->filter_wpcom_stats(
			array(
				'get_views_by_country' => array(
					'days'         => array(
						'2026-04-23' => array(
							'views' => array(
								array(
									'country_code' => 'FR',
									'views'        => 12,
								),
								array(
									'country_code' => 'DE',
									'views'        => 9,
								),
							),
						),
					),
					'country-info' => array(
						'FR' => array( 'country_full' => 'France' ),
						'DE' => array( 'country_full' => 'Germany' ),
					),
				),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'countries',
				'date' => '2026-04-23',
			)
		);

		$this->assertSame( 'France', $result['items'][0]['label'] );
		$this->assertSame( 'Germany', $result['items'][1]['label'] );
	}

	public function test_get_top_content_tags_handles_flat_shape(): void {
		$this->filter_wpcom_stats(
			array(
				'get_tags' => array(
					'tags' => array(
						array(
							'tag'   => 'news',
							'views' => 40,
						),
						array(
							'tag'   => 'updates',
							'views' => 15,
						),
					),
				),
			)
		);

		$result = Stats_Abilities::get_top_content( array( 'type' => 'tags' ) );

		$this->assertCount( 2, $result['items'] );
		$this->assertSame( 'news', $result['items'][0]['label'] );
		$this->assertSame( 40, $result['items'][0]['value'] );
	}

	public function test_get_top_content_enforces_max_cap(): void {
		$this->filter_wpcom_stats(
			array(
				'get_top_posts' => self::days_fixture(
					'postviews',
					array(
						array(
							'title' => 'A',
							'views' => 1,
						),
						array(
							'title' => 'B',
							'views' => 1,
						),
						array(
							'title' => 'C',
							'views' => 1,
						),
					)
				),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'posts',
				'max'  => 2,
			)
		);

		$this->assertCount( 2, $result['items'] );
	}

	public function test_get_top_content_propagates_wp_error(): void {
		$this->filter_wpcom_stats(
			array(
				'get_top_posts' => new \WP_Error( 'wpcom_boom', 'bad' ),
			)
		);

		$result = Stats_Abilities::get_top_content( array( 'type' => 'posts' ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	public function test_get_top_content_referrers_normalizes_groups_shape(): void {
		// Regression guard: WPCOM `stats/referrers` keys per-day data under `groups`,
		// not `referrers`. The mapping must read from `groups -> name/total/url?`.
		$this->filter_wpcom_stats(
			array(
				'get_referrers' => self::days_fixture(
					'groups',
					array(
						array(
							'name'  => 'wordpress.com',
							'url'   => 'https://wordpress.com',
							'total' => 60,
						),
						array(
							'name'  => 'Search Engines',
							'total' => 25,
						),
					)
				),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'referrers',
				'date' => '2026-04-23',
			)
		);

		$this->assertSame( 'referrers', $result['type'] );
		$this->assertCount( 2, $result['items'] );
		$this->assertSame( 'wordpress.com', $result['items'][0]['label'] );
		$this->assertSame( 60, $result['items'][0]['value'] );
		$this->assertSame( 'https://wordpress.com', $result['items'][0]['href'] );
		$this->assertSame( 'Search Engines', $result['items'][1]['label'] );
		$this->assertSame( 25, $result['items'][1]['value'] );
		$this->assertArrayNotHasKey( 'href', $result['items'][1] );
	}

	public function test_get_top_content_clicks_uniform_shape(): void {
		$this->filter_wpcom_stats(
			array(
				'get_clicks' => self::days_fixture(
					'clicks',
					array(
						array(
							'name'  => 'Docs',
							'url'   => 'https://docs.example/x',
							'views' => 9,
						),
						array(
							// No `name` — normalization should fall back to `url`.
							'url'   => 'https://example.com/y',
							'views' => 3,
						),
					)
				),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'clicks',
				'date' => '2026-04-23',
			)
		);

		$this->assertSame( 'clicks', $result['type'] );
		$this->assertCount( 2, $result['items'] );
		$this->assertSame( 'Docs', $result['items'][0]['label'] );
		$this->assertSame( 9, $result['items'][0]['value'] );
		$this->assertSame( 'https://docs.example/x', $result['items'][0]['href'] );
		$this->assertSame( 'https://example.com/y', $result['items'][1]['label'] );
		$this->assertSame( 'https://example.com/y', $result['items'][1]['href'] );
	}

	public function test_get_top_content_authors_uniform_shape(): void {
		$this->filter_wpcom_stats(
			array(
				'get_top_authors' => self::days_fixture(
					'authors',
					array(
						array(
							'name'  => 'Ada',
							'views' => 80,
						),
						array(
							'name'  => 'Grace',
							'views' => 30,
						),
					)
				),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'authors',
				'date' => '2026-04-23',
			)
		);

		$this->assertCount( 2, $result['items'] );
		$this->assertSame( 'Ada', $result['items'][0]['label'] );
		$this->assertSame( 80, $result['items'][0]['value'] );
		$this->assertArrayNotHasKey( 'href', $result['items'][0] );
	}

	public function test_get_top_content_downloads_uniform_shape(): void {
		$this->filter_wpcom_stats(
			array(
				'get_file_downloads' => self::days_fixture(
					'files',
					array(
						array(
							'filename'       => 'whitepaper.pdf',
							'relative_url'   => '/downloads/whitepaper.pdf',
							'download_count' => 42,
						),
						array(
							// No `filename` — normalization should fall back to relative_url.
							'relative_url'   => '/downloads/spec.zip',
							'download_count' => 7,
						),
					)
				),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'downloads',
				'date' => '2026-04-23',
			)
		);

		$this->assertCount( 2, $result['items'] );
		$this->assertSame( 'whitepaper.pdf', $result['items'][0]['label'] );
		$this->assertSame( 42, $result['items'][0]['value'] );
		$this->assertSame( '/downloads/whitepaper.pdf', $result['items'][0]['href'] );
		$this->assertSame( '/downloads/spec.zip', $result['items'][1]['label'] );
		$this->assertSame( '/downloads/spec.zip', $result['items'][1]['href'] );
	}

	public function test_get_top_content_video_plays_uniform_shape(): void {
		$this->filter_wpcom_stats(
			array(
				'get_video_plays' => self::days_fixture(
					'plays',
					array(
						array(
							'title' => 'Launch demo',
							'plays' => 200,
						),
						array(
							'title' => 'Tutorial',
							'plays' => 75,
						),
					)
				),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'video-plays',
				'date' => '2026-04-23',
			)
		);

		$this->assertCount( 2, $result['items'] );
		$this->assertSame( 'Launch demo', $result['items'][0]['label'] );
		$this->assertSame( 200, $result['items'][0]['value'] );
		$this->assertArrayNotHasKey( 'href', $result['items'][0] );
	}

	public function test_get_post_views_rejects_missing_post_id(): void {
		$result = Stats_Abilities::get_post_views( array() );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_missing_post_id', $result->get_error_code() );
	}

	public function test_get_post_views_rejects_post_id_zero(): void {
		// Regression guard: post ID 0 is not a legal post; but our validation uses `> 0`, not `empty()`,
		// which means a future ID-like value of string "0" behaves deterministically (also rejected
		// by the positive check, not accidentally by falsy coercion).
		$result = Stats_Abilities::get_post_views( array( 'post_id' => '0' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_missing_post_id', $result->get_error_code() );
	}

	public function test_get_post_views_rejects_non_numeric_post_id(): void {
		$result = Stats_Abilities::get_post_views( array( 'post_id' => 'not-a-number' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	public function test_get_post_views_accepts_numeric_string(): void {
		$this->filter_wpcom_stats(
			array(
				'get_post_views' => array(
					'views'  => 42,
					'fields' => array( 'period', 'views' ),
					'data'   => array(
						array( '2026-04-22', 20 ),
						array( '2026-04-23', 22 ),
					),
				),
			)
		);

		$result = Stats_Abilities::get_post_views( array( 'post_id' => '7' ) );

		$this->assertIsArray( $result );
		$this->assertSame( 7, $result['post_id'] );
		$this->assertSame( 42, $result['total_views'] );
		$this->assertCount( 2, $result['series'] );
		$this->assertSame(
			array(
				'date'  => '2026-04-22',
				'views' => 20,
			),
			$result['series'][0]
		);
	}

	public function test_get_visits_normalizes_series_rows(): void {
		$this->filter_wpcom_stats(
			array(
				'get_visits' => array(
					'fields' => array( 'period', 'views', 'visitors' ),
					'data'   => array(
						array( '2026-04-22', 100, 70 ),
						array( '2026-04-23', 120, 90 ),
					),
				),
			)
		);

		$result = Stats_Abilities::get_visits(
			array(
				'unit'     => 'day',
				'quantity' => 2,
			)
		);

		$this->assertSame( array( 'views', 'visitors' ), $result['fields'] );
		$this->assertCount( 2, $result['series'] );
		$this->assertSame(
			array(
				'date'     => '2026-04-22',
				'views'    => 100,
				'visitors' => 70,
			),
			$result['series'][0]
		);
	}

	public function test_get_visits_always_includes_requested_fields_even_when_missing_from_backing(): void {
		// If WPCOM omits a field, we still emit it as 0 so the agent can iterate uniformly.
		$this->filter_wpcom_stats(
			array(
				'get_visits' => array(
					'fields' => array( 'period', 'views' ),
					'data'   => array( array( '2026-04-23', 100 ) ),
				),
			)
		);

		$result = Stats_Abilities::get_visits( array( 'fields' => array( 'views', 'likes' ) ) );

		$this->assertSame( array( 'views', 'likes' ), $result['fields'] );
		$this->assertSame( 100, $result['series'][0]['views'] );
		$this->assertSame( 0, $result['series'][0]['likes'] );
	}

	public function test_get_followers_composes_three_subcalls(): void {
		$this->filter_wpcom_stats(
			array(
				'get_followers'           => array(
					'email' => 10,
					'wpcom' => 25,
				),
				'get_comment_followers'   => array( 'total' => 4 ),
				'get_publicize_followers' => array(
					'services' => array(
						array(
							'service'   => 'twitter',
							'followers' => 300,
						),
						array(
							'service'   => 'facebook',
							'followers' => 80,
						),
					),
				),
			)
		);

		$result = Stats_Abilities::get_followers();

		$this->assertSame( 10, $result['email'] );
		$this->assertSame( 25, $result['wpcom'] );
		$this->assertSame( 4, $result['comment'] );
		$this->assertSame(
			array(
				'twitter'  => 300,
				'facebook' => 80,
			),
			$result['publicize']
		);
		$this->assertSame( 10 + 25 + 4 + 300 + 80, $result['total'] );
		$this->assertFalse( $result['partial'] );
	}

	public function test_get_followers_flags_partial_on_subcall_error(): void {
		$this->filter_wpcom_stats(
			array(
				'get_followers'           => array(
					'email' => 5,
					'wpcom' => 10,
				),
				'get_comment_followers'   => new \WP_Error( 'boom', 'bad' ),
				'get_publicize_followers' => array( 'services' => array() ),
			)
		);

		$result = Stats_Abilities::get_followers();

		$this->assertTrue( $result['partial'] );
		$this->assertContains( 'comment_followers', $result['errors'] );
	}

	public function test_get_settings_returns_whitelisted_fields_only(): void {
		$result = Stats_Abilities::get_settings();

		$this->assertIsArray( $result );
		$this->assertSame(
			array( 'admin_bar', 'roles', 'count_roles', 'do_not_track' ),
			array_keys( $result )
		);
		// Internal keys must NOT leak.
		$this->assertArrayNotHasKey( 'blog_id', $result );
		$this->assertArrayNotHasKey( 'version', $result );
		$this->assertArrayNotHasKey( 'notices', $result );
	}

	public function test_get_settings_classifies_types_from_options_defaults(): void {
		// Regression guard: the snapshot derives bool/array typing from
		// Options::get_defaults() rather than a duplicated allow-list, so a new
		// option type added in Options must propagate here without code changes.
		$result = Stats_Abilities::get_settings();

		$this->assertIsBool( $result['admin_bar'] );
		$this->assertIsBool( $result['do_not_track'] );
		$this->assertIsArray( $result['roles'] );
		$this->assertIsArray( $result['count_roles'] );
	}

	public function test_update_settings_rejects_empty_input(): void {
		$result = Stats_Abilities::update_settings( array() );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_missing_setting_field', $result->get_error_code() );
	}

	public function test_update_settings_rejects_unknown_role(): void {
		$result = Stats_Abilities::update_settings( array( 'roles' => array( 'robot' ) ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_invalid_role', $result->get_error_code() );
	}

	public function test_update_settings_rejects_empty_roles_to_prevent_lockout(): void {
		// Schema validation enforces minItems=1 on REST input, but direct PHP callers bypass
		// that path; an empty `roles` array would revoke `view_stats` for every user, including
		// the caller. Reject explicitly.
		$result = Stats_Abilities::update_settings( array( 'roles' => array() ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_invalid_roles', $result->get_error_code() );
	}

	public function test_update_settings_changes_admin_bar(): void {
		$before = Stats_Abilities::get_settings();
		$this->assertTrue( $before['admin_bar'] );

		$result = Stats_Abilities::update_settings( array( 'admin_bar' => false ) );

		$this->assertIsArray( $result );
		$this->assertTrue( $result['changed'] );
		$this->assertFalse( $result['settings']['admin_bar'] );
	}

	public function test_update_settings_is_idempotent_for_current_state(): void {
		$before = Stats_Abilities::get_settings();
		$result = Stats_Abilities::update_settings( array( 'admin_bar' => $before['admin_bar'] ) );
		$this->assertFalse( $result['changed'], 'Desired == current must be a no-op.' );
	}

	public function test_update_settings_accepts_empty_count_roles(): void {
		$result = Stats_Abilities::update_settings( array( 'count_roles' => array() ) );
		$this->assertIsArray( $result );
		$this->assertSame( array(), $result['settings']['count_roles'] );
	}

	public function test_update_settings_preserves_unrelated_option_keys(): void {
		// Seed an unrelated internal key.
		update_option(
			'stats_options',
			array(
				'admin_bar' => true,
				'roles'     => array( 'administrator' ),
				'notices'   => array( 'do_not_clobber' => 1 ),
				'version'   => Main::STATS_VERSION,
			)
		);
		// Force-reset the static cache so the next get_options() re-reads.
		self::reset_static_property( Options::class, 'options', array() );

		Stats_Abilities::update_settings( array( 'admin_bar' => false ) );

		$this->assertSame(
			array( 'do_not_clobber' => 1 ),
			Options::get_option( 'notices' ),
			'update-settings must not blow away unrelated internal option keys.'
		);
	}

	/**
	 * Build a single-day WPCOM `stats/<endpoint>` fixture.
	 *
	 * Most top-content endpoints share the shape `days -> <date> -> <list_key> -> [rows]`;
	 * this helper keeps the fixture wiring uniform and out of each test body.
	 *
	 * @param string $list_key Per-day list key (e.g. `postviews`, `groups`, `clicks`).
	 * @param array  $rows     Row dictionaries.
	 * @param string $date     Day key (defaults to the canonical fixture date).
	 * @return array
	 */
	private static function days_fixture( string $list_key, array $rows, string $date = '2026-04-23' ): array {
		return array(
			'days' => array(
				$date => array( $list_key => $rows ),
			),
		);
	}

	/**
	 * Reset a class's static property (defeats inter-test caches).
	 *
	 * @param string $class Fully qualified class name.
	 * @param string $prop  Property name.
	 * @param mixed  $value New value.
	 */
	private static function reset_static_property( string $class, string $prop, $value ): void {
		$ref      = new \ReflectionClass( $class );
		$property = $ref->getProperty( $prop );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $value );
	}

	/**
	 * Install a filter that makes the abilities class use a stubbed WPCOM_Stats.
	 *
	 * @param array $method_returns Map of WPCOM_Stats method => return value (array or WP_Error).
	 */
	private function filter_wpcom_stats( array $method_returns ): void {
		$stub = $this->createStub( WPCOM_Stats::class );
		foreach ( $method_returns as $method => $value ) {
			$stub->method( $method )->willReturn( $value );
		}

		add_filter(
			'jetpack_stats_abilities_wpcom_stats',
			static function () use ( $stub ) {
				return $stub;
			}
		);
	}
}
